import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container } from "common";
import {
  ApplicationType,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import Head from "./Head";
import Stepper from "./Stepper";

type ApplicationPageProps = {
  application?: ApplicationType;
  translationKeyPrefix: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
  hideStepper?: boolean;
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
  application,
  translationKeyPrefix,
  headContent,
  overrideText,
  children,
  hideStepper = false,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  const aes = filterNonNullable(application?.applicationEvents)
  const type = application?.applicantType ?? ApplicationsApplicationApplicantTypeChoices.Individual
  // have to hide stepper if there are no application events
  // should refactor the stepper to be more flexible
  const hidden = hideStepper || application == null || aes.length === 0
  return (
    <>
      <Head heading={t(`${translationKeyPrefix}.heading`)}>
        {headContent || overrideText || t(`${translationKeyPrefix}.text`)}
      </Head>
      <StyledContainer>
        <InnerContainer $hideStepper={hideStepper}>
          {hidden ? (
            <div />
          ) : (
            <Stepper
              applicationPk={application.pk ?? 0}
              applicationEvents={aes}
              applicantType={type}
            />
          )}
          <Main>{children}</Main>
        </InnerContainer>
      </StyledContainer>
    </>
  );
};

export { ApplicationPageWrapper };
