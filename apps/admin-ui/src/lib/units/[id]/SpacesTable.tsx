import React, { useRef, useState } from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash-es";
import { useTranslation } from "next-i18next";
import { ApolloError, gql } from "@apollo/client";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import { type Maybe, type SpacesTableFragment, useDeleteSpaceMutation } from "@gql/gql-types";
import { PopupMenu } from "common/src/components/PopupMenu";
import { NewSpaceModal } from "./new-space-modal/NewSpaceModal";
import { errorToast } from "common/src/components/toast";
import { CustomTable } from "@/component/Table";
import { getSpaceUrl } from "@/modules/urls";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/modules/const";
import { TableLink } from "@/styled";
import { Flex } from "common/styled";
import { useDisplayError } from "common/src/hooks";
import { useModal } from "@/context/ModalContext";
import { FixedDialog } from "@/styled/FixedDialog";
import { useRouter } from "next/router";

type SpaceT = SpacesTableFragment["spaces"][0];

function countSubSpaces(space: Pick<SpaceT, "pk" | "children">): number {
  return (space.children || []).reduce(
    // @ts-expect-error -- FIXME the recursive type is broken
    (p, c) => p + 1 + (c ? countSubSpaces(c) : 0),
    0
  );
}

type SpacesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (space: SpaceT) => JSX.Element | string;
};

interface IProps {
  unit: SpacesTableFragment;
  refetch: () => Promise<unknown>;
}

export function SpacesTable({ unit, refetch }: IProps): JSX.Element {
  const { t } = useTranslation();
  const { setModalContent } = useModal();

  const [deleteSpaceMutation] = useDeleteSpaceMutation();
  const displayError = useDisplayError();
  const router = useRouter();
  const [spaceWaitingForDelete, setSpaceWaitingForDelete] = useState<Pick<SpaceT, "pk" | "nameFi"> | null>(null);

  async function deleteSpace(pk: Maybe<number> | undefined) {
    if (pk == null || pk === 0) {
      return;
    }
    try {
      const res = await deleteSpaceMutation({
        variables: { input: { pk: String(pk) } },
      });
      if (res.errors != null && res.errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: res.errors,
        });
      }
      if (res.data?.deleteSpace?.deleted) {
        setSpaceWaitingForDelete(null);
        refetch();
      } else {
        errorToast({ text: t("spaces:SpaceTable.removeFailed") });
      }
    } catch (err) {
      displayError(err);
    }
  }

  function handleRemoveSpace(space: Pick<SpaceT, "resources" | "pk" | "nameFi">) {
    if (space && space.resources && space?.resources.length > 0) {
      errorToast({
        text: t("spaces:SpaceTable.removeConflictMessage"),
        label: t("spaces:SpaceTable.removeConflictTitle"),
      });
      return;
    }
    setSpaceWaitingForDelete(space);
  }

  const closeModal = () => setModalContent(null);

  function handeAddSubSpace(space: SpaceT) {
    if (unit == null) {
      return;
    }
    setModalContent(
      <FixedDialog
        id="spaces-table-modal-id"
        isOpen
        close={closeModal}
        focusAfterCloseRef={ref}
        closeButtonLabelText={t("common:close")}
        aria-labelledby="modal-header"
      >
        <NewSpaceModal parentSpacePk={space.pk} unit={unit} closeModal={closeModal} refetch={refetch} />
      </FixedDialog>
    );
  }

  function handleEditSpace(space: SpaceT) {
    const link = getSpaceUrl(space.pk, unit?.pk);
    if (link === "") {
      return;
    }
    router.push(link);
  }

  // TODO translation keys are wonky, yeah it's under a unit page but the table should be reusable
  const cols: SpacesTableColumn[] = [
    {
      headerName: t("spaces:headings.name"),
      key: "nameFi",
      transform: (space: SpaceT) => {
        const { pk, nameFi } = space;
        const link = getSpaceUrl(pk, unit?.pk);
        const name = nameFi != null && nameFi.length > 0 ? nameFi : "-";
        return <TableLink href={link}>{truncate(trim(name), MAX_NAME_LENGTH)}</TableLink>;
      },
      isSortable: false,
    },
    {
      headerName: t("spaces:headings.code"),
      key: "code",
      transform: ({ code }: SpaceT) => trim(code),
      isSortable: false,
    },
    {
      headerName: t("spaces:headings.numSubSpaces"),
      key: "numSubSpaces",
      transform: (space) => {
        const count = countSubSpaces(space);
        return `${count} ${t("spaces:SpaceTable.subSpaceCount", { count })}`;
      },
      isSortable: false,
    },
    {
      headerName: t("spaces:headings.surfaceArea"),
      key: "surfaceArea",
      transform: ({ surfaceArea }: SpaceT) => (surfaceArea ? `${surfaceArea}m²` : ""),
      isSortable: false,
    },
    {
      headerName: t("spaces:headings.maxPersons"),
      key: "maxPersons",
      // TODO this is weird it creates both the max Persons and the buttons to the same cell
      transform: (space: SpaceT) => (
        <Flex $gap="none" $direction="row" $justifyContent={space.maxPersons != null ? "space-between" : "flex-end"}>
          {space.maxPersons != null && (
            <Flex $gap="2-xs" $alignItems="center" $direction="row">
              <IconGroup />
              {space.maxPersons}
            </Flex>
          )}
          <PopupMenu
            items={[
              {
                name: t("spaces:SpaceTable.menuAddSubSpace"),
                onClick: () => handeAddSubSpace(space),
              },
              {
                name: t("spaces:SpaceTable.menuEditSpace"),
                onClick: () => handleEditSpace(space),
              },
              {
                name: t("spaces:SpaceTable.menuRemoveSpace"),
                onClick: () => handleRemoveSpace(space),
              },
            ]}
          />
        </Flex>
      ),
      isSortable: false,
    },
  ];

  const ref = useRef(null);

  const rows = unit?.spaces ?? [];

  // TODO add if no spaces => "Unit.noSpaces"
  return (
    <>
      <CustomTable
        indexKey="pk"
        // @ts-expect-error -- Table expects mutable rows
        rows={rows}
        cols={cols}
        // no sort on purpose
      />
      {spaceWaitingForDelete && (
        <ConfirmationDialog
          isOpen
          variant="danger"
          heading={t("spaces:SpaceTable.removeConfirmationTitle", {
            name: spaceWaitingForDelete.nameFi,
          })}
          content={t("spaces:SpaceTable.removeConfirmationMessage")}
          acceptLabel={t("spaces:SpaceTable.removeConfirmationAccept")}
          cancelLabel={t("spaces:SpaceTable.removeConfirmationCancel")}
          onCancel={() => setSpaceWaitingForDelete(null)}
          onAccept={() => {
            deleteSpace(spaceWaitingForDelete.pk);
          }}
        />
      )}
    </>
  );
}

export const SPACE_TABLE_FRAGMENT = gql`
  fragment SpacesTable on UnitNode {
    ...NewResourceUnitFields
    spaces {
      id
      pk
      code
      surfaceArea
      maxPersons
      resources {
        id
      }
      children {
        id
      }
    }
  }
`;

export const DELETE_SPACE = gql`
  mutation DeleteSpace($input: SpaceDeleteMutationInput!) {
    deleteSpace(input: $input) {
      deleted
    }
  }
`;
