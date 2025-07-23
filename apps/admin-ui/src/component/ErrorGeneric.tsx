import React from "react";
import { ErrorContainer } from "common/src/components";
import { env } from "@/env.mjs";
import { PUBLIC_URL } from "@/common/const";
import { Flex } from "common/styled";

export function ErrorGeneric(): JSX.Element {
  return (
    <Flex $justifyContent={"center"} $alignItems={"center"} $marginTop={"2-xl"}>
      <ErrorContainer
        statusCode={500}
        feedbackUrl={env.EMAIL_VARAAMO_EXT_LINK}
        imgSrc={`${PUBLIC_URL}/images/500-error.png`}
      />
    </Flex>
  );
}
