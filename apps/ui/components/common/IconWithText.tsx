import { Flex } from "common/src/styled";
import React from "react";

type IconWithTextProps = {
  icon: JSX.Element;
  text: string | JSX.Element;
};

export function IconWithText({ icon, text, ...rest }: IconWithTextProps): JSX.Element {
  return (
    <Flex
      $gap="xs"
      $alignItems="center"
      $direction="row"
      as="p"
      style={{ fontSize: "var(--fontsize-body-s)" }}
      {...rest}
    >
      {text && (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </Flex>
  );
}
