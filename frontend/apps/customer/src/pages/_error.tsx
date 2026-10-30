import type { NextPage } from "next";
import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import type { ErrorProps } from "next/error";
import { ErrorContainer } from "ui/src/components";
import { getClientTranslations } from "ui/src/modules/clientTranslations";
import { env } from "@/env.mjs";
import i18nConfig from "../../next-i18next.config.cjs";

const CustomErrorComponent: NextPage<ErrorProps> = (props) => {
  return <ErrorContainer title={props.title} statusCode={props.statusCode} feedbackUrl={env.FEEDBACK_URL} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  await Sentry.captureUnderscoreErrorException(contextData);
  const errorProps = await Error.getInitialProps(contextData);
  return { ...errorProps, ...getClientTranslations(i18nConfig, contextData.locale) };
};

export default CustomErrorComponent;
