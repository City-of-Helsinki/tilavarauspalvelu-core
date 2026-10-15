import React from "react";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";
import { PUBLIC_URL } from "@/modules/const";

export function Error403(): React.ReactElement {
  const { env } = useEnvContext();
  return (
    <ErrorContainer statusCode={403} feedbackUrl={env.feedbackUrl} imgSrc={`${PUBLIC_URL}/images/403-error.png`} />
  );
}
