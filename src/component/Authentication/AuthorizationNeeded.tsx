import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { NarrowContainer } from "../../styles/layout";
import EmptyContent from "../EmptyContent";
import PageWrapper from "../PageWrapper";
import { H1 } from "../../styles/typography";

const Wrapper = styled(NarrowContainer)`
  margin-top: var(--spacing-4-xl);
`;

function AuthorizationNeeded(): JSX.Element {
  const { t } = useTranslation();

  return (
    <BrowserRouter>
      <PageWrapper>
        <EmptyContent>
          <Wrapper>
            <H1>{t("errors.authorizationNeeded")}</H1>
            <p style={{ marginBottom: "var(--spacing-xl)" }}>
              {t("common.noAuthorization")}
            </p>
          </Wrapper>
        </EmptyContent>
      </PageWrapper>
    </BrowserRouter>
  );
}

export default AuthorizationNeeded;
