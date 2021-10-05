import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";

import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "../../common/queries";
import { localizedValue } from "../../common/util";
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
    id: number
  ): Promise<FetchResult<{ deleteSpace: ResourceDeleteMutationPayload }>> =>
    deleteResourceMutation({ variables: { input: { pk: String(id) } } });

  const { t, i18n } = useTranslation();

  const modal = useRef<ModalRef>();

  const cellConfig = {
    cols: [
      {
        title: "Resource.name",
        key: `name.${i18n.language}`,
        transform: ({ name }: ResourceType) => (
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
        transform: ({ name, pk, locationType }: ResourceType) => (
          <ResourceTypeContainer>
            <ResourceTypeName>{locationType}</ResourceTypeName>
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
        noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
      />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </Wrapper>
  );
};

export default ResourcesTable;
