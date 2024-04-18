import React, { useState } from "react";
import { Link } from "hds-react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { Container } from "../../styles/layout";
import BreadcrumbWrapper from "../BreadcrumbWrapper";
import Filters, { emptyFilterState, FilterArguments } from "./Filters";
import { UnitsDataLoader } from "./UnitsDataLoader";
import { HR } from "@/component/Table";

function Units(): JSX.Element {
  const [search, setSearch] = useState<FilterArguments>(emptyFilterState);
  const debouncedSearch = debounce((value) => setSearch(value), 300);

  const { t } = useTranslation();

  return (
    <>
      <BreadcrumbWrapper route={["spaces-n-settings", "units"]} />
      <Container>
        <div>
          <H1 $legacy>{t("MainMenu.units")}</H1>
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
        <Filters onSearch={debouncedSearch} />
        <HR />
        <UnitsDataLoader filters={search} />
      </Container>
    </>
  );
}

export default Units;
