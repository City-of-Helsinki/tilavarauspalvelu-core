import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { env } from "@/env.mjs";
import { useSessionStorage } from "react-use";
import { PendingReservation } from "common";
import { useQuery } from "@apollo/client";
import { Query, QueryReservationByPkArgs } from "common/types/gql-types";
import { GET_RESERVATION } from "@/modules/queries/reservation";
import { LoadingSpinner } from "hds-react";
import styled from "styled-components";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const CenteredSpinner = styled(LoadingSpinner)`
  top: 50%;
  left: 50%;
  transform: translate3d(-50%, calc(-50% - 73px), 0);
`;

// This page exists to function as the return point from the payment provider.
// It is not meant to be seen by the user, and at the moment it just redirects
// the user to the front page.
function PaymentReturnPage() {
  const router = useRouter();
  const [reservationData] = useSessionStorage<PendingReservation | null>(
    "pendingReservation",
    null
  );
  const { data } = useQuery<Query, QueryReservationByPkArgs>(GET_RESERVATION, {
    variables: { pk: reservationData?.pk },
    skip: !reservationData?.pk,
    onError: () => {},
  });

  const reservationUrl = `${
    env.NEXT_PUBLIC_BASE_URL || "/"
  }reservation-unit/${data?.reservationByPk?.reservationUnits?.[0]
    ?.pk}/reservation`;

  useEffect(() => {
    router.push(reservationUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUrl]);

  return <CenteredSpinner />;
}

export default PaymentReturnPage;
