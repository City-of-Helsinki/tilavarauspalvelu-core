import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import {
  ApplicantTypeChoice,
  type ApplicationQuery,
  ApplicationStatusChoice,
} from "@gql/gql-types";
import { useRouter } from "next/router";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { applicationsPrefix, getApplicationPath } from "@/modules/urls";
import { Breadcrumb } from "../common/Breadcrumb";
import { fontBold, H1 } from "common";
import { Stepper as HDSStepper, StepState } from "hds-react";

const InnerContainer = styled.div<{ $hideStepper: boolean }>`
  display: grid;
  gap: 1em;
  grid-template-rows: repeat(3, auto);

  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: ${({ $hideStepper }) =>
      $hideStepper ? `1fr;` : `23em 1fr;`};
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
  children,
}: ApplicationPageProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { asPath, push } = router;

  const pages = ["page1", "page2", "page3", "preview"] as const;

  const hideStepper =
    pages.filter((x) => router.asPath.match(`/${x}`)).length === 0;

  const steps = pages.map((x, i) => ({
    label: t(`application:navigation.${x}`),
    state:
      calculateCompletedStep(application) === i
        ? StepState.available
        : calculateCompletedStep(application) < i
          ? StepState.disabled
          : StepState.completed,
  }));

  const handleStepClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    const s =
      Number(
        target.getAttribute("data-testid")?.replace("hds-stepper-step-", "")
      ) + 1;
    if (s === 4 ? asPath.endsWith("preview") : asPath.includes(`page${s}`)) {
      return; // already on the page, so do nothing
    }
    if (s === 4) {
      push(`${getApplicationPath(application?.pk)}preview`);
    } else {
      push(`${getApplicationPath(application?.pk)}page${s}`);
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
  const selectedStep = asPath.charAt(asPath.length - 1);

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
          selectedStep={selectedStep === "w" ? 3 : Number(selectedStep) - 1} //calculateCompletedStep(application)}
          onStepClick={handleStepClick}
        />
      )}
      <InnerContainer $hideStepper={hideStepper}>
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
