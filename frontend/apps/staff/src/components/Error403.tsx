import React from "react";
import { ErrorContainer } from "ui/src/components";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "@/modules/const";

export function Error403(): JSX.Element {
  return (
    <ErrorContainer statusCode={403} feedbackUrl={env.FEEDBACK_URL} imgSrc={`${PUBLIC_URL}/images/403-error.png`} />
  );
}
