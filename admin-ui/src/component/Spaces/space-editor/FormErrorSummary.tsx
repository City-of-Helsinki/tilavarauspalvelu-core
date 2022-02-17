import React from "react";
import { ErrorSummary } from "hds-react";
import Joi from "joi";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

type Props = {
  validationErrors: Joi.ValidationResult | null;
  linkToError?: boolean;
  fieldNamePrefix: string;
};

const Wrapper = styled.div`
  margin: var(--spacing-m) 0;
`;

const FormErrorSummary = ({
  validationErrors,
  linkToError = true,
  fieldNamePrefix = "",
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  if (!validationErrors || !validationErrors.error) {
    return null;
  }

  return (
    <Wrapper>
      <ErrorSummary label={t("FormErrorSummary.label")} autofocus>
        <ul>
          {validationErrors.error?.details.map((error, index) => {
            const label = t(`FormErrorSummary.errorLabel`, {
              index: index + 1,
            });
            return (
              <li key={String(error.path)}>
                {linkToError ? <a href={`#${error.path}`}>{label}</a> : label}
                {": "}
                {t(`validation.${error.type}`, {
                  ...error.context,
                  fieldName: t(`${fieldNamePrefix}${error.path}`),
                })}
              </li>
            );
          })}
        </ul>
      </ErrorSummary>
    </Wrapper>
  );
};

export default FormErrorSummary;
