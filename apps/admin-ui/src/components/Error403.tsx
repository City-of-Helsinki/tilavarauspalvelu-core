import React from "react";
import { PUBLIC_URL } from "@/modules/const";
import { env } from "@/env.mjs";
import { ErrorContainer } from "common/src/components";

export function Error403(): JSX.Element {
  return (
    <ErrorContainer
      statusCode={403}
      feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
      imgSrc={`${PUBLIC_URL}/images/403-error.png`}
    />
  );
}
