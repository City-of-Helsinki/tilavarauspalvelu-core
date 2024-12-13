import React, { useRef, useState } from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import { gql, type ApolloQueryResult } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  type Maybe,
  useDeleteSpaceMutation,
  type UnitQuery,
} from "@gql/gql-types";
import { PopupMenu } from "common/src/components/PopupMenu";
import Modal, { useModal as useHDSModal } from "@/component/HDSModal";
import { NewSpaceModal } from "./space/new-space-modal/NewSpaceModal";
import { errorToast } from "common/src/common/toast";
import { CustomTable } from "@/component/Table";
import { getSpaceUrl } from "@/common/urls";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styles/util";
import { Flex } from "common/styles/util";

interface IProps {
  unit: UnitQuery["unit"];
  refetch: () => Promise<ApolloQueryResult<UnitQuery>>;
}

type SpaceT = NonNullable<UnitQuery["unit"]>["spaces"][0];

function countSubSpaces(space: Pick<SpaceT, "pk" | "children">): number {
  return (space.children || []).reduce(
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

export function SpacesTable({ unit, refetch }: IProps): JSX.Element {
  const { t } = useTranslation();
  const {
    open: isOpen,
    openWithContent,
    closeModal,
    modalContent,
  } = useHDSModal();

  const [deleteSpaceMutation] = useDeleteSpaceMutation();

  async function deleteSpace(pk: Maybe<number> | undefined) {
    if (pk == null || pk === 0) {
      return;
    }
    try {
      const res = await deleteSpaceMutation({
        variables: { input: { pk: String(pk) } },
      });
      if (res.data?.deleteSpace?.deleted) {
        setSpaceWaitingForDelete(null);
        refetch();
      } else {
        // TODO missing translation
        errorToast({ text: t("SpaceTable.removeFailed") });
      }
    } catch (e) {
      /* TODO handle this error
       "extensions": {
        "code": "MUTATION_VALIDATION_ERROR",
        "errors": [{
          "field": "nonFieldErrors",
          "message": "Space occurs in active application round.",
          "code": "invalid"
        }]
        }
      */
      errorToast({ text: t("SpaceTable.removeFailed") });
    }
  }

  const history = useNavigate();

  const [spaceWaitingForDelete, setSpaceWaitingForDelete] =
    useState<SpaceT | null>(null);

  function handleRemoveSpace(space: SpaceT) {
    if (space && space.resources && space?.resources.length > 0) {
      errorToast({
        text: t("SpaceTable.removeConflictMessage"),
        label: t("SpaceTable.removeConflictTitle"),
      });
      return;
    }
    setSpaceWaitingForDelete(space);
  }

  function handeAddSubSpace(space: SpaceT) {
    openWithContent(
      <NewSpaceModal
        parentSpace={space}
        unit={unit}
        closeModal={closeModal}
        refetch={refetch}
      />
    );
  }

  function handleEditSpace(space: SpaceT) {
    const link = getSpaceUrl(space.pk, unit?.pk);
    if (link === "") {
      return;
    }
    history(link);
  }

  // TODO translation keys are wonky, yeah it's under a unit page but the table should be reusable
  const cols: SpacesTableColumn[] = [
    {
      headerName: t("Unit.headings.name"),
      key: "nameFi",
      transform: (space: SpaceT) => {
        const { pk, nameFi } = space;
        const link = getSpaceUrl(pk, unit?.pk);
        const name = nameFi != null && nameFi.length > 0 ? nameFi : "-";
        return (
          <TableLink to={link}>
            {truncate(trim(name), MAX_NAME_LENGTH)}
          </TableLink>
        );
      },
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.code"),
      key: "code",
      transform: ({ code }: SpaceT) => trim(code),
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.numSubSpaces"),
      key: "numSubSpaces",
      transform: (space) => {
        const count = countSubSpaces(space);
        return `${count} ${t("SpaceTable.subSpaceCount", { count })}`;
      },
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.surfaceArea"),
      key: "surfaceArea",
      transform: ({ surfaceArea }: SpaceT) =>
        surfaceArea ? `${surfaceArea}m²` : "",
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.maxPersons"),
      key: "maxPersons",
      // TODO this is weird it creates both the max Persons and the buttons to the same cell
      transform: (space: SpaceT) => (
        <Flex
          $gap="none"
          $direction="row"
          $justifyContent={
            space.maxPersons != null ? "space-between" : "flex-end"
          }
        >
          {space.maxPersons != null && (
            <Flex $gap="2-xs" $alignItems="center" $direction="row">
              <IconGroup />
              {space.maxPersons}
            </Flex>
          )}
          <PopupMenu
            items={[
              {
                name: t("SpaceTable.menuAddSubSpace"),
                onClick: () => handeAddSubSpace(space),
              },
              {
                name: t("SpaceTable.menuEditSpace"),
                onClick: () => handleEditSpace(space),
              },
              {
                name: t("SpaceTable.menuRemoveSpace"),
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
        rows={rows}
        cols={cols}
        // no sort on purpose
      />
      <Modal
        id="modal-id"
        open={isOpen}
        close={closeModal}
        afterCloseFocusRef={ref}
      >
        {modalContent}
      </Modal>
      {spaceWaitingForDelete && (
        <ConfirmationDialog
          isOpen
          variant="danger"
          heading={t("SpaceTable.removeConfirmationTitle", {
            name: spaceWaitingForDelete.nameFi,
          })}
          content={t("SpaceTable.removeConfirmationMessage")}
          acceptLabel={t("SpaceTable.removeConfirmationAccept")}
          cancelLabel={t("SpaceTable.removeConfirmationCancel")}
          onCancel={() => setSpaceWaitingForDelete(null)}
          onAccept={() => {
            deleteSpace(spaceWaitingForDelete.pk);
          }}
        />
      )}
    </>
  );
}

export const DELETE_SPACE = gql`
  mutation DeleteSpace($input: SpaceDeleteMutationInput!) {
    deleteSpace(input: $input) {
      deleted
    }
  }
`;
