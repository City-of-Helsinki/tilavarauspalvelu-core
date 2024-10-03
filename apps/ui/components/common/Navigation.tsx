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
import { useRouter } from "next/router";
import { breakpoints } from "common";
import { useLocation } from "react-use";
import { signIn, signOut } from "common/src/browserHelpers";
import { getLocalizationLang } from "common/src/helpers";
import { env } from "@/env.mjs";
import {
  applicationsPrefix,
  reservationsPrefix,
  reservationUnitPrefix,
  seasonalPrefix,
  singleSearchPrefix,
} from "@/modules/urls";

type HeaderProps = {
  apiBaseUrl: string;
  profileLink: string;
  languageOptions?: LanguageOption[];
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
        &:focus {
          text-decoration: underline;
        }
      }

      span:has(.active) {
        /* using box-shadow for a bottom border inside of the element, without affecting text positioning */
        box-shadow: 0 -4px 0 0 var(--color-black) inset;
        font-weight: bold;
      }
    }
  }

  #user-menu-dropdown ul {
    display: flex;
    flex-direction: column;

    > * {
      display: flex;
      background: transparent;
      border: 0;
      justify-content: space-between;
      border-bottom: 1px solid var(--color-black-20);
      transition: background 0.2s;
      &:hover {
        background: var(--color-black-10);
        cursor: pointer;
        text-decoration: underline;
      }
    }
  }

  #hds-mobile-menu {
    ul > li {
      > span {
        padding: var(--spacing-s);
        li,
        a {
          display: block;
          width: 100%;
          font-size: var(--fontsize-body-xl);
        }
      }
      &:first-child {
        display: none;
      }
    }
    .active {
      font-weight: bold;
    }
  }
`;

const menuItems = [
  {
    label: "navigation:Item.home",
    routes: ["/"],
    exact: true,
  },
  {
    label: "navigation:Item.reservationUnitSearch",
    routes: [singleSearchPrefix, reservationUnitPrefix],
  },
  {
    label: "navigation:Item.spaceReservation",
    routes: [seasonalPrefix],
  },
  {
    label: "navigation:Item.reservations",
    routes: [reservationsPrefix],
    requireLogin: true,
  },
  {
    label: "navigation:Item.applications",
    routes: [applicationsPrefix],
    requireLogin: true,
  },
];

function constructName(firstName?: string, lastName?: string) {
  return firstName || lastName ? `${firstName} ${lastName}` : undefined;
}

function checkActive(pathname: string, routes: string[], exact: boolean) {
  return routes.some((route) =>
    exact ? pathname === route : pathname.startsWith(route)
  );
}

function NavigationMenu({ user }: { user: CurrentUserQuery["currentUser"] }) {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    router.push(e.currentTarget.href);
  };

  return (
    <Header.NavigationMenu>
      {menuItems.map((item) => {
        if (item.requireLogin && !user) {
          return null;
        }
        if (!pathname) {
          return;
        }
        const localisationString =
          i18n.language === "fi" ? "" : getLocalizationLang(i18n.language);

        return (
          <Header.ActionBarSubItem
            key={item.label}
            label={t(item.label)}
            href={
              getLocalizationLang(i18n.language) === "fi"
                ? item.routes[0]
                : `/${localisationString}${item.routes[0]}`
            }
            onClick={handleClick}
            className={
              checkActive(pathname, item.routes, item.exact ?? false)
                ? "active"
                : ""
            }
          />
        );
      })}
    </Header.NavigationMenu>
  );
}

function ActionBar({ apiBaseUrl, profileLink, languageOptions }: HeaderProps) {
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
      titleHref={env.NEXT_PUBLIC_BASE_URL ?? "/"}
      openFrontPageLinksAriaLabel={t("common:applicationName")}
      logo={<Logo size="large" />}
      logoAriaLabel={`${t("common:applicationName")} logo`}
      logoHref={env.NEXT_PUBLIC_BASE_URL}
      menuButtonLabel="Menu"
    >
      <Header.LanguageSelector
        languages={languageOptions}
        ariaLabel={t("navigation:languageSelection")}
      />
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
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const router = useRouter();

  const languageOptions: LanguageOption[] = [
    { label: t("navigation:languages.fi"), value: getLocalizationLang("fi") },
    { label: t("navigation:languages.sv"), value: getLocalizationLang("sv") },
    { label: t("navigation:languages.en"), value: getLocalizationLang("en") },
  ];

  const languageChangeHandler = (language: string) => {
    i18n.changeLanguage(language);
    router.push(router.pathname, router.asPath, { locale: language });
  };

  return (
    <Wrapper>
      <Header
        onDidChangeLanguage={languageChangeHandler}
        defaultLanguage={router.locale}
        languages={languageOptions}
      >
        <ActionBar
          apiBaseUrl={apiBaseUrl}
          profileLink={profileLink}
          languageOptions={languageOptions}
        />
        <NavigationMenu user={user} />
      </Header>
    </Wrapper>
  );
}

export default Navigation;
