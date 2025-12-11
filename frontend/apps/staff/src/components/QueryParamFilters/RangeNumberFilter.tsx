import type { Control, FieldValues, Path, UseControllerProps } from "react-hook-form";
import styled from "styled-components";
import { ControlledNumberFilter } from "./NumberFilter";

const RangeContrainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  text-align: center;
`;

interface RangeNumberFilterProps {
  label: string;
  minName: string;
  maxName: string;
}

function RangeWrapper({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <div>{label}</div>
      <RangeContrainer>{children}</RangeContrainer>
    </div>
  );
}

interface ControlledRangeNumberFilterProps<T extends FieldValues>
  extends Omit<UseControllerProps<T>, "name">, Omit<RangeNumberFilterProps, "minName" | "maxName"> {
  minName: Path<T>;
  maxName: Path<T>;
  control: Control<T>;
}

export function ControlledRangeNumberFilter<T extends FieldValues>({
  label,
  minName,
  maxName,
  control,
}: ControlledRangeNumberFilterProps<T>): JSX.Element {
  return (
    <RangeWrapper label={label}>
      <ControlledNumberFilter name={minName} control={control} />
      <ControlledNumberFilter name={maxName} control={control} />
    </RangeWrapper>
  );
}
