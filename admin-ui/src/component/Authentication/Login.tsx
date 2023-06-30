import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { Button } from "hds-react";
import { H1 } from "common/src/common/typography";
import { NarrowContainer } from "../../styles/layout";
import EmptyContent from "../EmptyContent";
import PageWrapper from "../PageWrapper";

const Wrapper = styled(NarrowContainer)`
  margin-top: var(--spacing-4-xl);
`;

function Login(): JSX.Element {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <PageWrapper>
        <EmptyContent>
          <Wrapper>
            <H1 $legacy>{t("errors.loginNeeded")}</H1>
            <p style={{ marginBottom: "var(--spacing-xl)" }}>
              {t("common.loginWithTunnistamo")}
            </p>
            <Button
              type="button"
              onClick={() => {
                console.log("SHOULD LOGIN");
                // login();
              }}
            >
              {t("Navigation.login")}
            </Button>
          </Wrapper>
        </EmptyContent>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default Login;
