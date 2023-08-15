import React, { useState } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { UserInfo } from "common";
import { signIn, signOut, useSession } from "next-auth/react";
import { breakpoints } from "common/src/common/style";
import { useNavigate } from "react-router-dom";
import { publicUrl } from "app/common/const";
import MainMenu from "./MainMenu";
import { StyledHDSNavigation } from "../styles/util";

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

  const { data: session } = useSession();
  const { user } = session || {};

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
          userName={`${user?.name?.trim()}`}
          authenticated={user != null}
          label={t(user != null ? "Navigation.logging" : "Navigation.login")}
          onSignIn={() => {
            signIn("tunnistamo", {
              callbackUrl: window.location.href,
            });
          }}
        >
          {user && (
            <UserInfo
              name={`${user?.name?.trim()}` || t("Navigation.noName")}
              email={user?.email ?? t("Navigation.noEmail")}
            />
          )}
          <HDSNavigation.Item
            className="btn-logout"
            label={t("Navigation.logout")}
            onClick={() => signOut({ callbackUrl: `${publicUrl}/auth/logout` })}
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
        onLogoClick={() => window.location.assign(publicUrl ?? "/")}
      />
    );
  }
  return <NavigationWithRouter />;
};

export default WrappedNavigation;
