import Link from "next/link";
import { Logo } from "@/components/logo";

const PRODUCT = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];
const LEGAL = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
];

const linkCls =
  "relative inline-block text-ink2 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:text-ink hover:after:scale-x-100";

export function SiteFooter() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const github = process.env.NEXT_PUBLIC_GITHUB_URL;
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink2">Connected care. Better everyday health.</p>
          <p className="mt-4 max-w-xs text-sm text-muted">
            Tessera is not an emergency service. If you may be having a medical emergency, contact your local emergency number now.
          </p>
        </div>
        <FooterList title="Product" items={PRODUCT} />
        <FooterList title="Legal" items={LEGAL} />
        <div>
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contact ? (
              <li>
                <a href={`mailto:${contact}`} className={linkCls}>
                  {contact}
                </a>
              </li>
            ) : process.env.NODE_ENV !== "production" ? (
              <li className="text-muted">Contact: set NEXT_PUBLIC_CONTACT_EMAIL</li>
            ) : null}
            {github && (
              <li>
                <a href={github} rel="noopener noreferrer" target="_blank" className={linkCls}>
                  Source code
                </a>
              </li>
            )}
            <li>
              <Link href="/login" className={linkCls}>
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line px-4 py-4 text-center text-xs text-muted">
        Illustrative content on this site uses synthetic data. Patient-entered information is self-reported.
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className={linkCls}>
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
