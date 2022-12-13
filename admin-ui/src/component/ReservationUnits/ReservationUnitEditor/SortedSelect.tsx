import React from "react";
import { useTranslation } from "react-i18next";
import memoize from "lodash/memoize";
import { Select, SelectProps } from "hds-react";

function SortedSelect<T>(
  props: Partial<SelectProps<T>> & { sort?: boolean; label: string }
): JSX.Element {
  const { t } = useTranslation();

  const sortedOpts = memoize((originalOptions) => {
    const opts = [...originalOptions];
    if (props.sort) {
      opts.sort((a, b) =>
        a.label && b.label
          ? a.label.toLowerCase().localeCompare(b.label.toLowerCase())
          : !a.label
          ? 1
          : -1
      );
    }
    return opts;
  })(props.options);

  const actualProps = {
    ...{
      clearButtonAriaLabel: t("common.clearAllSelections"),
      selectedItemRemoveButtonAriaLabel: t("common.removeValue"),
      toggleButtonAriaLabel: t("common.toggleMenu"),
    },
    ...props,
  };

  return <Select {...actualProps} options={sortedOpts} />;
}
export default SortedSelect;
