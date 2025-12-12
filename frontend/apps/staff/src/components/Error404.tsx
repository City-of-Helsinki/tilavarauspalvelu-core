import React from "react";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";
import { PUBLIC_URL } from "@/modules/const";

export function Error404(): React.ReactElement {
  const { env } = useEnvContext();
  return (
    <ErrorContainer statusCode={404} feedbackUrl={env.feedbackUrl} imgSrc={`${PUBLIC_URL}/images/404-error.png`} />
  );
}
