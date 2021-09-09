import React, { useRef } from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import {
  Space,
  SpaceDeleteMutationInput,
  SpaceDeleteMutationPayload,
  UnitWIP,
} from "../../common/types";
import { DELETE_SPACE } from "../../common/queries";
import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import NewSpaceModal from "./NewSpaceModal";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";

interface IProps {
  spaces: Space[];
  unit: UnitWIP;
  onSave: () => void;
  onDelete: () => void;
  onDataError: (error: string) => void;
}

const Wrapper = styled.div``;

const Name = styled.div`
  font-size: var(--fontsize-body-l);
  font-family: var(--tilavaraus-admin-font-bold);
`;

const Prop = styled.div`
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
`;

const MaxPersons = styled.div`
  display: flex;
`;

const SpacesTable = ({
  spaces,
  unit,
  onSave,
  onDelete,
  onDataError,
}: IProps): JSX.Element => {
  const { t, i18n } = useTranslation();
  const {
    open: isOpen,
    openWithContent,
    closeModal,
    modalContent,
  } = useHDSModal();

  const [deleteSpaceMutation] = useMutation<
    { deleteSpace: SpaceDeleteMutationPayload },
    { input: SpaceDeleteMutationInput }
  >(DELETE_SPACE);

  const deleteSpace = (
    id: number
  ): Promise<FetchResult<{ deleteSpace: SpaceDeleteMutationPayload }>> =>
    deleteSpaceMutation({ variables: { input: { pk: id } } });

  const modal = useRef<ModalRef>();

  const history = useHistory();

  const cellConfig = {
    cols: [
      {
        title: "Unit.headings.name",
        key: `name.${i18n.language}`,
        transform: ({ name }: Space) => (
          <Name>{trim(name[i18n.language]) + t("")}</Name>
        ),
      },
      {
        title: "Unit.headings.code",
        key: "code",
        transform: ({ code }: Space) => trim(code),
      },
      {
        title: "Unit.headings.numSubSpaces",
        key: "numSubSpaces",
        transform: () => 1,
      },
      {
        title: "Unit.headings.surfaceArea",
        key: "surfaceArea",
        transform: ({ surfaceArea }: Space) =>
          surfaceArea ? `${surfaceArea}m²` : "",
      },
      {
        title: "Unit.headings.maxPersons",
        key: "maxPersons",
        transform: (space: Space) => {
          return (
            <MaxPersons>
              {space.maxPersons ? (
                <Prop>
                  <IconGroup />
                  {space.maxPersons}
                </Prop>
              ) : null}
              <PopupMenu
                items={[
                  {
                    name: t("SpaceTable.menuAddSubSpace"),
                    onClick: () =>
                      openWithContent(
                        <NewSpaceModal
                          parentSpace={space}
                          unit={unit}
                          closeModal={closeModal}
                          onSave={onSave}
                          onDataError={onDataError}
                        />
                      ),
                  },
                  {
                    name: t("SpaceTable.menuEditSpace"),
                    onClick: () => {
                      history.push(`/unit/${unit.id}/space/edit/${space.id}`);
                    },
                  },
                  {
                    name: t("SpaceTable.menuRemoveSpace"),
                    onClick: () => {
                      modal.current?.open({
                        id: "confirmation-modal",
                        open: true,
                        heading: t("SpaceTable.removeConfirmationTitle", {
                          name: space.name[i18n.language],
                        }),
                        content: t("SpaceTable.removeConfirmationMessage"),
                        acceptLabel: t("SpaceTable.removeConfirmationAccept"),
                        cancelLabel: t("SpaceTable.removeConfirmationCancel"),
                        onAccept: () => {
                          deleteSpace(space.id)
                            .then((d) => {
                              if (!d.errors) {
                                onDelete();
                              } else {
                                onDataError("SpaceTable.removeFailed");
                              }
                            })
                            .catch(() => {
                              onDataError("SpaceTable.removeFailed");
                            });
                        },
                      });
                    },
                  },
                ]}
              />
            </MaxPersons>
          );
        },
      },
    ],
    index: "id",
    sorting: "name.fi",
    order: "asc",
    rowLink: ({ id }: Space) => `/space/${id}`,
  } as CellConfig;

  const ref = useRef(null);

  return (
    <Wrapper>
      <DataTable
        groups={[{ id: 1, data: spaces }]}
        hasGrouping={false}
        config={{
          filtering: false,
          rowFilters: false,
          selection: false,
        }}
        displayHeadings={false}
        cellConfig={cellConfig}
        filterConfig={[]}
        noResultsKey="Unit.noSpaces"
      />
      <Modal
        id="modal-id"
        open={isOpen}
        close={closeModal}
        afterCloseFocusRef={ref}
      >
        {modalContent}
      </Modal>
      <ConfirmationDialog open={false} id="confirmation-dialog" ref={modal} />
    </Wrapper>
  );
};

export default SpacesTable;
