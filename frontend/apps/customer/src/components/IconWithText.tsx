import React from "react";
import { Flex } from "ui/src/styled";

type IconWithTextProps = {
  icon: React.ReactElement;
  text: string | React.ReactElement;
};

export function IconWithText({ icon, text, ...rest }: IconWithTextProps): React.ReactElement {
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
