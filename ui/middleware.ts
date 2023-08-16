import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const authEnabled = process.env.DISABLE_AUTH === "false";

export const config = { matcher: [] };

// export { default } from "next-auth/middleware";    this would be the default way of doing things, below is necessary only because of cypress testing
export default async function middleware(req: NextRequest) {
  if (authEnabled) {
    const token = (await getToken({
      req,
      secret: nextAuthSecret,
    }));

    if (!token?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }
}
