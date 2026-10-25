import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy notice", description: "What CareSync collects, why, how long it is kept, and who can see it." };

export default function PrivacyPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <LegalPage
      title="Privacy notice"
      updated="October 2026"
      intro="This notice explains in plain language what this CareSync service collects, why, and who can see it. CareSync is self-hosted software: the organisation or person running this instance (the operator) is responsible for the data stored here."
    >
      <LegalSection title="What is collected">
        <ul>
          <li>Account details: name, email address, a password stored only as a salted scrypt hash, time zone, and an optional date of birth.</li>
          <li>For medical professionals: profession, licence number, issuing region and optional specialty, used for administrator verification.</li>
          <li>Health-related entries you make as a patient: medication intake, routines, journal entries, measurements and appointment requests. These are self-reported and may be incomplete or inaccurate.</li>
          <li>Messages between patients and connected professionals, notes professionals add, and care plans they create.</li>
          <li>Security data: hashed session tokens, sign-in rate-limit counters, and an audit trail of important actions such as sign-ins, consent changes and record access.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Why it is collected">
        <p>Data is used to run the service: sign you in, show your medications and routines, send reminders, let you and your care team coordinate, and keep the system secure. It is not used for advertising or profiling.</p>
      </LegalSection>
      <LegalSection title="Who can see it">
        <ul>
          <li>You can see everything you record.</li>
          <li>A professional can see your data only after a care relationship is active, and only for the categories you have allowed (journal, measurements, routines, medication adherence). You can change these choices at any time.</li>
          <li>Administrators manage accounts and verification. Access to clinical data follows the same relationship rules.</li>
          <li>The operator controls the server and database and may have technical access to stored data.</li>
        </ul>
      </LegalSection>
      <LegalSection title="No sale of data">
        <p>CareSync does not sell personal data, show advertising, or share data with advertisers or data brokers.</p>
      </LegalSection>
      <LegalSection title="Retention and deletion">
        <p>Data is kept while your account is active. When an account is deleted, identifiers such as name and email are anonymised. Clinical records that a care team may be required to keep can be retained in de-identified form where required. Sessions expire automatically and password-reset and verification links are single-use and time-limited.</p>
      </LegalSection>
      <LegalSection title="Email">
        <p>The service sends email for verification, password reset, invitations and reminders when the operator has configured email delivery. Messages are kept short and avoid detailed health information.</p>
      </LegalSection>
      <LegalSection title="Important limits">
        <ul>
          <li>CareSync is not an emergency service. In an emergency, contact your local emergency number.</li>
          <li>Patient-entered information is self-reported. It is not verified clinical fact.</li>
          <li>This notice is a template-style description of the software&apos;s behaviour. It does not claim compliance with any specific law or standard. Operators must obtain legal review for their own jurisdiction before handling real patient data.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Contact">
        <p>{contact ? <>Questions or requests about your data: <a className="text-accent underline" href={`mailto:${contact}`}>{contact}</a>.</> : "Contact the operator of this service for questions or requests about your data."}</p>
      </LegalSection>
    </LegalPage>
  );
}
