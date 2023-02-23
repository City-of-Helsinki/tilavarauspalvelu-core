import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isFinite } from "lodash";
import ReservationCancellation from "../../components/reservation/ReservationCancellation";
import ReservationEdit from "../../components/reservation/ReservationEdit";

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

  return <Component {...props} />;
};

export default ReservationParams;
