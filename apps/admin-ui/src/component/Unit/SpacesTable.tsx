import React, { useRef } from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type ApolloQueryResult, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import type {
  Maybe,
  SpaceDeleteMutationInput,
  SpaceDeleteMutationPayload,
  SpaceNode,
  UnitNode,
  Query,
} from "common/types/gql-types";
import { DELETE_SPACE } from "@/common/queries";
import PopupMenu from "./PopupMenu";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import { NewSpaceModal } from "../Spaces/space-editor/new-space-modal/NewSpaceModal";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { useNotification } from "@/context/NotificationContext";
import { CustomTable, TableLink } from "@/component/Table";
import { getSpaceUrl } from "@/common/urls";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";

interface IProps {
  unit: UnitNode;
  refetch: () => Promise<ApolloQueryResult<Query>>;
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

  const [deleteSpaceMutation] = useMutation<
    { deleteSpace: SpaceDeleteMutationPayload },
    { input: SpaceDeleteMutationInput }
  >(DELETE_SPACE);

  const { notifyError } = useNotification();

  async function deleteSpace(pk: Maybe<number> | undefined) {
    if (pk == null || pk === 0) {
      return;
    }
    try {
      const res = await deleteSpaceMutation({
        variables: { input: { pk: String(pk) } },
      });
      if (res.data?.deleteSpace.deleted) {
        refetch();
      } else {
        // TODO missing translation
        notifyError("SpaceTable.removeFailed");
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
      notifyError("SpaceTable.removeFailed");
    }
  }

  const modal = useRef<ModalRef>();

  const history = useNavigate();

  function handleRemoveSpace(space: SpaceNode) {
    if (space && space.resourceSet && space?.resourceSet.length > 0) {
      notifyError(
        t("SpaceTable.removeConflictMessage"),
        t("SpaceTable.removeConflictTitle")
      );
      return;
    }
    modal.current?.open({
      id: "confirmation-modal",
      open: true,
      heading: t("SpaceTable.removeConfirmationTitle", {
        name: space.nameFi,
      }),
      content: t("SpaceTable.removeConfirmationMessage"),
      acceptLabel: t("SpaceTable.removeConfirmationAccept"),
      cancelLabel: t("SpaceTable.removeConfirmationCancel"),
      onAccept: () => {
        deleteSpace(space.pk);
      },
    });
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
    const link = getSpaceUrl(space.pk, unit.pk);
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
        const link = getSpaceUrl(pk, unit.pk);
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

  const rows = unit.spaces;

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
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </div>
  );
}
