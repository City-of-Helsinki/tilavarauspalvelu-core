import { breakpoints } from "common/src/const";
import { Flex } from "common/styled";
import { Button, ButtonSize, ButtonVariant, IconSearch, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

// FIXME this is copy pasted from customer ui, make a generic component
export const SearchButtonContainer = styled(Flex).attrs({
  $justifyContent: "space-between",
  $alignItems: "center",
})`
  && {
    /* have to use flex-flow: otherwise on desktop the button will be split to the second line */
    flex-flow: column nowrap;
    @media (min-width: ${breakpoints.m}) {
      flex-flow: row nowrap;
    }
  }
`;

export function SearchButton({ isLoading = false }: { isLoading?: boolean }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Flex $direction="row" $justifyContent="flex-end">
      <Button
        iconStart={isLoading ? <LoadingSpinner small /> : <IconSearch />}
        disabled={isLoading}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Medium}
        type="submit"
      >
        {t("filters:searchButton")}
      </Button>
    </Flex>
  );
}
