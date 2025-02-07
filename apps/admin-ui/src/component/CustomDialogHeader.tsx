import React from "react";
import { IconCross } from "hds-react";
import styled from "styled-components";
import { H4 } from "common";
import { Flex } from "common/styles/util";

const Container = styled(Flex).attrs({
  $direction: "row",
  $alignItems: "center",
  $gap: "var(--spacing-s)",
  $justifyContent: "space-between",
})`
  padding: 0 var(--spacing-l);
`;

const Button = styled.button`
  border: 0;
  background-color: transparent;
  cursor: pointer;
`;

// Why? The default DialogHeader focuses the title every time the dialog is rendered.
export function CustomDialogHeader({
  title,
  extras,
  close = () => null,
}: {
  title: string;
  extras?: JSX.Element;
  close: () => void;
}): JSX.Element {
  return (
    <Container>
      <H4 as="h2">{title}</H4>
      {extras ? <div>{extras}</div> : null}
      <Button
        style={{ paddingRight: 0 }}
        type="button"
        aria-label="Close"
        onClick={() => close()}
      >
        <IconCross aria-hidden="true" />
      </Button>
    </Container>
  );
}

CustomDialogHeader.componentName = "DialogHeader";
