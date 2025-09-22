import React from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";
import { fontRegular } from "../../../styled";
import type { Control, FieldValues, Path, PathValue, UseControllerProps } from "react-hook-form";
import { useController } from "react-hook-form";

const StyledCheckbox = styled(Checkbox)`
  && {
    flex-wrap: nowrap;
  }
  && label {
    ${fontRegular};
    line-height: var(--lineheight-l);

    a {
      text-decoration: underline;
      color: var(--color-black);
    }
  }
`;

interface CheckboxProps<T extends FieldValues> extends UseControllerProps<T> {
  id?: string;
  name: Path<T>;
  control: Control<T>;
  label: string;
  tooltip?: string;
  required?: boolean;
  defaultValue?: PathValue<T, Path<T>>;
  inverted?: boolean;
  error?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function ControlledCheckbox<T extends FieldValues>({
  id,
  control,
  name,
  required,
  defaultValue,
  label,
  inverted,
  error,
  tooltip,
  ...props
}: CheckboxProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ control, name, defaultValue, rules: { required } });

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    onChange(inverted ? !evt.target.checked : evt.target.checked);
  };

  return (
    <StyledCheckbox
      {...props}
      id={id ?? name}
      onChange={handleChange}
      checked={inverted ? !value : value}
      defaultChecked={typeof defaultValue === "boolean" ? defaultValue : undefined}
      label={label}
      errorText={error}
      tooltipText={tooltip}
    />
  );
}
