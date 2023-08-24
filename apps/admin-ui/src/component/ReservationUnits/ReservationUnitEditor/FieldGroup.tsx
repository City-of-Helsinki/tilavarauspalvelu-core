import { Strong } from "common/src/common/typography";
import { Tooltip } from "hds-react";
import React from "react";
import { HorisontalFlex } from "../../../styles/layout";

export type Props = {
  heading: string;
  tooltip?: string;
  id?: string;
  children?: React.ReactNode;
};
const FieldGroup = ({
  children,
  id,
  heading,
  tooltip = "",
}: Props): JSX.Element => (
  <HorisontalFlex
    style={{
      justifyContent: "space-between",
      width: "100%",
    }}
  >
    <span>
      <Strong style={{ display: "block", paddingBottom: "var(--spacing-xs)" }}>
        {heading}
      </Strong>
      {id ? <span id={id} /> : null}
      {children}
    </span>
    <Tooltip>{tooltip}</Tooltip>
  </HorisontalFlex>
);

export default FieldGroup;
