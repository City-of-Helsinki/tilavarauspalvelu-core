import React, { useState } from "react";
import {
  Query,
  QueryReservationByPkArgs,
  ReservationsReservationStateChoices,
  type ReservationType,
} from "common/types/gql-types";
import { H6 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { useLazyQuery, useQuery } from "@apollo/client";
import { format } from "date-fns";
import { RECURRING_RESERVATION_QUERY, RESERVATION_QUERY } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import ReservationList from "../../ReservationsList";
import ReservationListButton from "../../ReservationListButton";
import DenyDialog from "./DenyDialog";
import { useModal } from "../../../context/ModalContext";

const LIMIT = 100;

/// Returns both refetch and refetchSingle
/// Prefer the use of refetchSingle if at all possible, it takes a reservation pk as an argument
/// and only updates that.
/// refetch does a full cache reset that can take a long time and also causes rendering artefacts
/// because it resets a list to [].
/// refetchSingle has no error reporting incorrect reservation pk's are ignored
const useRecurringReservationList = (recurringReservationPk?: number) => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const [reservations, setReservations] = useState<ReservationType[]>([]);

  const { loading, refetch: baseRefetch } = useQuery<
    Query,
    { pk: number; offset: number; count: number }
  >(RECURRING_RESERVATION_QUERY, {
    skip: !recurringReservationPk,
    fetchPolicy: "network-only",
    variables: {
      pk: recurringReservationPk ?? 0,
      count: LIMIT,
      offset: reservations.length,
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

  const [getReservation] = useLazyQuery<Query, QueryReservationByPkArgs>(
    RESERVATION_QUERY
  );

  const refetch = () => {
    setReservations([]);
    baseRefetch();
  };

  const refetchSingle = (pk: number) => {
    getReservation({ variables: { pk } }).then((res) => {
      const data = res.data?.reservationByPk;
      const indexToUpdate = reservations.findIndex((x) => x.pk === data?.pk);
      if (data && indexToUpdate > -1) {
        setReservations([
          ...reservations.slice(0, indexToUpdate),
          data,
          ...reservations.slice(indexToUpdate + 1),
        ]);
      }
    });
  };

  return { loading, reservations, refetch, refetchSingle };
};

const RecurringReservationsView = ({
  reservation,
  onSelect,
  onChange,
}: {
  reservation: ReservationType;
  onSelect: (selected: ReservationType) => void;
  onChange: () => void;
}) => {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const { loading, reservations, refetchSingle } = useRecurringReservationList(
    reservation.recurringReservation?.pk ?? undefined
  );

  if (loading) {
    return <div>Loading</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChange = (_x: ReservationType) => {
    // eslint-disable-next-line no-console
    console.warn("Change NOT Implemented.");
  };

  const handleCloseRemoveDialog = (shouldRefetch?: boolean, pk?: number) => {
    if (shouldRefetch && pk) {
      refetchSingle(pk);
      onChange();
    }
    setModalContent(null);
  };

  const handleRemove = (res: ReservationType) => {
    setModalContent(
      <DenyDialog
        reservation={res}
        onReject={() => handleCloseRemoveDialog(true, res.pk ?? undefined)}
        onClose={() => handleCloseRemoveDialog(false)}
      />,
      true
    );
  };

  const forDisplay = reservations.map((x) => {
    const buttons = [];
    const startDate = new Date(x.begin);
    const now = new Date();

    if (x.state !== ReservationsReservationStateChoices.Denied) {
      if (startDate > now) {
        buttons.push(
          <ReservationListButton
            callback={() => handleChange(x)}
            type="change"
          />
        );
      }

      buttons.push(
        <ReservationListButton callback={() => onSelect(x)} type="show" />
      );
      if (startDate > now) {
        buttons.push(
          <ReservationListButton callback={() => handleRemove(x)} type="deny" />
        );
      }
    }
    return {
      date: startDate,
      startTime: format(startDate, "hh:mm"),
      endTime: format(new Date(x.end), "hh:mm"),
      isRemoved: x.state === "DENIED",
      buttons,
    };
  });

  return (
    <ReservationList
      header={<H6 as="h3">{t("RecurringReservationsView.Heading")}</H6>}
      items={forDisplay}
    />
  );
};

export default RecurringReservationsView;
