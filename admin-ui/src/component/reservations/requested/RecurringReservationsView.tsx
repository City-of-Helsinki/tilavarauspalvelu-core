import React from "react";
import styled from "styled-components";
import {
  Query,
  QueryReservationByPkArgs,
  type ReservationType,
} from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { RECURRING_RESERVATION_QUERY } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import ReservationList from "../../ReservationsList";

const StyledHeading = styled.h3`
  background: var(--color-black-10);
  font-size: var(--fontsize-body-m);
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-2-xs);
  margin: 0;
`;

const RecurringReservationsView = ({
  reservation,
}: {
  reservation: ReservationType;
}) => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { loading, data } = useQuery<Query, QueryReservationByPkArgs>(
    RECURRING_RESERVATION_QUERY,
    {
      skip: !reservation.recurringReservation?.pk,
      variables: {
        pk: Number(reservation.recurringReservation?.pk),
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  if (loading || data == null) {
    return <div>Loading</div>;
  }

  const reservations =
    data?.reservations?.edges
      ?.map((x) => x?.node)
      .filter((x): x is ReservationType => x != null) ?? [];

  const forDisplay = reservations.map((x) => ({
    date: new Date(x.begin),
    startTime: format(new Date(x.begin), "hh:mm"),
    endTime: format(new Date(x.begin), "hh:mm"),
    isRemoved: x.state !== "CONFIRMED",
    ...(x.state === "CONFIRMED"
      ? {
          button: {
            type: "remove" as const,
            callback: () => {
              // eslint-disable-next-line no-console
              console.log("TODO: NOT IMEPLENETED remove pressed");
            },
          },
        }
      : {}),
  }));

  return (
    <>
      <StyledHeading>{t("RecurringReservationsView.Heading")}</StyledHeading>
      <ReservationList items={forDisplay} />
    </>
  );
};

export default RecurringReservationsView;
