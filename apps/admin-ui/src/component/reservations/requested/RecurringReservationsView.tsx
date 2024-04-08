import React from "react";
import { H6 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { State, type ReservationNode, type Query } from "common/types/gql-types";
import { type ApolloQueryResult } from "@apollo/client";
import { useRecurringReservations } from "./hooks";
import ReservationList from "../../ReservationsList";
import ReservationListButton from "../../ReservationListButton";
import DenyDialog from "./DenyDialog";
import { useModal } from "@/context/ModalContext";
import EditTimeModal from "../EditTimeModal";

const RecurringReservationsView = ({
  recurringPk,
  onSelect,
  onChange,
  onReservationUpdated,
}: {
  recurringPk: number;
  onSelect?: (selected: ReservationNode) => void;
  onChange?: () => Promise<ApolloQueryResult<Query>>;
  onReservationUpdated?: () => void;
}) => {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const { loading, reservations, refetch } = useRecurringReservations(recurringPk);

  if (loading) {
    return <div>Loading</div>;
  }

  const handleChangeSuccess = () => {
    setModalContent(null);
    if (onChange) {
      refetch();
      onChange();
    }
  };

  const handleChange = (res: ReservationNode) => {
    setModalContent(
      <EditTimeModal
        reservation={res}
        onAccept={() => handleChangeSuccess()}
        onClose={() => setModalContent(null)}
      />,
      true
    );
  };

  const handleCloseRemoveDialog = () => {
    setModalContent(null);
  };

  const handleRemove = (res: ReservationNode) => {
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
      if (startDate > now) {
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
      endTime: format(new Date(x.end), "H:mm"),
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
