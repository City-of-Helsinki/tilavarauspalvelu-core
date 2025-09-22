import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import Error from "next/error";
import type { ErrorProps } from "next/error";
import { ErrorContainer } from "common/src/components";
import { env } from "@/env.mjs";
import { getApiErrors } from "common/src/apolloUtils";

const CustomErrorComponent: NextPage<ErrorProps> = (props) => {
  return <ErrorContainer title={props.title} statusCode={props.statusCode} feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // GraphQL errors return statusCode 200
  // manually bucket them as separate errors based on the backend error code
  const gqlErrors = getApiErrors(contextData.err);
  if (gqlErrors.length > 0) {
    // TODO there might be a nicer way of doing this with normal SentryCaptureMessage not Underscore
    const first = gqlErrors[0];
    const err = first != null && "validation_code" in first ? first.validation_code : (first?.code ?? "UNKNOWN");
    await Sentry.captureUnderscoreErrorException({
      ...contextData,
      err: `GraphQL error: ${err}`,
    });
  } else {
    await Sentry.captureUnderscoreErrorException(contextData);
  }
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
