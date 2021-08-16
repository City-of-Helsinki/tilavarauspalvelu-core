import React from "react";
import { Button, IconMenuDots } from "hds-react";
import { trim } from "lodash";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Resource } from "../../common/types";

import DataTable, { CellConfig } from "../DataTable";

interface IProps {
  resources: Resource[];
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

const MenuIcon = styled(IconMenuDots)`
  margin-left: auto;
`;

const RowButton = styled(Button)`
  color: var(--color-black);
  margin-left: auto;
  padding: 0;
  border-radius: 0;
  span {
    padding: 0;
  }
`;

const ResourcesTable = ({ resources }: IProps): JSX.Element => {
  const { t, i18n } = useTranslation();

  const cellConfig = {
    cols: [
      {
        title: "Resource.name",
        key: `name.${i18n.language}`,
        transform: ({ name }: Resource) => (
          <Name>{trim(name[i18n.language]) + t("")}</Name>
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
        transform: ({ resourceType }: Resource) => (
          <ResourceType>
            <ResourceTypeName>{resourceType}</ResourceTypeName>
            <RowButton
              onClick={(e) => {
                e.stopPropagation();
                // eslint-disable-next-line no-alert
                window.alert("display popup menu");
                return false;
              }}
              iconLeft={<MenuIcon />}
              variant="supplementary"
            >
              {" "}
            </RowButton>
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
    </Wrapper>
  );
};

export default ResourcesTable;
