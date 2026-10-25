import { describe, expect, it } from "vitest";
import { GET as getDoses } from "@/app/api/v1/doses/route";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { GET as getMe } from "@/app/api/v1/me/route";
import { GET as getPatients } from "@/app/api/v1/patients/route";
import { PASSWORD, makePatient } from "./helpers";

const json = (body: unknown) => ({ method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `ip-${Math.random()}` }, body: JSON.stringify(body) });

describe("REST v1", () => {
  it("rejects missing token and bad credentials", async () => {
    expect((await getMe(new Request("http://x/api/v1/me"))).status).toBe(401);
    const p = await makePatient();
    const bad = await login(new Request("http://x", json({ email: p.email, password: "wrong-password-1" })));
    expect(bad.status).toBe(401);
  });

  it("logs in and serves role-appropriate data", async () => {
    const p = await makePatient();
    const res = await login(new Request("http://x", json({ email: p.email, password: PASSWORD })));
    expect(res.status).toBe(200);
    const { token } = (await res.json()).data;
    const auth = { headers: { authorization: `Bearer ${token}` } };
    expect((await (await getMe(new Request("http://x", auth))).json()).data.role).toBe("PATIENT");
    expect((await getDoses(new Request("http://x", auth))).status).toBe(200);
    // Patients cannot use the staff directory.
    expect((await getPatients(new Request("http://x", auth))).status).toBe(403);
  });
});
