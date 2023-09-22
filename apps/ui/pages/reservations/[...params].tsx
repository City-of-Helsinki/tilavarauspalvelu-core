import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isFinite } from "lodash";
import { useSession } from "~/hooks/auth";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import ReservationEdit from "../../components/reservation/ReservationEdit";
import { authEnabled } from "../../modules/const";

type Props = {
  id: number;
  mode: "cancel" | "edit";
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query,
}) => {
  const id = Number(query.params?.[0]);
  const slug = query.params?.[1];

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

  const isUserUnauthenticated = authEnabled && !isAuthenticated;

  /*
  useEffect(() => {
    if (isUserUnauthenticated) {
      signIn();
    }
  }, [isUserUnauthenticated]);
  */

  if (isUserUnauthenticated) {
    return null;
  }

  const Component =
    mode === "cancel" ? ReservationCancellation : ReservationEdit;

  return <Component {...props} />;
};

export default ReservationParams;
