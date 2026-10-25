import type { MetadataRoute } from "next";

const PATHS = ["/", "/login", "/register", "/register/patient", "/register/professional", "/privacy", "/terms", "/accessibility"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return PATHS.map((p) => ({ url: `${base}${p}`, changeFrequency: p === "/" ? "monthly" : "yearly", priority: p === "/" ? 1 : 0.5 }));
}
