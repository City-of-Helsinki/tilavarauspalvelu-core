import React, { useState } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { isValidAuthState } from "app/context/authStateReducer";
import { UserInfo } from "common";
import { breakpoints } from "common/src/common/style";
import MainMenu from "./MainMenu";
// import { useAuthState } from "../context/AuthStateContext";
import { StyledHDSNavigation } from "../styles/util";
import { useSession } from "next-auth/react";

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

const Navigation = (): JSX.Element => {
  const { t } = useTranslation();

  const [isMenuOpen, setMenuState] = useState(false);
  const history = useNavigate();

  const { data: session } = useSession();
  const { user } = session || {};

  console.log("Navigation: session", session);
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
      onTitleClick={() => history("/")}
      onMenuToggle={() => setMenuState(!isMenuOpen)}
      menuOpen={isMenuOpen}
    >
      <HDSNavigation.Actions>
        <MobileNavigation>
          <MainMenu onItemSelection={() => setMenuState(false)} />
        </MobileNavigation>
        {session?.user && (
          <UserMenu
            userName={`${user?.name?.trim()}`}
            authenticated={user != null}
            label={t(user != null ? "Navigation.logging" : "Navigation.login")}
            onSignIn={() => {
              /*
              setLoggingIn(true);
              if (login) {
                setLoggingIn(true);
                login();
              } else {
                throw Error("cannot log in");
              }
              */
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
              // onClick={() => logout && logout()}
              variant="primary"
            />
          </UserMenu>
        )}
      </HDSNavigation.Actions>
    </StyledHDSNavigation>
  );
};

export default Navigation;
