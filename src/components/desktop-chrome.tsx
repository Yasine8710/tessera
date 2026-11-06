"use client";

import { Ellipsis } from "lucide-react";
import { useEffect } from "react";
import { LogoMark } from "@/components/logo";

/**
 * Desktop only. The Electron window has no Windows title bar (kiosk style), so the page draws one:
 * brand on the left, an app menu button, and the right edge is left free for the Windows
 * minimise / maximise / close overlay (env(titlebar-area-width) excludes it).
 */
export function DesktopTitleBar() {
  useEffect(() => {
    const send = () => window.tesseraDesktop?.setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    send();
    const mo = new MutationObserver(send);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  return (
    <div className="desktop-titlebar surface-anim" role="presentation">
      <div className="flex h-full items-center gap-2 pl-3" style={{ width: "env(titlebar-area-width, 100%)" }}>
        <LogoMark className="size-4" />
        <span className="text-[0.8rem] font-semibold tracking-tight text-ink2">Tessera</span>
        <button
          type="button"
          onClick={() => window.tesseraDesktop?.showMenu()}
          aria-label="Application menu"
          title="Menu"
          className="press ml-1 inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface2 hover:text-ink"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <Ellipsis className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
