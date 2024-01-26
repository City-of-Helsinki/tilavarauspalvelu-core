import React, { MouseEvent } from "react";
import styled from "styled-components";
import { Navigation as HDSNavigation } from "hds-react";
import { useRouter } from "next/router";
import { breakpoints } from "common/src/common/style";
import { useTranslation } from "next-i18next";
import { fontBold } from "common/src/common/typography";
import { NavigationUserMenu } from "./NavigationUserMenu/NavigationUserMenu";
import { NavigationMenuItem } from "./NavigationMenuItem";
import { LanguageOption, MenuItem } from "./types";

const languageOptions: LanguageOption[] = [
  { label: "Suomeksi", value: "fi" },
  { label: "English", value: "en" },
  { label: "Svenska", value: "sv" },
];

const StyledNavigation = styled(HDSNavigation)`
  color: ${(props) => props.theme.colors.black.medium};
  min-width: ${(props) => props.theme.breakpoints.xs};

  /* stylelint-disable selector-id-pattern */
  #languageSelector-menu {
    right: 0;
    left: unset;
  }

  a[aria-label="Varaamo"] {
    ${fontBold};
  }

  &&& a:not([href]) {
    cursor: pointer;
  }

  @media (max-width: ${(props) => props.theme.breakpoints.xs}) {
    position: fixed !important;
    z-index: ${(props) => props.theme.zIndex.navigation} !important;
  }
`;

const LanguageSelector = styled(HDSNavigation.LanguageSelector)`
  white-space: nowrap;
  position: absolute;
  right: var(--spacing-2-xl);
  margin-right: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    position: relative !important;
    right: unset !important;
  }
`;

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

// TODO cmd / shift + click doesn't open link in new tab
export function Navigation({
  apiBaseUrl,
  profileLink,
}: {
  apiBaseUrl: string;
  profileLink?: string;
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const handleNavigationTitleClick = (e?: Event) => {
    e?.preventDefault();
    router.push("/", "/", {
      locale: router.locale,
    });
  };

  const handleLanguageChange = (
    e: MouseEvent<HTMLAnchorElement>,
    language: string
  ) => {
    e.preventDefault();
    router.replace(router.pathname, router.asPath, {
      locale: language,
    });
  };

  return (
    <StyledNavigation
      title={t("common:applicationName")}
      titleAriaLabel={t("common:applicationName")}
      onTitleClick={handleNavigationTitleClick}
      menuToggleAriaLabel="Menu"
      skipTo="#main"
      skipToContentLabel={t("navigation:skipToMainContent")}
    >
      <HDSNavigation.Row variant="inline">
        {menuItems.map((item) => (
          <NavigationMenuItem
            key={item.title}
            href={item.path}
            onClick={(e: MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              router.push(item.path, item.path, { locale: router.locale });
            }}
            className={router.pathname === item.path ? "active" : ""}
            data-testid={`navigation__${item.title}`}
          >
            {t(`navigation:Item.${item.title}`)}
          </NavigationMenuItem>
        ))}
      </HDSNavigation.Row>
      <HDSNavigation.Actions>
        <LanguageSelector
          label={i18n?.language?.toUpperCase()}
          className="navigation__language-selector--button"
        >
          {languageOptions.map((languageOption) => (
            <HDSNavigation.Item
              key={languageOption.value}
              lang={languageOption.value}
              label={languageOption.label}
              href={`/${languageOption.value}`}
              onClick={(e) => handleLanguageChange(e, languageOption.value)}
            />
          ))}
        </LanguageSelector>
        <NavigationUserMenu apiBaseUrl={apiBaseUrl} profileLink={profileLink} />
      </HDSNavigation.Actions>
    </StyledNavigation>
  );
}
