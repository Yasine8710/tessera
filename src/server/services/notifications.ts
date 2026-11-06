import { Prisma, type NotificationType } from "@prisma/client";
import { dedupeKey, effectiveIntakeStatus } from "@/domain/rules";
import { expandSchedule, localDateString } from "@/domain/schedule";
import type { Actor } from "../access";
import { db, createIntakesIfMissing } from "../db";

const PREF_FIELD: Partial<Record<NotificationType, "doseReminders" | "missedAlerts" | "routineReminders" | "appointmentAlerts" | "messageAlerts">> = {
  DOSE_DUE: "doseReminders",
  DOSE_MISSED: "missedAlerts",
  ROUTINE_REMINDER: "routineReminders",
  APPOINTMENT_REMINDER: "appointmentAlerts",
  MESSAGE: "messageAlerts",
};

/**
 * Create an in-app notification. Idempotent per (user, key): a retried job or
 * duplicate event hits the unique index and is ignored. Returns true if created.
 */
export async function notify(
  userId: string,
  type: NotificationType,
  n: { title: string; body: string; link?: string; key: string },
): Promise<boolean> {
  const field = PREF_FIELD[type];
  if (field) {
    const pref = await db.notificationPreference.findUnique({ where: { userId } });
    if (pref && pref[field] === false) return false;
  }
  try {
    await db.notification.create({
      data: { userId, type, title: n.title, body: n.body, link: n.link, dedupeKey: n.key },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return false;
    throw e;
  }
}

export async function listNotifications(actor: Actor, take = 30) {
  return db.notification.findMany({ where: { userId: actor.userId }, orderBy: { createdAt: "desc" }, take });
}

export async function unreadCount(actor: Actor) {
  return db.notification.count({ where: { userId: actor.userId, readAt: null } });
}

export async function markRead(actor: Actor, id?: string) {
  await db.notification.updateMany({
    where: { userId: actor.userId, readAt: null, ...(id ? { id } : {}) },
    data: { readAt: new Date() },
  });
}

export async function getPreferences(actor: Actor) {
  return db.notificationPreference.upsert({
    where: { userId: actor.userId },
    create: { userId: actor.userId },
    update: {},
  });
}

export async function updatePreferences(
  actor: Actor,
  p: Partial<Record<"doseReminders" | "missedAlerts" | "routineReminders" | "appointmentAlerts" | "messageAlerts", boolean>> & { timezone?: string },
) {
  const { timezone, ...prefs } = p;
  await db.notificationPreference.upsert({
    where: { userId: actor.userId },
    create: { userId: actor.userId, ...prefs },
    update: prefs,
  });
  if (timezone) {
    const { isValidTimeZone } = await import("@/domain/schedule");
    if (isValidTimeZone(timezone)) await db.user.update({ where: { id: actor.userId }, data: { timezone } });
  }
}

/**
 * Scheduled job body: materialise upcoming/overdue dose rows, then create reminders.
 * Safe to run repeatedly (rows and notifications are unique on deterministic keys).
 */
export async function runReminderJob(now = new Date()) {
  const horizon = new Date(now.getTime() + 24 * 3600_000);
  const lookback = new Date(now.getTime() - 48 * 3600_000);
  const plans = await db.medicationPlan.findMany({
    where: { status: "ACTIVE", startDate: { lte: horizon } },
    include: { medication: true, patient: { include: { user: true } } },
  });
  let created = 0;
  for (const plan of plans) {
    const tz = plan.patient.user.timezone;
    const times = expandSchedule(
      {
        timesOfDay: plan.timesOfDay,
        daysOfWeek: plan.daysOfWeek,
        startDate: plan.startDate.toISOString().slice(0, 10),
        endDate: plan.endDate?.toISOString().slice(0, 10) ?? null,
      },
      tz,
      lookback,
      horizon,
    );
    await createIntakesIfMissing(plan.id, times);
    const intakes = await db.medicationIntake.findMany({ where: { planId: plan.id, scheduledFor: { gte: lookback, lt: horizon } } });
    for (const it of intakes) {
      if (it.status !== "SCHEDULED") continue;
      const eff = effectiveIntakeStatus(it.status, it.scheduledFor, now);
      const minsUntil = (it.scheduledFor.getTime() - now.getTime()) / 60_000;
      if (eff === "SCHEDULED" && minsUntil <= 15 && minsUntil > -120) {
        created += Number(
          await notify(plan.patient.userId, "DOSE_DUE", {
            title: `Time for ${plan.medication.name}`,
            body: `${plan.dose} scheduled at ${it.scheduledFor.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz })}.`,
            link: "/patient/medications",
            key: dedupeKey("DOSE_DUE", it.id),
          }),
        );
      } else if (eff === "MISSED") {
        await db.medicationIntake.updateMany({ where: { id: it.id, status: "SCHEDULED" }, data: { status: "MISSED" } });
        created += Number(
          await notify(plan.patient.userId, "DOSE_MISSED", {
            title: `No entry for ${plan.medication.name}`,
            body: "A scheduled dose has no recorded entry. Record it if you took it.",
            link: "/patient/medications",
            key: dedupeKey("DOSE_MISSED", it.id),
          }),
        );
      }
    }
  }

  // Appointment reminders: confirmed appointments starting within 24h.
  const appts = await db.appointment.findMany({
    where: { status: "CONFIRMED", startsAt: { gt: now, lte: horizon } },
    include: { patient: { select: { userId: true } }, professional: { select: { userId: true } } },
  });
  for (const a of appts) {
    for (const userId of [a.patient.userId, a.professional.userId]) {
      created += Number(
        await notify(userId, "APPOINTMENT_REMINDER", {
          title: "Appointment in the next 24 hours",
          body: a.title,
          link: userId === a.patient.userId ? "/patient/appointments" : "/staff/appointments",
          key: dedupeKey("APPT", a.id, userId),
        }),
      );
    }
  }

  // Routine reminders: active routines with a time of day, not yet completed today.
  const routines = await db.routineDefinition.findMany({
    where: { active: true, timeOfDay: { not: null } },
    include: { patient: { include: { user: true } }, completions: { orderBy: { localDate: "desc" }, take: 1 } },
  });
  for (const r of routines) {
    const tz = r.patient.user.timezone;
    const today = localDateString(now, tz);
    const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
    if (r.daysOfWeek.length && !r.daysOfWeek.includes(dow)) continue;
    if (r.completions[0]?.localDate === today) continue;
    const nowLocal = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: tz });
    if (nowLocal >= r.timeOfDay!) {
      created += Number(
        await notify(r.patient.userId, "ROUTINE_REMINDER", {
          title: r.title,
          body: "Today's routine is not marked done yet.",
          link: "/patient/routines",
          key: dedupeKey("ROUTINE", r.id, today),
        }),
      );
    }
  }

  // Follow-up tasks due.
  const tasks = await db.followUpTask.findMany({
    where: { status: "OPEN", dueAt: { lte: now } },
    include: { assignee: { select: { userId: true } } },
  });
  for (const t of tasks) {
    created += Number(
      await notify(t.assignee.userId, "FOLLOW_UP_TASK", {
        title: "Follow-up task due",
        body: t.title,
        link: "/staff/monitoring",
        key: dedupeKey("TASK", t.id),
      }),
    );
  }
  return { created };
}
