import styled from "styled-components";
import { NumberFilter } from "./NumberFilter";

const RangeContrainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: top;
  text-align: center;
`;

export function RangeNumberFilter({
  label,
  minName,
  maxName,
}: {
  label: string;
  minName: string;
  maxName: string;
}) {
  // TODO add a proper label to it (don't use div, and hide it for screen readers)
  // TODO hide the actual input label (using sr-only or height 0)
  return (
    <div>
      <div>{label}</div>
      <RangeContrainer>
        <NumberFilter name={minName} />
        <NumberFilter name={maxName} />
      </RangeContrainer>
    </div>
  );
}
