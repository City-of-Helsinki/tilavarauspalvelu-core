import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { Button, Dialog } from "hds-react";
import { ReservationUnitByPkType } from "../../../common/gql-types";
import { useModal } from "../../../context/ModalContext";

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

const DialogContent = ({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body">
          {t("ArchiveReservationUnitDialog.description")}
        </p>
      </Dialog.Content>
      <ActionButtons>
        <Button variant="secondary" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={() => {
            onAccept();
          }}
        >
          {t("ArchiveReservationUnitDialog.archive")}
        </Button>
      </ActionButtons>
    </>
  );
};

const ArchiveDialog = ({
  reservationUnit,
  onClose,
  onAccept,
}: {
  reservationUnit: ReservationUnitByPkType;

  onClose: () => void;
  onAccept: () => void;
}): JSX.Element => {
  const { isOpen } = useModal();
  const { t } = useTranslation();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
    >
      <Dialog.Header
        id="modal-header"
        title={t("ArchiveReservationUnitDialog.title", {
          name: reservationUnit.nameFi as string,
        })}
      />
      <DialogContent onAccept={onAccept} onClose={onClose} />
    </Dialog>
  );
};
export default ArchiveDialog;
