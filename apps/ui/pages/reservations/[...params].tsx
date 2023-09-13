import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { signIn, useSession } from "next-auth/react";
import { isFinite } from "lodash";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import ReservationEdit from "../../components/reservation/ReservationEdit";
import { authEnabled, authenticationIssuer } from "../../modules/const";

type Props = {
  id: number;
  mode: "cancel" | "edit";
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query,
}) => {
  const id = Number(query.params[0]);
  const slug = query.params[1];

  if (isFinite(id) && ["cancel", "edit"].includes(slug)) {
    return {
      props: {
        ...(await serverSideTranslations(locale)),
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

const ReservationParams = (props: Props): JSX.Element => {
  const { mode } = props;
  const session = useSession();

  const isUserUnauthenticated =
    authEnabled && session?.status === "unauthenticated";

  useEffect(() => {
    if (isUserUnauthenticated) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isUserUnauthenticated]);

  if (isUserUnauthenticated) return null;

  const Component =
    mode === "cancel" ? ReservationCancellation : ReservationEdit;

  return <Component {...props} />;
};

export default ReservationParams;
