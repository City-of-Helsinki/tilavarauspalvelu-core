import { ParagraphAlt, PreviewLabel, PreviewValue } from "./styles";

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
    <ParagraphAlt $isWide={isWide}>
      <PreviewLabel>{label}</PreviewLabel>
      <PreviewValue data-testid={testId}>{value}</PreviewValue>
    </ParagraphAlt>
  );
}
