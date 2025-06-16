import React from "react";
import { Link, LinkSize } from "hds-react";
import { H1, HR } from "common/styled";
import { useTranslation } from "next-i18next";
import { Filters } from "./Filters";
import { UnitsDataLoader } from "./UnitsDataLoader";

function Units(): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1 $marginTop="l">{t("MainMenu.units")}</H1>
        <p>
          {t("Units.description")}
          <Link size={LinkSize.Medium} href={t("Units.descriptionLinkHref")} openInNewTab external>
            {t("Units.descriptionLinkLabel")}
          </Link>
        </p>
      </div>
      <Filters />
      <HR />
      <UnitsDataLoader />
    </>
  );
}

export default Units;
