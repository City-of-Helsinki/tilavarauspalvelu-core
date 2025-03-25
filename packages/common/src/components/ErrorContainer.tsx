import styled from "styled-components";
import { breakpoints } from "../common/style";
import Image from "next/image";
import { TFunction, useTranslation } from "next-i18next";
import { H1 } from "../common/typography";
import IconButton from "./IconButton";
import { IconArrowRight } from "hds-react";
import React from "react";
import { Flex } from "../../styles/util";

const IMAGE_WIDTH = "418";
const IMAGE_HEIGHT = "350";

const HAS_SECOND_PARAGRAPH = [403];
const INCLUDE_FRONTPAGE_LINK = [403, 404];
const HAS_ERROR_IMAGE = [403, 404, 503];
const BREAKPOINT = breakpoints.m;

type ErrorPageProps = {
  statusCode?: number;
  imgSrc?: string;
  imgAlt?: string;
  feedbackUrl?: string | null;
  children?: React.ReactNode;
};

const ErrorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  flex-grow: 1;
  @media (min-width: ${BREAKPOINT}) {
    flex-direction: row;
  }
`;

const Img = styled(Image)`
  object-fit: contain;
  margin: 0 auto;
  width: 80%;
  max-width: ${`${IMAGE_WIDTH}px`};
  height: auto;
  @media (min-width: ${BREAKPOINT}) {
    flex-grow: 1;
    display: flex;
    max-width: ${`${IMAGE_WIDTH}px`};
    width: auto;
  }
`;

const TextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-l);
  justify-content: center;
  @media (min-width: ${BREAKPOINT}) {
    order: -1;
    flex-grow: 1;
    gap: var(--spacing-xl);
  }
`;

const Body = styled.p`
  margin: 0;
`;

const constructFeedbackUrl = (
  i18n: { language: string },
  feedbackUrl?: string | null
) => {
  if (!feedbackUrl) {
    return null;
  }
  try {
    const url = new URL(feedbackUrl);
    url.searchParams.set("lang", i18n.language);
    return url.toString();
  } catch (_) {
    return null;
  }
};

function statusCodeText({
  statusCode,
  t,
}: {
  statusCode?: number;
  t: TFunction;
}) {
  return (
    <>
      <H1>{t(`${statusCode}.heading`)}</H1>
      <Body>{t(`${statusCode}.body`)}</Body>
      {HAS_SECOND_PARAGRAPH.includes(statusCode ?? 0) && (
        <Body>{t(`${statusCode}.body2`)}</Body>
      )}
    </>
  );
}

const ErrorContainer = ({
  statusCode,
  feedbackUrl,
  imgSrc = "/images/general-error.png",
  imgAlt,
  children,
}: ErrorPageProps) => {
  const { t, i18n } = useTranslation("errors");

  return (
    <ErrorWrapper>
      <Img
        src={
          HAS_ERROR_IMAGE.includes(statusCode ?? 0)
            ? `/images/${statusCode}-error.png`
            : imgSrc
        }
        alt={
          (imgAlt ?? statusCode)
            ? t(`${statusCode}.heading`)
            : t("general.heading")
        }
        width={IMAGE_WIDTH}
        height={IMAGE_HEIGHT}
        aria-hidden="true"
      />
      <TextContent>
        {children || statusCodeText({ statusCode, t })}
        <Flex $direction={"column"} $gap="xs">
          <IconButton
            label={t("buttons.giveFeedback")}
            icon={<IconArrowRight />}
            href={constructFeedbackUrl(i18n, feedbackUrl) ?? feedbackUrl}
            rel="noopener noreferrer"
          />
          {INCLUDE_FRONTPAGE_LINK.includes(statusCode ?? 0) && (
            <IconButton
              label={t("buttons.backToHome")}
              icon={<IconArrowRight />}
              href="/"
            />
          )}
        </Flex>
      </TextContent>
    </ErrorWrapper>
  );
};

export default ErrorContainer;
