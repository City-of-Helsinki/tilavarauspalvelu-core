import React from "react";
import { Stepper as HDSStepper, StepState } from "hds-react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { ApplicationFormFragment } from "@/gql/gql-types";
import { ReadonlyDeep } from "common/src/helpers";
import { validateApplication } from "./form";
import { isSent } from "./module";
import { getApplicationPath } from "@/modules/urls";

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

type StepperProps = {
  application: ReadonlyDeep<ApplicationFormFragment>;
};
export function Stepper({ application }: Readonly<StepperProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { asPath, push } = router;

  // const completedStep = calculateCompletedStep(application);
  const steps = PAGES_WITH_STEPPER.map((x, i) => ({
    label: t(`application:navigation.${x}`),
    state: calculateAvailableStep(application, i),
  }));

  const handleStepClick = (i: number) => {
    if (i < 0 || i > 3) {
      return; // invalid step
    }
    const targetPageIndex = i + 1;
    // TODO refactor this to not construct the path manually
    // use a list of paths for the steps etc.
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

  return (
    <HDSStepper
      language={i18n.language}
      steps={steps}
      selectedStep={getStep(asPath.split("/").pop() ?? "page1")}
      onStepClick={(_, step) => handleStepClick(step)}
    />
  );
}
