import classNames from "classnames";
import React from "react";

import styles from "../../Table.module.scss";

export type TableBodyProps = {
  children: React.ReactNode;
  textAlignContentRight?: boolean;
};

export const TableBody = ({
  children,
  textAlignContentRight,
}: TableBodyProps): JSX.Element => {
  return (
    <tbody
      className={classNames(
        styles.content,
        textAlignContentRight && styles.textAlignContentRight
      )}
    >
      {children}
    </tbody>
  );
};
