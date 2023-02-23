import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { ExtendedJWT } from "./pages/api/auth/[...nextauth]";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const authEnabled = process.env.DISABLE_AUTH === "false";

export const config = { matcher: ["/reservations", "/applications"] };

// export { default } from "next-auth/middleware";    this would be the default way of doing things, below is necessary only because of cypress testing
export default async function middleware(req: NextRequest) {
  if (authEnabled) {
    const token = (await getToken({
      req,
      secret: nextAuthSecret,
    })) as ExtendedJWT;

    if (!token?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }
}
