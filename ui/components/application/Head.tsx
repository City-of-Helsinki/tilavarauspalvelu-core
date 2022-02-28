import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Breadcrumb from "../common/Breadcrumb";
import KorosDefault from "../common/KorosDefault";

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
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-layout-xl);
  max-width: var(--container-width-xl);
  margin: 0 auto;
  font-size: var(--fontsize-heading-m);
  font-weight: 500;
`;

const StyledKoros = styled(KorosDefault)`
  margin-top: var(--spacing-layout-m);
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
            label: `${t("breadcrumb:application")} - ${breadCrumbText}`,
            linkTo: "#",
          }}
        />
        <Heading>{heading}</Heading>
        {children || null}
      </Content>
      <StyledKoros from="white" to="var(--tilavaraus-gray)" />
    </Container>
  );
};

export default Head;
