import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import React, { useEffect } from "react";
import { breakpoints } from "common/src/common/style";
import { LoadingSpinner } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Container } from "common";
import { useSession } from "@/hooks/auth";
import { redirectProtectedRoute } from "@/modules/protectedRoute";
import { useOrder, useReservation } from "@/hooks/reservation";
import DeleteCancelled from "@/components/reservation/DeleteCancelled";
import ReservationFail from "@/components/reservation/ReservationFail";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { locale } = ctx;

  const redirect = redirectProtectedRoute(ctx);
  if (redirect) {
    return redirect;
  }

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "fi")),
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
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const { orderId } = router.query;

  const uuid = Array.isArray(orderId) ? orderId[0] : orderId;
  const { order, isLoading, called } = useOrder({ orderUuid: uuid });

  const { deleteReservation, deleteError, deleteLoading, deleted } =
    useReservation({
      reservationPk: order?.reservationPk
        ? parseInt(order?.reservationPk, 10)
        : 0,
    });

  useEffect(() => {
    const { reservationPk } = order || {};
    if (reservationPk) {
      deleteReservation({
        variables: { input: { pk: parseInt(reservationPk, 10) } },
      });
    }
  }, [deleteReservation, order]);

  const { t } = useTranslation("common");

  // NOTE should not end up here (SSR redirect to login)
  if (!isAuthenticated) {
    <StyledContainer>
      <div>{t("common:error.notAuthenticated")}</div>
    </StyledContainer>;
  }

  if (isLoading || deleteLoading || !called) {
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
