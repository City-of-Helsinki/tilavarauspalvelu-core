import React from "react";
import { LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import styled from "styled-components";

const PriceText = styled.span<{ $isLoading: boolean }>`
  transition: color 0.2s;
  ${({ $isLoading }) => ($isLoading ? "color: var(--color-black-50);" : "")}
`;

type LoadingPriceProps = Readonly<{
  price: string | null;
  isLoading: boolean;
}>;

/// While a new price loads, the previous price stays in its place grayed out, so that the layout does not jump.
/// The price is a polite live region, so a screen reader reads the new price when it has loaded.
export function LoadingPrice({ price, isLoading }: LoadingPriceProps): React.ReactElement | null {
  const { t } = useTranslation();
  if (price == null) {
    return isLoading ? <LoadingSpinner small loadingText={t("prices:loading")} /> : null;
  }
  return (
    <PriceText $isLoading={isLoading} aria-live="polite" aria-busy={isLoading}>
      {price}
    </PriceText>
  );
}
