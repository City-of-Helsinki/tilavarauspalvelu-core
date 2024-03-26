import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import {
  ResourceDeleteMutationInput,
  ResourceDeleteMutationPayload,
  ResourceNode,
  UnitNode,
} from "common/types/gql-types";
import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "../../common/queries";
import { resourceUrl } from "../../common/urls";

interface IProps {
  resources: ResourceNode[] | undefined;
  unit: UnitNode;
  hasSpaces: boolean;
  onDelete: (text?: string) => void;
  onDataError: (error: string) => void;
}

const Name = styled.div`
  font-size: var(--fontsize-body-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ResourceNodeContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ResourcesTable = ({
  resources,
  unit,
  hasSpaces,
  onDelete,
  onDataError,
}: IProps): JSX.Element => {
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

  const cellConfig = {
    cols: [
      {
        title: "ResourceTable.headings.name",
        key: `nameFi`,
        transform: ({ nameFi }: ResourceNode) => (
          <Name>{trim(nameFi as string)}</Name>
        ),
      },
      {
        title: "ResourceTable.headings.unitName",
        key: "space.unit.nameFi",
        transform: ({ space }: ResourceNode) =>
          space?.unit?.nameFi || t("ResourceTable.noSpace"),
      },
      {
        title: "",
        key: "type",
        transform: ({ nameFi, pk, locationType }: ResourceNode) => (
          <ResourceNodeContainer>
            <span>{locationType}</span>
            <PopupMenu
              items={[
                {
                  name: t("ResourceTable.menuEditResource"),
                  onClick: () => {
                    history(resourceUrl(Number(pk), Number(unit.pk)));
                  },
                },
                {
                  name: t("ResourceTable.menuRemoveResource"),
                  onClick: () => {
                    modal.current?.open({
                      id: "confirmation-modal",
                      open: true,
                      heading: t("ResourceTable.removeConfirmationTitle", {
                        name: nameFi,
                      }),
                      content: t("ResourceTable.removeConfirmationMessage"),
                      acceptLabel: t("ResourceTable.removeConfirmationAccept"),
                      cancelLabel: t("ResourceTable.removeConfirmationCancel"),
                      onAccept: async () => {
                        try {
                          await deleteResource(pk as number);
                          onDelete(t("ResourceTable.removeSuccess"));
                        } catch (error) {
                          onDataError(t("ResourceTable.removeFailed"));
                        }
                      },
                    });
                  },
                },
              ]}
            />
          </ResourceNodeContainer>
        ),
        disableSorting: true,
      },
    ],
    index: "pk",
    sorting: "nameFi",
    order: "asc",
    rowLink: ({ pk }: ResourceNode) => resourceUrl(Number(pk), Number(unit.pk)),
  } as CellConfig;

  return (
    <div>
      <DataTable
        groups={[{ id: 1, data: resources }]}
        hasGrouping={false}
        config={{
          filtering: false,
          rowFilters: false,
          selection: false,
        }}
        cellConfig={cellConfig}
        filterConfig={[]}
        noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
      />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </div>
  );
};

export default ResourcesTable;
