import React from "react";
import { ErrorContainer } from "ui/src/components";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "@/modules/const";

export function Error503(): JSX.Element {
  return (
    <ErrorContainer
      statusCode={503}
      feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
      imgSrc={`${PUBLIC_URL}/images/503-error.png`}
    />
  );
}
