import { Flex } from "common/styled";
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
    <Flex $gap="xs" $alignItems="center" $direction="row" {...rest}>
      {text && (
        <>
          {icon}
          <span>{text}</span>
        </>
      )}
    </Flex>
  );
}
