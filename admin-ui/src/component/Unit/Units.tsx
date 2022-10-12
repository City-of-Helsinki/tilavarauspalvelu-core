import React, { useState } from "react";
import styled from "styled-components";
import { Link } from "hds-react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { VerticalFlex } from "../../styles/layout";
import withMainMenu from "../withMainMenu";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Filters, { emptyFilterState, FilterArguments } from "./Filters";
import UnitsDataLoader from "./UnitsDataLoader";
import { Sort } from "./UnitsTable";
import { HR } from "../lists/components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-2-xs);

  padding: var(--spacing-layout-2-xs) 0 var(--spacing-layout-m)
    var(--spacing-layout-m);
  max-width: var(--container-width-l);
`;

const Units = (): JSX.Element => {
  const [search, setSearch] = useState<FilterArguments>(emptyFilterState);
  const [sort, setSort] = useState<Sort>({ field: "nameFi", sort: true });
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const { t } = useTranslation();

  const onSortChanged = (sortField: string) => {
    setSort({
      field: sortField,
      sort: sort?.field === sortField ? !sort?.sort : true,
    });
  };

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "units"]} />
      <Wrapper>
        <div>
          <H1>{t("MainMenu.units")}</H1>
          <p>
            {t("Units.description")}
            <Link
              size="M"
              href={t("Units.descriptionLinkHref")}
              openInNewTab
              external
            >
              {t("Units.descriptionLinkLabel")}
            </Link>
          </p>
        </div>
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
      </Wrapper>
    </>
  );
};

export default withMainMenu(Units);
