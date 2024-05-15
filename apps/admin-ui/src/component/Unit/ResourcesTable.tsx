import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import {
  type FetchResult,
  useMutation,
  type ApolloQueryResult,
} from "@apollo/client";
import { useNavigate } from "react-router-dom";
import type {
  Maybe,
  Query,
  ResourceDeleteMutationInput,
  ResourceDeleteMutationPayload,
  ResourceNode,
  UnitNode,
} from "@gql/gql-types";
import { PopupMenu } from "@/component/PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "@/common/queries";
import { getResourceUrl } from "@/common/urls";
import { CustomTable, TableLink } from "../Table";
import { useNotification } from "@/context/NotificationContext";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";

interface IProps {
  resources: ResourceNode[];
  unit: UnitNode;
  refetch: () => Promise<ApolloQueryResult<Query>>;
}

const ResourceNodeContainer = styled.div`
  display: flex;
  align-items: center;
`;

type ResourcesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (space: ResourceNode) => JSX.Element | string;
};

export function ResourcesTable({
  resources,
  unit,
  refetch,
}: IProps): JSX.Element {
  const [deleteResourceMutation] = useMutation<
    { deleteSpace: ResourceDeleteMutationPayload },
    { input: ResourceDeleteMutationInput }
  >(DELETE_RESOURCE);

  const deleteResource = (
    pk: number
  ): Promise<FetchResult<{ deleteSpace: ResourceDeleteMutationPayload }>> =>
    deleteResourceMutation({ variables: { input: { pk: String(pk) } } });

  const { t } = useTranslation();

  const modal = useRef<ModalRef>();
  const history = useNavigate();

  const { notifyError, notifySuccess } = useNotification();

  function handleEditResource(pk: Maybe<number> | undefined) {
    if (pk == null || unit.pk == null) {
      return;
    }
    history(getResourceUrl(pk, unit.pk));
  }

  function handleDeleteResource(
    pk: Maybe<number> | undefined,
    name: Maybe<string> | undefined
  ) {
    if (pk == null) {
      return;
    }
    modal.current?.open({
      id: "confirmation-modal",
      open: true,
      heading: t("ResourceTable.removeConfirmationTitle", {
        name,
      }),
      content: t("ResourceTable.removeConfirmationMessage"),
      acceptLabel: t("ResourceTable.removeConfirmationAccept"),
      cancelLabel: t("ResourceTable.removeConfirmationCancel"),
      onAccept: async () => {
        try {
          await deleteResource(pk);
          notifySuccess(t("ResourceTable.removeSuccess"));
          refetch();
        } catch (error) {
          notifyError(t("ResourceTable.removeFailed"));
        }
      },
    });
  }

  const cols: ResourcesTableColumn[] = [
    {
      headerName: t("ResourceTable.headings.name"),
      key: `nameFi`,
      transform: ({ pk, nameFi }: ResourceNode) => {
        const link = getResourceUrl(pk, unit.pk);
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
      headerName: t("ResourceTable.headings.unitName"),
      key: "space.unit.nameFi",
      transform: ({ space }: ResourceNode) =>
        space?.unit?.nameFi ?? t("ResourceTable.noSpace"),
      isSortable: false,
    },
    {
      headerName: "",
      key: "type",
      transform: (resource: ResourceNode) => (
        <ResourceMenu
          {...resource}
          onEdit={() => handleEditResource(resource.pk)}
          onDelete={() => handleDeleteResource(resource.pk, resource.nameFi)}
        />
      ),
      isSortable: false,
    },
  ];

  const rows = resources ?? [];

  // TODO add if no resources:
  // const hasSpaces={Boolean(unit?.spaces?.length)}
  // noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
  return (
    // has to be a grid otherwise inner table breaks
    <div style={{ display: "grid" }}>
      <CustomTable indexKey="pk" rows={rows} cols={cols} />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </div>
  );
}

function ResourceMenu({
  locationType,
  onEdit,
  onDelete,
}: ResourceNode & { onDelete: () => void; onEdit: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <ResourceNodeContainer ref={ref}>
      <span>{locationType}</span>
      <PopupMenu
        items={[
          {
            name: t("ResourceTable.menuEditResource"),
            onClick: onEdit,
          },
          {
            name: t("ResourceTable.menuRemoveResource"),
            onClick: onDelete,
          },
        ]}
      />
    </ResourceNodeContainer>
  );
}
