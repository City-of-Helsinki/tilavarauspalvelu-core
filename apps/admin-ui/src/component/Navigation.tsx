import { useTranslation } from "react-i18next";
import { signIn, signOut } from "common/src/browserHelpers";
import { useSession } from "@/hooks/auth";
import {
  Header,
  IconSignout,
  IconStar,
  IconUser,
  TitleStyleType,
} from "hds-react";
import React from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import useHandling from "@/hooks/useHandling";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import Logo from "common/src/components/Logo";
import { env } from "@/env.mjs";
import {
  allReservationsUrl,
  applicationRoundsUrl,
  bannerNotificationsUrl,
  myUnitsUrl,
  requestedReservationsUrl,
  reservationUnitsUrl,
  reservationsUrl,
  unitsUrl,
  singleUnitUrl,
} from "@/common/urls";

type Props = {
  apiBaseUrl: string;
};

const BackgroundHeader = styled(Header)`
  --header-color: black;
  --actionbar-background-color: var(--color-bus-dark);
  --notification-bubble-background-color: var(
    --tilavaraus-admin-handling-count-color
  );
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
  permission?: Permission;
}

const getFilteredMenu = (
  hasOwnUnits: boolean,
  hasPermission: (perm: Permission) => boolean
): IMenuChild[] => [
  ...(hasOwnUnits
    ? [
        {
          title: "MainMenu.myUnits",
          icon: <IconStar aria-hidden />,
          routes: [myUnitsUrl],
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_VIEW_RESERVATIONS) ||
  hasPermission(Permission.CAN_CREATE_STAFF_RESERVATIONS)
    ? [
        {
          title: "MainMenu.requestedReservations",
          routes: [requestedReservationsUrl],
          exact: true,
        },
        {
          title: "MainMenu.allReservations",
          routes: [allReservationsUrl, reservationsUrl],
          excludeRoutes: [requestedReservationsUrl],
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_VALIDATE_APPLICATIONS)
    ? [
        {
          title: "MainMenu.applicationRounds",
          routes: [applicationRoundsUrl],
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_MANAGE_RESERVATION_UNITS)
    ? [
        {
          permission: Permission.CAN_MANAGE_RESERVATION_UNITS,
          title: "MainMenu.reservationUnits",
          routes: [reservationUnitsUrl],
        },
        {
          permission: Permission.CAN_MANAGE_UNITS,
          title: "MainMenu.units",
          routes: [unitsUrl, singleUnitUrl],
        },
      ].filter((item) => hasPermission(item.permission))
    : []),

  ...(hasPermission(Permission.CAN_MANAGE_BANNER_NOTIFICATIONS)
    ? [
        {
          permission: Permission.CAN_MANAGE_BANNER_NOTIFICATIONS,
          title: "MainMenu.notifications",
          routes: [bannerNotificationsUrl],
        },
      ].filter((item) => hasPermission(item.permission))
    : []),
];

function checkActive(
  pathname: string,
  routes: string[],
  exact: boolean,
  exclude?: string[]
) {
  if (exclude?.includes(pathname)) {
    return false;
  }
  return routes.some((route) =>
    exact ? pathname === route : pathname.startsWith(route)
  );
}

function NavigationLink({
  title,
  routes,
  exact,
  exclude,
  count,
}: {
  title: string;
  routes: string[];
  exact?: boolean;
  exclude?: string[];
  count?: number;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!routes) return null;
  const shouldDisplayCount =
    title === "MainMenu.requestedReservations" && count && count > 0;

  const handleClick = (evt: React.MouseEvent<HTMLAnchorElement>) => {
    evt.preventDefault();
    if (!routes) return;
    navigate(routes[0]);
  };

  return (
    <Header.ActionBarSubItem
      key={routes[0]}
      onClick={handleClick}
      href={`/kasittely${routes[0]}`}
      label={t(title)}
      className={
        checkActive(pathname, routes, exact ?? false, exclude) ? "active" : ""
      }
      notificationBubbleAriaLabel={shouldDisplayCount ? "Määrä" : undefined}
      notificationBubbleContent={
        shouldDisplayCount ? count?.toString() : undefined
      }
    />
  );
}
const Navigation = ({ apiBaseUrl }: Props) => {
  const { t } = useTranslation();
  const { user } = useSession();
  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const name = `${firstName} ${lastName}`.trim() || t("Navigation.noName");
  const { handlingCount, hasOwnUnits } = useHandling();
  const { hasSomePermission, user: userPermission } = usePermission();
  if (!userPermission) return null;

  const menuItemList = getFilteredMenu(hasOwnUnits, hasSomePermission).filter(
    (item) => item != null
  );

  return (
    <BackgroundHeader>
      <ActionBar
        title={t("common:applicationName")}
        titleAriaLabel={t("common:applicationName")}
        frontPageLabel={t("common:gotoFrontpage")}
        titleStyle={TitleStyleType.Bold}
        titleHref={env.NEXT_PUBLIC_BASE_URL ?? "/"}
        openFrontPageLinksAriaLabel={t("common:applicationName")}
        logo={<Logo size="large" style={{ filter: "invert(1)" }} />}
        logoAriaLabel={`${t("common:applicationName")} logo`}
        logoHref={env.NEXT_PUBLIC_BASE_URL}
      >
        {user ? (
          <Header.ActionBarItem
            id="user-menu"
            label={name}
            icon={<IconUser />}
            fixedRightPosition
          >
            <Header.ActionBarButton
              label={
                <>
                  <span>{t("Navigation.logout")}</span>
                  <IconSignout />
                </>
              }
              onClick={() => signOut(apiBaseUrl)}
            />
          </Header.ActionBarItem>
        ) : (
          <Header.ActionBarButton
            label={t("Navigation.login")}
            onClick={() => signIn(apiBaseUrl)}
          />
        )}
      </ActionBar>
      <NavigationMenuWrapper>
        <Header.NavigationMenu>
          {menuItemList.map((item) => (
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
};

export default Navigation;
