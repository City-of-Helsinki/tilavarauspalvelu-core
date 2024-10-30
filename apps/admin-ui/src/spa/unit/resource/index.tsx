import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { ResourceEditor } from "./ResourceEditor";

type Props = {
  unitPk: string;
  resourcePk: string;
};

function ResourceEditorView(): JSX.Element {
  const { resourcePk, unitPk } = useParams<Props>();
  const { t } = useTranslation();

  const [resource, unit] = [resourcePk, unitPk].map(Number);

  if (!resource) {
    return <>{t("ResourceEditorView.illegalResource")}</>;
  }

  if (!unit) {
    return <>{t("ResourceEditorView.illegalUnit")}</>;
  }

  return <ResourceEditor resourcePk={resource} unitPk={unit} />;
}

export default ResourceEditorView;
