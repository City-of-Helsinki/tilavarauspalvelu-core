import React from "react";
import { useTranslation } from "react-i18next";
import { GenericDialog } from "./GenericDialog";
import { type ReservationUnitNode } from "@gql/gql-types";

export function ArchiveDialog({
  reservationUnit,
  onClose,
  onAccept,
}: {
  reservationUnit: Pick<ReservationUnitNode, "nameFi">;
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("ArchiveReservationUnitDialog.description")}
      title={t("ArchiveReservationUnitDialog.title", {
        name: reservationUnit.nameFi ?? "-",
      })}
      acceptLabel={t("ArchiveReservationUnitDialog.archive")}
    />
  );
}
