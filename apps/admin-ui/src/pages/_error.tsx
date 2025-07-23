import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import Error, { type ErrorProps } from "next/error";
import { ErrorContainer } from "common/src/components";
import { env } from "@/env.mjs";

const CustomErrorComponent: NextPage<ErrorProps> = (props) => {
  return <ErrorContainer statusCode={props.statusCode} feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  await Sentry.captureUnderscoreErrorException(contextData);
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
