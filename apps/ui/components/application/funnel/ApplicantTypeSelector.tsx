import React from "react";
import { RadioButton } from "hds-react";
import { useTranslation } from "next-i18next";
import { ReserveeType } from "@gql/gql-types";
import { useController, useFormContext } from "react-hook-form";
import type { ApplicationPage3FormValues } from "./form";
import { Flex } from "common/styled";
import styled from "styled-components";
import { ErrorText } from "common/src/components/ErrorText";

const Label = styled.p`
  margin: 0;
`;

export function ApplicantTypeSelector(): JSX.Element {
  const { t } = useTranslation();

  const {
    control,
    formState: { errors },
  } = useFormContext<ApplicationPage3FormValues>();

  const {
    field: { value, onChange },
  } = useController({ name: "applicantType", control });

  const error = errors.applicantType;
  const errorText = error?.message ? t(`application:validation.${error.message}`) : undefined;

  const reserveeTypeChoices = [ReserveeType.Nonprofit, ReserveeType.Company, ReserveeType.Individual];
  return (
    <Flex $gap="xs">
      <Label>
        {t("application:Page3.as.prefix")}
        {" *"}
      </Label>
      <div>
        {reserveeTypeChoices.map((reserveeType) => (
          <RadioButton
            name={reserveeType}
            key={reserveeType}
            id={reserveeType}
            label={t(`application:Page3.as.type.${reserveeType}`)}
            onClick={() => onChange(reserveeType)}
            checked={value === reserveeType}
          />
        ))}
      </div>
      {errorText && <ErrorText>{errorText}</ErrorText>}
    </Flex>
  );
}
