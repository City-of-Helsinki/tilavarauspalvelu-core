import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Container } from "hds-react";
import { ErrorBoundary } from "react-error-boundary";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { RecurringReservationsView } from "@/component/RecurringReservationsView";
import { ActionsWrapper } from "./commonStyling";
import Error404 from "@/common/Error404";
import { useRecurringReservationQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { errorToast } from "common/src/common/toast";

const InfoSection = styled.p`
  margin: var(--spacing-l) 0;
`;

const StyledContainer = styled(Container)`
  margin-top: var(--spacing-2-xl);
  @media (min-width: ${breakpoints.m}) {
    padding-left: var(--spacing-2-xl) !important;
    padding-right: var(--spacing-2-xl) !important;
  }
`;

function RecurringReservationDoneInner({
  recurringPk,
}: {
  recurringPk: number;
}) {
  const { t } = useTranslation("translation", {
    keyPrefix: "MyUnits.RecurringReservation.Confirmation",
  });

  const id = base64encode(`RecurringReservationNode:${recurringPk}`);
  const { data } = useRecurringReservationQuery({
    skip: !recurringPk,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { recurringReservation } = data ?? {};
  const reservations = filterNonNullable(recurringReservation?.reservations);

  // TODO use urlbuilder
  const reservationPk = reservations[0]?.pk;
  const reservationUrl = reservationPk ? `/reservations/${reservationPk}` : "";

  return (
    <StyledContainer>
      <H1 $legacy>
        {reservations.length > 0 ? t(`title`) : t("allFailedTitle")}
      </H1>
      <InfoSection>{t(`successInfo`)}</InfoSection>
      <RecurringReservationsView recurringPk={recurringPk} />
      <ActionsWrapper>
        <ButtonLikeLink to="../../.." relative="path">
          {t(`buttonToUnit`)}
        </ButtonLikeLink>
        <ButtonLikeLink
          disabled={reservations[0]?.pk == null}
          to={reservationUrl}
        >
          {t(`buttonToReservation`)}
        </ButtonLikeLink>
      </ActionsWrapper>
    </StyledContainer>
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
