import React from "react";
import { useTranslation } from "next-i18next";
import SpaceEditor from "@/component/unit/SpaceEditor";
import { useRouter } from "next/router";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";

function SpaceEditorView(): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const unitPk = toNumber(ignoreMaybeArray(router.query.id));
  const spacePk = toNumber(ignoreMaybeArray(router.query.pk));

  if (!spacePk) {
    return <>{t("SpaceEditorView.illegalSpace")}</>;
  }

  if (!unitPk) {
    return <>{t("SpaceEditorView.illegalUnit")}</>;
  }

  return <SpaceEditor space={spacePk} unit={unitPk} />;
}

export default SpaceEditorView;
