import React, { useState } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { UserInfo } from "common";
import { breakpoints } from "common/src/common/style";
import { useNavigate } from "react-router-dom";
import { signIn, signOut, useSession } from "@/hooks/auth";
import { PUBLIC_URL } from "@/common/const";
import { StyledHDSNavigation } from "@/styles/util";
import MainMenu from "./MainMenu";

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

  /* stylelint-disable selector-id-pattern */
  #userDropdown-menu {
    right: 0;
    left: auto;
  }
`;

const Navigation = ({ onLogoClick = () => {}, disabledRouter = false }) => {
  const { t } = useTranslation();

  const [isMenuOpen, setMenuState] = useState(false);

  // NOTE have to construct the name from GQL query because most users don't have names in oidc profile
  const { user } = useSession();
  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const name = `${firstName} ${lastName}`.trim() || t("Navigation.noName");

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
      onTitleClick={onLogoClick}
      onMenuToggle={() => setMenuState(!isMenuOpen)}
      menuOpen={isMenuOpen}
    >
      <HDSNavigation.Actions>
        <MobileNavigation>
          {user && !disabledRouter && (
            <MainMenu
              placement="navigation"
              onItemSelection={() => setMenuState(false)}
            />
          )}
        </MobileNavigation>
        <UserMenu
          userName={name}
          authenticated={user != null}
          label={t(user != null ? "Navigation.logging" : "Navigation.login")}
          onSignIn={signIn}
        >
          {user && (
            <UserInfo
              name={name}
              email={user?.email || t("Navigation.noEmail")}
            />
          )}
          <HDSNavigation.Item
            className="btn-logout"
            label={t("Navigation.logout")}
            onClick={signOut}
            variant="primary"
          />
        </UserMenu>
      </HDSNavigation.Actions>
    </StyledHDSNavigation>
  );
};

// NOTE requires both client and react-router context
const NavigationWithRouter = () => {
  const history = useNavigate();
  return <Navigation onLogoClick={() => history("/")} />;
};

// NOTE this is a workaround for SSR and react-router. Checking for window is not enough because of context.
const WrappedNavigation = ({ disabledRouter = false }) => {
  if (typeof window === "undefined" || disabledRouter) {
    return (
      <Navigation
        disabledRouter
        onLogoClick={() => window.location.assign(PUBLIC_URL ?? "/")}
      />
    );
  }
  return <NavigationWithRouter />;
};

export default WrappedNavigation;
