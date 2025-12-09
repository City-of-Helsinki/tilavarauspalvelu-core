import React from "react";
import { ErrorContainer } from "ui/src/components";
import { Flex } from "ui/src/styled";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "@/modules/const";

export function ErrorGeneric(): JSX.Element {
  return (
    <Flex $justifyContent="center" $alignItems="center" $marginTop="2-xl">
      <ErrorContainer statusCode={500} feedbackUrl={env.FEEDBACK_URL} imgSrc={`${PUBLIC_URL}/images/500-error.png`} />
    </Flex>
  );
}
