import React from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";
import {
  useController,
  type FieldValues,
  type UseControllerProps,
} from "react-hook-form";

const Indent = styled.div<{ $noIndent: boolean }>`
  ${({ $noIndent }) => ($noIndent ? null : `margin-left: var(--spacing-l);`)}
`;

const Wrapper = styled.div<{ $noMargin: boolean }>`
  ${({ $noMargin }) => ($noMargin ? null : `margin-top: var(--spacing-s);`)}
`;

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  label: string;
  children: React.ReactNode;
  noIndent?: boolean;
  noMargin?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function ActivationGroup<T extends FieldValues>({
  control,
  name,
  label,
  children,
  noIndent = false,
  noMargin = false,
  style,
  className,
}: ControllerProps<T>): JSX.Element {
  const { field } = useController({ control, name });

  return (
    <Wrapper $noMargin={noMargin} style={style} className={className}>
      <Checkbox
        id={name}
        label={label}
        checked={field.value}
        onChange={field.onChange}
      />
      {field.value ? (
        <Wrapper $noMargin={noMargin}>
          <Indent $noIndent={noIndent}>{children}</Indent>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
}
