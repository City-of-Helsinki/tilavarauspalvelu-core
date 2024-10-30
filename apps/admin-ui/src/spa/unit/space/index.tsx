import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import SpaceEditor from "./SpaceEditor";

type Props = {
  unitPk: string;
  spacePk: string;
};

function SpaceEditorView(): JSX.Element {
  const { spacePk, unitPk } = useParams<Props>();
  const { t } = useTranslation();

  const [space, unit] = [spacePk, unitPk].map(Number).filter(Number.isFinite);

  if (!space) {
    return <>{t("SpaceEditorView.illegalSpace")}</>;
  }

  if (!unit) {
    return <>{t("SpaceEditorView.illegalUnit")}</>;
  }

  return <SpaceEditor space={space} unit={unit} />;
}

export default SpaceEditorView;
