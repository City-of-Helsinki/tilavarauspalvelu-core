import { RadioButton } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontRegular } from "common/src/common/typography";
import { Applicant_Type } from "common/types/gql-types";
import { useController, useFormContext } from "react-hook-form";
import { ApplicationFormValues } from "./Form";

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const Prefix = styled.p`
  ${fontRegular}
`;

export const ApplicantTypeSelector = (): JSX.Element => {
  const { t } = useTranslation();

  const { control } = useFormContext<ApplicationFormValues>();
  const {
    field: { value, onChange },
  } = useController({
    name: "applicantType",
    control,
  });
  // Community and association are the same except for corporate id
  const choices = Object.values(Applicant_Type).filter(
    (id) => id !== Applicant_Type.Community
  );

  const selection = choices.find(
    (id) =>
      id === value ||
      (id === Applicant_Type.Association && value === Applicant_Type.Community)
  );

  return (
    <>
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
    </>
  );
};
