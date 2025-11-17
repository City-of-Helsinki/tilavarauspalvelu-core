import * as Sentry from "@sentry/nextjs";
import type { NextPage } from "next";
import Error from "next/error";
import type { ErrorProps } from "next/error";
import { ErrorContainer } from "ui/src/components";
import { getApiErrors } from "ui/src/modules/apolloUtils";
import { env } from "@/env.mjs";

const CustomErrorComponent: NextPage<ErrorProps> = (props) => {
  return <ErrorContainer title={props.title} statusCode={props.statusCode} feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK} />;
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // TODO rewrite using the transform error function
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
