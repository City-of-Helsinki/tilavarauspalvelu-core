import React from "react";
import { ErrorSummary } from "hds-react";
import Joi from "joi";
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { get } from "lodash";

type Props = {
  validationErrors: Joi.ValidationResult | null;
  linkToError?: boolean;
  useDerivedIdsFor?: string[];
  fieldNamePrefix: string;
};

const getErrorContext = (
  context: Joi.Context | undefined,
  fieldNamePrefix: string
) => {
  return typeof get(context, "limit") === "object"
    ? {
        ...context,
        limit: i18next.t(`${fieldNamePrefix}${get(context, "limit.key")}`),
      }
    : { ...context };
};

const Wrapper = styled.div`
  margin: var(--spacing-m) 0;
`;

const FormErrorSummary = ({
  validationErrors,
  linkToError = true,
  fieldNamePrefix = "",
  useDerivedIdsFor = [],
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
            const id = useDerivedIdsFor.includes(String(error.path))
              ? `${error.path}-toggle-button`
              : error.path;
            const errorContext = getErrorContext(
              error.context,
              fieldNamePrefix
            );
            return (
              <li key={String(error.path)}>
                {linkToError ? <a href={`#${id}`}>{label}</a> : label}
                {": "}
                {t(`validation.${error.type}`, {
                  ...errorContext,
                  fieldName: t(`${fieldNamePrefix}${errorContext?.key}`),
                })}
              </li>
            );
          })}
        </ul>
      </ErrorSummary>
    </Wrapper>
  );
};

export const validationErrorResolver =
  (validationErrors: Joi.ValidationResult | null, labelPrefix = "") =>
  (name: string): string | undefined => {
    const error = validationErrors?.error?.details.find(
      (errorDetail) =>
        errorDetail.path.find((path) => path === name) ||
        name === errorDetail.path.join(",")
    );
    if (!error) {
      return undefined;
    }

    return i18next.t(`validation.${error.type}`, {
      ...getErrorContext(error.context, labelPrefix),
    }) as string;
  };

export default FormErrorSummary;
