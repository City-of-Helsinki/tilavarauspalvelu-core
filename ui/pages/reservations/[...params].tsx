import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isFinite } from "lodash";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import { authEnabled, isBrowser } from "../../modules/const";
import ReservationEdit from "../../components/reservation/ReservationEdit";
import { clearApiAccessToken } from "../../modules/auth/util";
import WithOidc from "../../components/common/WithOidc";

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

  const Component =
    mode === "cancel" ? ReservationCancellation : ReservationEdit;

  if (!isBrowser || !authEnabled) {
    return <Component {...props} />;
  }

  return (
    <WithOidc
      render={(oidcProps: { logout: (() => void) | undefined }) => (
        <Component
          {...props}
          logout={() => {
            clearApiAccessToken();
            oidcProps.logout();
          }}
        />
      )}
    />
  );
};

export default ReservationParams;
