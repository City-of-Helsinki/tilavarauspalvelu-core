import React from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";

const Indent = styled.div<{ $noIndent: boolean }>`
  ${({ $noIndent }) => ($noIndent ? null : `margin-left: var(--spacing-l);`)}
`;

const Wrapper = styled.div<{ $noMargin: boolean }>`
  ${({ $noMargin }) => ($noMargin ? null : `margin-top: var(--spacing-s);`)}
`;

// TODO rewrite using a forwardRef (or do we want to tie this with react-hook-form?)
export function ActivationGroup({
  id,
  label,
  children,
  noIndent = false,
  noMargin = false,
  open,
  onChange,
  style,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  noIndent?: boolean;
  noMargin?: boolean;
  open: boolean;
  onChange: () => void;
  style?: React.CSSProperties;
  className?: string;
}): JSX.Element {
  return (
    <Wrapper $noMargin={noMargin} style={style} className={className}>
      <Checkbox
        id={id}
        label={label}
        checked={open}
        // TODO why is this onClick? why not onChange?
        onClick={() => onChange()}
      />
      {open ? (
        <Wrapper $noMargin={noMargin}>
          <Indent $noIndent={noIndent}>{children}</Indent>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
}
