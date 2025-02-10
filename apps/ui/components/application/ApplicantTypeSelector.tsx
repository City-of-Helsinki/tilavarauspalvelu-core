import React from "react";
import { RadioButton } from "hds-react";
import { useTranslation } from "next-i18next";
import { ApplicantTypeChoice } from "@gql/gql-types";
import { useController, useFormContext } from "react-hook-form";
import type { ApplicationPage3FormValues } from "./form";
import { Flex } from "common/styles/util";
import styled from "styled-components";
import { ErrorText } from "common/src/components/ErrorText";

const Label = styled.p`
  margin: 0;
`;

export function ApplicantTypeSelector(): JSX.Element {
  const { t } = useTranslation();

  const { control, getFieldState } =
    useFormContext<ApplicationPage3FormValues>();
  const {
    field: { value, onChange },
  } = useController({
    name: "applicantType",
    control,
  });
  // Community and association are the same except for corporate id
  const choices = Object.values(ApplicantTypeChoice).filter(
    (id) => id !== ApplicantTypeChoice.Community
  );

  const selection = choices.find(
    (id) =>
      id === value ||
      (id === ApplicantTypeChoice.Association &&
        value === ApplicantTypeChoice.Community)
  );
  const { error } = getFieldState("applicantType");

  const errorText = error?.message
    ? t(`application:validation.${error.message}`)
    : undefined;
  return (
    <Flex $gap="xs">
      <Label>
        {t("application:Page3.as.prefix")}
        {" *"}
      </Label>
      <div>
        {choices.map((id) => (
          <RadioButton
            name={id}
            key={id}
            id={id}
            label={t(`application:Page3.as.type.${id}`)}
            onClick={() => onChange(id)}
            checked={selection === id}
          />
        ))}
      </div>
      {errorText && <ErrorText>{errorText}</ErrorText>}
    </Flex>
  );
}
