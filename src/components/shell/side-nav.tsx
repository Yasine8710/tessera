"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { icons, type IconName } from "./icons";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

function Items({ items, onNavigate, dark }: { items: NavItem[]; onNavigate?: () => void; dark?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
      {items.map((i) => {
        const active = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
        const Icon = icons[i.icon];
        return (
          <Link
            key={i.href}
            href={i.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-[0.92rem] transition-colors",
              dark
                ? active ? "bg-white/12 font-medium text-white" : "text-nav-ink/85 hover:bg-white/8 hover:text-white"
                : active ? "bg-accent-soft font-medium text-accent-hover" : "text-ink2 hover:bg-surface2",
            )}
          >
            <Icon className="size-[1.1rem] shrink-0" aria-hidden />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SideNav({
  items,
  variant,
  title,
  name,
  logout,
}: {
  items: NavItem[];
  variant: "desktop" | "mobile";
  title?: string;
  name?: string;
  logout?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const path = usePathname();

  useEffect(() => {
    ref.current?.close();
    setOpen(false);
  }, [path]);

  if (variant === "desktop") return <Items items={items} dark />;
  return (
    <>
      <button
        type="button"
        className="inline-flex size-10 items-center justify-center rounded-md hover:bg-surface2"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <dialog ref={ref} onClose={() => setOpen(false)} className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none border-0 p-0" aria-label={title}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold">{title}</span>
            <button type="button" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-surface2" aria-label="Close menu" onClick={() => ref.current?.close()}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <Items items={items} onNavigate={() => ref.current?.close()} />
          <div className="border-t border-line p-4 text-sm">
            <p className="mb-2 truncate font-medium">{name}</p>
            <form action={logout}>
              <button className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface2">
                <LogOut className="size-4" aria-hidden /> Sign out
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
