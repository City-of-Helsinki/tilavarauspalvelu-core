import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { Container } from "common";
import {
  ApplicantTypeChoice,
  ApplicationStatusChoice,
  type ApplicationQuery,
} from "@gql/gql-types";
import { useRouter } from "next/router";
import Head from "./Head";
import Stepper, { StepperProps } from "./Stepper";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { getApplicationPath } from "@/modules/urls";

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
    width: calc(100vw - 3 * var(--spacing-xs));
  }
`;

const NotesWrapper = styled.div`
  margin-bottom: var(--spacing-m);
`;

// TODO this should have more complete checks (but we are thinking of splitting the form anyway)
function calculateCompletedStep(values: Node): 0 | 1 | 2 | 3 | 4 {
  const { status } = values;
  // 4 should only be returned if the application state === Received
  if (status === ApplicationStatusChoice.Received) {
    return 4;
  }

  // 3 if the user information is filled
  if (
    (values.billingAddress?.streetAddressFi &&
      values.applicantType === ApplicantTypeChoice.Individual) ||
    values.contactPerson != null
  ) {
    return 3;
  }

  // 2 only if application events have time schedules
  if (
    values.applicationSections?.length &&
    values.applicationSections?.find((x) => x?.suitableTimeRanges) != null
  ) {
    return 2;
  }

  // First page is valid
  if (
    values.applicationSections?.[0]?.reservationUnitOptions?.length &&
    values.applicationSections?.[0]?.reservationsBeginDate &&
    values.applicationSections?.[0]?.reservationsEndDate &&
    values.applicationSections?.[0]?.name &&
    values.applicationSections?.[0]?.numPersons &&
    values.applicationSections?.[0]?.purpose
  ) {
    return 1;
  }
  return 0;
}

type Node = NonNullable<ApplicationQuery["application"]>;
type ApplicationPageProps = {
  application: Node;
  translationKeyPrefix: string;
  overrideText?: string;
  isDirty?: boolean;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
};

export function ApplicationPageWrapper({
  application,
  translationKeyPrefix,
  headContent,
  overrideText,
  isDirty,
  children,
}: ApplicationPageProps): JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();

  const pages = ["page1", "page2", "page3", "preview"] as const;

  const hideStepper =
    pages.filter((x) => router.asPath.match(`/${x}`)).length === 0;
  const steps: StepperProps = {
    steps: pages.map((x, i) => ({ slug: x, step: i })),
    completedStep: application ? calculateCompletedStep(application) : 0,
    basePath: getApplicationPath(application?.pk),
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
          <Main>
            <NotesWrapper>
              <NotesWhenApplying
                applicationRound={application?.applicationRound ?? null}
              />
            </NotesWrapper>
            {children}
          </Main>
        </InnerContainer>
      </StyledContainer>
    </>
  );
}
