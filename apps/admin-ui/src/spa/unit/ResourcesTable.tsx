import React, { useRef, useState } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { type ApolloQueryResult } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  useDeleteResourceMutation,
  type Maybe,
  type ResourceNode,
  type UnitQuery,
} from "@gql/gql-types";
import { PopupMenu } from "@/component/PopupMenu";
import { getResourceUrl } from "@/common/urls";
import { CustomTable, TableLink } from "@/component/Table";
import { errorToast, successToast } from "common/src/common/toast";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";

interface IProps {
  unit: UnitQuery["unit"];
  refetch: () => Promise<ApolloQueryResult<UnitQuery>>;
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

export function ResourcesTable({ unit, refetch }: IProps): JSX.Element {
  const resources = unit?.spaces?.flatMap((s) => s?.resourceSet);

  const [deleteResourceMutation] = useDeleteResourceMutation();

  const deleteResource = (pk: number) =>
    deleteResourceMutation({ variables: { input: { pk: String(pk) } } });

  const { t } = useTranslation();

  const history = useNavigate();

  const [resourceWaitingForDelete, setResourceWaitingForDelete] =
    useState<ResourceNode | null>(null);

  function handleEditResource(pk: Maybe<number> | undefined) {
    if (pk == null || unit?.pk == null) {
      return;
    }
    history(getResourceUrl(pk, unit.pk));
  }

  function handleDeleteResource(resource: ResourceNode) {
    if (resource.pk == null) {
      return;
    }
    setResourceWaitingForDelete(resource);
  }

  const cols: ResourcesTableColumn[] = [
    {
      headerName: t("ResourceTable.headings.name"),
      key: `nameFi`,
      transform: ({ pk, nameFi }: ResourceNode) => {
        const link = getResourceUrl(pk, unit?.pk);
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
          onDelete={() => handleDeleteResource(resource)}
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
      {resourceWaitingForDelete && (
        <ConfirmationDialog
          isOpen
          variant="danger"
          heading={t("ResourceTable.removeConfirmationTitle", {
            name: resourceWaitingForDelete.nameFi,
          })}
          content={t("ResourceTable.removeConfirmationMessage")}
          acceptLabel={t("ResourceTable.removeConfirmationAccept")}
          cancelLabel={t("ResourceTable.removeConfirmationCancel")}
          onCancel={() => setResourceWaitingForDelete(null)}
          onAccept={async () => {
            if (resourceWaitingForDelete.pk == null) {
              return;
            }
            try {
              await deleteResource(resourceWaitingForDelete.pk);
              successToast({ text: t("ResourceTable.removeSuccess") });
              setResourceWaitingForDelete(null);
              refetch();
            } catch (error) {
              errorToast({ text: t("ResourceTable.removeFailed") });
            }
          }}
        />
      )}
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
