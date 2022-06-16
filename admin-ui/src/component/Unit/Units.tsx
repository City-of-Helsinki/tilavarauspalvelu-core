import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "hds-react";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { Container, Content, VerticalFlex } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import { H1 } from "../../styles/new-typography";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Filters, { emptyFilterState, FilterArguments } from "./Filters";
import UnitsDataLoader from "./UnitsDataLoader";
import { Sort } from "./UnitsTable";
import { HR } from "../lists/components";

const Units = (): JSX.Element => {
  const [search, setSearch] = useState<FilterArguments>(emptyFilterState);
  const [sort, setSort] = useState<Sort>({ field: "nameFi", sort: true });
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const Description = styled.div`
    margin: var(--spacing-m) 0 var(--spacing-xl) 0;
  `;

  const { t } = useTranslation();

  const onSortChanged = (sortField: string) => {
    setSort({
      field: sortField,
      sort: sort?.field === sortField ? !sort?.sort : true,
    });
  };

  return (
    <Container>
      <BreadcrumbWrapper route={["spaces-n-settings", "units"]} />
      <Content>
        <H1>{t("MainMenu.units")}</H1>
        <Description>
          {t("Units.description")}
          <Link
            size="M"
            href={t("Units.descriptionLinkHref")}
            openInNewTab
            external
          >
            {t("Units.descriptionLinkLabel")}
          </Link>
        </Description>
        <VerticalFlex>
          <Filters onSearch={debouncedSearch} />
          <HR />
          <UnitsDataLoader
            key={JSON.stringify({ ...search, ...sort })}
            filters={search}
            sort={sort}
            sortChanged={onSortChanged}
          />
        </VerticalFlex>
      </Content>
    </Container>
  );
};

export default withMainMenu(Units);
