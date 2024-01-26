import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { env } from "@/env.mjs";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  return {
    props: {
      ...getCommonServerSideProps(),
      redirectUrl: env.NEXT_PUBLIC_BASE_URL || "/",
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

// TODO what is the purpose of this page?
const LogoutPage = ({ redirectUrl }: Props) => {
  const router = useRouter();

  useEffect(() => {
    router.push(redirectUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default LogoutPage;
