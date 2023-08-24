import React from "react";
import { useTranslation } from "react-i18next";
import GenericDialog from "./GenericDialog";

const DiscardChangesDialog = ({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("DiscardReservationUnitChangesDialog.description")}
      title={t("DiscardReservationUnitChangesDialog.title")}
      acceptLabel={t("DiscardReservationUnitChangesDialog.discard")}
    />
  );
};
export default DiscardChangesDialog;
