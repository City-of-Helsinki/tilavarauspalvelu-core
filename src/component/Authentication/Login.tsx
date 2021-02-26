import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { Button } from "hds-react";
import { NarrowContainer } from "../../styles/layout";
import EmptyContent from "../EmptyContent";
import PageWrapper from "../PageWrapper";
import { H1 } from "../../styles/typography";

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
            <H1>{t("errors.loginNeeded")}</H1>
            <p style={{ marginBottom: "var(--spacing-xl)" }}>
              {t("common.loginWithTunnistamo")}
            </p>
            <Button
              type="button"
              onClick={() => {
                window.history.replaceState(
                  null,
                  t("common.applicationName"),
                  "/"
                );
                window.location.reload();
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
