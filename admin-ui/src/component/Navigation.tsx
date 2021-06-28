import React, { useState } from "react";
import { Navigation as HDSNavigation } from "hds-react";
// eslint-disable-next-line import/no-unresolved
import { useReactOidc } from "@axa-fr/react-oidc-context";
import { Profile } from "oidc-client";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import MainMenu from "./MainMenu";
import { breakpoints, StyledHDSNavigation } from "../styles/util";
import { authEnabled } from "../common/const";

interface NavigationProps {
  profile: Profile | null;
  login?: () => void;
  logout?: () => void;
}

const MobileNavigation = styled.div`
  @media (min-width: ${breakpoints.m}) {
    display: none;
  }
`;

const UserMenu = styled(HDSNavigation.User)`
  svg {
    &:first-of-type {
      margin-right: var(--spacing-3-xs);
    }
  }

  a {
    cursor: pointer;
  }

  #userDropdown-menu {
    right: 0;
    left: auto;
  }
`;

const Navigation = ({
  profile,
  login,
  logout,
}: NavigationProps): JSX.Element => {
  const { t } = useTranslation();

  const [isMenuOpen, setMenuState] = useState(false);
  const history = useHistory();

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
        <UserMenu
          userName={`${profile?.given_name || ""} ${
            profile?.family_name || ""
          }`.trim()}
          authenticated={Boolean(profile)}
          label={t("Navigation.login")}
          onSignIn={() => login && login()}
        >
          <HDSNavigation.Item
            label={t("Navigation.logout")}
            onClick={() => logout && logout()}
            variant="primary"
          />
        </UserMenu>
      </HDSNavigation.Actions>
    </StyledHDSNavigation>
  );
};

const NavigationWithProfileAndLogout = authEnabled
  ? () => {
      const { oidcUser, login, logout } = useReactOidc();
      const profile = oidcUser ? oidcUser.profile : null;

      return (
        <Navigation
          profile={profile}
          login={() => login()}
          logout={() => logout()}
        />
      );
    }
  : () => <Navigation profile={null} />;

export default NavigationWithProfileAndLogout;
