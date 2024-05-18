import React from "react";
import { useTranslation } from "react-i18next";
import { GenericDialog } from "./GenericDialog";

export function ArchiveDialog({
  reservationUnit,
  onClose,
  onAccept,
}: {
  reservationUnit: {
    nameFi?: string | null;
  };
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
