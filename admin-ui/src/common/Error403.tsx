import { Button, Link } from "hds-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { useAuthState } from "../context/AuthStateContext";
import { localLogout } from "./auth/util";
import { publicUrl } from "./const";

const Wrapper = styled.div`
  margin: var(--spacing-layout-s);
  word-break: break-word;
  gap: var(--spacing-layout-m);
  h1 {
    margin-bottom: 0;
    font-size: 2.5em;
  }

  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));

  @media (min-width: ${breakpoints.l}) {
    margin: var(--spacing-layout-m);
    h1 {
      font-size: 4em;
    }
  }
`;

const Image = styled.img`
  width: 100%;
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-s);
`;

const LogoutSection = (): JSX.Element => {
  const { authState } = useAuthState();
  const navigate = useNavigate();

  const { t } = useTranslation();

  const handleClick = () => {
    if (authState.logout) {
      authState.logout();
    }
    localLogout();
    navigate("/");
  };

  return (
    <>
      <Link external href="/">
        {t("errorPages.accessForbidden.linkToVaraamo")}
      </Link>
      <Link
        external
        href="https://app.helmet-kirjasto.fi/forms/?site=varaamopalaute&ref=https://tilavaraus.hel.fi/"
      >
        {t("errorPages.accessForbidden.giveFeedback")}
      </Link>
      {authState.state !== "NotAutenticated" && (
        <ButtonContainer>
          <Button onClick={handleClick}>{t("Navigation.logout")}</Button>
        </ButtonContainer>
      )}
    </>
  );
};

const Error403 = ({
  showLogoutSection,
}: {
  showLogoutSection?: boolean;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <Wrapper>
      <div>
        <H1 $legacy>403 - {t("errorPages.accessForbidden.title")}</H1>
        <p>{t("errorPages.accessForbidden.description")}</p>
        {showLogoutSection && <LogoutSection />}
      </div>
      <Image src={`${publicUrl}/403.png`} />
    </Wrapper>
  );
};

export default Error403;
