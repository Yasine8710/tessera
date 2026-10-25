"use server";

import { act, type ActionResult } from "@/server/action";
import * as clinical from "@/server/services/clinical";
import * as patient from "@/server/services/patient";

// Every function re-validates input in the service; authorization lives there too.

export async function reportIntakeAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await clinical.reportIntake(s, input);
  });
}

export async function createChangeRequestAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await clinical.createChangeRequest(s, input);
  });
}

export async function createRoutineAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.createRoutine(s, input);
  });
}

export async function setRoutineActiveAction(routineId: string, active: boolean): Promise<ActionResult> {
  return act((s) => patient.setRoutineActive(s, routineId, active));
}

export async function toggleRoutineAction(routineId: string, done: boolean): Promise<ActionResult> {
  return act((s) => patient.toggleRoutineToday(s, routineId, done));
}

export async function addJournalAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.addJournalEntry(s, input);
  });
}

export async function addMeasurementAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.addMeasurement(s, input);
  });
}

export async function requestAppointmentAction(input: unknown): Promise<ActionResult> {
  return act(async (s) => {
    await patient.requestAppointment(s, input);
  });
}

export async function appointmentChangeAction(appointmentId: string, action: "CANCEL" | "RESCHEDULE"): Promise<ActionResult> {
  return act((s) => patient.patientAppointmentAction(s, appointmentId, action));
}
