import React from "react";
import {
  Header,
  IconKey,
  IconLinkExternal,
  IconSignout,
  IconUser,
  type LanguageOption,
  LogoSize,
  TitleStyleType,
} from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { useSession } from "@/hooks/auth";
import { type CurrentUserQuery } from "@gql/gql-types";
import Logo from "common/src/components/Logo";
import { useRouter } from "next/router";
import { breakpoints } from "common/src/const";
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
import { fontBold, fontMedium } from "common/styled";

type HeaderProps = {
  apiBaseUrl: string;
  profileLink: string;
  languageOptions?: LanguageOption[];
};

const Wrapper = styled.div`
  z-index: var(--tilavaraus-stack-order-navigation);
  @media (min-width: ${breakpoints.l}) {
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
        ${fontMedium}
      }
    }
  }

  #user-menu-dropdown {
    ul {
      display: flex;
      flex-direction: column;

      > * {
        display: flex;
        background: transparent;
        border: 0;
        justify-content: space-between;
        border-bottom: 1px solid var(--color-black-20);
        transition: background 0.2s;
        color: black;
        &:hover {
          background: var(--color-black-10);
          cursor: pointer;
          text-decoration: underline;
        }
      }
    }
    @media (max-width: ${breakpoints.l}) {
      font-size: var(--fontsize-body-l);
      ul > * {
        padding: var(--spacing-s);
      }
    }
  }

  #user-menu {
    button span svg {
      margin-top: 10px;
    }
    @media (max-width: ${breakpoints.l}) {
      [class*="HeaderActionBarItemButton-module_actionBarItemButton__"] {
        padding: var(--spacing-s);
      }
      &.visible [class*="HeaderActionBarItemButton-module_actionBarItemButton__"] {
        border-bottom: 1px solid var(--color-black-20) !important;
      }
      [class*="HeaderActionBarItemButton-module_actionBarItemButtonLabel__"] {
        font-size: var(--fontsize-body-l);
      }
    }
  }

  #hds-mobile-menu {
    ul > li {
      > span {
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
      &:has(.active) {
        ${fontBold}
      }
      &:hover,
      &:focus-within {
        background: var(--color-black-10);
        cursor: pointer;
        text-decoration: none;
      }
      a:hover {
        text-decoration: none;
      }
    }
  }

  [class*="HeaderActionBar-module_title__"] {
    @media (max-width: ${breakpoints.l}) {
      font-size: var(--fontsize-heading-s) !important;
      ${fontMedium}
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
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  return "";
}

function constructInitials(firstName?: string, lastName?: string) {
  if (firstName && lastName) {
    return `${firstName.charAt(0).toUpperCase()} ${lastName.charAt(0).toUpperCase()}`;
  }
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }
  if (lastName) {
    return lastName.charAt(0).toUpperCase();
  }
  return null;
}

function checkActive(pathname: string, routes: string[], exact: boolean) {
  return routes.some((route) => (exact ? pathname === route : pathname.startsWith(route)));
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
    <Header.NavigationMenu aria-label={t("navigation:navigation")}>
      {menuItems.map((item) => {
        if (item.requireLogin && !user) {
          return null;
        }
        if (!pathname) {
          return;
        }
        const localisationString = i18n.language === "fi" ? "" : getLocalizationLang(i18n.language);

        return (
          <Header.Link
            key={item.label}
            label={t(item.label)}
            href={
              getLocalizationLang(i18n.language) === "fi" ? item.routes[0] : `/${localisationString}${item.routes[0]}`
            }
            onClick={handleClick}
            className={checkActive(pathname, item.routes, item.exact ?? false) ? "active" : ""}
            aria-current={checkActive(pathname, item.routes, item.exact ?? false)}
          />
        );
      })}
    </Header.NavigationMenu>
  );
}

function ActionBar({ apiBaseUrl, profileLink, languageOptions }: Readonly<HeaderProps>) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useSession();
  const { firstName, lastName } = user ?? {};

  const userName = constructName(firstName, lastName);
  const userInitials = constructInitials(firstName, lastName);

  return (
    <Header.ActionBar
      title={t("common:applicationName")}
      titleAriaLabel={t("common:applicationName")}
      frontPageLabel={t("common:gotoFrontpage")}
      titleStyle={TitleStyleType.Bold}
      titleHref={env.NEXT_PUBLIC_BASE_URL ?? "/"}
      openFrontPageLinksAriaLabel={t("common:applicationName")}
      logo={<Logo size={LogoSize.Large} />}
      logoAriaLabel={t("common:helsinkiCity")}
      menuButtonLabel={t("navigation:navigation")}
    >
      <Header.LanguageSelector languages={languageOptions} ariaLabel={t("navigation:languageSelection")} />
      {isAuthenticated ? (
        <Header.ActionBarItem fixedRightPosition id="user-menu" label={userName} avatar={userInitials ?? <IconUser />}>
          {!user?.isAdAuthenticated && (
            <a href={profileLink} target="_blank" rel="noopener noreferrer">
              {t("navigation:profileLinkLabel")}
              <IconLinkExternal />
            </a>
          )}
          <button type="button" aria-label={t("common:logout")} onClick={() => signOut(apiBaseUrl)}>
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
            signIn({
              apiBaseUrl,
              language: getLocalizationLang(i18n.language),
              returnUrl: window.location.href,
              client: "customer",
            });
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
      <Header onDidChangeLanguage={languageChangeHandler} defaultLanguage={router.locale} languages={languageOptions}>
        <ActionBar apiBaseUrl={apiBaseUrl} profileLink={profileLink} languageOptions={languageOptions} />
        <NavigationMenu user={user ?? null} />
      </Header>
    </Wrapper>
  );
}

export default Navigation;
