import React from "react";
import { Koros } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Breadcrumb from "../common/Breadcrumb";

type HeadProps = {
  heading: string;
  breadCrumbText?: string;
  children?: React.ReactNode;
};

const Heading = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Container = styled.div`
  background-color: var(--tilavaraus-header-background-color);
`;

const Content = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto;
  font-size: var(--fontsize-heading-m);
  font-weight: 500;
`;

const StyledKoros = styled(Koros)`
  background-color: var(--tilavaraus-gray);
  fill: var(--tilavaraus-header-background-color);
`;

const Head = ({
  children,
  heading,
  breadCrumbText,
}: HeadProps): JSX.Element => {
  const { t } = useTranslation();
  return (
    <Container>
      <Content>
        <Breadcrumb
          current={{
            label: `${t("breadcrumb.application")} - ${breadCrumbText}`,
            linkTo: "#",
          }}
        />
        <Heading>{heading}</Heading>
        {children || null}
      </Content>
      <StyledKoros flipHorizontal className="koros" type="storm" />
    </Container>
  );
};

export default Head;
