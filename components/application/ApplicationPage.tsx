import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import { Application } from "../../modules/types";
import Container from "../common/Container";
import Head from "./Head";
import Stepper from "./Stepper";

type ApplicationPageProps = {
  application?: Application;
  translationKeyPrefix: string;
  breadCrumbText?: string;
  overrideText?: string;
  children?: React.ReactNode;
  headContent?: React.ReactNode;
};

const InnerContainer = styled.div`
  display: grid;
  gap: 1em;
  grid-template-columns: 18em 1fr;

  @media (max-width: ${breakpoint.l}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;

const Main = styled.div`
  margin-top: var(--spacing-s);

  @media (max-width: ${breakpoint.s}) {
    width: calc (100vw - 3 * var(--spacing-xs));
  }
`;

const ApplicationPage = ({
  application,
  translationKeyPrefix,
  breadCrumbText,
  headContent,
  overrideText,
  children,
}: ApplicationPageProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <>
      <Head
        heading={t(`${translationKeyPrefix}.heading`)}
        breadCrumbText={breadCrumbText || ""}
      >
        {headContent || overrideText || t(`${translationKeyPrefix}.text`)}
      </Head>
      <Container main>
        <InnerContainer>
          <Stepper application={application} />
          <Main>{children}</Main>
        </InnerContainer>
      </Container>
    </>
  );
};

export default ApplicationPage;
