import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconCheck } from "hds-react";
import { useRouter } from "next/router";
import { Application } from "../../modules/types";

const StepContainer = styled.div<{ $disabled: boolean }>`
  ${({ $disabled }) =>
    $disabled
      ? `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='80' width='100'%3E%3Cg fill='none' stroke='rgb(120,120,120)' stroke-width='3'%3E%3Cpath  d='M24 0 l0 80' /%3E%3C/g%3E%3C/svg%3E");`
      : `background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='80' width='100'%3E%3Cg fill='none' stroke='rgb(0,0,191)' stroke-width='3'%3E%3Cpath  d='M24 0 l0 80' /%3E%3C/g%3E%3C/svg%3E");`}

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
  font-family: var(--font-bold);
`;
const Number = styled.div<{ $current: boolean; $disabled: boolean }>`
  border-radius: 50%;
  width: 32px;
  height: 32px;
  margin-right: 1em;
  text-align: center;
  align-self: flex-end;
  border: 2px solid var(--color-bus);
  outline: 2px solid;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-black-40);
  ${({ $current }) =>
    $current
      ? "outline-color: var(--color-coat-of-arms);"
      : "outline-color: var(--tilavaraus-gray);"}

  ${({ $disabled }) =>
    $disabled
      ? "border-color: var(--color-black-20);"
      : `
      color: var(--color-bus);
      `}

${({ $disabled, $current }) =>
    !$disabled && !$current
      ? "background: var(--color-bus); color: white;"
      : ``}
`;

const Step = styled.button<{ $clickable: boolean }>`
  border: none;
  width: 100%;
  display: flex;
  line-height: 1;
  align-content: flex-start;
  align-items: center;
  background: var(--tilavaraus-gray);

  ${({ $clickable }) => ($clickable ? "cursor: pointer;" : "cursor: normal;")}
`;

const Name = styled.div<{ $disabled: boolean; $current: boolean }>`
  text-decoration: underline;

  ${({ $current }) =>
    $current
      ? `text-decoration: none;
      color: var(--color-black-90);`
      : `color: var(--color-bus);`}
  ${({ $disabled }) =>
    $disabled
      ? `      text-decoration: none;
      color: var(--color-black-40);`
      : ``}
`;

type Props = {
  application?: Application;
};

const Stepper = ({ application }: Props): JSX.Element => {
  const { t } = useTranslation();
  const { asPath, push } = useRouter();
  let maxPage = -1;
  if (application) {
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
          const isReady = !isDisabled && !isCurrent;
          return (
            <StepContainer $disabled={maxPage <= index} key={page}>
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
                <Number $disabled={isDisabled} $current={isCurrent}>
                  {isReady ? <IconCheck /> : index + 1}
                </Number>
                <Name $current={isCurrent} $disabled={isDisabled}>
                  {index + 1}. {t(`application:navigation.${page}`)}
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
