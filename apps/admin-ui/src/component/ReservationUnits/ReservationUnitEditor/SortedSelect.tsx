import React from "react";
import { useTranslation } from "react-i18next";
import memoize from "lodash/memoize";
import { Select, SelectProps } from "hds-react";
import { sortByName } from "../../../common/util";

function SortedSelect<T>(
  props: Partial<SelectProps<{ label: string; value: T }>> & {
    sort?: boolean;
    label: string;
  }
): JSX.Element {
  const { t } = useTranslation();

  const sortedOpts = memoize(
    (originalOptions: Array<{ label: string; value: T }>) => {
      const opts = [...originalOptions];
      if (props.sort) {
        opts.sort((a, b) => sortByName(a.label, b.label));
      }
      return opts;
    }
  )(props.options ?? []);

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
