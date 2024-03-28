import styled from "styled-components";
import { fontMedium } from "common";
import { ReactNode } from "react";

type SingleLabelRangeInputProps = {
  label: string;
  children: ReactNode;
};

const InputContainer = styled.div`
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: auto auto;
  {/* hide the HDS-labels visually, but retain them in the DOM */}
  label {
    height: 0;
    overflow: hidden;
  }
  > :not(:last-child) > div {
    border-right: none;
  }
`;

const Label = styled.div`
  ${fontMedium}
`;

// A wrapper to supply a singular label to two related input fields:
// Visually hides the original input labels from HDS-components while retaining their aria-attributes for a18y,
// thus removing the need to try using hacks like empty label strings for the desired effect
const SingleLabelInputGroup = ({
  label,
  children,
}: SingleLabelRangeInputProps) => {
  return (
    <div>
      <Label aria-hidden>{label}</Label>
      <InputContainer>{children}</InputContainer>
    </div>
  );
};

export default SingleLabelInputGroup;
