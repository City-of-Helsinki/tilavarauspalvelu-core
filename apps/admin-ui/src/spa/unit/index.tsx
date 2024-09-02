import React from "react";
import { Link } from "hds-react";
import { H1 } from "common/src/common/typography";
import { useTranslation } from "next-i18next";
import { Container } from "@/styles/layout";
import { Filters } from "./Filters";
import { UnitsDataLoader } from "./UnitsDataLoader";
import { HR } from "@/component/Table";

function Units(): JSX.Element {
  const { t } = useTranslation();

  return (
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
      <Filters />
      <HR />
      <UnitsDataLoader />
    </Container>
  );
}

export default Units;
