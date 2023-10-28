import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container } from "common";
import {
  ApplicationNode,
  ApplicationStatusChoice,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";
import { useRouter } from "next/router";
import Head from "./Head";
import Stepper, { StepperProps } from "./Stepper";

type ApplicationPageProps = {
  application: ApplicationNode;
  translationKeyPrefix: string;
  overrideText?: string;
  isDirty?: boolean;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
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

// TODO this should have more complete checks (but we are thinking of splitting the form anyway)
const calculateCompletedStep = (values: ApplicationNode): 0 | 1 | 2 | 3 | 4 => {
  const { status } = values;
  // 4 should only be returned if the application state === Received
  if (status === ApplicationStatusChoice.Received) {
    return 4;
  }

  // 3 if the user information is filled
  if (
    (values.billingAddress?.streetAddress &&
      values.applicantType ===
        ApplicationsApplicationApplicantTypeChoices.Individual) ||
    values.contactPerson != null
  ) {
    return 3;
  }

  // 2 only if application events have time schedules
  if (
    values.applicationEvents?.length &&
    values.applicationEvents?.find(
      (x) => x?.applicationEventSchedules?.length
    ) != null
  ) {
    return 2;
  }

  // First page is valid
  if (
    values.applicationEvents?.[0]?.eventReservationUnits?.length &&
    values.applicationEvents?.[0]?.begin &&
    values.applicationEvents?.[0]?.end &&
    values.applicationEvents?.[0]?.name &&
    values.applicationEvents?.[0]?.numPersons &&
    values.applicationEvents?.[0]?.purpose
  ) {
    return 1;
  }
  return 0;
};

const ApplicationPageWrapper = ({
  application,
  translationKeyPrefix,
  headContent,
  overrideText,
  isDirty,
  children,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  const pages = ["page1", "page2", "page3", "preview"];

  const hideStepper =
    pages.filter((x) => router.asPath.match(`/${x}`)).length === 0;
  const steps: StepperProps = {
    steps: pages.map((x, i) => ({ slug: x, step: i })),
    completedStep: calculateCompletedStep(application),
    basePath: `/application/${application.pk ?? 0}`,
    isFormDirty: isDirty ?? false,
  };

  return (
    <>
      <Head heading={t(`${translationKeyPrefix}.heading`)}>
        {headContent || overrideText || t(`${translationKeyPrefix}.text`)}
      </Head>
      <StyledContainer>
        <InnerContainer $hideStepper={hideStepper}>
          {hideStepper ? <div /> : <Stepper {...steps} />}
          <Main>{children}</Main>
        </InnerContainer>
      </StyledContainer>
    </>
  );
};

export { ApplicationPageWrapper };
