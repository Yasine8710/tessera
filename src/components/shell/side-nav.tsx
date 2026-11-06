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
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[0.92rem]",
              dark
                ? active ? "font-medium text-white" : "text-nav-ink/85 hover:bg-white/8 hover:text-white"
                : active ? "font-medium text-accent" : "text-ink2 hover:bg-surface2 hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`nav-active-${group}`}
                aria-hidden
                className={cn("absolute inset-0 rounded-md", dark ? "bg-white/10" : "bg-accent-soft")}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              >
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
              </motion.span>
            )}
            <Icon className="relative size-[1.1rem] shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            <span className="relative">{i.label}</span>
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
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-semibold">{title}</span>
            <button type="button" className="press inline-flex size-9 items-center justify-center rounded-md hover:bg-surface2" aria-label="Close menu" onClick={() => ref.current?.close()}>
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <Items items={items} onNavigate={() => ref.current?.close()} />
          <div className="flex items-center justify-between gap-2 border-t border-line p-4 text-sm">
            <div className="min-w-0">
              <p className="mb-2 truncate font-medium">{name}</p>
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
