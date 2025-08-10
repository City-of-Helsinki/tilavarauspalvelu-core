import { useTranslation } from "next-i18next";
import { signIn, signOut } from "common/src/browserHelpers";
import { useSession, useHandling } from "@/hooks";
import { Header, IconSignout, IconStar, IconUser, LogoSize, TitleStyleType } from "hds-react";
import React from "react";
import styled from "styled-components";
import { useLocation } from "react-use";
import Logo from "common/src/components/Logo";
import { hasSomePermission } from "@/modules/permissionHelper";
import { env } from "@/env.mjs";
import {
  APPLICATION_ROUNDS_URL_PREFIX,
  BANNER_NOTIFICATIONS_URL_PREFIX,
  MY_UNITS_URL_PREFIX,
  RESERVATION_UNIT_URL_PREFIX,
  RESERVATIONS_URL_PREFIX,
  UNITS_URL_PREFIX,
  REQUESTED_RESERVATIONS_URL_PREFIX,
} from "@/common/urls";
import { UserPermissionChoice } from "@gql/gql-types";
import { getLocalizationLang } from "common/src/helpers";
import { useRouter } from "next/router";
import { PUBLIC_URL } from "@/common/const";

type Props = {
  apiBaseUrl: string;
};

const BackgroundHeader = styled(Header)`
  && {
    --header-color: black;
    --actionbar-background-color: var(--color-bus-dark);
    --notification-bubble-background-color: var(--tilavaraus-admin-handling-count-color);

    [class^="HeaderActionBarItem-module_container"] {
      > button span {
        color: white !important;
        svg {
          color: white;
        }
      }
    }

    /* retain text-decoration: underline on the plain text in navigation items, but disable it in the notificationBubble */
    [class^="HeaderNavigationMenu-module_headerNavigationMenuLinkContent__"]:hover,
    [class^="HeaderNavigationMenu-module_headerNavigationMenuLinkContent__"]:focus-within {
      a {
        text-decoration: none;
        span {
          text-decoration: underline;
        }
        [class^="HeaderActionBarSubItem-module_notificationBubble__"] {
          text-decoration: none;
        }
      }
    }
    #user-menu-dropdown {
      color: black;
      button,
      span,
      div {
        display: flex;
        justify-content: space-between;
        width: 100%;
      }
      svg {
        color: var(--header-color);
      }
    }
    #user-menu {
      > button span {
        color: white !important;
        svg {
          color: white;
        }
      }
    }
    #hds-mobile-menu {
      #user-menu * {
        color: var(--header-color) !important;
        box-sizing: border-box;
        button {
          padding-inline: var(--spacing-s);
        }
      }
      ul > li {
        > span {
          box-sizing: border-box;
          padding: var(--spacing-s);
          li {
            width: 100%;
            font-size: var(--fontsize-body-xl);
          }
          .active {
            font-weight: bold;
          }
        }

        /* hide the big link to frontpage which HDS adds by default */
        &:first-child {
          display: none;
        }
      }
    }
  }
`;

const ActionBar = styled(Header.ActionBar)`
  [class*="HeaderActionBar-module_title"] {
    color: white;
  }
  [class*="icon_hds-icon"] {
    color: white;
  }
`;

const NavigationMenuWrapper = styled.div`
  span:has(.active) {
    font-weight: bold !important;

    /* using box-shadow for a bottom border inside of the element, without affecting text positioning */
    box-shadow: 0 -4px 0 0 var(--color-black) inset;
  }
`;

interface IMenuChild {
  title: string;
  icon?: JSX.Element;
  routes?: string[];
  excludeRoutes?: string[];
  exact?: boolean;
}

function getFilteredMenu(
  hasOwnUnits: boolean,
  hasPermission: (perm: UserPermissionChoice, onlyGeneral?: boolean) => boolean
): IMenuChild[] {
  const menuItems: IMenuChild[] = [];
  if (hasOwnUnits) {
    menuItems.push({
      title: "navigation:myUnits",
      icon: <IconStar aria-hidden />,
      routes: [MY_UNITS_URL_PREFIX],
    });
  }
  if (
    hasPermission(UserPermissionChoice.CanViewReservations) ||
    hasPermission(UserPermissionChoice.CanCreateStaffReservations)
  ) {
    menuItems.push(
      {
        title: "navigation:requestedReservations",
        routes: [REQUESTED_RESERVATIONS_URL_PREFIX],
        exact: true,
      },
      {
        title: "navigation:allReservations",
        routes: [RESERVATIONS_URL_PREFIX],
        excludeRoutes: [REQUESTED_RESERVATIONS_URL_PREFIX],
      }
    );
  }
  // NOTE: this is shown even if there are no application rounds accessible for this user
  // i.e. they have the permission to a unit that is not on any application round
  if (hasPermission(UserPermissionChoice.CanViewApplications)) {
    menuItems.push({
      title: "navigation:applicationRounds",
      routes: [APPLICATION_ROUNDS_URL_PREFIX],
    });
  }
  if (hasPermission(UserPermissionChoice.CanManageReservationUnits)) {
    menuItems.push(
      {
        title: "navigation:reservationUnits",
        routes: [RESERVATION_UNIT_URL_PREFIX],
      },
      {
        title: "navigation:units",
        routes: [UNITS_URL_PREFIX],
      }
    );
  }
  if (hasPermission(UserPermissionChoice.CanManageNotifications, true)) {
    menuItems.push({
      title: "navigation:notifications",
      routes: [BANNER_NOTIFICATIONS_URL_PREFIX],
    });
  }
  return menuItems;
}

function checkActive(
  pathname: string | undefined,
  routes: string[],
  exact: boolean | undefined = false,
  exclude?: string[]
) {
  if (!pathname) {
    return false;
  }
  if (exclude?.includes(pathname)) {
    return false;
  }
  return routes.some((route) => (exact ? pathname === route : pathname.startsWith(route)));
}

function NavigationLink({
  title,
  routes,
  exact,
  exclude,
  count,
}: Readonly<{
  title: string;
  routes: string[];
  exact?: boolean;
  exclude?: string[];
  count?: number;
}>) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const router = useRouter();

  if (routes.length === 0) {
    return null;
  }
  const shouldDisplayCount = title === "navigation:requestedReservations" && count && count > 0;

  const handleClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
    evt.preventDefault();
    const route = routes[0];
    if (route != null) {
      // NOTE: this is a workaround for the HDS Header component not closing the mobile menu on navigation, if there isn't a page reload
      // TODO: remove this when HDS Header is fixed
      document.getElementById("Menu")?.querySelector("button")?.click();
      router.push(route);
    }
  };

  const routesWithPrefix = routes.map((route) => `${PUBLIC_URL}${route}`);

  return (
    <Header.ActionBarSubItem
      key={routes[0]}
      onClick={handleClick}
      href={routesWithPrefix[0]}
      label={t(title)}
      aria-label={t(title)}
      className={checkActive(pathname, routesWithPrefix, exact, exclude) ? "active" : ""}
      notificationBubbleAriaLabel={shouldDisplayCount ? "Määrä" : undefined}
      notificationBubbleContent={shouldDisplayCount ? count?.toString() : undefined}
      aria-current={checkActive(pathname, routesWithPrefix, exact, exclude)}
    />
  );
}

export function Navigation({ apiBaseUrl }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const name = `${firstName} ${lastName}`.trim() || t("navigation:noName");
  const { handlingCount, hasOwnUnits } = useHandling();
  if (!user) {
    return null;
  }

  const hasPerms = (perm: UserPermissionChoice, onlyGeneral?: boolean) => {
    return hasSomePermission(user, perm, onlyGeneral);
  };
  const menuItemList = getFilteredMenu(hasOwnUnits, hasPerms).filter((item) => item != null);

  return (
    <BackgroundHeader>
      <ActionBar
        title={t("common:applicationName")}
        titleAriaLabel={t("common:applicationName")}
        frontPageLabel={t("common:gotoFrontpage")}
        titleStyle={TitleStyleType.Bold}
        titleHref={env.NEXT_PUBLIC_BASE_URL ?? "/"}
        openFrontPageLinksAriaLabel={t("common:applicationName")}
        logo={<Logo size={LogoSize.Large} style={{ filter: "invert(1)" }} />}
        logoAriaLabel={`${t("common:applicationName")} logo`}
        logoHref={env.NEXT_PUBLIC_BASE_URL}
      >
        {user ? (
          <Header.ActionBarItem id="user-menu" label={name} icon={<IconUser />} fixedRightPosition>
            <Header.ActionBarButton
              label={
                <>
                  <span>{t("navigation:logout")}</span>
                  <IconSignout />
                </>
              }
              onClick={() => signOut(apiBaseUrl, env.NEXT_PUBLIC_BASE_URL)}
            />
          </Header.ActionBarItem>
        ) : (
          <Header.ActionBarButton
            label={t("navigation:login")}
            onClick={() =>
              signIn({
                apiBaseUrl,
                language: getLocalizationLang(i18n.language),
                client: "admin",
              })
            }
          />
        )}
      </ActionBar>
      <NavigationMenuWrapper>
        <Header.NavigationMenu>
          {menuItemList.map((item) => (
            // FIXME: Warning: validateDOMNesting(...): <li> cannot appear as a descendant of <li>
            <NavigationLink
              key={item.routes && item.routes[0]}
              title={item.title}
              routes={item.routes ?? []}
              exact={item.exact}
              exclude={item.excludeRoutes}
              count={handlingCount}
            />
          ))}
        </Header.NavigationMenu>
      </NavigationMenuWrapper>
    </BackgroundHeader>
  );
}
