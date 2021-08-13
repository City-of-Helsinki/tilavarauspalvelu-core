import React from "react";
import { IconSearch, TextInput } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Space } from "../../common/types";
import { NarrowContainer } from "../../styles/layout";
import { H1 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";

const Wrapper = styled.div`
  padding-top: var(--spacing-layout-2-xl);
`;

const SearchContainer = styled.div`
  margin-top: var(--spacing-layout-xl);
  margin-bottom: var(--spacing-layout-m);
`;

const StyledInput = styled(TextInput).attrs({
  style: {
    "--border-width": "0",
  } as React.CSSProperties,
})``;

const SpaceCount = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
  font-size: var(--fontsize-heading-s);
`;

const MockData: Space[] = [
  {
    id: 1,
    name: {
      fi: "Tilan #1 nimi",
      en: "Space #1 name",
      sv: "Space #1 namn",
    },
    building: 1,
    district: 1,
    locationType: "fixed",
  },
];

const SpacesList = (): JSX.Element => {
  const { t } = useTranslation();

  const spaces = MockData;
  console.log(spaces);

  return (
    <Wrapper>
      <NarrowContainer>
        <H1>{t("Spaces.spaceListHeading")}</H1>
        <p>{t("Spaces.spaceListDescription")}</p>
        <SearchContainer>
          <StyledInput
            id="spacesSearch"
            buttonIcon={<IconSearch />}
            placeholder={t("Spaces.searchPlaceholder")}
          />
        </SearchContainer>
        <SpaceCount>
          {spaces.length} {t("common.volumeUnit")}
        </SpaceCount>
      </NarrowContainer>
    </Wrapper>
  );
};

export default withMainMenu(SpacesList);
