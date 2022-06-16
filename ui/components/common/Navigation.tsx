import React, { useMemo } from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation, TFunction } from "next-i18next";
import { useRouter } from "next/router";
import styled from "styled-components";
import { UserInfo } from "common";
import { applicationsUrl } from "../../modules/util";
import { authEnabled, isBrowser } from "../../modules/const";
import { breakpoint } from "../../modules/style";
import { UserProfile } from "../../modules/types";
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
  min-width: ${breakpoint.xs};

  .btn-logout {
    display: flex;
    margin-top: var(--spacing-m);
    cursor: pointer;
  }

  @media (max-width: ${breakpoint.xs}) {
    position: fixed !important;
    z-index: 100 !important;
  }
`;

const NaviItem = styled(HDSNavigation.Item)<{ $hidden: boolean }>`
  --item-active-color: var(--color-bus);
  ${({ $hidden }) => $hidden && `display: none !important;`}

  span {
    font-family: var(--font-medium);
    font-weight: 500;
  }
`;

const PreContent = styled.div`
  @media (max-width: ${breakpoint.xs}) {
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
      title: "spaceReservation",
      path: "/recurring",
    },
    {
      title: "applications",
      path: applicationsUrl,
      condition: !!profile,
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
          <HDSNavigation.User
            userName={getUserName(profile, t)}
            authenticated={Boolean(profile)}
            label={t("common:login")}
            onSignIn={() => setShouldLogin(true)}
          >
            {profile && (
              <UserInfo name={getUserName(profile, t)} email={profile.email} />
            )}
            <HDSNavigation.Item
              label={t("common:logout")}
              onClick={() => logout && logout()}
            />
          </HDSNavigation.User>
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
