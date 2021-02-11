import React, { useEffect, useState } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import MainMenu from "./MainMenu";
import { breakpoints } from "../styles/util";

interface ILanguageOption {
  label: string;
  value: string;
}

const languageOptions: ILanguageOption[] = [
  { label: "Suomeksi", value: "fi" },
  { label: "Svenska", value: "sv" },
  { label: "English", value: "en" },
];

const StyledHDSNavigation = styled(HDSNavigation)`
  --breakpoint-xl: 9000px;
`;

const MobileNavigation = styled.div`
  @media (min-width: ${breakpoints.m}) {
    display: none;
  }
`;

const Navigation = (): JSX.Element => {
  const [isMenuOpen, setMenuState] = useState(false);
  const [language, setLanguage] = useState(languageOptions[0]);
  const { t, i18n } = useTranslation();
  const formatSelectedValue = ({ value }: ILanguageOption): string =>
    value.toUpperCase();
  const history = useHistory();

  useEffect(() => {
    i18n.changeLanguage(language.value);
  }, [language, i18n]);

  return (
    <StyledHDSNavigation
      theme={{
        "--header-background-color":
          "var(--tilavaraus-admin-header-background-color)",
        "--header-color": "var(--tilavaraus-admin-header-color)",
      }}
      title={t("common.applicationName")}
      menuToggleAriaLabel="Menu"
      skipTo="#main"
      skipToContentLabel={t("Navigation.skipToMainContent")}
      onTitleClick={() => history.push("/")}
      onMenuToggle={() => setMenuState(!isMenuOpen)}
      menuOpen={isMenuOpen}
    >
      <HDSNavigation.Actions>
        <MobileNavigation>
          <MainMenu
            placement="navigation"
            onItemSelection={() => setMenuState(false)}
          />
        </MobileNavigation>
        <HDSNavigation.User authenticated label={t("Navigation.login")}>
          <HDSNavigation.Item
            label={t("Navigation.profile")}
            href="https://hel.fi"
            target="_blank"
            variant="primary"
          />
        </HDSNavigation.User>
        <HDSNavigation.LanguageSelector
          label={formatSelectedValue(language)}
          buttonAriaLabel={t("Navigation.languageSelection")}
        >
          {languageOptions.map((languageOption) => (
            <HDSNavigation.Item
              key={languageOption.value}
              label={languageOption.label}
              onClick={(
                e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
              ): void => {
                e.preventDefault();
                setLanguage(languageOption);
              }}
            />
          ))}
        </HDSNavigation.LanguageSelector>
      </HDSNavigation.Actions>
    </StyledHDSNavigation>
  );
};

export default Navigation;
