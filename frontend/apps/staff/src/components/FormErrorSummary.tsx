import React, { useEffect, useRef } from "react";
import type { FieldErrors, FieldValues } from "react-hook-form";
import { Notification } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

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
}: Props<T>): React.ReactElement | null {
  const { t } = useTranslation("forms");
  const summaryRef = useRef<HTMLDivElement>(null);

  const keys: string[] = [];
  for (const err in errors) {
    keys.push(err);
  }

  useEffect(() => {
    summaryRef.current?.focus();
  }, []);

  if (Object.keys(errors).length === 0) {
    return null;
  }

  const cleanPrefix = cleanUpFieldName(fieldNamePrefix);
  const prefix = cleanPrefix != null ? `${cleanPrefix}.` : "errors.";

  return (
    <Wrapper ref={summaryRef} tabIndex={-1}>
      <Notification type="alert" label={t("ErrorSummary.label")}>
        <ul>
          {Object.values(errors).map((err, index: number) => {
            const label = t(`ErrorSummary.errorLabel`, {
              index: index + 1,
            });
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
      </Notification>
    </Wrapper>
  );
}
