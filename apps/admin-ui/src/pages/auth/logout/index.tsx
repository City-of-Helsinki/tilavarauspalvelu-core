import { useEffect } from "react";
import { getVersion } from "@/modules/baseUtils.mjs";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

/* Page to redirect to the front page after a succesful logout
 * TODO might be able to replace this with middleware
 * */
export default function LogoutPage({ redirectUrl }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.replace(redirectUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      redirectUrl: "/",
      version: getVersion(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}
