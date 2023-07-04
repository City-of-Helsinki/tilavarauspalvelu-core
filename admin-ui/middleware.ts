import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
const authEnabled = process.env.DISABLE_AUTH === "false";

// export { default } from "next-auth/middleware";
// eslint-disable-next-line consistent-return
export default async function middleware(req: NextRequest) {
  console.log("auth middleware");
  if (authEnabled) {
    console.log("auth enabled");
    const token = await getToken({
      req,
      secret: nextAuthSecret,
    });

    if (!token?.user) {
      console.log("got user token");
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }
}
