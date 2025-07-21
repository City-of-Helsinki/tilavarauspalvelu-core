import { Button, ButtonVariant, IconPlusCircleFill } from "hds-react";
import React, { createRef } from "react";
import { useTranslation } from "next-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { useSpacesResourcesQuery } from "@gql/gql-types";
import { ResourcesTable } from "./ResourcesTable";
import { SpacesTable } from "./SpacesTable";
import { SubPageHead } from "./SubPageHead";
import { NewSpaceModal } from "./space/new-space-modal/NewSpaceModal";
import { NewResourceModal } from "./resource/NewResourceModal";
import { base64encode } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import Error404 from "@/common/Error404";
import { fontBold, H2, CenterSpinner, Flex } from "common/styled";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useModal } from "@/context/ModalContext";
import { FixedDialog } from "@/styled/FixedDialog";

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

  const newSpacesButtonRef = createRef<HTMLButtonElement>();
  const newResourceButtonRef = createRef<HTMLButtonElement>();

  const id = base64encode(`UnitNode:${unitPk}`);
  const {
    data,
    refetch,
    loading: isLoading,
  } = useSpacesResourcesQuery({
    variables: { id },
    fetchPolicy: "network-only",
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { setModalContent } = useModal();

  if (isLoading) {
    return <CenterSpinner />;
  }

  const { unit } = data ?? {};
  if (unit == null) {
    return <Error404 />;
  }

  const handleOpenNewSpaceModal = () => {
    setModalContent(
      <FixedDialog
        id="space-modal"
        isOpen
        close={() => setModalContent(null)}
        focusAfterCloseRef={newSpacesButtonRef}
        closeButtonLabelText={t("common:close")}
        aria-labelledby="modal-header"
      >
        <NewSpaceModal unit={unit} closeModal={() => setModalContent(null)} refetch={refetch} />
      </FixedDialog>
    );
  };

  const handleOpenNewResourceModal = () => {
    setModalContent(
      <FixedDialog
        id="resource-modal"
        isOpen
        close={() => setModalContent(null)}
        focusAfterCloseRef={newResourceButtonRef}
        closeButtonLabelText={t("common:close")}
        aria-labelledby="modal-header"
      >
        <NewResourceModal spacePk={0} unit={unit} closeModal={() => setModalContent(null)} refetch={refetch} />
      </FixedDialog>
    );
  };

  return (
    <>
      <LinkPrev />
      <SubPageHead title={t("Unit.spacesAndResources")} unit={unit} />
      <Flex $direction="row" $justifyContent="space-between" $alignItems="center">
        <H2 $noMargin>{t("Unit.spaces")}</H2>
        <ActionButton
          ref={newSpacesButtonRef}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          onClick={() => handleOpenNewSpaceModal()}
        >
          {t("Unit.addSpace")}
        </ActionButton>
      </Flex>
      <SpacesTable unit={unit} refetch={refetch} />
      <Flex $direction="row" $justifyContent="space-between" $alignItems="center">
        <H2 $noMargin>{t("Unit.resources")}</H2>
        <ActionButton
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          disabled={unit.spaces.length === 0}
          onClick={handleOpenNewResourceModal}
        >
          {t("Unit.addResource")}
        </ActionButton>
      </Flex>
      <ResourcesTable unit={unit} refetch={refetch} />
    </>
  );
}

export default SpacesResources;

export const SPACES_RESOURCES_QUERY = gql`
  query SpacesResources($id: ID!) {
    unit(id: $id) {
      id
      ...UnitSubpageHead
      ...SpacesTable
      ...ResourceTable
    }
  }
`;
