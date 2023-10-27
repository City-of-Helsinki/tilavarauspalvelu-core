import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container } from "common";
import Head from "./Head";
import Stepper, { StepperProps } from "./Stepper";

type ApplicationPageProps = {
  translationKeyPrefix: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
  steps: StepperProps | undefined;
};

const StyledContainer = styled(Container)`
  background-color: var(--color-white);
`;

const InnerContainer = styled.div<{ $hideStepper: boolean }>`
  display: grid;
  gap: 1em;
  ${({ $hideStepper }) =>
    $hideStepper
      ? `grid-template-columns: 6em 1fr;`
      : `grid-template-columns: 18em 1fr;`}

  @media (max-width: ${breakpoints.l}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const Main = styled.div`
  margin-top: var(--spacing-s);

  @media (max-width: ${breakpoints.s}) {
    width: calc (100vw - 3 * var(--spacing-xs));
  }
`;

const ApplicationPageWrapper = ({
  translationKeyPrefix,
  headContent,
  overrideText,
  children,
  steps,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head heading={t(`${translationKeyPrefix}.heading`)}>
        {headContent || overrideText || t(`${translationKeyPrefix}.text`)}
      </Head>
      <StyledContainer>
        <InnerContainer $hideStepper={steps == null}>
          {steps == null ? <div /> : <Stepper {...steps} />}
          <Main>{children}</Main>
        </InnerContainer>
      </StyledContainer>
    </>
  );
};

export { ApplicationPageWrapper };
