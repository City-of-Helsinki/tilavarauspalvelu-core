import { PreviewLabel, PreviewValue, ValuePairContainer } from "@/styled/reservation";

export function LabelValuePair({
  label,
  value,
  isWide,
  testId,
}: {
  label: string;
  value: string | number;
  isWide?: boolean;
  testId?: string;
}) {
  return (
    <ValuePairContainer $isWide={isWide}>
      <PreviewLabel>{label}</PreviewLabel>
      <PreviewValue data-testid={testId}>{value}</PreviewValue>
    </ValuePairContainer>
  );
}
