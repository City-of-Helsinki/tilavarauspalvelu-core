import { useEffect } from "react";
// NOTE not using App.tsx so need to import i18n here also
import "@/i18n";
import { getVersion } from "@/helpers/serverUtils";
import { useRouter } from "next/router";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

/* Page to redirect to the front page after a succesful logout
 * TODO might be able to replace this with middleware
 * */
function LogoutPage({ redirectUrl }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export async function getServerSideProps() {
  return {
    props: {
      redirectUrl: "/",
      version: getVersion(),
      // TODO can't use SSR translations because our translations aren't in public folder
      // ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default LogoutPage;
