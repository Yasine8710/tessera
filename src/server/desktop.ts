/** True when running inside the Windows desktop app (single machine, no email, local database). */
export const isDesktop = () => process.env.TESSERA_DESKTOP === "1";
