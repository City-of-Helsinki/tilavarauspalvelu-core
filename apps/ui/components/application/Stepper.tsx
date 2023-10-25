import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconCheck } from "hds-react";
import { useRouter } from "next/router";
import { fontBold } from "common/src/common/typography";
import type {
  ApplicationEventNode,
  ApplicationsApplicationApplicantTypeChoices,
} from "common/types/gql-types";

const StepContainer = styled.div<{ $disabled: boolean }>`
  ${({ $disabled }) =>
    $disabled
      ? `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='70' width='100'%3E%3Cg fill='none' stroke='rgb(204,204,204)' stroke-width='3'%3E%3Cpath  d='M24 0 l0 70' /%3E%3C/g%3E%3C/svg%3E");`
      : `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='70' width='100'%3E%3Cg fill='none' stroke='rgb(0,0,191)' stroke-width='3'%3E%3Cpath  d='M24 0 l0 70' /%3E%3C/g%3E%3C/svg%3E");`}

  &:last-of-type {
    background-image: none;
  }

  background-repeat: repeat-y;
  height: 70px;
  padding: 0;
  :last-of-type {
    height: auto;
  }
`;

const Container = styled.nav`
  margin: var(--spacing-m) 0;
  font-size: var(--fontsize-body-l);
  padding: 0;
  list-style-type: none;
`;

const Number = styled.div<{ $current: boolean; $disabled: boolean }>`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  margin-right: var(--spacing-xs);
  text-align: center;
  align-self: flex-end;
  border: 2px solid var(--color-bus);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-black-40);
  ${({ $disabled }) =>
    $disabled
      ? "border-color: var(--color-black-20);"
      : `color: var(--color-bus);`}
  ${({ $disabled, $current }) =>
    !$disabled && !$current
      ? "background: var(--color-bus); color: white;"
      : `background: var(--color-white);`}
`;

const Step = styled.button<{ $clickable: boolean }>`
  border: none;
  width: 100%;
  display: flex;
  line-height: 1;
  align-content: flex-start;
  align-items: center;
  background: transparent;
  padding-top: 0;

  ${({ $clickable }) => ($clickable ? "cursor: pointer;" : "cursor: normal;")}
`;

const Name = styled.div<{ $disabled: boolean; $current: boolean }>`
  ${({ $current }) =>
    $current
      ? `
      color: var(--color-black-90);
      ${fontBold};
    `
      : `color: var(--color-bus);`}
  ${({ $disabled }) => ($disabled ? `color: var(--color-black-40);` : ``)}
`;

// TODO only pass the props that are needed (not the whole application)
type Props = {
  applicationPk: number;
  applicationEvents: ApplicationEventNode[];
  applicantType: ApplicationsApplicationApplicantTypeChoices;
};

const checkReady = ({
  applicationEvents,
  applicantType,
  step,
}: {
  applicationEvents: ApplicationEventNode[];
  applicantType: ApplicationsApplicationApplicantTypeChoices;
  step: number;
}): boolean => {
  switch (step) {
    case 0: {
      return (
        applicationEvents.length > 0 &&
        applicationEvents[0].pk != null &&
        applicationEvents[0].pk > 0
      );
    }
    case 1: {
      return (
        applicationEvents[0]?.applicationEventSchedules != null &&
        applicationEvents[0]?.applicationEventSchedules.length > 0
      );
    }
    case 2: {
      return applicantType !== null;
    }
    default:
      return false;
  }
};

const getMaxPage = ({
  applicationEvents,
  applicantType,
}: {
  applicationEvents: ApplicationEventNode[];
  applicantType: ApplicationsApplicationApplicantTypeChoices;
}) => {
  let maxPage = 0;
  if (applicationEvents.length > 0 && applicationEvents[0].id) {
    maxPage = 1;
  }
  if (
    applicationEvents[0].applicationEventSchedules != null &&
    applicationEvents[0].applicationEventSchedules.length > 0
  ) {
    maxPage = 2;
  }
  if (applicantType != null) {
    maxPage = 3;
  }
  return maxPage;
};

const Stepper = ({
  applicationPk,
  applicationEvents,
  applicantType,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { asPath, push } = useRouter();
  const maxPage = getMaxPage({ applicationEvents, applicantType });
  const pages = ["page1", "page2", "page3", "preview"];

  const handleStepClick = (page: string) => {
    const isCurrent = asPath.indexOf(page) !== -1;
    if (!isCurrent) {
      push(`/application/${applicationPk}/${page}`);
    }
  };

  return (
    <Container aria-label={t("common:applicationNavigationName")}>
      {pages.map((page, step) => {
        const isCurrent = asPath.indexOf(page) !== -1;
        const isDisabled = step > maxPage;
        const isReady = checkReady({
          applicationEvents,
          applicantType,
          step,
        });
        return (
          <StepContainer $disabled={step >= maxPage} key={page}>
            <Step
              key={page}
              onClick={() => handleStepClick(page)}
              $clickable={!isDisabled && !isCurrent}
              disabled={isDisabled || isCurrent}
            >
              <Number
                $disabled={isDisabled}
                $current={isCurrent}
                aria-hidden="true"
              >
                {isReady ? <IconCheck aria-hidden="true" /> : step + 1}
              </Number>
              <Name $current={isCurrent} $disabled={isDisabled}>
                {t(`application:navigation.${page}`)}
              </Name>
            </Step>
          </StepContainer>
        );
      })}
    </Container>
  );
};

export default Stepper;
