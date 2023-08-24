import React from "react";
import { Checkbox as HdsCheckbox, CheckboxProps } from "hds-react";
import styled from "styled-components";

const StyledCheckbox = styled(HdsCheckbox)`
  label {
    display: block;
  }
`;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (props, ref) => {
    const customStyles = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "--background-unselected": "var(--color-white)",
      display: "block",
      lineHeight: "24px",
    } as React.CSSProperties;

    return (
      <StyledCheckbox
        role="checkbox"
        {...props}
        style={customStyles}
        ref={ref}
      />
    );
  }
);

export default Checkbox;
