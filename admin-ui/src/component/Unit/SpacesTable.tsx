import React from "react";
import { IconGroup } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Space } from "../../common/types";
import DataTable, { CellConfig } from "../DataTable";
import PopupMenu from "./PopupMenu";

interface IProps {
  spaces: Space[];
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

const SpacesTable = ({ spaces }: IProps): JSX.Element => {
  const { t, i18n } = useTranslation();

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
        transform: ({ maxPersons }: Space) => (
          <MaxPersons>
            {maxPersons ? (
              <Prop>
                <IconGroup />
                {maxPersons}
              </Prop>
            ) : null}
            <PopupMenu
              items={[
                {
                  name: t("SpaceTable.menuAddSubSpace"),
                  onClick: () => {
                    // eslint-disable-next-line no-console
                    console.log("Clicked!");
                  },
                },
                {
                  name: t("SpaceTable.menuEditSpace"),
                  onClick: () => {
                    // eslint-disable-next-line no-console
                    console.log("Clicked!");
                  },
                },
                {
                  name: t("SpaceTable.menuRemoveSpace"),
                  onClick: () => {
                    // eslint-disable-next-line no-console
                    console.log("Clicked!");
                  },
                },
              ]}
            />
          </MaxPersons>
        ),
      },
    ],
    index: "id",
    sorting: "name.fi",
    order: "asc",
    rowLink: ({ id }: Space) => `/space/${id}`,
  } as CellConfig;

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
    </Wrapper>
  );
};

export default SpacesTable;
