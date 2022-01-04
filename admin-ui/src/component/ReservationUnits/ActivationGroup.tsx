import React, { useState } from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: var(--spacing-xs);
`;

const Indent = styled.div<{ $noIndent: boolean }>`
  margin-top: var(--spacing-m);
  ${({ $noIndent }) => ($noIndent ? null : `margin-left: var(--spacing-l);`)}
`;

const ActivationGroup = ({
  id,
  label,
  initiallyOpen,
  children,
  noIndent = false,
  onClose,
}: {
  id: string;
  label: string;
  initiallyOpen: boolean;
  children: React.ReactChild | React.ReactChild[];
  noIndent?: boolean;
  onClose?: () => void;
}): JSX.Element => {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <Wrapper>
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
      {open ? <Indent $noIndent={noIndent}>{children}</Indent> : null}
    </Wrapper>
  );
};

export default ActivationGroup;
