import React, { useRef, useState } from "react";
import { trim } from "lodash-es";
import { useTranslation } from "react-i18next";
import { gql } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { ConfirmationDialog } from "common/src/components/ConfirmationDialog";
import {
  useDeleteResourceMutation,
  type Maybe,
  type ResourceTableFragment,
} from "@gql/gql-types";
import { PopupMenu } from "common/src/components/PopupMenu";
import { getResourceUrl } from "@/common/urls";
import { CustomTable } from "@/component/Table";
import { successToast } from "common/src/common/toast";
import { truncate } from "common/src/helpers";
import { MAX_NAME_LENGTH } from "@/common/const";
import { TableLink } from "@/styled";
import { Flex } from "common/styled";
import { TFunction } from "next-i18next";
import { useDisplayError } from "common/src/hooks";

interface IProps {
  unit: ResourceTableFragment;
  refetch: () => Promise<unknown>;
}

type ResourceT = ResourceTableFragment["spaces"][0]["resources"][0];

type ResourcesTableColumn = {
  headerName: string;
  key: string;
  isSortable: boolean;
  transform?: (resource: ResourceT) => JSX.Element | string;
};

function getColConfig({
  t,
  unit,
  handleEditResource,
  handleDeleteResource,
}: {
  unit?: Pick<ResourceTableFragment, "pk">;
  handleEditResource: (pk: number | null) => void;
  handleDeleteResource: (
    resource: Pick<ResourceT, "pk" | "nameTranslations">
  ) => void;
  t: TFunction;
}) {
  return [
    {
      headerName: t("ResourceTable.headings.name"),
      key: `nameFi`,
      transform: ({ pk, nameTranslations }: ResourceT) => {
        const link = getResourceUrl(pk, unit?.pk);
        const nameFi = nameTranslations.fi;
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
}

export function ResourcesTable({ unit, refetch }: IProps): JSX.Element {
  const resources = unit.spaces.flatMap((s) => s.resources);

  const [deleteResourceMutation] = useDeleteResourceMutation();

  const deleteResource = (pk: number) =>
    deleteResourceMutation({ variables: { input: { pk: String(pk) } } });

  const { t } = useTranslation();

  const history = useNavigate();

  const [resourceWaitingForDelete, setResourceWaitingForDelete] = useState<Pick<
    ResourceT,
    "pk" | "nameTranslations"
  > | null>(null);

  function handleEditResource(pk: Maybe<number> | undefined) {
    if (pk == null || unit?.pk == null) {
      return;
    }
    history(getResourceUrl(pk, unit.pk));
  }

  function handleDeleteResource(
    resource: Pick<ResourceT, "pk" | "nameTranslations">
  ) {
    if (resource.pk == null) {
      return;
    }
    setResourceWaitingForDelete(resource);
  }

  const cols: ResourcesTableColumn[] = getColConfig({
    t,
    unit,
    handleEditResource,
    handleDeleteResource,
  });
  const displayError = useDisplayError();

  const handleConfirmDelete = async () => {
    if (resourceWaitingForDelete?.pk == null) {
      return;
    }
    try {
      await deleteResource(resourceWaitingForDelete.pk);
      successToast({ text: t("ResourceTable.removeSuccess") });
      setResourceWaitingForDelete(null);
      refetch();
    } catch (err) {
      displayError(err);
    }
  };

  const rows = resources;

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
            name: resourceWaitingForDelete.nameTranslations.fi,
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

export const RESOURCE_TABLE_FRAGMENT = gql`
  fragment ResourceTable on UnitNode {
    id
    pk
    spaces {
      id
      resources {
        id
        pk
        nameTranslations {
          fi
        }
        locationType
      }
    }
  }
`;
