import styled from "styled-components";
import Image from "next/image";
import { TFunction, useTranslation } from "next-i18next";
import IconButton from "./IconButton";
import { IconArrowRight } from "hds-react";
import React from "react";
import { Flex, H1 } from "../../styled";
import { breakpoints } from "../const";

const IMAGE_WIDTH = "418";
const IMAGE_HEIGHT = "350";
const BREAKPOINT = breakpoints.m;

const STATUS_CODES_WITH_SECOND_PARAGRAPH = [403];
const STATUS_CODES_WITH_FRONTPAGE_LINK = [403, 404, 500];
const STATUS_CODES_WITH_NONGENERIC_CONTENT = [403, 404, 500, 503];

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
  const statusCodeString = STATUS_CODES_WITH_NONGENERIC_CONTENT.includes(
    statusCode ?? 0
  )
    ? statusCode?.toString()
    : "generic";
  return (
    <>
      <H1>
        {statusCode !== 500 ? `${statusCode}: ` : ""}
        {t(`${statusCodeString}.heading`)}
      </H1>
      <Body>{t(`${statusCodeString}.body`)}</Body>
      {STATUS_CODES_WITH_SECOND_PARAGRAPH.includes(statusCode ?? 0) && (
        <Body>{t(`${statusCodeString}.body2`)}</Body>
      )}
    </>
  );
}

const ErrorContainer = ({
  statusCode,
  feedbackUrl,
  imgSrc,
  imgAlt,
  children,
}: ErrorPageProps) => {
  const { t, i18n } = useTranslation("errors");

  return (
    <ErrorWrapper>
      <Img
        src={
          imgSrc ??
          (STATUS_CODES_WITH_NONGENERIC_CONTENT.includes(statusCode ?? 0)
            ? `/images/${statusCode}-error.png`
            : "/images/generic-error.png")
        }
        alt={
          (imgAlt ?? statusCode)
            ? t(`${statusCode}.heading`)
            : t("generic.heading")
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
          {STATUS_CODES_WITH_FRONTPAGE_LINK.includes(statusCode ?? 0) && (
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
