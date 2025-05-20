import React from "react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/const";
import { type ReadonlyDeep } from "common/src/helpers";
import { H2, HR } from "common/styled";
import { type ApplicationFormFragment } from "@gql/gql-types";
import { applicationsPrefix } from "@/modules/urls";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ApplicationHead } from "..";
import { ApplicationStepper } from ".";
import { NotesWhenApplying } from "../NotesWhenApplying";

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

const StyledH2 = styled(H2)`
  margin-bottom: var(--spacing-2-xs);
  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-m);
  }
`;

type ApplicationPageT = "page1" | "page2" | "page3" | "page4";

type ApplicationPageProps = {
  application: ReadonlyDeep<ApplicationFormFragment>;
  page: ApplicationPageT;
  children?: React.ReactNode;
};

/// Page wrapper for application funnel pages (steps 1, 2, 3, 4)
/// Includes general structure like breadcrumb and title
/// and specific funnel elements like stepper and notes
export function ApplicationFunnelWrapper({
  application,
  page,
  children,
}: Readonly<ApplicationPageProps>): JSX.Element {
  const { t } = useTranslation();
  const routes = [
    {
      slug: applicationsPrefix,
      title: t("breadcrumb:applications"),
    },
    {
      title: t("breadcrumb:application"),
    },
  ] as const;

  const { heading, subtitle } = getApplicationPageTitle(t, page);

  return (
    <>
      <Breadcrumb routes={routes} />
      <ApplicationHead status={application.status} title={heading} />
      <ApplicationStepper application={application} />
      {subtitle && <StyledH2 $marginTop="none">{subtitle}</StyledH2>}
      <HR />
      <InnerContainer>
        <>
          {/* TODO preview / view should not maybe display these notes */}
          <StyledNotesWhenApplying
            applicationRound={application.applicationRound}
          />
          <ChildWrapper>{children}</ChildWrapper>
        </>
      </InnerContainer>
    </>
  );
}

function getApplicationPageTitle(t: TFunction, page: ApplicationPageT) {
  const tr = getTranslationPrefix(page);

  const heading = t(`application:heading`);
  const subtitle = t(`${tr}.subHeading`);

  return {
    heading,
    subtitle,
  };
}

function getTranslationPrefix(page: ApplicationPageT) {
  switch (page) {
    case "page1":
      return "application:Page1";
    case "page2":
      return "application:Page2";
    case "page3":
      return "application:Page3";
    case "page4":
      return "application:preview";
  }
}
