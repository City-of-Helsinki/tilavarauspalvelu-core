import React, { useRef, useState } from "react";
import { trim } from "lodash-es";
import { useTranslation } from "react-i18next";
import { gql } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  useDeleteResourceMutation,
  type Maybe,
  type UnitWithSpacesAndResourcesQuery,
} from "@gql/gql-types";
import { PopupMenu } from "common/src/components/PopupMenu";
import { getResourceUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { errorToast, successToast } from "common/src/common/toast";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styled";
import { Flex } from "common/styled";

interface IProps {
  unit: QueryT;
  refetch: () => Promise<unknown>;
}

// TODO use a fragment (TableElementFragment similar to other Tables)
type QueryT = NonNullable<UnitWithSpacesAndResourcesQuery["unit"]>;
type SpaceT = QueryT["spaces"][0];
type ResourceT = NonNullable<SpaceT>["resources"][0];

type ResourcesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (resource: ResourceT) => JSX.Element | string;
};

export function ResourcesTable({ unit, refetch }: IProps): JSX.Element {
  const resources = unit?.spaces?.flatMap((s) => s?.resources);

  const [deleteResourceMutation] = useDeleteResourceMutation();

  const deleteResource = (pk: number) =>
    deleteResourceMutation({ variables: { input: { pk: String(pk) } } });

  const { t } = useTranslation();

  const history = useNavigate();

  const [resourceWaitingForDelete, setResourceWaitingForDelete] =
    useState<ResourceT | null>(null);

  function handleEditResource(pk: Maybe<number> | undefined) {
    if (pk == null || unit?.pk == null) {
      return;
    }
    history(getResourceUrl(pk, unit.pk));
  }

  function handleDeleteResource(resource: ResourceT) {
    if (resource.pk == null) {
      return;
    }
    setResourceWaitingForDelete(resource);
  }

  const cols: ResourcesTableColumn[] = [
    {
      headerName: t("ResourceTable.headings.name"),
      key: `nameFi`,
      transform: ({ pk, nameFi }: ResourceT) => {
        const link = getResourceUrl(pk, unit?.pk);
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
      headerName: t("ResourceTable.headings.unitName"),
      key: "space.unit.nameFi",
      transform: ({ space }: ResourceT) =>
        space?.unit?.nameFi ?? t("ResourceTable.noSpace"),
      isSortable: false,
    },
    {
      headerName: "",
      key: "type",
      transform: (resource: ResourceT) => (
        <ResourceMenu
          {...resource}
          onEdit={() => handleEditResource(resource.pk)}
          onDelete={() => handleDeleteResource(resource)}
        />
      ),
      isSortable: false,
    },
  ];

  const handleConfirmDelete = async () => {
    if (resourceWaitingForDelete?.pk == null) {
      return;
    }
    try {
      await deleteResource(resourceWaitingForDelete.pk);
      successToast({ text: t("ResourceTable.removeSuccess") });
      setResourceWaitingForDelete(null);
      refetch();
    } catch (_) {
      errorToast({ text: t("ResourceTable.removeFailed") });
    }
  };

  const rows = resources ?? [];

  // TODO add if no resources:
  // const hasSpaces={Boolean(unit?.spaces?.length)}
  // noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
  return (
    <>
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
          onAccept={handleConfirmDelete}
        />
      )}
    </>
  );
}

export const DELETE_RESOURCE = gql`
  mutation DeleteResource($input: ResourceDeleteMutationInput!) {
    deleteResource(input: $input) {
      deleted
    }
  }
`;

function ResourceMenu({
  locationType,
  onEdit,
  onDelete,
}: ResourceT & { onDelete: () => void; onEdit: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const type = locationType ? t(`locationType.${locationType}`) : "-";
  return (
    <Flex
      $gap="none"
      $direction="row"
      $alignItems="center"
      $justifyContent="space-between"
      ref={ref}
    >
      <span>{type}</span>
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
    </Flex>
  );
}
