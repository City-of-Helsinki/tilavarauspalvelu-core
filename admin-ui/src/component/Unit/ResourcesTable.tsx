import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";

import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "../../common/queries";

import {
  ResourceDeleteMutationInput,
  ResourceDeleteMutationPayload,
  ResourceType,
} from "../../common/gql-types";

interface IProps {
  resources: ResourceType[] | undefined;
  hasSpaces: boolean;
  onDelete: (text?: string) => void;
  onDataError: (error: string) => void;
}

const Wrapper = styled.div``;

const Name = styled.div`
  font-size: var(--fontsize-body-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ResourceTypeContainer = styled.div`
  display: flex;
  align-items: center;
`;

const ResourceTypeName = styled.span``;

const ResourcesTable = ({
  resources,
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
    deleteResourceMutation({ variables: { input: { pk } } });

  const { t, i18n } = useTranslation();

  const modal = useRef<ModalRef>();

  const cellConfig = {
    cols: [
      {
        title: "Resource.name",
        key: `name.${i18n.language}`,
        transform: ({ nameFi }: ResourceType) => (
          <Name>{trim(nameFi as string)}</Name>
        ),
      },
      {
        title: "Resource.space.name",
        key: "space.unit.nameFi",
        transform: ({ space }: ResourceType) =>
          space?.unit?.nameFi || t("ResourceTable.noSpace"),
      },
      {
        title: "Resource.area",
        key: "area",
        transform: () => "Töölö WIP",
      },
      {
        title: "Resource.type",
        key: "type",
        transform: ({ nameFi, pk, locationType }: ResourceType) => (
          <ResourceTypeContainer>
            <ResourceTypeName>{locationType}</ResourceTypeName>
            <PopupMenu
              items={[
                {
                  name: t("ResourceTable.menuEditResource"),
                  onClick: () => {
                    // eslint-disable-next-line no-console
                    console.log("Edit resource todo");
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
          </ResourceTypeContainer>
        ),
      },
    ],
    index: "pk",
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
        noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
      />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </Wrapper>
  );
};

export default ResourcesTable;
