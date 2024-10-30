import { Button, Link } from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { signOut } from "common/src/browserHelpers";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { useSession } from "@/hooks/auth";
import { PUBLIC_URL } from "./const";
import { env } from "@/env.mjs";
import { ButtonContainer, Flex } from "@/styles/layout";

const Wrapper = styled.div`
  padding: var(--spacing-layout-s);
  word-break: break-word;
  gap: var(--spacing-layout-m);
  h1 {
    margin-bottom: 0;
    font-size: 2.5em;
  }
  p {
    margin-bottom: var(--spacing-layout-m);
  }

  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: minmax(400px, 600px) 400px;
    margin: 0 auto;
    h1 {
      font-size: 4em;
    }
  }
`;

const Image = styled.img`
  width: 100%;
`;

const LogoutSection = ({
  apiBaseUrl,
  feedbackUrl,
}: {
  apiBaseUrl: string;
  feedbackUrl: string;
}): JSX.Element => {
  const { isAuthenticated } = useSession();

  const { t } = useTranslation();

  return (
    <Flex>
      <Link external href="/">
        {t("errorPages.linkToVaraamo")}
      </Link>
      <Link external href={feedbackUrl}>
        {t("errorPages.giveFeedback")}
      </Link>
      {isAuthenticated && (
        <ButtonContainer>
          <Button onClick={() => signOut(apiBaseUrl, env.NEXT_PUBLIC_BASE_URL)}>
            {t("Navigation.logout")}
          </Button>
        </ButtonContainer>
      )}
    </Flex>
  );
};

const Error403 = ({
  apiBaseUrl,
  feedbackUrl,
}: {
  apiBaseUrl: string;
  feedbackUrl: string;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <div>
        <H1 $legacy>403 - {t("errorPages.accessForbidden.title")}</H1>
        <p>{t("errorPages.accessForbidden.description")}</p>
        <LogoutSection apiBaseUrl={apiBaseUrl} feedbackUrl={feedbackUrl} />
      </div>
      <Image src={`${PUBLIC_URL}/403.png`} />
    </Wrapper>
  );
};

export default Error403;
