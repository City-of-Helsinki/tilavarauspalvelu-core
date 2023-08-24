import classNames from "classnames";
import React from "react";

import styles from "../../Table.module.scss";

export type TableContainerProps = React.ComponentPropsWithoutRef<"table"> & {
  children: React.ReactNode;
  dataTestId?: string;
  variant?: "dark" | "light";
  id: string;
  dense?: boolean;
  zebra?: boolean;
  verticalLines?: boolean;
  customThemeClass?: string;
  headingId?: string;
};

export const TableContainer = ({
  children,
  dataTestId,
  variant = "dark",
  id,
  dense = false,
  zebra = false,
  verticalLines = false,
  customThemeClass,
  headingId,
  ...rest
}: TableContainerProps): JSX.Element => {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div tabIndex={0} className={styles.container}>
      <table
        className={classNames(
          styles.table,
          variant === "dark" ? styles.dark : styles.light,
          dense && styles.dense,
          zebra && styles.zebra,
          verticalLines && styles.verticalLines,
          customThemeClass
        )}
        aria-labelledby={headingId}
        data-testid={dataTestId}
        id={id}
        {...rest}
      >
        {children}
      </table>
    </div>
  );
};
