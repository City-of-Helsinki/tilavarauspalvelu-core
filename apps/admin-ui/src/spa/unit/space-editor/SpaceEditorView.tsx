import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ContentContainer } from "../../../styles/layout";
import SpaceEditor from "./SpaceEditor";

type Props = {
  unitPk: string;
  spacePk: string;
};

const SpaceEditorView = (): JSX.Element | null => {
  const { spacePk, unitPk } = useParams<Props>();
  const { t } = useTranslation();

  const [space, unit] = [spacePk, unitPk].map(Number).filter(Number.isFinite);

  if (!space) {
    return (
      <ContentContainer>{t("SpaceEditorView.illegalSpace")}</ContentContainer>
    );
  }

  if (!unit) {
    return (
      <ContentContainer>{t("SpaceEditorView.illegalUnit")}</ContentContainer>
    );
  }

  return <SpaceEditor space={space} unit={unit} />;
};

export default SpaceEditorView;
