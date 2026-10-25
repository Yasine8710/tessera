import { Bell, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { SideNav, type NavItem } from "./side-nav";
import { unreadCount } from "@/server/services/notifications";
import type { Session } from "@/server/session";

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
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      <aside className="hidden bg-nav text-nav-ink lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-dvh">
        <div className="px-5 py-5">
          <Logo href={`/${area}`} light />
          <p className="mt-1 pl-[2.625rem] text-xs uppercase tracking-wider text-nav-ink/60">{label}</p>
        </div>
        <SideNav items={nav} variant="desktop" />
        <div className="border-t border-white/10 p-4 text-sm">
          <p className="truncate font-medium text-white">{session.name}</p>
          <p className="truncate text-nav-ink/70">{session.email}</p>
          <form action={logoutAction} className="mt-3">
            <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-nav-ink hover:bg-white/10">
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-bg/95 px-4 py-2.5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <SideNav items={nav} variant="mobile" title={label} name={session.name} logout={logoutAction} />
            <Logo href={`/${area}`} />
          </div>
          <p className="hidden items-center gap-2 text-sm text-muted lg:flex">
            <ShieldAlert className="size-4 text-warn" aria-hidden />
            Not for emergencies. If you may be in danger, call your local emergency number.
          </p>
          <Link href={`/${area}/notifications`} className="relative inline-flex size-10 items-center justify-center rounded-md hover:bg-surface2" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <Bell className="size-5" aria-hidden />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-4 text-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
