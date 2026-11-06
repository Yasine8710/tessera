/** True when running inside the Windows desktop app (single machine, no email, local database). */
export const isDesktop = () => process.env.CARESYNC_DESKTOP === "1";
