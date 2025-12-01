import React from "react";
import type { CSSProperties } from "react";
import type { FieldValues, UseControllerProps } from "react-hook-form";
import { useController } from "react-hook-form";
import { TextInput } from "hds-react";
import styled from "styled-components";
import { CharacterCounter } from "@ui/components/form/CharacterCounter";
import { Flex } from "@ui/styled";

const characterCounterStyle = (hasTooltip: boolean) =>
  ({
    position: "absolute",
    top: "0",
    color: "var(--color-black-50)",
    right: hasTooltip ? "var(--spacing-l)" : "var(--spacing-2-xs)",
  }) satisfies CSSProperties;

const TextInputWrapper = styled(Flex).attrs({ $direction: "column", $gap: "s" })`
  position: relative;
  width: 100%;
`;

interface ControllerProps<T extends FieldValues> extends UseControllerProps<T> {
  id?: string;
  min?: number;
  max?: number;
  required?: boolean;
  label: string;
  tooltipText?: string;
  helperText?: string;
  errorText?: string;
  style?: CSSProperties;
  placeholder?: string;
  invalid?: boolean;
}

export function ControlledTextInput<T extends FieldValues>({
  id,
  control,
  name,
  min,
  max,
  required,
  placeholder,
  label,
  tooltipText,
  helperText,
  errorText,
  style,
  invalid,
  ...rest
}: ControllerProps<T>) {
  const {
    field: { value, onChange },
  } = useController({ control, name, rules: { required } });
  return (
    <TextInputWrapper style={style}>
      <TextInput
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        id={id ?? name}
        name={name}
        label={label}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        tooltipText={tooltipText}
        helperText={helperText}
        errorText={errorText}
        invalid={invalid}
      />
      {max ? (
        <CharacterCounter value={value} maxLength={max} style={characterCounterStyle(!!tooltipText)} {...rest} />
      ) : null}
    </TextInputWrapper>
  );
}
