import React, { useRef } from "react";
import { IconGroup } from "hds-react";
import { clone, set, trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { DELETE_SPACE } from "../../common/queries";
import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";
import Modal, { useModal as useHDSModal } from "../HDSModal";
import NewSpaceModal from "./NewSpaceModal";
import ConfirmationDialog, { ModalRef } from "../ConfirmationDialog";

import {
  SpaceDeleteMutationInput,
  SpaceDeleteMutationPayload,
  SpaceType,
  UnitByPkType,
} from "../../common/gql-types";
import { DataGroup } from "../../common/types";
import SpaceTreeDataTableGroup from "./SpaceTreeDataTableGroup";

interface IProps {
  spaces: SpaceType[];
  unit: UnitByPkType;
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

const buildTrees = (spaces: SpaceType[]): SpaceType[] => {
  const editedSpaces = spaces.map(clone);
  editedSpaces.forEach((s) => {
    const parent = editedSpaces.find((ps) => ps.pk === s.parent?.pk);
    if (parent) {
      set(s, "parent", parent);
      set(parent, "children", (parent.children || []).concat(s));
    }
  });
  return editedSpaces;
};

const collectSubTree = (space: SpaceType): SpaceType[] => {
  const children = (space.children as SpaceType[]) || [];
  return [space].concat(children.flatMap((c) => collectSubTree(c)));
};

const spacesAsGroups = (spaces: SpaceType[]): DataGroup[] => {
  const reconciled = buildTrees(spaces);
  const roots = reconciled.filter((e) => e.parent === null);

  return roots.map((sp) => ({
    id: sp.pk as number,
    data: collectSubTree(sp),
  }));
};

const countSubSpaces = (space: SpaceType): number =>
  (space.children || []).reduce(
    (p, c) => p + 1 + (c ? countSubSpaces(c) : 0),
    0
  );

const renderGroup = (
  group: { data: SpaceType[] },
  hasGrouping: boolean,
  cellConfig: CellConfig,
  groupIndex: number,
  groupVisibility: boolean[],
  setGroupVisibility: React.Dispatch<React.SetStateAction<boolean[]>>,
  isSelectionActive: boolean,
  groupRows: number[],
  selectedRows: number[],
  updateSelection: (
    selection: number[],
    method?: "add" | "remove" | undefined
  ) => void,
  children: any
): JSX.Element => (
  <SpaceTreeDataTableGroup
    cellConfig={cellConfig}
    group={group}
    hasGrouping={hasGrouping}
    key={group.data[0].pk || "group"}
    cols={cellConfig.cols.length}
    index={groupIndex}
    isVisible={groupVisibility[groupIndex]}
    toggleGroupVisibility={(): void => {
      const tempGroupVisibility = [...groupVisibility];
      tempGroupVisibility[groupIndex] = !tempGroupVisibility[groupIndex];
      setGroupVisibility(tempGroupVisibility);
    }}
  >
    {children}
  </SpaceTreeDataTableGroup>
);

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
    pk: number
  ): Promise<FetchResult<{ deleteSpace: SpaceDeleteMutationPayload }>> =>
    deleteSpaceMutation({ variables: { input: { pk } } });

  const modal = useRef<ModalRef>();

  const history = useHistory();

  const cellConfig = {
    cols: [
      {
        title: "Unit.headings.name",
        key: `name.${i18n.language}`,
        transform: (space) => {
          return <Name>{trim(space.nameFi as string)}</Name>;
        },
      },
      {
        title: "Unit.headings.code",
        key: "code",
        transform: ({ code }: SpaceType) => trim(code),
      },
      {
        title: "Unit.headings.numSubSpaces",
        key: "numSubSpaces",
        transform: (space) => {
          const count = countSubSpaces(space);
          return `${count} ${t("SpaceTable.subSpaceCount", { count })}`;
        },
      },
      {
        title: "Unit.headings.surfaceArea",
        key: "surfaceArea",
        transform: ({ surfaceArea }: SpaceType) =>
          surfaceArea ? `${surfaceArea}m²` : "",
      },
      {
        title: "Unit.headings.maxPersons",
        key: "maxPersons",
        transform: (space: SpaceType) => {
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
                      history.push(`/unit/${unit.pk}/space/edit/${space.pk}`);
                    },
                  },
                  {
                    name: t("SpaceTable.menuRemoveSpace"),
                    onClick: () => {
                      modal.current?.open({
                        id: "confirmation-modal",
                        open: true,
                        heading: t("SpaceTable.removeConfirmationTitle", {
                          name: space.nameFi,
                        }),
                        content: t("SpaceTable.removeConfirmationMessage"),
                        acceptLabel: t("SpaceTable.removeConfirmationAccept"),
                        cancelLabel: t("SpaceTable.removeConfirmationCancel"),
                        onAccept: () => {
                          deleteSpace(space.pk as number)
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
    index: "pk",
    order: "asc",
    rowLink: ({ pk }: SpaceType) => `/unit/${unit.pk}/space/edit/${pk}`,
  } as CellConfig;

  const ref = useRef(null);

  return (
    <Wrapper>
      <DataTable
        groups={spacesAsGroups(spaces)}
        hasGrouping
        renderGroup={renderGroup}
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
