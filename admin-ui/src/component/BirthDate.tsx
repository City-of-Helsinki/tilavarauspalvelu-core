import React, { useState } from "react";
import { UserType } from "common/types/gql-types";
import { formatDate } from "../common/util";
import { HorisontalFlex } from "../styles/layout";

type Props = {
  user: UserType | null;
  onShow: () => void;
  showLabel: string;
  hideLabel: string;
};

export const BirthDate = ({
  user,
  onShow,
  hideLabel,
  showLabel,
}: Props): JSX.Element => {
  const [visible, setVisible] = useState(!!user);

  return (
    <HorisontalFlex style={{ gap: "var(--spacing-2-xs)" }}>
      {visible ? (
        <span>{formatDate(user?.dateOfBirth) || "-"}</span>
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
        onClick={() => {
          setVisible(!visible);
          if (!visible) {
            onShow();
          }
        }}
      >
        {visible ? hideLabel : showLabel}
      </button>
    </HorisontalFlex>
  );
};
