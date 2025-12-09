import React from "react";
import { ErrorContainer } from "ui/src/components";
import { PUBLIC_URL } from "@/modules/const";
import { env } from "../env.mjs";

export function Error404(): JSX.Element {
  return (
    <ErrorContainer statusCode={404} feedbackUrl={env.FEEDBACK_URL} imgSrc={`${PUBLIC_URL}/images/404-error.png`} />
  );
}
