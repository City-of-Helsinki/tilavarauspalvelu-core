import { Button, IconPlusCircleFill } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUnitQuery } from "@gql/gql-types";
import { Container } from "@/styles/layout";
import Loader from "../Loader";
import { ResourcesTable } from "./ResourcesTable";
import { SpacesTable } from "./SpacesTable";
import { SubPageHead } from "./SubPageHead";
import Modal, { useModal } from "../HDSModal";
import { NewSpaceModal } from "../Spaces/space-editor/new-space-modal/NewSpaceModal";
import { NewResourceModal } from "../Resources/resource-editor/NewResourceModal";
import { base64encode } from "common/src/helpers";
import { useNotification } from "@/context/NotificationContext";
import Error404 from "@/common/Error404";

interface IProps {
  [key: string]: string;
  unitPk: string;
}

const TableHead = styled.div`
  display: flex;
  margin-bottom: var(--spacing-m);
  margin-top: var(--spacing-m);
`;

const Title = styled.div`
  font-size: var(--fontsize-heading-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ActionButton = styled(Button)`
  margin-left: auto;
  padding: 0;
  span {
    padding: 0;
    color: var(--color-black);
    font-family: var(--tilavaraus-admin-font-bold);
  }
`;

/// The unit specific space and resources listing
function SpacesResources(): JSX.Element {
  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);

  const newSpacesButtonRef = React.createRef<HTMLButtonElement>();
  const newResourceButtonRef = React.createRef<HTMLButtonElement>();

  const { notifyError } = useNotification();

  const id = base64encode(`UnitNode:${unitPk}`);
  const {
    data,
    refetch,
    loading: isLoading,
  } = useUnitQuery({
    variables: { id },
    fetchPolicy: "network-only",
    onError: () => {
      notifyError("errors.errorFetchingData");
    },
  });

  const {
    open: newSpaceDialogIsOpen,
    openModal: openNewSpaceModal,
    closeModal: closeNewSpaceModal,
  } = useModal();

  const {
    openWithContent,
    modalContent,
    open: isNewResourceModalOpen,
    closeModal: closeNewResourceModal,
  } = useModal();

  if (isLoading) {
    return <Loader />;
  }

  const { unit } = data ?? {};
  if (unit == null) {
    return <Error404 />;
  }

  return (
    <Container>
      <Modal
        id="space-modal"
        open={newSpaceDialogIsOpen}
        close={() => closeNewSpaceModal()}
        afterCloseFocusRef={newSpacesButtonRef}
      >
        <NewSpaceModal
          unit={unit}
          closeModal={() => closeNewSpaceModal()}
          refetch={refetch}
        />
      </Modal>
      <SubPageHead title={t("Unit.spacesAndResources")} unit={unit} />
      <TableHead>
        <Title>{t("Unit.spaces")}</Title>
        <ActionButton
          ref={newSpacesButtonRef}
          iconLeft={<IconPlusCircleFill />}
          variant="supplementary"
          onClick={() => openNewSpaceModal()}
        >
          {t("Unit.addSpace")}
        </ActionButton>
      </TableHead>
      <SpacesTable unit={unit} refetch={refetch} />
      <TableHead>
        <Title>{t("Unit.resources")}</Title>
        <ActionButton
          disabled={unit.spaces.length === 0}
          iconLeft={<IconPlusCircleFill />}
          variant="supplementary"
          onClick={() => {
            openWithContent(
              <NewResourceModal
                spacePk={0}
                unit={unit}
                closeModal={closeNewResourceModal}
                refetch={refetch}
              />
            );
          }}
        >
          {t("Unit.addResource")}
        </ActionButton>
      </TableHead>
      <ResourcesTable unit={unit} refetch={refetch} />
      <Modal
        id="resource-modal"
        open={isNewResourceModalOpen}
        close={closeNewResourceModal}
        afterCloseFocusRef={newResourceButtonRef}
      >
        {modalContent}
      </Modal>
    </Container>
  );
}

export default SpacesResources;
