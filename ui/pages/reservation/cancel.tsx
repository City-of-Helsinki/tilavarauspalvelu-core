import { signIn, useSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useEffect } from "react";
import { breakpoints } from "common/src/common/style";
import { LoadingSpinner } from "hds-react";
import styled from "styled-components";
import { authEnabled, authenticationIssuer } from "../../modules/const";
import { useOrder, useReservation } from "../../hooks/reservation";
import Container from "../../components/common/Container";
import DeleteCancelled from "../../components/reservation/DeleteCancelled";
import ReservationFail from "../../components/reservation/ReservationFail";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const StyledContainer = styled(Container)`
  display: flex;
  padding: var(--spacing-m) var(--spacing-m) var(--spacing-layout-m);
  justify-content: center;

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;
const Cancel = () => {
  const session = useSession();
  const router = useRouter();
  const { orderId } = router.query as { orderId: string };

  const isCheckingAuth = session?.status === "loading";
  const isLoggedOut = authEnabled && session?.status === "unauthenticated";

  useEffect(() => {
    if (isLoggedOut) {
      signIn(authenticationIssuer, {
        callbackUrl: window.location.href,
      });
    }
  }, [isLoggedOut]);

  const { order, loading, called } = useOrder({ orderUuid: orderId });

  const { deleteReservation, deleteError, deleteLoading, deleted } =
    useReservation({
      reservationPk: order?.reservationPk
        ? parseInt(order?.reservationPk, 10)
        : null,
    });

  useEffect(() => {
    const { reservationPk } = order || {};
    if (reservationPk) {
      deleteReservation({
        variables: { input: { pk: parseInt(reservationPk, 10) } },
      });
    }
  }, [deleteReservation, order]);

  if (loading || deleteLoading || isCheckingAuth || !called || isLoggedOut) {
    return (
      <StyledContainer>
        <LoadingSpinner />
      </StyledContainer>
    );
  }

  // return invalid order id error
  if (!order || !order.reservationPk) {
    return <ReservationFail type="order" />;
  }

  // return general error
  if (
    deleted === false &&
    (!deleteError ||
      deleteError?.message !== "No Reservation matches the given query.")
  ) {
    return <DeleteCancelled reservationPk={order?.reservationPk} error />;
  }

  // return success report - even if deletion failed
  return (
    <StyledContainer>
      <DeleteCancelled reservationPk={order?.reservationPk} error={false} />
    </StyledContainer>
  );
};

export default Cancel;
