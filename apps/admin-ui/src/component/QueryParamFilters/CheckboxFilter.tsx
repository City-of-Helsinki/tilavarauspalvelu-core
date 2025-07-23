import React from "react";
import styled from "styled-components";
import { Checkbox } from "hds-react";
import { useTranslation } from "next-i18next";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";

// "&& > *" needed to position the checkbox and label correctly in the grid block
const CenteredCheckbox = styled(Checkbox)`
  display: grid;
  height: 84px;
  && > * {
    top: var(--spacing-m);
  }
`;

function BaseCheckboxFilter({
  name,
  checked,
  onChange,
}: {
  name: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}): JSX.Element {
  const { t } = useTranslation();
  return (
    <CenteredCheckbox
      id={name}
      label={t(`filters:label.${name}`)}
      onChange={(e) => onChange(e.target.checked)}
      checked={checked}
    />
  );
}

interface ControlledCheckboxFilterProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
}
export function ControlledCheckboxFilter<T extends FieldValues>({
  name,
  control,
}: ControlledCheckboxFilterProps<T>): JSX.Element {
  const {
    field: { value: checked, onChange },
  } = useController({ name, control });

  return <BaseCheckboxFilter name={name} checked={checked} onChange={onChange} />;
}
