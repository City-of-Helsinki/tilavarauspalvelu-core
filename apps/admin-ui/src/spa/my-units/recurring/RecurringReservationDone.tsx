import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { RecurringReservationsView } from "@/component/RecurringReservationsView";
import Error404 from "@/common/Error404";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { getReservationUrl } from "@/common/urls";
import { Flex, H1 } from "common/styled";
import { useRecurringReservations } from "@/hooks";

function RecurringReservationDoneInner({ recurringPk }: { recurringPk: number }) {
  const { t } = useTranslation("translation", {
    keyPrefix: "MyUnits.RecurringReservation.Confirmation",
  });

  const { reservations } = useRecurringReservations(recurringPk);
  const reservationUrl = getReservationUrl(reservations[0]?.pk);

  return (
    <>
      <H1 $marginBottom="none">{reservations.length > 0 ? t(`title`) : t("allFailedTitle")}</H1>
      <p>{t(`successInfo`)}</p>
      <RecurringReservationsView recurringPk={recurringPk} />
      <Flex $direction="row" $justifyContent="flex-end" $wrap="wrap">
        <ButtonLikeLink to="../../.." relative="path">
          {t(`buttonToUnit`)}
        </ButtonLikeLink>
        <ButtonLikeLink disabled={reservationUrl === ""} to={reservationUrl}>
          {t(`buttonToReservation`)}
        </ButtonLikeLink>
      </Flex>
    </>
  );
}

function ErrorComponent() {
  const { t } = useTranslation();
  return <div>{t("errors.errorRecurringReservationsDoneDisplay")}</div>;
}

export function RecurringReservationDone() {
  const { pk } = useParams() as { pk: string };
  const recurringPk = Number(pk);
  const isValid = recurringPk > 0;

  if (!isValid) {
    return <Error404 />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorComponent}>
      <RecurringReservationDoneInner recurringPk={recurringPk} />
    </ErrorBoundary>
  );
}
