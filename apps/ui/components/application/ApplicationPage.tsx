import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import {
  ApplicantTypeChoice,
  ApplicationFormFragment,
  ApplicationStatusChoice,
} from "@gql/gql-types";
import { useRouter } from "next/router";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { applicationsPrefix, getApplicationPath } from "@/modules/urls";
import { Breadcrumb } from "../common/Breadcrumb";
import { fontBold, H1 } from "common";
import { Stepper as HDSStepper, StepState } from "hds-react";

const InnerContainer = styled.div`
  display: grid;
  gap: 1em;
  grid-template-rows: repeat(3, auto);

  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 21em 1fr;
  }
`;

const StyledNotesWhenApplying = styled(NotesWhenApplying)`
  grid-column-start: 1;
`;

const ChildWrapper = styled.div`
  @media (min-width: ${breakpoints.l}) {
    grid-column: 2;
    grid-row: 1 / -1;
  }
`;

const StyledStepper = styled(HDSStepper)`
  [class*="Stepper-module_selected"] {
    ${fontBold}
  }
`;

// TODO this should have more complete checks (but we are thinking of splitting the form anyway)
function calculateCompletedStep(aes: Node): 0 | 1 | 2 | 3 | 4 {
  const { status } = aes;
  // 4 should only be returned if the application state === Received
  if (status === ApplicationStatusChoice.Received) {
    return 4;
  }

  // 3 if the user information is filled
  if (
    (aes.billingAddress?.streetAddressFi &&
      aes.applicantType === ApplicantTypeChoice.Individual) ||
    aes.contactPerson != null
  ) {
    return 3;
  }

  // 2 only if application events have time schedules
  if (
    aes.applicationSections?.length &&
    aes.applicationSections?.find((x) => x?.suitableTimeRanges) != null
  ) {
    return 2;
  }

  // First page is valid
  if (
    aes.applicationSections?.[0]?.reservationUnitOptions?.length &&
    aes.applicationSections?.[0]?.reservationsBeginDate &&
    aes.applicationSections?.[0]?.reservationsEndDate &&
    aes.applicationSections?.[0]?.name &&
    aes.applicationSections?.[0]?.numPersons &&
    aes.applicationSections?.[0]?.purpose
  ) {
    return 1;
  }
  return 0;
}

type Node = ApplicationFormFragment;
type ApplicationPageProps = {
  application: Node;
  translationKeyPrefix: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
};

const getStep = (slug: string) => {
  switch (slug) {
    case "page1":
      return 0;
    case "page2":
      return 1;
    case "page3":
      return 2;
    case "preview":
      return 3;
    default:
      return 0;
  }
};

const getStepState = (completedStep: number, step: number) => {
  if (completedStep === step) {
    return StepState.completed;
  }
  if (completedStep > step) {
    return StepState.completed;
  }
  return StepState.disabled;
};

export function ApplicationPageWrapper({
  application,
  translationKeyPrefix,
  headContent,
  overrideText,
  children,
}: Readonly<ApplicationPageProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { asPath, push } = router;

  const pages = ["page1", "page2", "page3", "preview"] as const;

  const hideStepper =
    pages.filter((x) => router.asPath.match(`/${x}`)).length === 0;
  const completedStep = calculateCompletedStep(application);
  const steps = pages.map((x, i) => ({
    label: t(`application:navigation.${x}`),
    state: getStepState(completedStep, i),
  }));

  const handleStepClick = (i: number) => {
    if (i < 0 || i > 3) {
      return; // invalid step
    }
    const targetPageIndex = i + 1;
    if (
      targetPageIndex === 4
        ? asPath.endsWith("preview")
        : asPath.includes(`page${targetPageIndex}`)
    ) {
      return; // already on the page, so do nothing
    }
    if (targetPageIndex === 4) {
      push(`${getApplicationPath(application?.pk)}preview`);
    } else {
      push(`${getApplicationPath(application?.pk)}page${targetPageIndex}`);
    }
  };

  const title = t(`${translationKeyPrefix}.heading`);
  const subTitle =
    headContent || overrideText || t(`${translationKeyPrefix}.text`);

  const routes = [
    {
      slug: applicationsPrefix,
      title: t("breadcrumb:applications"),
    },
    {
      title: t("breadcrumb:application"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <div>
        <H1 $noMargin>{title}</H1>
        <p>{subTitle}</p>
      </div>
      {hideStepper ? null : (
        <StyledStepper
          language={i18n.language}
          steps={steps}
          selectedStep={getStep(asPath.split("/").pop() ?? "page1")}
          onStepClick={(_e, i) => handleStepClick(i)}
        />
      )}
      <InnerContainer>
        <>
          {/* TODO preview / view should not maybe display these notes */}
          <StyledNotesWhenApplying
            applicationRound={application?.applicationRound}
          />
          <ChildWrapper>{children}</ChildWrapper>
        </>
      </InnerContainer>
    </>
  );
}
