import React, { useEffect, useState } from "react";

import { IconCross } from "hds-react";
import styled from "styled-components";

export type DialogHeaderProps = {
  id: string;
  title: string;
  iconLeft?: React.ReactNode;
};

const Title = styled.h3`
  :focus {
    border: 2px solid var(--color-coat-of-arms);
  }
`;

const Container = styled.div`
  display: flex;
  margin: 0 var(--spacing-l);
`;

const Button = styled.button`
  margin-left: auto;
  border: 0;
  background-color: transparent;
  cursor: pointer;
`;

const Extras = styled.div`
  margin-left: auto;
`;

// Why? The default DialogHeader focuses the title every time the dialog is rendered.
export const CustomDialogHeader = ({
  id,
  title,
  extras,
  close = () => null,
}: {
  id: string;
  title: string;
  extras?: JSX.Element;
  close: () => void;
}): JSX.Element => {
  const [state, set] = useState(false);
  const titleRef = React.createRef<HTMLHeadingElement>();

  useEffect(() => {
    if (!state && titleRef.current) {
      titleRef.current.focus();
      set(true);
    }
  }, [state, titleRef]);

  return (
    <Container>
      <Title id={id} tabIndex={-1} ref={titleRef}>
        {title}
      </Title>
      {extras ? <Extras>{extras}</Extras> : <div />}
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
};

CustomDialogHeader.componentName = "DialogHeader";
