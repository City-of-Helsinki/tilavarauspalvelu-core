import React, { useState } from "react";
import { formatDate } from "../common/util";
import { HorisontalFlex } from "../styles/layout";

type Props = {
  dateOfBirth: string | undefined;
  showLabel: string;
  hideLabel: string;
};

export const BirthDate = ({
  dateOfBirth,
  hideLabel,
  showLabel,
}: Props): JSX.Element => {
  const [visible, setVisible] = useState(false);

  return (
    <HorisontalFlex style={{ gap: "var(--spacing-2-xs)" }}>
      {visible ? (
        <span>{dateOfBirth ? formatDate(dateOfBirth) : "-"}</span>
      ) : (
        <span>XX.XX.XXXX</span>
      )}
      <button
        style={{
          margin: 0,
          padding: 0,
          border: "none",
          background: "none",
          color: "var(--color-bus)",
          textDecoration: "underline",
        }}
        type="button"
        onClick={() => setVisible(!visible)}
      >
        {visible ? hideLabel : showLabel}
      </button>
    </HorisontalFlex>
  );
};
