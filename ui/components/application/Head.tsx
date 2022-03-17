import { trim } from "lodash";
import { useRouter } from "next/router";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Breadcrumb from "../common/Breadcrumb";
import KorosDefault from "../common/KorosDefault";

type HeadProps = {
  heading: string;
  breadCrumbText?: string;
  children?: React.ReactNode;
  noKoros?: boolean;
};

const Heading = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const Container = styled.div<{ $white: boolean }>`
  background-color: ${({ $white }) =>
    $white ? "var(--color-white)" : "var(--tilavaraus-hero-background-color)"};
  color: ${({ $white }) =>
    $white ? "var(--color-black)" : "var(--color-white)"};
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
  noKoros = false,
}: HeadProps): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Container $white={router.route === "/intro"}>
      <Breadcrumb
        root={{
          label: "home",
          linkTo: "/recurring",
        }}
        current={{
          label: trim(
            `${t("breadcrumb:application")} - ${breadCrumbText}`,
            " - "
          ),
          linkTo: "#",
        }}
      />
      <Content>
        <Heading>{heading}</Heading>
        {children || null}
      </Content>
      {noKoros ? null : (
        <StyledKoros
          from="var(--tilavaraus-hero-background-color)"
          to="var(--color-white)"
        />
      )}
    </Container>
  );
};

export default Head;
