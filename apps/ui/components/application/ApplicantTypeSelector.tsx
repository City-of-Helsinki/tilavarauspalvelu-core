import { RadioButton } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontRegular } from "common/src/common/typography";
import { ApplicantTypeChoice } from "@gql/gql-types";
import { useController, useFormContext } from "react-hook-form";
import type { ApplicationFormPage3Values } from "./Form";

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const Prefix = styled.p`
  ${fontRegular}
`;

export const ApplicantTypeSelector = (): JSX.Element => {
  const { t } = useTranslation();

  const { control } = useFormContext<ApplicationFormPage3Values>();
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

  return (
    <div>
      <Prefix>{t("application:Page3.as.prefix")}</Prefix>
      {choices.map((id) => (
        <Container key={id}>
          <RadioButton
            name={id}
            id={id}
            label={t(`application:Page3.as.type.${id}`)}
            onClick={() => onChange(id)}
            checked={selection === id}
          />
        </Container>
      ))}
    </div>
  );
};
