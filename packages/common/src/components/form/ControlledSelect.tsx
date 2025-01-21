import React from "react";
import { Option, SearchResult, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
  type UseControllerProps,
} from "react-hook-form";
import { convertOptionToHDS, filterNonNullable, toNumber } from "../../helpers";
import { convertLanguageCode } from "../../common/util";

interface SelectProps<T extends FieldValues> extends UseControllerProps<T> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  options: Array<{ label: string; value: string | number }>;
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
  afterChange?: (
    value: string | number | Array<string | number> | undefined
  ) => void;
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
  // ignore till HDS provides an upstream fix
  tooltip: _,
  helper: assistive,
  multiselect,
  disabled,
  afterChange,
  enableSearch,
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
            if (typeof options[0].value === "number") {
              return toNumber(x);
            }
            return x;
          })
      );
      onChange(v);
      afterChange?.(v);
    } else if (Array.isArray(selection)) {
      const val = selection.find(() => true)?.value;
      const v = typeof options[0].value === "number" ? toNumber(val) : val;
      onChange(v);
      afterChange?.(v ?? undefined);
    } else {
      throw new Error("Invalid selection");
    }
  };

  function toHDSValue(
    opts: Array<{ label: string; value: string | number }>,
    val: string | number | Array<string | number> | undefined
  ): Partial<Option>[] {
    if (val == null) {
      return [];
    }
    if (Array.isArray(val)) {
      const keyVals = filterNonNullable(
        val.map((v) => opts.find((o) => o.value === v))
      );
      return keyVals.map(convertOptionToHDS);
    }
    return opts.filter((o) => o.value === val).map(convertOptionToHDS);
  }

  const handleSearch = (val: string) => {
    const opts = options.filter((o) =>
      o.label.toLowerCase().includes(val.toLowerCase())
    );
    const res: SearchResult = {
      options: opts.map(convertOptionToHDS),
      groups: undefined,
    };
    return Promise.resolve(res);
  };

  return (
    <Select
      style={style}
      className={className}
      clearable={clearable ?? false}
      required={required}
      multiSelect={multiselect}
      noTags
      onSearch={enableSearch ? handleSearch : undefined}
      texts={{
        label,
        placeholder: placeholder ?? t("common:select"),
        error,
        assistive,
        language,
        // FIXME tooltip is missing is an upstream issue
        // tooltipText: tooltip,
      }}
      value={toHDSValue(options, value)}
      options={options.map(convertOptionToHDS)}
      onChange={handleChange}
      invalid={Boolean(error)}
      disabled={disabled ?? options.length === 0}
    />
  );
}
