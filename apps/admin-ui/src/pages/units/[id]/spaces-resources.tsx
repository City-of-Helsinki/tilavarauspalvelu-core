import { Button, ButtonVariant, IconPlusCircleFill } from "hds-react";
import React, { createRef } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { UserPermissionChoice, useSpacesResourcesQuery } from "@gql/gql-types";
import { createNodeId, toNumber, ignoreMaybeArray, getNode } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { Error404 } from "@/component/Error404";
import { fontBold, H2, CenterSpinner, Flex } from "common/styled";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useModal } from "@/context/ModalContext";
import { FixedDialog } from "@/styled/FixedDialog";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import { ResourcesTable, SubPageHead, SpacesTable, NewSpaceModal, NewResourceModal } from "@lib/units/[id]/";

const ActionButton = styled(Button)`
  span {
    color: var(--color-black);
    ${fontBold}
  }
`;

/// The unit specific space and resources listing
function SpacesResources({ unitPk }: { unitPk: number }): JSX.Element {
  const { t } = useTranslation();

  const newSpacesButtonRef = createRef<HTMLButtonElement>();
  const newResourceButtonRef = createRef<HTMLButtonElement>();

  const {
    data,
    refetch,
    loading: isLoading,
  } = useSpacesResourcesQuery({
    variables: { id: createNodeId("UnitNode", unitPk) },
    fetchPolicy: "network-only",
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { setModalContent } = useModal();

  if (isLoading) {
    return <CenterSpinner />;
  }

  const unit = getNode(data);
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
      <SubPageHead title={t("spaces:spacesAndResources")} unit={unit} />
      <Flex $direction="row" $justifyContent="space-between" $alignItems="center">
        <H2 $noMargin>{t("spaces:spaces")}</H2>
        <ActionButton
          ref={newSpacesButtonRef}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          onClick={() => handleOpenNewSpaceModal()}
        >
          {t("spaces:addSpace")}
        </ActionButton>
      </Flex>
      <SpacesTable unit={unit} refetch={refetch} />
      <Flex $direction="row" $justifyContent="space-between" $alignItems="center">
        <H2 $noMargin>{t("spaces:resources")}</H2>
        <ActionButton
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          disabled={unit.spaces.length === 0}
          onClick={handleOpenNewResourceModal}
        >
          {t("spaces:addResource")}
        </ActionButton>
      </Flex>
      <ResourcesTable unit={unit} refetch={refetch} />
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page(props: PropsNarrowed): JSX.Element {
  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <SpacesResources unitPk={props.pk} />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }
  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const SPACES_RESOURCES_QUERY = gql`
  query SpacesResources($id: ID!) {
    node(id: $id) {
      ... on UnitNode {
        id
        ...UnitSubpageHead
        ...SpacesTable
        ...ResourceTable
      }
    }
  }
`;
