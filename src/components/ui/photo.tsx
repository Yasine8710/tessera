"use client";

import Image from "next/image";
import { useState } from "react";
import { PHOTOS, type PhotoName } from "@/lib/photos";
import { cn } from "@/lib/cn";

/**
 * Local stock photography (see scripts/photos.mjs). Fades in once decoded, zooms very slightly on hover
 * of the nearest `.group`, and is dimmed a little in the dark theme so it does not glare.
 * `className` sizes the frame (give it a height or aspect ratio); `focal` is the CSS object-position.
 */
export function Photo({
  name,
  alt = "",
  className,
  focal = "center",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority,
  zoom = true,
}: {
  name: PhotoName;
  alt?: string;
  className?: string;
  focal?: string;
  sizes?: string;
  priority?: boolean;
  zoom?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const p = PHOTOS[name];
  return (
    <div className={cn("relative overflow-hidden bg-surface2", className)}>
      <Image
        src={`/photos/${name}.webp`}
        alt={alt}
        width={p.w}
        height={p.h}
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        style={{ objectPosition: focal }}
        className={cn(
          "size-full object-cover transition-[opacity,transform,filter] duration-700 ease-[var(--ease)] dark:brightness-[0.86] dark:contrast-[1.04]",
          loaded ? "opacity-100" : "opacity-0",
          zoom && "group-hover:scale-[1.035]",
        )}
      />
    </div>
  );
}
