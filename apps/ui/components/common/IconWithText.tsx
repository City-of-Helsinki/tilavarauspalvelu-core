import { Flex } from "common/styles/util";
import React from "react";

type IconWithTextProps = {
  icon: JSX.Element;
  text: string | JSX.Element;
};

export function IconWithText({
  icon,
  text,
  ...rest
}: IconWithTextProps): JSX.Element {
  return (
    <Flex $gap="xs" $align="center" $direction="row" {...rest}>
      {text && (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </Flex>
  );
}
