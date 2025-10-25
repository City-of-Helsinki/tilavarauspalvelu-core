import React from "react";
import { PUBLIC_URL } from "@/modules/const";
import { env } from "@/env.mjs";
import { ErrorContainer } from "common/src/components";

export function Error503(): JSX.Element {
  return (
    <ErrorContainer
      statusCode={503}
      feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
      imgSrc={`${PUBLIC_URL}/images/503-error.png`}
    />
  );
}
