const ROLES = [
  {
    role: "Patient",
    can: "Manage their own medications, routines, journal, measurements and appointments. Invite or accept care professionals and choose what each can see. Message connected professionals.",
    cannot: "See other patients, staff tools or any administration page.",
  },
  {
    role: "Professional (verified)",
    can: "After approval, view the records of patients who have connected and consented, per consent category. Create care plans, tasks, notes and appointments for them. Message them.",
    cannot: "See patients without an active connection and consent, or use administration pages. Unverified professionals have no staff access.",
  },
  {
    role: "Administrator",
    can: "Approve or reject professional applications, suspend or reactivate accounts, manage organizations, review the audit log and change platform settings.",
    cannot: "Read any clinical record, message or journal entry. Administrators have no clinical-record access.",
  },
];

export function RolesTable() {
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">What each role can and cannot do</caption>
        <thead className="border-b border-line2 text-muted [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.12em]">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Role</th>
            <th scope="col" className="px-5 py-3 font-medium">Can</th>
            <th scope="col" className="px-5 py-3 font-medium">Cannot</th>
          </tr>
        </thead>
        <tbody className="stagger divide-y divide-line align-top">
          {ROLES.map((r) => (
            <tr key={r.role} className="transition-colors hover:bg-surface2/60">
              <th scope="row" className="px-5 py-3 font-semibold">{r.role}</th>
              <td className="px-5 py-3 text-ink2">{r.can}</td>
              <td className="px-5 py-3 text-ink2">{r.cannot}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
