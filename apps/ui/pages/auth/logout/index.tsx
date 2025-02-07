import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getCommonServerSideProps } from "@/modules/serverUtils";

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

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      redirectUrl: "/",
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default LogoutPage;
