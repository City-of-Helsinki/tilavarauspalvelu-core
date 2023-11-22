import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { env } from "@/env.mjs";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

// TODO what is the purpose of this page?
const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push(env.NEXT_PUBLIC_BASE_URL || "/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default LogoutPage;
