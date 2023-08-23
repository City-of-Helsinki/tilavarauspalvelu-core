import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ContentContainer } from "../../../styles/layout";
import ResourceEditor from "./ResourceEditor";

type Props = {
  unitPk: string;
  resourcePk: string;
};

const ResourceEditorView = (): JSX.Element | null => {
  const { resourcePk, unitPk } = useParams<Props>();
  const { t } = useTranslation();

  const [resource, unit] = [resourcePk, unitPk].map(Number);

  if (!resource) {
    return (
      <ContentContainer>
        {t("ResourceEditorView.illegalResource")}
      </ContentContainer>
    );
  }

  if (!unit) {
    return (
      <ContentContainer>{t("ResourceEditorView.illegalUnit")}</ContentContainer>
    );
  }

  return <ResourceEditor resourcePk={resource} unitPk={unit} />;
};

export default ResourceEditorView;
