import { Button, IconAngleRight } from "hds-react";
import { useRouter } from "next/router";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { breakpoint } from "../../modules/style";
import { applicationsUrl } from "../../modules/util";
import Container from "../common/Container";
import Head from "./Head";

type Props = {
  breadCrumbText: string;
};

const Paragraph = styled.p`
  white-space: pre-wrap;
  margin-bottom: var(--spacing-xl);

  @media (min-width: ${breakpoint.m}) {
    max-width: 60%;
  }
`;

const StyledButton = styled(Button)`
  margin-bottom: var(--spacing-layout-l);
`;

const Sent = ({ breadCrumbText }: Props): JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <Head
        heading={t("application:sent.heading")}
        breadCrumbText={breadCrumbText}
      >
        <p>{t("application:sent.subHeading")}</p>
      </Head>
      <Container main>
        <Paragraph>{t("application:sent.body")}</Paragraph>
        <StyledButton
          onClick={() => router.push(applicationsUrl)}
          iconRight={<IconAngleRight />}
          size="small"
        >
          {t("navigation:Item.applications")}
        </StyledButton>
      </Container>
    </>
  );
};

export default Sent;
