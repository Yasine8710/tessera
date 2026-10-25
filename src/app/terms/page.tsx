import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms of use", description: "The terms for using CareSync." };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="October 2026"
      intro="By creating an account you agree to these terms. They are written in plain language. The operator of this instance may add terms of their own."
    >
      <LegalSection title="What CareSync is">
        <p>CareSync helps patients keep track of medications, routines and appointments, and helps connected healthcare professionals follow progress and organise follow-up. It is a coordination tool, not a medical device.</p>
      </LegalSection>
      <LegalSection title="Not medical advice, not an emergency service">
        <ul>
          <li>CareSync does not diagnose conditions, recommend treatment, or suggest doses.</li>
          <li>Messaging is not monitored around the clock. Do not use it for urgent problems.</li>
          <li>In an emergency, contact your local emergency number immediately.</li>
          <li>Appointments requested in CareSync are requests until staff confirm them.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Your account">
        <ul>
          <li>Provide accurate information and keep your password private.</li>
          <li>Medical professionals must provide genuine licence details. Staff access is granted only after administrator verification and may be withdrawn.</li>
          <li>Do not attempt to access data you are not authorised to see.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Your data and sharing">
        <p>You decide which categories of your data a connected professional can see, and you can end a connection at any time. Information you enter is self-reported and may be incomplete. Professionals remain responsible for their own clinical judgement and record-keeping duties.</p>
      </LegalSection>
      <LegalSection title="Cost">
        <p>CareSync is free for patients and staff. There are no subscriptions, advertising or data sales. The operator pays for hosting, email and database costs.</p>
      </LegalSection>
      <LegalSection title="No warranty">
        <p>The service is provided as is, without guarantees of availability or fitness for a particular purpose, to the extent permitted by law. Reminders may be delayed or fail; do not rely on them as your only safeguard for important medication.</p>
      </LegalSection>
      <LegalSection title="Operators">
        <p>Anyone hosting CareSync is responsible for obtaining legal review for their jurisdiction, for configuring email and backups, and for the lawful handling of data in their instance. The software makes no claim of regulatory compliance.</p>
      </LegalSection>
    </LegalPage>
  );
}
