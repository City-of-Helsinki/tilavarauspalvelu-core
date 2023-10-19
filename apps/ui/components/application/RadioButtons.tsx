import { RadioButton } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontRegular } from "common/src/common/typography";
import { ApplicationsApplicationApplicantTypeChoices } from "common/types/gql-types";

type Props = {
  activeForm: ApplicationsApplicationApplicantTypeChoices;
  children?: React.ReactNode;
  setActiveForm: (id: ApplicationsApplicationApplicantTypeChoices) => void;
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const Prefix = styled.p`
  ${fontRegular}
`;

const RadioButtons = ({
  activeForm,
  children,
  setActiveForm,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  // Community and association are the same except for corporate id
  const choices = Object.values(
    ApplicationsApplicationApplicantTypeChoices
  ).filter(
    (id) => id !== ApplicationsApplicationApplicantTypeChoices.Community
  );
  // TODO is it better to do this here or in the parent?
  const selection = choices.find(
    (id) =>
      id === activeForm ||
      (id === ApplicationsApplicationApplicantTypeChoices.Association &&
        activeForm === ApplicationsApplicationApplicantTypeChoices.Community)
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
            onClick={() => setActiveForm(id)}
            checked={selection === id}
          />
          {activeForm === id ? children : null}
        </Container>
      ))}
    </>
  );
};

export default RadioButtons;
