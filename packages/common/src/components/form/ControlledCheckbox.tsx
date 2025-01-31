import React from "react";
import { Checkbox } from "hds-react";
import styled from "styled-components";
import { fontRegular } from "../../common/typography";
import {
  Control,
  FieldValues,
  Path,
  PathValue,
  useController,
  UseControllerProps,
} from "react-hook-form";

const StyledCheckbox = styled(Checkbox)`
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
  required?: boolean;
  defaultValue?: PathValue<T, Path<T>>;
  error?: string;
}

export function ControlledCheckbox<T extends FieldValues>({
  id,
  control,
  name,
  required,
  defaultValue,
  ...props
}: CheckboxProps<T>): JSX.Element {
  const {
    field: { value, onChange },
  } = useController({ control, name, defaultValue, rules: { required } });

  return (
    <StyledCheckbox
      id={id ?? name}
      onChange={(e) => onChange(e.target.checked)}
      checked={value}
      defaultChecked={
        typeof defaultValue === "boolean" ? defaultValue : undefined
      }
      label={props.label}
      errorText={props.error}
    />
  );
}
