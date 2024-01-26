import React from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isFinite } from "lodash";
import { useTranslation } from "next-i18next";
import { useSession } from "@/hooks/auth";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import ReservationEdit from "../../components/reservation/ReservationEdit";
import Error from "next/error";
import { getCommonServerSideProps } from "@/modules/serverUtils";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale, query } = ctx;

  const id = Number(query.params?.[0]);
  const slug = query.params?.[1];

  if (isFinite(id) && slug != null && (slug === "cancel" || slug === "edit")) {
    return {
      props: {
        ...getCommonServerSideProps(),
        ...(await serverSideTranslations(locale ?? "fi")),
        key: `${id}${slug}${locale}`,
        id,
        mode: slug,
      },
    };
  }

  return {
    notFound: true,
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
      key: `${id}${slug}${locale}`,
      id: null,
      mode: null,
    },
  };
};

const ReservationParams = (props: Props): JSX.Element | null => {
  const { mode } = props;
  const { isAuthenticated } = useSession();
  const { t } = useTranslation("common");

  // NOTE should not end up here (SSR redirect to login)
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  // TODO should use separate files for file routing (e.g. /reservation/edit/[id]/cancel.tsx)
  if (mode !== "cancel" && mode !== "edit") {
    return <Error statusCode={404} />;
  }
  if (mode === "cancel") {
    return <ReservationCancellation {...props} />;
  }
  return <ReservationEdit {...props} />;
};

export default ReservationParams;
