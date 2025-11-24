import React, { useRef, useState } from "react";
import { gql } from "@apollo/client";
import { trim } from "lodash-es";
import { useTranslation } from "next-i18next";
import type { TFunction } from "next-i18next";
import { useRouter } from "next/router";
import { ConfirmationDialog } from "ui/src/components/ConfirmationDialog";
import { PopupMenu } from "ui/src/components/PopupMenu";
import { successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { truncate } from "ui/src/modules/helpers";
import { Flex } from "ui/src/styled";
import { CustomTable } from "@/components/Table";
import { MAX_NAME_LENGTH } from "@/modules/const";
import { getResourceUrl } from "@/modules/urls";
import { TableLink } from "@/styled";
import { useDeleteResourceMutation } from "@gql/gql-types";
import type { Maybe, ResourceTableFragment } from "@gql/gql-types";

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
  handleDeleteResource: (resource: Pick<ResourceT, "pk" | "nameFi">) => void;
  t: TFunction;
}) {
  return [
    {
      headerName: t("spaces:ResourceTable.headings.name"),
      key: `nameFi`,
      transform: ({ pk, nameFi }: ResourceT) => {
        const link = getResourceUrl(pk, unit?.pk);
        const name = nameFi != null && nameFi.length > 0 ? nameFi : "-";
        return <TableLink href={link}>{truncate(trim(name), MAX_NAME_LENGTH)}</TableLink>;
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
  const [deleteResourceMutation] = useDeleteResourceMutation();

  const deleteResource = (pk: number) => deleteResourceMutation({ variables: { input: { pk: String(pk) } } });

  const { t } = useTranslation();
  const router = useRouter();

  const [resourceWaitingForDelete, setResourceWaitingForDelete] = useState<Pick<ResourceT, "pk" | "nameFi"> | null>(
    null
  );

  function handleEditResource(pk: Maybe<number> | undefined) {
    if (pk == null || unit?.pk == null) {
      return;
    }
    router.push(getResourceUrl(pk, unit.pk));
  }

  function handleDeleteResource(resource: Pick<ResourceT, "pk" | "nameFi">) {
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
      successToast({ text: t("spaces:ResourceTable.removeSuccess") });
      setResourceWaitingForDelete(null);
      refetch();
    } catch (err) {
      displayError(err);
    }
  };

  const rows = unit.spaces.flatMap((s) => s.resources);

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
          heading={t("spaces:ResourceTable.removeConfirmationTitle", {
            name: resourceWaitingForDelete.nameFi,
          })}
          content={t("spaces:ResourceTable.removeConfirmationMessage")}
          acceptLabel={t("spaces:ResourceTable.removeConfirmationAccept")}
          cancelLabel={t("spaces:ResourceTable.removeConfirmationCancel")}
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

function ResourceMenu({ locationType, onEdit, onDelete }: ResourceT & { onDelete: () => void; onEdit: () => void }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  const type = t(`translation:locationType.${locationType}`);
  return (
    <Flex $gap="none" $direction="row" $alignItems="center" $justifyContent="space-between" ref={ref}>
      <span>{type}</span>
      <PopupMenu
        items={[
          {
            name: t("spaces:ResourceTable.menuEditResource"),
            onClick: onEdit,
          },
          {
            name: t("spaces:ResourceTable.menuRemoveResource"),
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
        nameFi
        locationType
      }
    }
  }
`;
