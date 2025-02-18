import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { type ApplicationFormFragment } from "@gql/gql-types";
import { useRouter } from "next/router";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { applicationsPrefix, getApplicationPath } from "@/modules/urls";
import { Breadcrumb } from "../common/Breadcrumb";
import { fontBold, H1 } from "common";
import { Stepper as HDSStepper, StepState } from "hds-react";
import { validateApplication } from "./form";
import { isSent } from "./module";

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

function calculateCompletedStep(
  application: ApplicationFormFragment
): -1 | 0 | 1 | 2 | 3 {
  const isValid = validateApplication(application);

  if (isSent(application?.status)) {
    return 3;
  }
  if (isValid.valid) {
    return 2;
  }

  const { page } = isValid;
  if (page === 1) {
    return 0;
  } else if (page === 2) {
    return 1;
  } else if (page === 3) {
    return 2;
  }
  return -1;
}

function getStepState(completedStep: number, step: number) {
  if (step - 1 === completedStep) {
    return StepState.available;
  }
  if (completedStep >= step) {
    return StepState.completed;
  }
  return StepState.disabled;
}

type ApplicationPageProps = {
  application: ApplicationFormFragment;
  translationKeyPrefix: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
};

// Ordered list of steps by page slug
export const PAGES_WITH_STEPPER = [
  "page1",
  "page2",
  "page3",
  "preview",
] as const;

function getStep(slug: string) {
  const index = PAGES_WITH_STEPPER.findIndex((x) => x === slug);
  if (index === -1) {
    return 0;
  }
  return index;
}

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

  const hideStepper =
    PAGES_WITH_STEPPER.filter((x) => router.asPath.match(`/${x}`)).length === 0;
  const completedStep = calculateCompletedStep(application);
  const steps = PAGES_WITH_STEPPER.map((x, i) => ({
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
