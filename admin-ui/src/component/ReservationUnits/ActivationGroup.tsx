import React, { useState } from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";

const Wrapper = styled.div`
  margin-top: var(--spacing-xs);
`;

const Indent = styled.div`
  margin-top: var(--spacing-m);
  margin-left: var(--spacing-l);
`;

const ActivationGroup = ({
  id,
  label,
  initiallyOpen,
  children,
  onClose,
}: {
  id: string;
  label: string;
  initiallyOpen: boolean;
  children: React.ReactChild;
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
      {open ? <Indent>{children}</Indent> : null}
    </Wrapper>
  );
};

export default ActivationGroup;
