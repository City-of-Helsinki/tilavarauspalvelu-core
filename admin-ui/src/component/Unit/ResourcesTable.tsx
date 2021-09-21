import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import {
  Resource,
  ResourceDeleteMutationInput,
  ResourceDeleteMutationPayload,
} from "../../common/types";

import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "../../common/queries";
import { localizedValue } from "../../common/util";

interface IProps {
  resources: Resource[];
  onDelete: (text?: string) => void;
  onDataError: (error: string) => void;
}

const Wrapper = styled.div``;

const Name = styled.div`
  font-size: var(--fontsize-body-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ResourceType = styled.div`
  display: flex;
  align-items: center;
`;

const ResourceTypeName = styled.span``;

const ResourcesTable = ({
  resources,
  onDelete,
  onDataError,
}: IProps): JSX.Element => {
  const [deleteResourceMutation] = useMutation<
    { deleteSpace: ResourceDeleteMutationPayload },
    { input: ResourceDeleteMutationInput }
  >(DELETE_RESOURCE);

  const deleteResource = (
    id: number
  ): Promise<FetchResult<{ deleteSpace: ResourceDeleteMutationPayload }>> =>
    deleteResourceMutation({ variables: { input: { pk: id } } });

  const { t, i18n } = useTranslation();

  const modal = useRef<ModalRef>();

  const cellConfig = {
    cols: [
      {
        title: "Resource.name",
        key: `name.${i18n.language}`,
        transform: ({ name }: Resource) => (
          <Name>{trim(localizedValue(name, i18n.language))}</Name>
        ),
      },
      {
        title: "Resource.unit",
        key: "unit",
        transform: () => "Hannantalo WIP",
      },
      {
        title: "Resource.area",
        key: "area",
        transform: () => "Töölö WIP",
      },
      {
        title: "Resource.type",
        key: "type",
        transform: ({ name, pk, resourceType }: Resource) => (
          <ResourceType>
            <ResourceTypeName>{resourceType}</ResourceTypeName>
            <PopupMenu
              items={[
                {
                  name: t("ResourceTable.menuEditResource"),
                  onClick: () => {
                    // eslint-disable-next-line no-console
                    console.log("Clicked!");
                  },
                },
                {
                  name: t("ResourceTable.menuRemoveResource"),
                  onClick: () => {
                    modal.current?.open({
                      id: "confirmation-modal",
                      open: true,
                      heading: t("ResourceTable.removeConfirmationTitle", {
                        name: localizedValue(name, i18n.language),
                      }),
                      content: t("ResourceTable.removeConfirmationMessage"),
                      acceptLabel: t("ResourceTable.removeConfirmationAccept"),
                      cancelLabel: t("ResourceTable.removeConfirmationCancel"),
                      onAccept: async () => {
                        try {
                          await deleteResource(pk);
                          onDelete(t("ResourceTable.remove.success"));
                        } catch (error) {
                          onDataError(t("ResourceTable.removeFailed"));
                        }
                      },
                    });
                  },
                },
              ]}
            />
          </ResourceType>
        ),
      },
    ],
    index: "id",
    sorting: "name.fi",
    order: "asc",
    // rowLink: ({ id }: Resource) => `/resource/${id}`,
  } as CellConfig;

  return (
    <Wrapper>
      <DataTable
        groups={[{ id: 1, data: resources }]}
        hasGrouping={false}
        config={{
          filtering: false,
          rowFilters: false,
          selection: false,
        }}
        displayHeadings={false}
        cellConfig={cellConfig}
        filterConfig={[]}
        noResultsKey="Unit.noResources"
      />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </Wrapper>
  );
};

export default ResourcesTable;
