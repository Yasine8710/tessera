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

export function SiteFooter() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  const github = process.env.NEXT_PUBLIC_GITHUB_URL;
  return (
    <footer className="border-t border-line bg-nav text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-3 max-w-xs text-sm text-white/70">Connected care. Better everyday health.</p>
          <p className="mt-4 max-w-xs text-sm text-white/70">
            Tessera is not an emergency service. If you may be having a medical emergency, contact your local emergency number now.
          </p>
        </div>
        <FooterList title="Product" items={PRODUCT} />
        <FooterList title="Legal" items={LEGAL} />
        <div>
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contact ? (
              <li>
                <a href={`mailto:${contact}`} className="text-white/80 hover:text-white hover:underline">
                  {contact}
                </a>
              </li>
            ) : process.env.NODE_ENV !== "production" ? (
              <li className="text-white/60">Contact: set NEXT_PUBLIC_CONTACT_EMAIL</li>
            ) : null}
            {github && (
              <li>
                <a href={github} rel="noopener noreferrer" target="_blank" className="text-white/80 hover:text-white hover:underline">
                  Source code
                </a>
              </li>
            )}
            <li>
              <Link href="/login" className="text-white/80 hover:text-white hover:underline">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        Illustrative content on this site uses synthetic data. Patient-entered information is self-reported.
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="text-white/80 hover:text-white hover:underline">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
