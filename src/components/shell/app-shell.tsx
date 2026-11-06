import { Bell, LogOut } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme";
import { SideNav, type NavItem } from "./side-nav";
import { unreadCount } from "@/server/services/notifications";
import type { Session } from "@/server/session";

/** Date eyebrow and time-of-day greeting in the person's own time zone. Falls back to the server zone if it is invalid. */
function today(timezone: string) {
  const now = new Date();
  const fmt = (tz: string | undefined) => ({
    date: new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long", timeZone: tz }).format(now),
    hour: Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now)),
  });
  let r: ReturnType<typeof fmt>;
  try {
    r = fmt(timezone);
  } catch {
    r = fmt(undefined);
  }
  const greeting = r.hour < 12 ? "Good morning" : r.hour < 18 ? "Good afternoon" : "Good evening";
  return { date: r.date, greeting };
}

export async function AppShell({
  session,
  nav,
  area,
  children,
}: {
  session: Session;
  nav: NavItem[];
  area: "patient" | "staff" | "admin";
  children: React.ReactNode;
}) {
  const unread = await unreadCount(session);
  const label = area === "patient" ? "Patient portal" : area === "staff" ? "Staff portal" : "Administration";
  const { date, greeting } = today(session.timezone);
  const first = session.name.replace(/^(dr|prof|mr|mrs|ms|mx)\.?\s+/i, "").split(" ")[0];
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden bg-nav text-nav-ink lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-dvh">
        <div className="px-5 pb-6 pt-6">
          <Logo href={`/${area}`} light />
          <p className="eyebrow mt-3 text-nav-ink/60!">{label}</p>
        </div>
        <SideNav items={nav} variant="desktop" />
        <div className="flex items-end justify-between gap-2 border-t border-white/10 px-5 py-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{session.name}</p>
            <p className="truncate text-nav-ink/70">{session.email}</p>
            <form action={logoutAction} className="mt-3">
              <button className="press -ml-2 inline-flex items-center gap-2 rounded-sm px-2 py-1.5 text-nav-ink underline-offset-4 hover:text-white hover:underline">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
          </div>
          <ThemeToggle onDark />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg px-4 py-3 lg:px-10">
          <div className="flex items-center gap-2 lg:hidden">
            <SideNav items={nav} variant="mobile" title={label} name={session.name} logout={logoutAction} />
            <Logo href={`/${area}`} />
          </div>
          <div className="anim-fade hidden lg:block">
            <p className="eyebrow">{date}</p>
            <p className="mt-0.5 text-[0.95rem] font-medium tracking-tight">
              {greeting}, {first}
            </p>
          </div>
          <Link href={`/${area}/notifications`} className="relative inline-flex size-10 items-center justify-center rounded-md press hover:bg-surface2" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <Bell className="size-5" aria-hidden />
            {unread > 0 && <span className="anim-scale absolute right-1.5 top-1.5 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-onaccent">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
        <footer className="border-t border-line px-4 py-4 text-xs text-muted sm:px-6 lg:px-10">
          Not for emergencies. If you may be in danger, call your local emergency number.
        </footer>
      </div>
    </div>
  );
}
