import React, { useRef, useState } from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type ApolloQueryResult } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  type Maybe,
  type SpaceNode,
  useDeleteSpaceMutation,
  UnitQuery,
} from "@gql/gql-types";
import { PopupMenu } from "@/component/PopupMenu";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import { NewSpaceModal } from "../Spaces/space-editor/new-space-modal/NewSpaceModal";
import { errorToast } from "common/src/common/toast";
import { CustomTable, TableLink } from "@/component/Table";
import { getSpaceUrl } from "@/common/urls";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";

interface IProps {
  unit: UnitQuery["unit"];
  refetch: () => Promise<ApolloQueryResult<UnitQuery>>;
}

const Prop = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
`;

const MaxPersons = styled.div`
  display: flex;
`;

function countSubSpaces(space: SpaceNode): number {
  return (space.children || []).reduce(
    (p, c) => p + 1 + (c ? countSubSpaces(c) : 0),
    0
  );
}

type SpacesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (space: SpaceNode) => JSX.Element | string;
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
    useState<SpaceNode | null>(null);

  function handleRemoveSpace(space: SpaceNode) {
    if (space && space.resourceSet && space?.resourceSet.length > 0) {
      errorToast({
        text: t("SpaceTable.removeConflictMessage"),
        label: t("SpaceTable.removeConflictTitle"),
      });
      return;
    }
    setSpaceWaitingForDelete(space);
  }

  function handeAddSubSpace(space: SpaceNode) {
    openWithContent(
      <NewSpaceModal
        parentSpace={space}
        unit={unit}
        closeModal={closeModal}
        refetch={refetch}
      />
    );
  }

  function handleEditSpace(space: SpaceNode) {
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
      transform: (space: SpaceNode) => {
        const { pk, nameFi } = space;
        const link = getSpaceUrl(pk, unit?.pk);
        const name = nameFi != null && nameFi.length > 0 ? nameFi : "-";
        return (
          <TableLink href={link}>
            {truncate(trim(name), MAX_NAME_LENGTH)}
          </TableLink>
        );
      },
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.code"),
      key: "code",
      transform: ({ code }: SpaceNode) => trim(code),
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
      transform: ({ surfaceArea }: SpaceNode) =>
        surfaceArea ? `${surfaceArea}m²` : "",
      isSortable: false,
    },
    {
      headerName: t("Unit.headings.maxPersons"),
      key: "maxPersons",
      // TODO this is weird it creates both the max Persons and the buttons to the same cell
      transform: (space: SpaceNode) => (
        <MaxPersons>
          {space.maxPersons != null && (
            <Prop>
              <IconGroup />
              {space.maxPersons}
            </Prop>
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
        </MaxPersons>
      ),
      isSortable: false,
    },
  ];

  const ref = useRef(null);

  const rows = unit?.spaces ?? [];

  // TODO add if no spaces => "Unit.noSpaces"
  return (
    // has to be a grid otherwise inner table breaks
    <div style={{ display: "grid" }}>
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
    </div>
  );
}
