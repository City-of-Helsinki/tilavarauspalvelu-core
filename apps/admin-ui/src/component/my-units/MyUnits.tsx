import React, { useState } from "react";
import { debounce } from "lodash";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import { Container } from "../../styles/layout";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import { Sort } from "../Unit/UnitsTable";
import Filters, { FilterArguments, emptyFilterState } from "../Unit/Filters";
import { HR } from "../lists/components";
import UnitsDataLoader from "../Unit/UnitsDataLoader";

// NOTE copy pasta from Unit/Units.tsx
const MyUnits = () => {
  const [search, setSearch] = useState<FilterArguments>(emptyFilterState);
  const [sort, setSort] = useState<Sort>();
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
      <BreadcrumbWrapper route={["my-units"]} />
      <Container>
        <div>
          <H1 $legacy>{t("MyUnits.heading")}</H1>
          <p>{t("MyUnits.description")}</p>
        </div>
        <Filters onSearch={debouncedSearch} />
        <HR />
        <UnitsDataLoader
          filters={search}
          sort={sort}
          sortChanged={onSortChanged}
          isMyUnits
        />
      </Container>
    </>
  );
};

export default MyUnits;
