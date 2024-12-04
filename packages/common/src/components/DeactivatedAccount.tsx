import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import IconButton from "./IconButton";
import { IconArrowRight } from "hds-react";
import { fontBold, H1 } from "../common/typography";
import { breakpoints } from "../common/style";
import Image from "next/image";

const IMAGE_WIDTH = "418";
const IMAGE_HEIGHT = "350";

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const Img = styled(Image)`
  object-fit: contain;
  width: auto;
  height: auto;
  margin: 0 auto;
  @media (min-width: ${breakpoints.l}) {
    flex-grow: 1;
    display: flex;
    max-width: ${`${IMAGE_WIDTH}px`};
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  justify-content: center;
  @media (min-width: ${breakpoints.m}) {
    order: -1;
  }
`;

const Body = styled.p`
  margin: 0;
`;

const Email = styled.a`
  ${fontBold}
`;

const constructFeedbackUrl = (
  feedbackUrl: string,
  i18n: { language: string }
) => {
  try {
    const url = new URL(feedbackUrl);
    url.searchParams.set("lang", i18n.language);
    return url.toString();
  } catch (e) {
    return null;
  }
};

const DeactivatedAccount = ({
  feedbackUrl,
  imgSrc,
}: {
  feedbackUrl: string;
  imgSrc: string;
}) => {
  const { t, i18n } = useTranslation();
  return (
    <ErrorContainer>
      <Img
        src={imgSrc}
        alt={t("errors:deactivatedAccount.heading")}
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
        aria-hidden="true"
      />
      <TextContent>
        <H1>{t("errors:deactivatedAccount.heading")}</H1>
        <Body>
          {`${t("errors:deactivatedAccount.subHeadingA")} `}
          <Email href={`mailto:${t("errors:deactivatedAccount.email")}`}>
            {t("errors:deactivatedAccount.email")}
          </Email>
          {` ${t("errors:deactivatedAccount.subHeadingB")}`}
        </Body>
        <IconButton
          label={t("errors:deactivatedAccount.button")}
          icon={<IconArrowRight aria-hidden="true" />}
          href={constructFeedbackUrl(feedbackUrl, i18n) ?? feedbackUrl}
          rel="noopener noreferrer"
        />
      </TextContent>
    </ErrorContainer>
  );
};

export default DeactivatedAccount;
