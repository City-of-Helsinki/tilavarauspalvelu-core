import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import router from "next/router";
import { isBrowser } from "../../modules/const";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Login = (): null => {
  if (isBrowser) {
    router.reload();
  }

  return null;
};

export default Login;
