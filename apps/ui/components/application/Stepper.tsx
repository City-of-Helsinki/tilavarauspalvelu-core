import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconCheck } from "hds-react";
import { useRouter } from "next/router";
import { fontBold } from "common/src/common/typography";
import { constructUrl } from "common/src/helpers";

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

export type StepperProps = {
  steps: {
    slug: string;
    step: number;
  }[];
  completedStep: number;
  basePath: string;
  isFormDirty: boolean;
};

const Stepper = ({
  steps,
  completedStep,
  basePath,
  isFormDirty,
}: StepperProps): JSX.Element => {
  const { t } = useTranslation();
  const { asPath, push } = useRouter();
  const pages = steps.map((step) => step.slug);

  const handleStepClick = (page: string) => {
    const isCurrent = asPath.includes(page);
    if (isCurrent) {
      return;
    }
    if (isFormDirty) {
      // eslint-disable-next-line no-alert -- TODO replace with modal
      const confirm = window.confirm(t("application:confirmFormNavigation"));
      if (!confirm) {
        return;
      }
    }
    push(constructUrl(basePath, page));
  };

  return (
    <Container aria-label={t("common:applicationNavigationName")}>
      {pages.map((page, step) => {
        const isCurrent = asPath.includes(page);
        const isDisabled = step > completedStep;
        const isReady = step < completedStep;
        return (
          <StepContainer $disabled={step >= completedStep} key={page}>
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
