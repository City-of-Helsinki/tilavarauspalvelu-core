import React from "react";
import memoize from "lodash/memoize";
import { ComboboxProps, Combobox } from "hds-react";
import { OptionType } from "../../../common/types";

const SortedCompobox = (
  props: ComboboxProps<OptionType> & { sort?: boolean }
): JSX.Element => {
  const sortedOpts = memoize((originalOptions) => {
    const opts = [...originalOptions];
    if (props.sort) {
      opts.sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase())
      );
    }
    return opts;
  })(props.options);

  return <Combobox {...props} options={sortedOpts} />;
};
export default SortedCompobox;
