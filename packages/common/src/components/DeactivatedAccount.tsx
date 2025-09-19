import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontBold, H1 } from "../../styled";
import { ErrorContainer } from "./ErrorContainer";

const Body = styled.p`
  margin: 0;
`;

const Email = styled.a`
  ${fontBold}
`;

export const DeactivatedAccount = ({ feedbackUrl, imgSrc }: { feedbackUrl: string; imgSrc: string }) => {
  const { t } = useTranslation();
  return (
    <ErrorContainer feedbackUrl={feedbackUrl} imgSrc={imgSrc}>
      <H1>{t("errors:deactivatedAccount.heading")}</H1>
      <Body>
        {`${t("errors:deactivatedAccount.subHeadingA")} `}
        <Email href={`mailto:${t("errors:deactivatedAccount.email")}`}>{t("errors:deactivatedAccount.email")}</Email>
        {` ${t("errors:deactivatedAccount.subHeadingB")}`}
      </Body>
    </ErrorContainer>
  );
};
