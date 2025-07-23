import React from "react";
import { ErrorContainer } from "common/src/components";
import { PUBLIC_URL } from "@/common/const";
import { env } from "../env.mjs";

export function Error404(): JSX.Element {
  return (
    <ErrorContainer
      statusCode={404}
      feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
      imgSrc={`${PUBLIC_URL}/images/404-error.png`}
    />
  );
}
