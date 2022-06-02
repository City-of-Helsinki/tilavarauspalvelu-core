import React, { useRef } from "react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";
import { DELETE_RESOURCE } from "../../common/queries";

import {
  ResourceDeleteMutationInput,
  ResourceDeleteMutationPayload,
  ResourceType,
  UnitByPkType,
} from "../../common/gql-types";

interface IProps {
  resources: ResourceType[] | undefined;
  unit: UnitByPkType;
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
    deleteResourceMutation({ variables: { input: { pk } } });

  const { t } = useTranslation();

  const modal = useRef<ModalRef>();
  const history = useHistory();

  const cellConfig = {
    cols: [
      {
        title: "ResourceTable.headings.name",
        key: `nameFi`,
        transform: ({ nameFi }: ResourceType) => (
          <Name>{trim(nameFi as string)}</Name>
        ),
      },
      {
        title: "ResourceTable.headings.unitName",
        key: "space.unit.nameFi",
        transform: ({ space }: ResourceType) =>
          space?.unit?.nameFi || t("ResourceTable.noSpace"),
      },
      {
        title: "",
        key: "type",
        transform: ({ nameFi, pk, locationType }: ResourceType) => (
          <ResourceTypeContainer>
            <ResourceTypeName>{locationType}</ResourceTypeName>
            <PopupMenu
              items={[
                {
                  name: t("ResourceTable.menuEditResource"),
                  onClick: () => {
                    history.push(`/unit/${unit.pk}/resource/edit/${pk}`);
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
        disableSorting: true,
      },
    ],
    index: "pk",
    sorting: "nameFi",
    order: "asc",
    rowLink: ({ pk }: ResourceType) => `/unit/${unit.pk}/resource/edit/${pk}`,
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
        cellConfig={cellConfig}
        filterConfig={[]}
        noResultsKey={hasSpaces ? "Unit.noResources" : "Unit.noResourcesSpaces"}
      />
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </Wrapper>
  );
};

export default ResourcesTable;
