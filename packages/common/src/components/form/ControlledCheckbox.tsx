import React from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";
import { fontRegular } from "../../../styled";
import { Control, FieldValues, Path, PathValue, useController, UseControllerProps } from "react-hook-form";

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
  error,
  tooltip,
  ...props
}: CheckboxProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ control, name, defaultValue, rules: { required } });

  return (
    <StyledCheckbox
      {...props}
      id={id ?? name}
      onChange={(e) => onChange(e.target.checked)}
      checked={value}
      defaultChecked={typeof defaultValue === "boolean" ? defaultValue : undefined}
      label={label}
      errorText={error}
      tooltipText={tooltip}
    />
  );
}
