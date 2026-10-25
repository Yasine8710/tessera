import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address.").max(254);
const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use at most 128 characters.");
const name = z.string().trim().min(2, "Enter your full name.").max(100);
const timezone = z.string().min(1).max(64);
const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm.");

export const registerPatientSchema = z.object({
  name,
  email,
  password,
  timezone,
  dateOfBirth: localDate.optional().or(z.literal("")),
  acceptTerms: z.literal(true, { error: "You must accept the terms to continue." }),
});

export const registerProfessionalSchema = z.object({
  name,
  email,
  password,
  timezone,
  profession: z.string().trim().min(2, "Enter your profession.").max(100),
  licenseNumber: z.string().trim().min(3, "Enter your licence number.").max(60),
  licenseRegion: z.string().trim().min(2, "Enter the issuing region.").max(100),
  specialty: z.string().trim().max(100).optional().or(z.literal("")),
  acceptTerms: z.literal(true, { error: "You must accept the terms to continue." }),
});

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.").max(128) });
export const resetRequestSchema = z.object({ email });
export const resetPasswordSchema = z.object({ token: z.string().min(10).max(200), password });

export const inviteSchema = z.object({ patientEmail: email });

export const carePlanSchema = z.object({
  title: z.string().trim().min(3).max(120),
  instructions: z.string().trim().min(3).max(4000),
  startDate: localDate,
  endDate: localDate.optional().or(z.literal("")),
});
export const carePlanUpdateSchema = carePlanSchema.extend({
  reason: z.string().trim().min(3, "Give a reason for the change.").max(500),
});

export const medicationPlanSchema = z.object({
  medicationName: z.string().trim().min(2).max(120),
  dose: z.string().trim().min(1).max(120),
  route: z.string().trim().max(60).optional().or(z.literal("")),
  instructions: z.string().trim().max(1000).optional().or(z.literal("")),
  timesOfDay: z.array(time).min(1, "Add at least one time.").max(12),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7),
  startDate: localDate,
  endDate: localDate.optional().or(z.literal("")),
});

export const intakeReportSchema = z.object({
  intakeId: z.string().min(1),
  status: z.enum(["TAKEN", "SKIPPED"]),
  takenAt: z.string().datetime().optional(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export const routineSchema = z.object({
  title: z.string().trim().min(2).max(100),
  kind: z.enum(["HYDRATION", "ACTIVITY", "SLEEP", "EXERCISE", "WELLNESS", "CLINICIAN_TASK"]),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7),
  timeOfDay: time.optional().or(z.literal("")),
});

export const journalSchema = z.object({
  wellbeing: z.number().int().min(1).max(5).optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  symptoms: z.array(z.string().trim().min(1).max(60)).max(15),
  text: z.string().trim().max(2000).optional().or(z.literal("")),
  sharedWithTeam: z.boolean(),
  recordedAt: z.string().datetime().optional(),
});

export const measurementSchema = z.object({
  type: z.enum(["BLOOD_PRESSURE", "WEIGHT", "GLUCOSE", "HEART_RATE", "TEMPERATURE"]),
  value: z.number(),
  value2: z.number().optional(),
  recordedAt: z.string().datetime().optional(),
});

export const appointmentRequestSchema = z.object({
  professionalId: z.string().min(1),
  title: z.string().trim().min(3).max(120),
  startsAt: z.string().datetime(),
  durationMin: z.number().int().min(10).max(240),
});
export const appointmentScheduleSchema = appointmentRequestSchema.extend({
  patientId: z.string().min(1),
  location: z.string().trim().max(200).optional().or(z.literal("")),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().trim().min(1, "Write a message.").max(4000),
});

export const taskSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().trim().min(3).max(200),
  dueAt: z.string().datetime(),
  assigneeId: z.string().optional(),
});

export const changeRequestSchema = z.object({
  planId: z.string().min(1),
  message: z.string().trim().min(5, "Describe the change you are asking about.").max(1000),
});

export const noteSchema = z.object({ patientId: z.string().min(1), body: z.string().trim().min(1).max(4000) });

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;
export type RegisterProfessionalInput = z.infer<typeof registerProfessionalSchema>;
