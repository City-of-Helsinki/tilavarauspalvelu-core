import React from "react";
import { ErrorContainer } from "ui/src/components";
import { useEnvContext } from "@/context/EnvContext";
import { PUBLIC_URL } from "@/modules/const";

export function Error503(): React.ReactElement {
  const { env } = useEnvContext();
  return (
    <ErrorContainer statusCode={503} feedbackUrl={env.feedbackUrl} imgSrc={`${PUBLIC_URL}/images/503-error.png`} />
  );
}
