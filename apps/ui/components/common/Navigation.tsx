import React from "react";
import {
  Header,
  IconKey,
  IconLinkExternal,
  IconSignout,
  IconUser,
  type LanguageOption,
  TitleStyleType,
} from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { useSession } from "@/hooks/auth";
import { type CurrentUserQuery } from "@gql/gql-types";
import Logo from "common/src/components/Logo";
import router from "next/router";
import { breakpoints } from "common";
import { useLocation } from "react-use";
import { signIn, signOut } from "common/src/browserHelpers";

type HeaderProps = {
  apiBaseUrl: string;
  profileLink: string;
};

const Wrapper = styled.div`
  @media (min-width: ${breakpoints.l}) {
    [class*="module_headerNavigationMenu__"] {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto;
    }

    [class*="module_headerActionBar__"],
    [class*="module_headerNavigationMenu__"] ul {
      width: 100%;
      margin: 0 auto;
      max-width: var(--container-width-xl);
    }

    [class*="module_headerNavigationMenuContainer__"] li {
      a {
        margin: 0;
      }
      span:has(.active) {
        /* using box-shadow for a bottom border inside of the element, without affecting text positioning */
        box-shadow: 0 -4px 0 0 var(--color-black) inset;
      }
    }
  }
  @media (max-width: ${breakpoints.l}) {
    #user-menu-dropdown ul {
      display: flex;
      flex-direction: column;
      > {
        appearance: none !important;
      }
      /* force the user specific navigation items (nth-child > 2) to the right */
      &:nth-child(2) {
        flex-grow: 1;
      }
    }
  }
  #user-menu-dropdown ul {
    display: flex;
    flex-direction: column;
    > * {
      display: flex;
      background: white;
      border: 0;
      justify-content: space-between;
      &:hover {
        cursor: pointer;
        text-decoration: underline;
      }
    }
  }
`;

const languageOptions: LanguageOption[] = [
  { label: "Suomeksi", value: "fi" },
  { label: "Svenska", value: "sv" },
  { label: "English", value: "en" },
];

const menuItems = [
  {
    label: "navigation:Item.reservationUnitSearch",
    href: ["/search/single", "/reservation-unit"],
  },
  {
    label: "navigation:Item.spaceReservation",
    href: ["/recurring"],
  },
  {
    label: "navigation:Item.reservations",
    href: ["/reservations"],
    requireLogin: true,
  },
  {
    label: "navigation:Item.applications",
    href: ["/applications"],
    requireLogin: true,
  },
];

function constructName(firstName?: string, lastName?: string) {
  return firstName || lastName ? `${firstName} ${lastName}` : undefined;
}

function NavigationMenu({ user }: { user: CurrentUserQuery["currentUser"] }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  return (
    <Header.NavigationMenu>
      {menuItems.map((item) => {
        if (item.requireLogin && !user) {
          return null;
        }
        const isActive = () => {
          if (!pathname) return false;
          let active = false;
          item.href.forEach((href) => {
            if (pathname.startsWith(href)) {
              active = true;
            }
          });
          return active;
        };
        return (
          <Header.Link
            key={item.label}
            label={t(item.label)}
            href={item.href[0]}
            className={isActive() ? "active" : ""}
          />
        );
      })}
    </Header.NavigationMenu>
  );
}

function ActionBar({ apiBaseUrl, profileLink }: HeaderProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useSession();
  const { firstName, lastName } = user ?? {};

  const userName = constructName(firstName, lastName);
  return (
    <Header.ActionBar
      title={t("common:applicationName")}
      titleAriaLabel={t("common:applicationName")}
      frontPageLabel={t("common:gotoFrontpage")}
      titleStyle={TitleStyleType.Bold}
      titleHref="/"
      openFrontPageLinksAriaLabel={t("common:applicationName")}
      logo={<Logo size="large" />}
      logoAriaLabel={`${t("common:applicationName")} logo`}
      logoHref="/"
    >
      <Header.LanguageSelector ariaLabel={t("navigation:languageSelection")} />
      {isAuthenticated ? (
        <Header.ActionBarItem
          fixedRightPosition
          id="user-menu"
          label={userName ?? ""}
          icon={<IconUser />}
        >
          <a href={profileLink} target="_blank" rel="noopener norreferrer">
            {t("navigation:profileLinkLabel")}
            <IconLinkExternal />
          </a>
          <button
            type="button"
            aria-label={t("common:logout")}
            onClick={() => signOut(apiBaseUrl)}
          >
            {t("common:logout")}
            <IconSignout />
          </button>
        </Header.ActionBarItem>
      ) : (
        <Header.ActionBarButton
          fixedRightPosition
          label={t("common:login")}
          onClick={(e) => {
            e.preventDefault();
            signIn(apiBaseUrl);
          }}
          id="login"
          icon={<IconKey />}
        />
      )}
    </Header.ActionBar>
  );
}

function Navigation({ apiBaseUrl, profileLink }: HeaderProps) {
  const { i18n } = useTranslation();
  const { user } = useSession();

  const languageChangeHandler = (language: string) => {
    i18n.changeLanguage(language);
    router.push(router.pathname, router.asPath, { locale: language });
  };

  return (
    <Wrapper>
      <Header
        onDidChangeLanguage={languageChangeHandler}
        languages={languageOptions}
      >
        <ActionBar apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
        <NavigationMenu user={user} />
      </Header>
    </Wrapper>
  );
}

export default Navigation;
