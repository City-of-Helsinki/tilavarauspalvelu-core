import React, { useEffect } from "react";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { CancelledLinkSet } from "@/components/reservation/CancelledLinkSet";
import { H1 } from "common";
import { useDeleteReservation, useOrder } from "@/hooks/reservation";
import { ReservationFail } from "@/components/reservation/ReservationFail";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { useTranslation } from "react-i18next";
import { CenterSpinner } from "@/components/common/common";

type Props = Awaited<ReturnType<typeof getServerSideProps>>["props"];

function Cancel({ apiBaseUrl }: Props): JSX.Element {
  const router = useRouter();
  const { orderId } = router.query;

  const uuid = Array.isArray(orderId) ? orderId[0] : orderId;
  const { order, isLoading, called } = useOrder({ orderUuid: uuid });

  const {
    mutation: deleteReservation,
    error: deleteError,
    isLoading: isDeleteLoading,
    deleted,
  } = useDeleteReservation();

  // TODO not a fan of this
  // just do the reservation query on SSR, handles invalid route errors also
  useEffect(() => {
    const { reservationPk } = order || {};
    if (reservationPk) {
      deleteReservation({
        variables: { input: { pk: reservationPk } },
      });
    }
  }, [deleteReservation, order]);

  // TODO why is this like this?
  const isError =
    !deleted &&
    (!deleteError ||
      deleteError?.message !== "No Reservation matches the given query.");

  const { t } = useTranslation();

  // TODO improve error reporting
  if (isError) {
    return (
      <div>
        <H1>{t("common:error.error")}</H1>
        <p>{t("errors:general_error")}</p>
      </div>
    );
  }

  // TEMPORARY testing
  // return invalid order id error
  if (!order || !order.reservationPk) {
    return <ReservationFail apiBaseUrl={apiBaseUrl} type="order" />;
  }

  if (isLoading || isDeleteLoading || !called) {
    return <CenterSpinner />;
  }

  // return success report - even if deletion failed
  return <DeleteCancelled apiBaseUrl={apiBaseUrl} />;
}

// TODO why is this named DeleteCancelled? it seems to be a success report
function DeleteCancelled({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { t } = useTranslation();
  return (
    <>
      <H1>{t("reservations:reservationCancelledTitle")}</H1>
      <CancelledLinkSet apiBaseUrl={apiBaseUrl} />
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Cancel;
