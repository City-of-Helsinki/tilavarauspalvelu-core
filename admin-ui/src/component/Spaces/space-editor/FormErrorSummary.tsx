import React from "react";
import { ErrorSummary } from "hds-react";
import Joi from "joi";
import { useTranslation } from "react-i18next";

type Props = {
  validationErrors: Joi.ValidationResult | null;
  linkToError?: boolean;
};

const FormErrorSummary = ({
  validationErrors,
  linkToError = true,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!validationErrors || !validationErrors.error) {
    return null;
  }

  return (
    <ErrorSummary label={t("FormErrorSummary.label")} autofocus>
      <ul>
        {validationErrors.error?.details.map((error, index) => {
          const label = t(`FormErrorSummary.errorLabel`, { index: index + 1 });
          return (
            <li key={String(error.path)}>
              {linkToError ? <a href={`#${error.path}`}>{label}</a> : label}
              {": "}
              {t(`validation.${error.type}`, {
                ...error.context,
                fieldName: t(`SpaceEditor.label.${error.path}`),
              })}
            </li>
          );
        })}
      </ul>
    </ErrorSummary>
  );
};

export default FormErrorSummary;
