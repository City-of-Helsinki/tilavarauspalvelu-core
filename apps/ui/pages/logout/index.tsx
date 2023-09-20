import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import getConfig from "next/config";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const {
  publicRuntimeConfig: { baseUrl },
} = getConfig();

// TODO what is the purpose of this page?
const LogoutPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push(baseUrl || "/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default LogoutPage;
