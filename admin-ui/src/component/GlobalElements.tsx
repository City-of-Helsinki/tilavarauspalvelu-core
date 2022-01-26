import React from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "../context/ModalContext";
import { useNotification } from "../context/NotificationContext";
import { StyledNotification } from "../styles/util";
import Modal from "./Modal";

const GlobalElements = (): JSX.Element => {
  const { modalContent } = useModal();
  const { notification, clearNotification } = useNotification();
  const { t } = useTranslation();

  const modal = modalContent.isHds ? (
    modalContent.content
  ) : (
    <Modal>{modalContent.content}</Modal>
  );

  return (
    <>
      {modalContent.content ? modal : null}
      {notification ? (
        <StyledNotification
          type={notification.type}
          label={notification.title}
          position="top-center"
          dismissible
          closeButtonLabelText={`${t("common.close")}`}
          onClose={clearNotification}
        >
          {notification.message}
        </StyledNotification>
      ) : null}
    </>
  );
};

export default GlobalElements;
