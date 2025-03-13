import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { type ApplicationFormFragment } from "@gql/gql-types";
import NotesWhenApplying from "@/components/application/NotesWhenApplying";
import { applicationsPrefix } from "@/modules/urls";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { ApplicationHead } from "@/components/recurring/ApplicationHead";
import { ReadonlyDeep } from "common/src/helpers";
import { ApplicationStepper } from "./ApplicationStepper";

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

type ApplicationPageProps = {
  application: ReadonlyDeep<ApplicationFormFragment>;
  translationKeyPrefix:
    | "application:Page1"
    | "application:Page2"
    | "application:Page3"
    | "application:preview";
  subtitle?: string;
  children?: React.ReactNode;
};

export function ApplicationPageWrapper({
  application,
  translationKeyPrefix,
  subtitle,
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

  const title = t(`${translationKeyPrefix}.heading`);
  const subtitle2 = subtitle || t(`${translationKeyPrefix}.text`);

  return (
    <>
      <Breadcrumb routes={routes} />
      <ApplicationHead
        status={application.status}
        title={title}
        subTitle={subtitle2}
      />
      <ApplicationStepper application={application} />
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
