import { type GetServerSidePropsContext } from "next";
import { getSignInUrl } from "@/modules/const";
import { authEnabled } from "@/modules/const";

// TODO remove authEnabled and replace with mocking this and useSession
export function redirectProtectedRoute (ctx: GetServerSidePropsContext) {
  if (!authEnabled) {
    return undefined
  }
  // TODO wrap the session cookie to withSession with req.session.user
  const session =  ctx.req.cookies['sessionid'];
  const host = ctx.req.headers.host ?? "";
  const protocol = ctx.req.headers["x-forwarded-proto"] ?? "http";
  const currentUrl = `${protocol}://${host}${ctx.req.url ?? ""}`;
  if (!session) {
    // redirect to login
    return {
      redirect: {
        destination: getSignInUrl(currentUrl),
        permanent: false,
      },
    };
  }
  return undefined;
}

