import { NextResponse, type NextRequest } from "next/server";

/**
 * Desktop shell only: every request must carry the per-launch token that the Electron
 * main process injects, so other local programs or browsers cannot talk to the loopback server.
 */
export function middleware(req: NextRequest) {
  const expected = process.env.CARESYNC_LAUNCH_TOKEN;
  if (expected && req.headers.get("x-caresync-token") !== expected) return new NextResponse("Forbidden", { status: 403 });
  return NextResponse.next();
}

export const config = { matcher: "/((?!_next/static|_next/image).*)" };
