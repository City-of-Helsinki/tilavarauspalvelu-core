import React from "react";
import { Stepper as HDSStepper, StepState } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { type ApplicationFormFragment } from "@/gql/gql-types";
import { type ReadonlyDeep } from "common/src/helpers";
import { validateApplication } from "./form";
import { isSent } from "@/modules/util";
import { getApplicationPath } from "@/modules/urls";
import styled from "styled-components";
import { breakpoints } from "common/src/const";

// Ordered list of steps by page slug
export const PAGES_WITH_STEPPER = ["page1", "page2", "page3", "page4"] as const;

function getStep(slug: string) {
  const index = PAGES_WITH_STEPPER.findIndex((x) => x === slug);
  if (index === -1) {
    return 0;
  }
  return index;
}

function calculateAvailableStep(
  application: ReadonlyDeep<ApplicationFormFragment>,
  step: number
) {
  if (isSent(application?.status)) {
    return StepState.completed;
  }
  const isValid = validateApplication(application);
  if (isValid.valid) {
    // Last step depends only on the application being Sent (any saves will set it back to Draft)
    if (step === PAGES_WITH_STEPPER.length - 1) {
      return StepState.available;
    }
    return StepState.completed;
  }
  if (step === isValid.page - 1) {
    return StepState.available;
  } else if (step < isValid.page - 1) {
    return StepState.completed;
  }
  return StepState.disabled;
}

const StyledStepper = styled(HDSStepper)`
  p {
    /* HDS stepper line breaks aggressively while adding extra white space */
    white-space: nowrap;
    @media (max-width: ${breakpoints.m}) {
      white-space: unset;
    }
  }
`;

type StepperProps = {
  application: ReadonlyDeep<ApplicationFormFragment>;
};
export function ApplicationStepper({
  application,
}: Readonly<StepperProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { pathname, push } = router;
  const steps = PAGES_WITH_STEPPER.map((x, i) => ({
    label: t(`application:navigation.${x}`),
    state: calculateAvailableStep(application, i),
  }));

  const handleStepClick = (i: number) => {
    const targetPage = PAGES_WITH_STEPPER[i];
    if (targetPage == null) {
      return;
    }
    if (pathname.endsWith(targetPage)) {
      return; // already on the page, so do nothing
    }

    push(getApplicationPath(application?.pk, targetPage));
  };

  const selectedStep = getStep(pathname.split("/").pop() ?? "page1");

  return (
    <StyledStepper
      language={i18n.language}
      steps={steps}
      selectedStep={selectedStep}
      onStepClick={(_, step) => handleStepClick(step)}
    />
  );
}
