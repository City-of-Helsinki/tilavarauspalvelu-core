import React, { useState } from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";

const Indent = styled.div<{ $noIndent: boolean }>`
  ${({ $noIndent }) => ($noIndent ? null : `margin-left: var(--spacing-l);`)}
`;

const Wrapper = styled.div<{ $noMargin: boolean }>`
  ${({ $noMargin }) => ($noMargin ? null : `margin-top: var(--spacing-s);`)}
`;

Wrapper.displayName = "Wrapper";

const ActivationGroup = ({
  id,
  label,
  initiallyOpen,
  children,
  noIndent = false,
  noMargin = false,
  onClose,
}: {
  id: string;
  label: string;
  initiallyOpen: boolean;
  children: React.ReactChild | React.ReactChild[];
  noIndent?: boolean;
  noMargin?: boolean;
  onClose?: () => void;
}): JSX.Element => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <>
      <Checkbox
        id={id}
        label={label}
        checked={open}
        onClick={() => {
          setOpen(!open);
          if (open && onClose) {
            onClose();
          }
        }}
      />

      {open ? (
        <Wrapper $noMargin={noMargin}>
          <Indent $noIndent={noIndent}>{children}</Indent>
        </Wrapper>
      ) : null}
    </>
  );
};

export default ActivationGroup;
