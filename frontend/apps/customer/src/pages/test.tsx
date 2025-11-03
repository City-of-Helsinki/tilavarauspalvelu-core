import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useSearchParams } from "next/navigation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import CustomErrorComponent from "@/pages/_error";

function Page() {
  const params = useSearchParams();
  const statusCode = params.get("statusCode") ? Number(params.get("statusCode")) : 500;
  return <CustomErrorComponent statusCode={statusCode} />;
}

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Page;
