import React from "react";
import { useTranslation } from "react-i18next";
import { H1 } from "common/src/common/typography";
import { Filters } from "@/spa/unit/Filters";
import { HR } from "@/component/Table";
import { UnitsDataLoader } from "@/spa/unit/UnitsDataLoader";

export function MyUnits() {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <H1>{t("MyUnits.heading")}</H1>
        <p>{t("MyUnits.description")}</p>
      </div>
      <Filters />
      <HR />
      <UnitsDataLoader isMyUnits />
    </>
  );
}
