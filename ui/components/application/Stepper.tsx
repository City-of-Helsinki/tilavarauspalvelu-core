import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconCheck } from "hds-react";
import { useRouter } from "next/router";
import { Application } from "../../modules/types";
import { fontBold } from "../../modules/style/typography";

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

type Props = {
  application?: Application;
};

const checkReady = (application: Application, index: number): boolean => {
  switch (index) {
    case 0: {
      return (
        application.applicationEvents.length > 0 &&
        application.applicationEvents[0].id > 0
      );
    }
    case 1: {
      return (
        application.applicationEvents?.[0]?.applicationEventSchedules.length > 0
      );
    }
    case 2: {
      return application.applicantType !== null;
    }

    default:
      return false;
  }
};

const Stepper = ({ application }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { asPath, push } = useRouter();
  let maxPage = -1;
  if (application) {
    maxPage = 0;
    if (
      application.applicationEvents.length > 0 &&
      application.applicationEvents[0].id
    ) {
      maxPage = 1;
    }
    if (
      application.applicationEvents?.[0]?.applicationEventSchedules.length > 0
    ) {
      maxPage = 2;
    }
    if (application.applicantType != null) {
      maxPage = 3;
    }
  }
  const pages = ["page1", "page2", "page3", "preview"];

  return (
    <Container aria-label={t("common:applicationNavigationName")}>
      <>
        {pages.map((page, index) => {
          const isCurrent = asPath.indexOf(page) !== -1;
          const isDisabled = index > maxPage;
          const isReady = checkReady(application, index);
          return (
            <StepContainer $disabled={index >= maxPage} key={page}>
              <Step
                key={page}
                onClick={() => {
                  if (!isCurrent) {
                    push(`/application/${application.id}/${page}`);
                  }
                }}
                $clickable={!isDisabled && !isCurrent}
                disabled={isDisabled || isCurrent}
              >
                <Number
                  $disabled={isDisabled}
                  $current={isCurrent}
                  aria-hidden="true"
                >
                  {isReady ? <IconCheck /> : index + 1}
                </Number>
                <Name $current={isCurrent} $disabled={isDisabled}>
                  {t(`application:navigation.${page}`)}
                </Name>
              </Step>
            </StepContainer>
          );
        })}
      </>
    </Container>
  );
};
export default Stepper;
