import { Button, ButtonVariant, IconPlusCircleFill } from "hds-react";
import React, { createRef } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { UserPermissionChoice, useSpacesResourcesQuery } from "@gql/gql-types";
import { HDSModal, useModal } from "common/src/components/HDSModal";
import { ResourcesTable } from "@/component/unit/ResourcesTable";
import { SpacesTable } from "@/component/unit/SpacesTable";
import { SubPageHead } from "@/component/unit/SubPageHead";
import { NewSpaceModal } from "@/component/unit/new-space-modal/NewSpaceModal";
import { NewResourceModal } from "@/component/unit/NewResourceModal";
import { base64encode, toNumber, ignoreMaybeArray } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import Error404 from "@/common/Error404";
import { fontBold, H2, CenterSpinner, Flex } from "common/styled";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { AuthorizationChecker } from "@/common/AuthorizationChecker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";

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

  const id = base64encode(`UnitNode:${unitPk}`);
  const {
    data,
    refetch,
    loading: isLoading,
  } = useSpacesResourcesQuery({
    variables: { id },
    fetchPolicy: "network-only",
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { open: newSpaceDialogIsOpen, openModal: openNewSpaceModal, closeModal: closeNewSpaceModal } = useModal();

  const { openWithContent, modalContent, open: isNewResourceModalOpen, closeModal: closeNewResourceModal } = useModal();

  if (isLoading) {
    return <CenterSpinner />;
  }

  const { unit } = data ?? {};
  if (unit == null) {
    return <Error404 />;
  }

  return (
    <>
      <HDSModal
        id="space-modal"
        isOpen={newSpaceDialogIsOpen}
        onClose={closeNewSpaceModal}
        focusAfterCloseRef={newSpacesButtonRef}
      >
        <NewSpaceModal unit={unit} closeModal={() => closeNewSpaceModal()} refetch={refetch} />
      </HDSModal>
      <LinkPrev />
      <SubPageHead title={t("Unit.spacesAndResources")} unit={unit} />
      <Flex $direction="row" $justifyContent="space-between" $alignItems="center">
        <H2 $noMargin>{t("Unit.spaces")}</H2>
        <ActionButton
          ref={newSpacesButtonRef}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconPlusCircleFill />}
          onClick={() => openNewSpaceModal()}
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
          onClick={() => {
            openWithContent(
              <NewResourceModal spacePk={0} unit={unit} closeModal={closeNewResourceModal} refetch={refetch} />
            );
          }}
        >
          {t("Unit.addResource")}
        </ActionButton>
      </Flex>
      <ResourcesTable unit={unit} refetch={refetch} />
      <HDSModal
        id="resource-modal"
        isOpen={isNewResourceModalOpen}
        onClose={closeNewResourceModal}
        focusAfterCloseRef={newResourceButtonRef}
      >
        {modalContent}
      </HDSModal>
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
    unit(id: $id) {
      id
      ...UnitSubpageHead
      ...SpacesTable
      ...ResourceTable
    }
  }
`;
