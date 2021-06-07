import { RadioButton } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { FormType } from "../../modules/types";

type Props = {
  activeForm: FormType;
  children: React.ReactNode;
  setActiveForm: (id: FormType) => void;
};

const Container = styled.div`
  margin-top: var(--spacing-m);
`;

const RadioButtons = ({
  activeForm,
  children,
  setActiveForm,
}: Props): JSX.Element | null => {
  const { t } = useTranslation();

  return (
    <>
      {["organisation", "individual", "company"].map((id: string) => (
        <Container key={id}>
          <RadioButton
            name={id}
            id={id}
            label={t(`Application.Page3.as.type.${id}`)}
            onClick={() => {
              setActiveForm(id as FormType);
            }}
            checked={activeForm === id}
          />
          {activeForm === id ? children : null}
        </Container>
      ))}
    </>
  );
};

export default RadioButtons;
