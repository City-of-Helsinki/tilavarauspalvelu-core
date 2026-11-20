import type { GetServerSidePropsContext } from "next";
import { getPostLogoutPath, LOGOUT_RETURN_PATH_COOKIE } from "@/modules/logout";

export default function LogoutPage() {
  return null;
}

// eslint-disable-next-line require-await
export async function getServerSideProps({ req, res }: GetServerSidePropsContext) {
  const returnPath = req.cookies[LOGOUT_RETURN_PATH_COOKIE];
  if (returnPath != null) {
    res.setHeader("Set-Cookie", `${LOGOUT_RETURN_PATH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`);
  }
  return {
    redirect: {
      destination: getPostLogoutPath(returnPath),
      permanent: false,
    },
  };
}
