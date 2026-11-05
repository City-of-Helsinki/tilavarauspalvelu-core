import React from "react";
import { useLocation } from "react-use";
import { Header, IconLinkExternal, IconSignout, IconStar, IconUser, LogoSize, TitleStyleType } from "hds-react";
import { useTranslation } from "next-i18next/pages";
import { useRouter } from "next/router";
import styled from "styled-components";
import { Logo } from "ui/src/components/Logo";
import { signIn, signOut } from "ui/src/modules/browserHelpers";
import { getLocalizationLang } from "ui/src/modules/helpers";
import { UserPermissionChoice } from "@gql/gql-types";
import { env } from "@/env.mjs";
import { useSession, useHandling } from "@/hooks";
import { PUBLIC_URL } from "@/modules/const";
import { hasSomePermission } from "@/modules/permissionHelper";
import {
  APPLICATION_ROUNDS_URL_PREFIX,
  BANNER_NOTIFICATIONS_URL_PREFIX,
  MY_UNITS_URL_PREFIX,
  RESERVATION_UNIT_URL_PREFIX,
  RESERVATIONS_URL_PREFIX,
  UNITS_URL_PREFIX,
  REQUESTED_RESERVATIONS_URL_PREFIX,
  getAccessibilityTermsUrl,
} from "@/modules/urls";

type Props = {
  apiBaseUrl: string;
};

const BackgroundHeader = styled(Header)`
  && {
    --actionbar-background-color: var(--color-bus-dark);
    --action-bar-item-title-font-color: white;

    [class^="HeaderActionBarItem-module_dropdown"],
    #hds-mobile-menu {
      --action-bar-item-title-font-color: black;
    }

    #hds-mobile-menu {
      #user-menu * {
        box-sizing: border-box;
        button {
          padding-inline: var(--spacing-s);
        }
      }
      ul > li {
        > span {
          box-sizing: border-box;
          padding: var(--spacing-s);
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
  --header-color: white;
`;

const NavigationMenuWrapper = styled.div`
  span:has(.active) {
    font-weight: bold !important;

    /* using box-shadow for a bottom border inside of the element, without affecting text positioning */
    box-shadow: 0 -4px 0 0 var(--color-black) inset;
  }
`;

// HDS underlines the whole link on hover. The link is a flex container, so the underline also reaches the bubble.
// Underline only the label instead. The triple "&" beats the HDS selector ".headerLink.headerLink:hover".
const NavigationAnchorLink = styled.a`
  &&&:hover {
    text-decoration: none;
  }
  &&&:hover > span:first-child {
    text-decoration: underline;
    text-decoration-color: var(--nav-link-hover-color);
  }
`;

// Same look as the HDS notification bubble of Header.ActionBarSubItem.
const NotificationBubble = styled.span`
  display: inline-block;
  box-sizing: border-box;
  min-width: var(--spacing-m);
  margin-left: var(--spacing-2-xs);
  padding: 0 6px;
  border-radius: var(--spacing-xs);
  background: var(--tilavaraus-admin-handling-count-color);
  color: var(--color-white);
  font-size: var(--fontsize-body-s);
  font-weight: normal;
  line-height: var(--spacing-m);
  text-align: center;
`;

const ProfileMenuLink = styled.div`
  display: flex;
  align-items: center;
`;

interface IMenuChild {
  title: string;
  icon?: React.ReactElement;
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

  const handleClick: (evt: React.MouseEvent<HTMLAnchorElement>) => Promise<void> = async (evt) => {
    evt.preventDefault();
    const route = routes[0];
    if (route != null) {
      // NOTE: this is a workaround for the HDS Header component not closing the mobile menu on navigation, if there isn't a page reload
      // TODO: remove this when HDS Header is fixed
      document.querySelector("#Menu")?.querySelector("button")?.click();
      await router.push(route);
    }
  };

  const routesWithPrefix = routes.map((route) => `${PUBLIC_URL}${route}`);
  const excludesWithPrefix = exclude?.map((route) => `${PUBLIC_URL}${route}`);
  const isActive = checkActive(pathname, routesWithPrefix, exact, excludesWithPrefix);

  // NOTE Use Header.Link here. HDS wraps each menu child in an <li>.
  // Header.ActionBarSubItem renders its own <li>, which causes a hydration error.
  return (
    <Header.Link
      as={NavigationAnchor}
      onClick={handleClick}
      href={routesWithPrefix[0]}
      label={t(title)}
      aria-label={t(title)}
      active={isActive}
      className={isActive ? "active" : ""}
      count={shouldDisplayCount ? count : undefined}
      aria-current={isActive}
    />
  );
}

/// The link element for Header.Link. HDS passes the label as children.
/// It shows the count in a notification bubble after the label.
function NavigationAnchor({
  children,
  count,
  ...rest
}: React.ComponentPropsWithoutRef<"a"> & Readonly<{ count?: number }>) {
  return (
    <NavigationAnchorLink {...rest}>
      <span>{children}</span>
      {count != null && <NotificationBubble>{count}</NotificationBubble>}
    </NavigationAnchorLink>
  );
}

export function Navigation({ apiBaseUrl }: Props) {
  const { t, i18n } = useTranslation();
  const { user } = useSession();
  const firstName = user?.firstName?.trim() ?? "";
  const lastName = user?.lastName?.trim() ?? "";
  const name = `${firstName} ${lastName}`.trim() || t("navigation:noName");
  const { handlingCount, hasOwnUnits } = useHandling();

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
                <ProfileMenuLink>
                  <span>{t("navigation:a11yTerms")}</span>
                  <IconLinkExternal />
                </ProfileMenuLink>
              }
              onClick={() => window.open(getAccessibilityTermsUrl(), "_blank", "noopener noreferrer")}
              aria-label={t("navigation:a11yTerms")}
              aria-roledescription="link"
            />
            <Header.ActionBarButton
              label={
                <ProfileMenuLink>
                  <span>{t("navigation:logout")}</span>
                  <IconSignout />
                </ProfileMenuLink>
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
      {menuItemList.length > 0 && (
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
      )}
    </BackgroundHeader>
  );
}
