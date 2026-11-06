import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Accessibility", description: "Tessera accessibility target, features and known limitations." };

export default function AccessibilityPage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <LegalPage photo="walk-coat" focal="50% 40%"
      title="Accessibility"
      updated="October 2026"
      intro="Tessera aims to be usable by as many people as possible, including people who use keyboards, screen readers, zoom or reduced motion."
    >
      <LegalSection title="Our target">
        <p>We design toward WCAG 2.2 level AA. This is a goal, not a certification: we have not had an independent audit, and we do not claim full conformance.</p>
      </LegalSection>
      <LegalSection title="What we do">
        <ul>
          <li>Every control is reachable and operable by keyboard, with a visible focus indicator and a skip link to main content.</li>
          <li>Form fields have visible labels, and errors are announced next to the field.</li>
          <li>Layouts work at 320 to 375 pixel widths and when text is enlarged, without horizontal scrolling.</li>
          <li>Animations are small and are switched off when your system requests reduced motion.</li>
          <li>Status is never conveyed by colour alone.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Known limitations">
        <ul>
          <li>Charts in the progress views are visual first; a table of the same values should be used with a screen reader and some views may not yet offer one.</li>
          <li>Date and time pickers rely on your browser&apos;s native controls, which vary in accessibility.</li>
          <li>The interface is currently available in English only.</li>
          <li>Automated checks do not replace testing with assistive technology; some issues may remain.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Tell us about a problem">
        <p>{contact ? <>If something blocks you, email <a className="text-accent underline" href={`mailto:${contact}`}>{contact}</a> and describe the page and your assistive technology.</> : "If something blocks you, contact the operator of this service and describe the page and your assistive technology."}</p>
      </LegalSection>
    </LegalPage>
  );
}
