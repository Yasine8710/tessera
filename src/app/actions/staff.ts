"use server";

import { act, type ActionResult } from "@/server/action";
import * as clinical from "@/server/services/clinical";
import * as patient from "@/server/services/patient";
import * as staff from "@/server/services/staff";

// Authorization lives in the services; these wrappers only bind the signed-in session.

export async function createCarePlanAction(patientId: string, input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await clinical.createCarePlan(s, patientId, input);
  });
}

export async function updateCarePlanAction(planId: string, input: unknown): Promise<ActionResult> {
  return act((s) => clinical.updateCarePlan(s, planId, input));
}

export async function addMedicationAction(planId: string, input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await clinical.addMedicationToPlan(s, planId, input);
  });
}

export async function stopMedicationAction(medicationPlanId: string, reason: string): Promise<ActionResult> {
  return act((s) => clinical.stopMedicationPlan(s, medicationPlanId, reason));
}

export async function resolveChangeRequestAction(id: string, response: string): Promise<ActionResult> {
  return act((s) => clinical.resolveChangeRequest(s, id, response));
}

export async function createClinicianRoutineAction(patientId: string, input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.createRoutine(s, input, patientId);
  });
}

export async function scheduleAppointmentAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.scheduleAppointment(s, input);
  });
}

export async function staffAppointmentAction(
  id: string,
  to: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW",
  extra: { sharedNotes?: string; startsAt?: string } = {},
): Promise<ActionResult> {
  return act((s) => patient.staffAppointmentUpdate(s, id, to, extra));
}

export async function createTaskAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await staff.createTask(s, input);
  });
}

export async function completeTaskAction(id: string): Promise<ActionResult> {
  return act((s) => staff.completeTask(s, id));
}

export async function addNoteAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await staff.addInternalNote(s, input);
  });
}
