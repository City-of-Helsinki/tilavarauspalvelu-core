import React, { useMemo } from "react";
import { IconSignout, Navigation as HDSNavigation } from "hds-react";
import { useTranslation, TFunction } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import UserInfo from "common/src/userinfo/UserInfo";
import { UserProfile } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import { applicationsUrl } from "../../modules/util";
import { authEnabled, isBrowser } from "../../modules/const";
import RequireAuthentication from "./RequireAuthentication";
import { clearApiAccessToken } from "../../modules/auth/util";

interface LanguageOption {
  label: string;
  value: string;
}

type MenuItem = {
  title: string;
  path: string;
  condition?: boolean;
};

const StyledNavigation = styled(HDSNavigation)`
  --header-background-color: var(--tilavaraus-header-background-color);
  --header-divider-color: var(--color-black-20);

  color: var(--tilavaraus-header-color);
  min-width: ${breakpoints.xs};

  .btn-logout {
    display: flex;
    margin-top: var(--spacing-m);
    cursor: pointer;
  }

  #languageSelector-menu {
    right: 0;
    left: unset;
  }

  @media (max-width: ${breakpoints.xs}) {
    position: fixed !important;
    z-index: var(--tilavaraus-stack-order-navigation) !important;
  }

  @media (max-width: ${breakpoints.m}) {
    .navigation__language-selector--button {
      position: absolute;
      right: var(--spacing-layout-l);
    }
  }
`;

const UserMenu = styled(HDSNavigation.User)<{
  $active?: boolean;
}>`
  ${({ $active }) =>
    $active &&
    `
      &:after {
        content: "";
        position: absolute;
        bottom: -20px;
        width: 100%;
        border-bottom: 3px solid var(--color-bus);
        z-index: -1;
    }
  `}
`;

const NaviItem = styled(HDSNavigation.Item)<{ $hidden: boolean }>`
  --item-active-color: var(--color-bus);
  ${({ $hidden }) => $hidden && `display: none !important;`}
  white-space: nowrap;

  span {
    font-family: var(--font-medium);
    font-weight: 500;
  }
`;

const UserNaviItem = styled(HDSNavigation.Item)<{
  $hidden: boolean;
  $divider?: boolean;
  icon?: Element;
}>`
  & > span {
    margin: 0 !important;
  }

  cursor: pointer;
  display: flex;
  padding: var(--spacing-xs) 0;
  color: var(--color-black);

  ${({ $hidden }) => $hidden && `display: none !important;`}
  ${({ $divider }) =>
    $divider &&
    `
    position: relative;
    margin-top: var(--spacing-xs) !important;

    &:after {
      content: "";
      border-top: 1px solid var(--color-black-20);
      position: absolute;
      width: 100%;
      top: 0;

      @media (min-width: ${breakpoints.m}) {
        width: 80%;

      }
    }
    `}
  ${({ icon }) =>
    icon &&
    `
    & > span:first-of-type {
      order: 2;
      padding-left: var(--spacing-xs);
    }
  `}
`;

const PreContent = styled.div`
  @media (max-width: ${breakpoints.xs}) {
    margin-top: var(--spacing-layout-l);
  }
`;

type Props = {
  profile: UserProfile | null;
  logout?: () => void;
};

const getUserName = (profile: UserProfile | null, t: TFunction) => {
  if (profile === null) {
    return "";
  }
  if (!profile.given_name && !profile.family_name) {
    return t("userNoName");
  }

  return `${profile?.given_name || ""} ${profile?.family_name || ""}`;
};

const Navigation = ({ profile, logout }: Props): JSX.Element => {
  const { t, i18n } = useTranslation(["common", "navigation"]);
  const router = useRouter();

  const [shouldLogin, setShouldLogin] = React.useState(false);

  const languageOptions: LanguageOption[] = useMemo(
    () => [
      { label: "Suomeksi", value: "fi" },
      { label: "English", value: "en" },
      { label: "Svenska", value: "sv" },
    ],
    []
  );

  const formatSelectedValue = (lang = router.defaultLocale): string =>
    lang.toUpperCase();

  const menuItems: MenuItem[] = [
    {
      title: "reservationUnitSearch",
      path: "/search/single",
    },
    {
      title: "spaceReservation",
      path: "/recurring",
    },
  ];

  return (
    <>
      <StyledNavigation
        title={t("common:applicationName")}
        onTitleClick={() => router.push("/")}
        menuToggleAriaLabel="Menu"
        skipTo="#main"
        skipToContentLabel={t("navigation:skipToMainContent")}
      >
        <HDSNavigation.Row variant="inline">
          {menuItems.map((item) => (
            <NaviItem
              href="#"
              key={`${item.title}${item.path}`}
              label={t(`navigation:Item.${item.title}`)}
              onClick={() => router.push(item.path)}
              active={router.pathname === item.path}
              $hidden={item.condition === false}
            />
          ))}
        </HDSNavigation.Row>
        <HDSNavigation.Actions>
          <UserMenu
            userName={getUserName(profile, t)}
            authenticated={Boolean(profile)}
            label={t("common:login")}
            onSignIn={() => setShouldLogin(true)}
            $active={
              router.pathname === "/reservations" ||
              router.pathname === "/applications"
            }
          >
            {profile && (
              <UserInfo name={getUserName(profile, t)} email={profile.email} />
            )}
            <UserNaviItem
              $hidden={!profile}
              label={t("navigation:Item.reservations")}
              onClick={() => router.push("/reservations")}
            />
            <UserNaviItem
              $hidden={!profile}
              label={t("navigation:Item.applications")}
              onClick={() => router.push(applicationsUrl)}
            />
            <UserNaviItem
              $divider={!!profile}
              label={t("common:logout")}
              onClick={() => logout && logout()}
              icon={<IconSignout aria-hidden />}
            />
          </UserMenu>
          <HDSNavigation.LanguageSelector
            label={formatSelectedValue(i18n.language)}
            className="navigation__language-selector--button"
          >
            {languageOptions.map((languageOption) => (
              <HDSNavigation.Item
                key={languageOption.value}
                lang={languageOption.value}
                label={languageOption.label}
                href="#"
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
                ): void => {
                  e.preventDefault();
                  router.push(router.pathname, router.asPath, {
                    locale: languageOption.value,
                  });
                }}
              />
            ))}
          </HDSNavigation.LanguageSelector>
        </HDSNavigation.Actions>
      </StyledNavigation>
      <PreContent />
      {shouldLogin && (
        <RequireAuthentication>
          <div />
        </RequireAuthentication>
      )}
    </>
  );
};

const NavigationWithProfileAndLogout = (): JSX.Element => {
  if (!isBrowser || !authEnabled) {
    return <Navigation profile={null} />;
  }

  const WithOidc = require("./WithOidc").default;

  return (
    <WithOidc
      render={(props: {
        profile: UserProfile | null;
        logout: (() => void) | undefined;
      }) => (
        <Navigation
          profile={props.profile}
          logout={() => {
            clearApiAccessToken();
            props.logout();
          }}
        />
      )}
    />
  );
};

export default NavigationWithProfileAndLogout;
