import React from "react";
import { defaultFilter, Option, Select, Tooltip } from "hds-react";
import { useTranslation } from "next-i18next";
import { type Control, type FieldValues, type Path, useController, type UseControllerProps } from "react-hook-form";
import { convertOptionToHDS, filterNonNullable, toNumber } from "../../modules/helpers";
import { convertLanguageCode } from "../../modules/util";
import styled from "styled-components";
import { fontMedium } from "../../styled";

const StyledControlledSelect = styled(Select)<{ $strongLabel?: boolean }>`
  /* Used to override the default max-width of HDS Select component, which causes different width fields in the form */
  && {
    max-width: none;
    > label {
      ${({ $strongLabel }) => $strongLabel && fontMedium};
    }
  }
`;

interface SelectProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Readonly<Array<{ label: string; value: string | number }>>;
  required?: boolean;
  placeholder?: string;
  error?: string;
  validate?: { [key: string]: (val: string) => boolean };
  style?: React.CSSProperties;
  className?: string;
  clearable?: boolean;
  tooltip?: string;
  helper?: string;
  multiselect?: boolean;
  disabled?: boolean;
  enableSearch?: boolean;
  afterChange?: (value: string | number | Array<string | number> | undefined) => void;
  id?: string;
  strongLabel?: boolean;
}

export function ControlledSelect<T extends FieldValues>({
  name,
  label,
  control,
  required,
  options,
  error,
  placeholder,
  validate,
  style,
  className,
  clearable,
  tooltip,
  helper: assistive,
  multiselect,
  disabled,
  afterChange,
  enableSearch,
  strongLabel,
  ...rest
}: SelectProps<T>): JSX.Element {
  const { t, i18n } = useTranslation(["common"]);
  const language = convertLanguageCode(i18n.language);

  const {
    field: { value, onChange },
  } = useController({ name, control, rules: { required, validate } });

  const handleChange = (selection: Option[]) => {
    if (!clearable && selection.length === 0) {
      return;
    }
    if (multiselect && Array.isArray(selection)) {
      const v = filterNonNullable(
        selection
          .map((x) => x.value)
          .map((x) => {
            if (typeof options[0]?.value === "number") {
              return toNumber(x);
            }
            return x;
          })
      );
      onChange(v);
      afterChange?.(v);
    } else if (Array.isArray(selection)) {
      const val = selection.find(() => true)?.value;
      const v = typeof options[0]?.value === "number" ? toNumber(val) : val;
      onChange(v);
      afterChange?.(v ?? undefined);
    } else {
      throw new Error("Invalid selection");
    }
  };

  function toHDSValue(
    opts: Readonly<Array<{ label: string; value: string | number }>>,
    val: string | number | Array<string | number> | undefined
  ): Partial<Option>[] {
    if (val == null) {
      return [];
    }
    if (Array.isArray(val)) {
      const keyVals = filterNonNullable(val.map((v) => opts.find((o) => o.value === v)));
      return keyVals.map(convertOptionToHDS);
    }
    return opts.filter((o) => o.value === val).map(convertOptionToHDS);
  }

  return (
    <StyledControlledSelect
      {...rest}
      style={style}
      className={className}
      clearable={clearable ?? false}
      required={required}
      multiSelect={multiselect}
      noTags
      filter={enableSearch ? defaultFilter : undefined}
      texts={{
        label,
        placeholder: placeholder ?? t("common:select"),
        error,
        assistive,
        language,
      }}
      tooltip={tooltip != null && tooltip !== "" ? <Tooltip>{tooltip}</Tooltip> : undefined}
      value={toHDSValue(options, value)}
      options={options.map(convertOptionToHDS)}
      onChange={handleChange}
      invalid={Boolean(error)}
      disabled={disabled ?? options.length === 0}
      $strongLabel={strongLabel}
    />
  );
}
