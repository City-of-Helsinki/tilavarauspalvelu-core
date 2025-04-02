import React from "react";
import { PUBLIC_URL } from "./const";
import { env } from "@/env.mjs";
import ErrorContainer from "common/src/components/ErrorContainer";

const Error503 = (): JSX.Element => {
  return (
    <ErrorContainer
      statusCode={503}
      feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
      imgSrc={`${PUBLIC_URL}/images/503-error.png`}
    />
  );
};

export default Error503;
