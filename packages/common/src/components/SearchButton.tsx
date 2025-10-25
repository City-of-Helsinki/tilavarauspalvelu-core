import { breakpoints } from "../modules/const";
import { Flex } from "../../styled";
import { Button, ButtonSize, ButtonVariant, IconSearch, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";

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

interface SearchButtonProps {
  labelKey?: string;
  isLoading?: boolean;
}

export function SearchButton({ isLoading = false, labelKey = "filters:searchButton" }: SearchButtonProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <Flex $direction="row" $justifyContent="flex-end">
      <Button
        iconStart={isLoading ? <LoadingSpinner small /> : <IconSearch />}
        disabled={isLoading}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Medium}
        type="submit"
        data-testid="searchButton"
      >
        {t(labelKey)}
      </Button>
    </Flex>
  );
}
