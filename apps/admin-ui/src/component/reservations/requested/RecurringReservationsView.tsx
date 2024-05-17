import React from "react";
import { H6 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  State,
  type ReservationQuery,
  RecurringReservationQuery,
} from "@gql/gql-types";
import { type ApolloQueryResult } from "@apollo/client";
import { useRecurringReservations } from "./hooks";
import { ReservationList } from "@/component/ReservationsList";
import ReservationListButton from "@/component/ReservationListButton";
import DenyDialog from "./DenyDialog";
import { useModal } from "@/context/ModalContext";
import EditTimeModal from "../EditTimeModal";

type RecurringReservationType = NonNullable<
  RecurringReservationQuery["recurringReservation"]
>;
type ReservationType = NonNullable<RecurringReservationType["reservations"]>[0];

function RecurringReservationsView({
  recurringPk,
  onSelect,
  onChange,
  onReservationUpdated,
}: {
  recurringPk: number;
  onSelect?: (selected: ReservationType) => void;
  onChange?: () => Promise<ApolloQueryResult<ReservationQuery>>;
  onReservationUpdated?: () => void;
}) {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const { loading, reservations, refetch } =
    useRecurringReservations(recurringPk);

  if (loading) {
    return <div>Loading</div>;
  }

  const handleChangeSuccess = () => {
    setModalContent(null);
    refetch();
    if (onChange) {
      onChange();
    }
  };

  type ReservationEditType = NonNullable<ReservationQuery["reservation"]>;
  const handleChange = (res: (typeof reservations)[0]) => {
    setModalContent(
      <EditTimeModal
        // TODO this was here already (so probably uses the undefineds on purpose)
        // The correct way to deal with this would be either split
        // the Edit modal into two parts or do a query using id inside it (if we need all the data).
        reservation={res as ReservationEditType}
        onAccept={() => handleChangeSuccess()}
        onClose={() => setModalContent(null)}
      />,
      true
    );
  };

  const handleCloseRemoveDialog = () => {
    setModalContent(null);
  };

  const handleRemove = (res: (typeof reservations)[0]) => {
    setModalContent(
      <DenyDialog
        reservations={[res]}
        onReject={() => {
          refetch();
          if (onReservationUpdated) {
            onReservationUpdated();
          }
          handleCloseRemoveDialog();
        }}
        onClose={handleCloseRemoveDialog}
      />,
      true
    );
  };

  const forDisplay = reservations.map((x) => {
    const buttons = [];
    const startDate = new Date(x.begin);
    const endDate = new Date(x.end);
    const now = new Date();

    if (x.state !== State.Denied) {
      if (startDate > now && onChange) {
        buttons.push(
          <ReservationListButton
            key="change"
            callback={() => handleChange(x)}
            type="change"
            t={t}
          />
        );
      }

      if (onSelect) {
        buttons.push(
          <ReservationListButton
            key="show"
            callback={() => onSelect(x)}
            type="show"
            t={t}
          />
        );
      }
      if (endDate > now) {
        buttons.push(
          <ReservationListButton
            key="deny"
            callback={() => handleRemove(x)}
            type="deny"
            t={t}
          />
        );
      }
    }
    return {
      date: startDate,
      startTime: format(startDate, "H:mm"),
      endTime: format(endDate, "H:mm"),
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
}

export default RecurringReservationsView;
