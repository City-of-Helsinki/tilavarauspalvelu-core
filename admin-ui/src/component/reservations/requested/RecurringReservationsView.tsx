import React, { useState } from "react";
import { Query, type ReservationType } from "common/types/gql-types";
import { H6 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { RECURRING_RESERVATION_QUERY } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import ReservationList from "../../ReservationsList";
import ReservationListButton from "../../ReservationListButton";

const LIMIT = 100;

const RecurringReservationsView = ({
  reservation,
  onSelect,
}: {
  reservation: ReservationType;
  onSelect: (selected: ReservationType) => void;
}) => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<ReservationType[]>([]);

  const { loading } = useQuery<
    Query,
    { pk: number; offset: number; count: number }
  >(RECURRING_RESERVATION_QUERY, {
    skip: !reservation.recurringReservation?.pk,
    variables: {
      pk: Number(reservation.recurringReservation?.pk),
      offset: reservations.length,
      count: LIMIT,
    },
    onCompleted: (data) => {
      const qd = data?.reservations;
      if (qd?.edges.length != null && qd?.totalCount && qd?.edges.length > 0) {
        const ds =
          qd?.edges
            ?.map((x) => x?.node)
            .filter((x): x is ReservationType => x != null) ?? [];

        setReservations([...reservations, ...ds]);
      }
    },
    onError: () => {
      notifyError(t("RequestedReservation.errorFetchingData"));
    },
  });

  if (loading) {
    return <div>Loading</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChange = (_x: ReservationType) => {
    // eslint-disable-next-line no-console
    console.warn("Change NOT Implemented.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRemove = (_x: ReservationType) => {
    // eslint-disable-next-line no-console
    console.warn("Remove NOT Implemented.");
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleRestore = (_x: ReservationType) => {
    // eslint-disable-next-line no-console
    console.warn("Restore NOT Implemented.");
  };

  const forDisplay = reservations.map((x) => ({
    date: new Date(x.begin),
    startTime: format(new Date(x.begin), "HH:mm"),
    endTime: format(new Date(x.end), "HH:mm"),
    isRemoved: x.state !== "CONFIRMED",
    buttons: [
      <ReservationListButton callback={() => handleChange(x)} type="change" />,
      <ReservationListButton callback={() => onSelect(x)} type="show" />,
      x.state === "CONFIRMED" ? (
        <ReservationListButton callback={() => handleRemove(x)} type="remove" />
      ) : (
        <ReservationListButton
          callback={() => handleRestore(x)}
          type="restore"
        />
      ),
    ],
  }));

  return (
    <ReservationList
      header={<H6 as="h3">{t("RecurringReservationsView.Heading")}</H6>}
      items={forDisplay}
    />
  );
};

export default RecurringReservationsView;
