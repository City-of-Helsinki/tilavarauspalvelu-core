import { Button, IconPlusCircleFill } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useUnitQuery } from "@gql/gql-types";
import { ResourcesTable } from "./ResourcesTable";
import { SpacesTable } from "./SpacesTable";
import { SubPageHead } from "./SubPageHead";
import Modal, { useModal } from "@/component/HDSModal";
import { NewSpaceModal } from "./space/new-space-modal/NewSpaceModal";
import { NewResourceModal } from "./resource/NewResourceModal";
import { base64encode } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import Error404 from "@/common/Error404";
import { fontBold, H2 } from "common";
import { CenterSpinner, Flex } from "common/styles/util";
import { LinkPrev } from "@/component/LinkPrev";

interface IProps {
  [key: string]: string;
  unitPk: string;
}

const ActionButton = styled(Button)`
  span {
    color: var(--color-black);
    ${fontBold}
  }
`;

/// The unit specific space and resources listing
function SpacesResources(): JSX.Element {
  const { t } = useTranslation();
  const unitPk = Number(useParams<IProps>().unitPk);

  const newSpacesButtonRef = React.createRef<HTMLButtonElement>();
  const newResourceButtonRef = React.createRef<HTMLButtonElement>();

  const id = base64encode(`UnitNode:${unitPk}`);
  const {
    data,
    refetch,
    loading: isLoading,
  } = useUnitQuery({
    variables: { id },
    fetchPolicy: "network-only",
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
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
    return <CenterSpinner />;
  }

  const { unit } = data ?? {};
  if (unit == null) {
    return <Error404 />;
  }

  return (
    <>
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
      <LinkPrev />
      <SubPageHead title={t("Unit.spacesAndResources")} unit={unit} />
      <Flex
        $direction="row"
        $justifyContent="space-between"
        $alignItems="center"
      >
        <H2 $noMargin>{t("Unit.spaces")}</H2>
        <ActionButton
          ref={newSpacesButtonRef}
          iconLeft={<IconPlusCircleFill />}
          variant="supplementary"
          onClick={() => openNewSpaceModal()}
        >
          {t("Unit.addSpace")}
        </ActionButton>
      </Flex>
      <SpacesTable unit={unit} refetch={refetch} />
      <Flex
        $direction="row"
        $justifyContent="space-between"
        $alignItems="center"
      >
        <H2 $noMargin>{t("Unit.resources")}</H2>
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
      </Flex>
      <ResourcesTable unit={unit} refetch={refetch} />
      <Modal
        id="resource-modal"
        open={isNewResourceModalOpen}
        close={closeNewResourceModal}
        afterCloseFocusRef={newResourceButtonRef}
      >
        {modalContent}
      </Modal>
    </>
  );
}

export default SpacesResources;
