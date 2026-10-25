/**
 * Mail adapter. v0.1 has no SMTP transport: when SMTP_URL is unset (the default)
 * messages are written to the server console and `delivered` is false, so the UI
 * never claims an email was sent. Plug a provider in `send()` to enable delivery.
 */
export type MailResult = { delivered: boolean };

export async function sendMail(to: string, subject: string, text: string): Promise<MailResult> {
  if (!process.env.SMTP_URL) {
    if (process.env.NODE_ENV !== "test") {
      console.info(`[mail:dev-fallback] to=${to} subject="${subject}"\n${text}\n`);
    }
    return { delivered: false };
  }
  // Provider integration point (e.g. nodemailer / HTTP API). Intentionally not faked.
  console.warn("[mail] SMTP_URL is set but no transport is implemented; message not sent.");
  return { delivered: false };
}

export function appUrl(path: string): string {
  return `${process.env.APP_URL ?? "http://localhost:3000"}${path}`;
}
