"use client";

import { LogOut, Menu, X } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ThemeToggle } from "@/components/theme";
import { icons, type IconName } from "./icons";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: IconName; exact?: boolean };

function Items({ items, onNavigate, dark }: { items: NavItem[]; onNavigate?: () => void; dark?: boolean }) {
  const path = usePathname();
  const group = useId();
  return (
    <nav aria-label="Main" className="flex-1 overflow-y-auto px-5 py-2">
      <p aria-hidden className={cn("eyebrow pb-2", dark && "text-nav-ink/60!")}>
        Menu
      </p>
      <div className="stagger">
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
                "group relative flex items-center gap-3 border-t py-2.5 pl-3 text-[0.92rem]",
                dark ? "border-white/10" : "border-line",
                dark
                  ? active ? "font-semibold text-white" : "text-nav-ink/80 hover:text-white"
                  : active ? "font-semibold text-ink" : "text-ink2 hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`nav-active-${group}`}
                  aria-hidden
                  className={cn("absolute -top-px bottom-0 left-0 w-0.5", dark ? "bg-white" : "bg-accent")}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <Icon className={cn("size-4 shrink-0 transition-all duration-200 group-hover:translate-x-0.5", !active && "opacity-70 group-hover:opacity-100")} aria-hidden />
              <span>{i.label}</span>
            </Link>
          );
        })}
      </div>
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
        className="press inline-flex size-10 items-center justify-center rounded-md hover:bg-surface2"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => {
          ref.current?.showModal();
          setOpen(true);
        }}
      >
        <Menu className="size-5" aria-hidden />
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-0 h-dvh max-h-dvh w-72 max-w-[85vw] rounded-none border-0 border-r p-0 transition-transform duration-300 [animation:none] starting:-translate-x-full"
        aria-label={title}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="eyebrow text-ink2!">{title}</span>
            <button type="button" className="press inline-flex size-9 items-center justify-center rounded-md hover:bg-surface2" aria-label="Close menu" onClick={() => ref.current?.close()}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <Items items={items} onNavigate={() => ref.current?.close()} />
          <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-4 text-sm">
            <div className="min-w-0">
              <p className="mb-2 truncate text-base font-semibold tracking-tight">{name}</p>
              <form action={logout}>
                <button className="press inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface2">
                  <LogOut className="size-4" aria-hidden /> Sign out
                </button>
              </form>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </dialog>
    </>
  );
}
