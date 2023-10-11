import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isFinite } from "lodash";
import { useTranslation } from "next-i18next";
import { useSession } from "@/hooks/auth";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import ReservationEdit from "../../components/reservation/ReservationEdit";

type Props = {
  id: number;
  mode: "cancel" | "edit";
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale, query } = ctx;

  const id = Number(query.params?.[0]);
  const slug = query.params?.[1];

  const redirect = redirectProtectedRoute(ctx);
  if (redirect) {
    return redirect;
  }

  if (isFinite(id) && slug != null && (slug === "cancel" || slug === "edit")) {
    return {
      props: {
        ...(await serverSideTranslations(locale ?? "fi")),
        key: `${id}${slug}${locale}`,
        id,
        mode: slug,
      },
    };
  }

  return {
    notFound: true,
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

  // TODO this is awful, use /cancel&... and /edit&... with separate cancel.tsx and edit.tsx instead
  const Component =
    mode === "cancel" ? ReservationCancellation : ReservationEdit;

  return <Component {...props} />;
};

export default ReservationParams;
