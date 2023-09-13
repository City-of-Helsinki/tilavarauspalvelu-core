import React from "react";

import styles from "../../Table.module.scss";

export const HeaderRow = ({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element => {
  return <tr className={styles.headerRow}>{children}</tr>;
};
