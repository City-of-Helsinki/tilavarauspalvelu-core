import React from "react";
import { useTranslation } from "react-i18next";
import { Notification } from "hds-react";
import { useModal } from "@/context/ModalContext";
import { useNotification } from "@/context/NotificationContext";
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
        <Notification
          type={notification.type}
          label={notification.title}
          position="top-center"
          closeButtonLabelText={`${t("common.close")}`}
          onClose={clearNotification}
          dismissible
          // NOTE: there is something funny with the HDS notification styling so forcing it
          // TODO: figure out what is causing this and remove the style override
          style={{
            transform: "translate3d(-50%, 0px, 0px)",
            opacity: 1,
          }}
          autoClose={notification.type === "success"}
        >
          {notification.message}
        </Notification>
      ) : null}
    </>
  );
};

export default GlobalElements;
