import React from "react";
import { Navigation as HDSNavigation } from "hds-react";
import { useTranslation, TFunction } from "next-i18next";
import { useLocalStorage } from "react-use";
import { useRouter } from "next/router";
import styled from "styled-components";
import { applicationsUrl, reservationsUrl } from "../../modules/util";
import { authEnabled, isBrowser } from "../../modules/const";
import { breakpoint } from "../../modules/style";
import { UserProfile } from "../../modules/types";
import RequireAuthentication from "./RequireAuthentication";

interface LanguageOption {
  label: string;
  value: string;
}

type MenuItem = {
  title: string;
  path: string;
  condition?: boolean;
};

const languageOptions: LanguageOption[] = [{ label: "Suomeksi", value: "fi" }];

const StyledNavigation = styled(HDSNavigation)`
  --header-background-color: var(
    --tilavaraus-header-background-color
  ) !important;
  --header-divider-color: var(--tilavaraus-header-background-color) !important;

  color: var(--tilavaraus-header-color);

  @media (max-width: ${breakpoint.s}) {
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
  @media (max-width: ${breakpoint.s}) {
    margin-top: var(--spacing-layout-m);
  }
`;

const DEFAULT_LANGUAGE = "fi";

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
  const [language, setLanguage] = useLocalStorage<string>(
    "userLocale",
    i18n.language
  );
  const [shouldLogin, setShouldLogin] = React.useState(false);

  const formatSelectedValue = (lang = DEFAULT_LANGUAGE): string =>
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
    {
      title: "reservations",
      path: reservationsUrl,
      condition: !!profile,
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
            <HDSNavigation.Item
              label={t("common:logout")}
              onClick={() => logout && logout()}
            />
          </HDSNavigation.User>
          <HDSNavigation.LanguageSelector label={formatSelectedValue(language)}>
            {languageOptions.map((languageOption) => (
              <HDSNavigation.Item
                key={languageOption.value}
                label={languageOption.label}
                onClick={(
                  e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>
                ): void => {
                  e.preventDefault();
                  setLanguage(languageOption.value);
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
      }) => <Navigation profile={props.profile} logout={props.logout} />}
    />
  );
};

export default NavigationWithProfileAndLogout;
