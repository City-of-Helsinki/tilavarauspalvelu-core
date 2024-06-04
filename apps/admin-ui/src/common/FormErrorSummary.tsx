import React from "react";
import { ErrorSummary } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import type { FieldErrors, FieldValues } from "react-hook-form";

type Props<T extends FieldValues> = {
  fieldNamePrefix?: string;
  errors: FieldErrors<T>;
};

const Wrapper = styled.div`
  margin: var(--spacing-m) 0;
`;

function cleanUpFieldName(fieldName?: string): string | null {
  if (!fieldName) {
    return null;
  }
  if (fieldName.endsWith(".")) {
    return fieldName.slice(0, -1);
  }
  return fieldName;
}

export function FormErrorSummary<T extends FieldValues>({
  errors,
  fieldNamePrefix,
}: Props<T>): JSX.Element | null {
  const { t } = useTranslation();

  const keys: string[] = [];
  for (const err in errors) {
    keys.push(err);
  }

  if (Object.keys(errors).length === 0) {
    return null;
  }

  const cleanPrefix = cleanUpFieldName(fieldNamePrefix);

  // TODO use a common translation key for these
  const prefix =
    cleanPrefix != null ? `${cleanPrefix}.` : "Notifications.form.errors.";

  return (
    <Wrapper>
      <ErrorSummary label={t("FormErrorSummary.label")} autofocus>
        <ul>
          {Object.values(errors).map((err, index: number) => {
            const label = t(`FormErrorSummary.errorLabel`, {
              index: index + 1,
            });
            // TODO undefined should be filtered out
            const fieldName = t(`${prefix}${err?.message}`);
            return (
              <li key={keys[index]}>
                <span>{label}</span>
                {": "}
                {t(fieldName)}
              </li>
            );
          })}
        </ul>
      </ErrorSummary>
    </Wrapper>
  );
}
