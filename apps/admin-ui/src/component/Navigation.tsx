import { useTranslation } from "react-i18next";
import { signIn, signOut } from "common/src/browserHelpers";
import { useSession } from "@/hooks/auth";
import { Header, IconStar, IconUser, Logo, TitleStyleType } from "hds-react";
import React from "react";
import styled from "styled-components";
import { useLocation } from "react-router-dom";
import useHandling from "@/hooks/useHandling";
import usePermission from "@/hooks/usePermission";
import { Permission } from "@/modules/permissionHelper";
import IconPremises from "common/src/icons/IconPremises";
import { env } from "@/env.mjs";

type Props = {
  apiBaseUrl: string;
};

const ActionBar = styled(Header.ActionBar)`
  background: var(--color-bus);

  --action-bar-item-title-font-color: white;
  [class*="HeaderActionBar-module_title"] {
    color: white;
  }
  #user-menu > button {
    color: white;
  }
  #user-menu-dropdown {
    color: black;

    --action-bar-item-title-font-color: black;
  }
`;

const NavigationMenuWrapper = styled.div`
  --notification-bubble-background-color: var(
    --tilavaraus-admin-handling-count-color
  );
  span:has(.active) {
    /* using box-shadow for a bottom border inside of the element, without affecting text positioning */
    box-shadow: 0 -4px 0 0 var(--color-black) inset;
  }

  /* We only want underline on the label text, not the text in the bubble */
  a:hover {
    text-decoration: none;
    span:first-child {
      text-decoration: underline;
    }
  }
`;

interface IMenuChild {
  title: string;
  icon?: JSX.Element;
  route?: string;
  exact?: boolean;
  permission?: Permission;
}

const getFilteredMenu = (
  hasOwnUnits: boolean,
  hasPermission: (perm: Permission) => boolean
): IMenuChild[] => [
  {
    title: "MainMenu.home",
    icon: <IconPremises aria-hidden />,
    route: "/",
    exact: true,
  },
  ...(hasOwnUnits
    ? [
        {
          title: "MainMenu.myUnits",
          icon: <IconStar aria-hidden />,
          route: "/my-units",
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_VIEW_RESERVATIONS) ||
  hasPermission(Permission.CAN_CREATE_STAFF_RESERVATIONS)
    ? [
        {
          title: "MainMenu.requestedReservations",
          route: "/reservations/requested",
        },
        {
          title: "MainMenu.allReservations",
          route: "/reservations/all",
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_VALIDATE_APPLICATIONS)
    ? [
        {
          title: "MainMenu.applicationRounds",
          route: "/recurring-reservations/application-rounds",
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_MANAGE_RESERVATION_UNITS)
    ? [
        {
          permission: Permission.CAN_MANAGE_RESERVATION_UNITS,
          title: "MainMenu.reservationUnits",
          route: `/premises-and-settings/reservation-unit`,
        },
        {
          permission: Permission.CAN_MANAGE_UNITS,
          title: "MainMenu.units",
          route: "/premises-and-settings/units",
        },
      ].filter((item) => hasPermission(item.permission))
    : []),

  ...(hasPermission(Permission.CAN_MANAGE_BANNER_NOTIFICATIONS)
    ? [
        {
          permission: Permission.CAN_MANAGE_BANNER_NOTIFICATIONS,
          title: "MainMenu.notifications",
          route: "/messaging/notifications",
        },
      ].filter((item) => hasPermission(item.permission))
    : []),
];

function NavigationLink({
  href,
  title,
  exact,
  count,
}: {
  href: string;
  title: string;
  exact?: boolean;
  count?: number;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const shouldDisplayCount =
    title === t("MainMenu.requestedReservations") && count && count > 0;
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Header.ActionBarSubItem
      key={href}
      href={`/kasittely/${href}`}
      label={t(title)}
      className={isActive ? "active" : ""}
      notificationBubbleAriaLabel={shouldDisplayCount ? "Määrä" : undefined}
      notificationBubbleContent={
        shouldDisplayCount ? count.toString() : undefined
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

  const base64Logo =
    "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNzggMzYiIHRpdGxlPSJIZWxzaW5naW4ga2F1cHVua2kiIHJvbGU9ImltZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxwYXRoCiAgICAgICAgZD0iTTc1Ljc1MyAyLjI1MXYyMC43YzAgMy45NS0zLjI3NSA3LjE3OC03LjMxIDcuMTc4aC0yMi4yNmMtMi42NzQgMC01LjIwNS45Ni03LjE4MyAyLjczOWExMC43NDkgMTAuNzQ5IDAgMDAtNy4xODMtMi43NEg5LjUwOWMtNC4wMDMgMC03LjI0Ny0zLjIxLTcuMjQ3LTcuMTc3VjIuMjVoNzMuNDkxek00MC4xODcgMzQuODM1YTguNDcgOC40NyAwIDAxNi4wMTItMi40NzFoMjIuMjQ1YzUuMjY4IDAgOS41NTYtNC4yMTkgOS41NTYtOS40MTNWMEgwdjIyLjkzNWMwIDUuMTk0IDQuMjU2IDkuNDEzIDkuNTA5IDkuNDEzaDIyLjMwOGMyLjI2MyAwIDQuMzk4Ljg4MiA2LjAxMiAyLjQ3MUwzOS4wMTYgMzZsMS4xNy0xLjE2NXoiCiAgICAgICAgZmlsbD0iY3VycmVudENvbG9yIiAvPgogICAgPHBhdGgKICAgICAgICBkPSJNNjcuNTIyIDExLjY3NmMwIC42ODEtLjU1NiAxLjE3Ny0xLjI1NSAxLjE3Ny0uNyAwLTEuMjU1LS40OTYtMS4yNTUtMS4xNzcgMC0uNjgyLjU1Ni0xLjE3OCAxLjI1NS0xLjE3OC43LS4wMyAxLjI1NS40NjUgMS4yNTUgMS4xNzh6bS0yLjM1MiA5LjYyMmgyLjE3OHYtNy41NDZINjUuMTd2Ny41NDZ6bS0zLjkwOS00LjU1NmwyLjg0NSA0LjU1NmgtMi4zNjhsLTEuOTA3LTMuMDIyLTEuMDMzIDEuMjcxdjEuNzVoLTIuMTYxVjEwLjQ1M2gyLjE2djUuMDA0YzAgLjkzLS4xMSAxLjg2LS4xMSAxLjg2aC4wNDdzLjUwOS0uODIxLjkzOC0xLjQxbDEuNjUzLTIuMTU0aDIuNTQybC0yLjYwNiAyLjk5em0tNi44MTctLjI3OGMwLTEuODc1LS45MzgtMi44OTgtMi40MzItMi44OTgtMS4yNzEgMC0xLjkzOS43MjgtMi4zMiAxLjQyNmgtLjA0OGwuMTEyLTEuMjRoLTIuMTYydjcuNTQ2aDIuMTYyVjE2LjgyYzAtLjg2OC41MjQtMS40NzIgMS4zMzUtMS40NzIuODEgMCAxLjE2LjUyNyAxLjE2IDEuNTM0djQuNDE2aDIuMTc3bC4wMTYtNC44MzR6bS04LjkzMS00Ljc4OGMwIC42ODEtLjU1NyAxLjE3Ny0xLjI1NiAxLjE3Ny0uNyAwLTEuMjU1LS40OTYtMS4yNTUtMS4xNzcgMC0uNjgyLjU1Ni0xLjE3OCAxLjI1NS0xLjE3OC43MTUtLjAzIDEuMjU2LjQ2NSAxLjI1NiAxLjE3OHptLTIuMzUyIDkuNjIyaDIuMTc3di03LjU0Nkg0My4xNnY3LjU0NnptLTMuNzUtMi4xMDdjMC0uNjA1LS44NTktLjcyOS0xLjg2LTEuMDA4LTEuMTYtLjI5NC0yLjYyMi0uODY3LTIuNjIyLTIuMzA4IDAtMS40MjYgMS4zOTgtMi4zMjQgMy4wNTEtMi4zMjQgMS41NDEgMCAyLjk1Ni43MTIgMy41NDQgMS43MmwtMS44NiAxLjAyMmMtLjE5LS42NjYtLjc2Mi0xLjE5My0xLjYyLTEuMTkzLS41NTcgMC0xLjAxOC4yMzItMS4wMTguNjgyIDAgLjU3MyAxLjAxOC42MzUgMi4xNjIuOTkxIDEuMjA4LjM3MiAyLjMyLjkxNSAyLjMyIDIuMjk0IDAgMS41MTgtMS40NDYgMi40MTctMy4xMTUgMi40MTctMS44MTEgMC0zLjI0Mi0uNzQ0LTMuODc3LTEuOTUybDEuODktMS4wMzljLjI0LjgyMi45MjIgMS40NDEgMS45NTUgMS40NDEuNjIgMCAxLjA1LS4yNDggMS4wNS0uNzQzem0tNi44ODItOC42NzdoLTIuMTc3djguNjkyYzAgLjc3NS4xNzUgMS4zNDguNTA5IDEuNzA1LjM1LjM1Ni44OS41MjYgMS42MzYuNTI2LjI1NSAwIC41MjUtLjAzLjc4LS4wNzcuMjctLjA2Mi40NzYtLjE0LjY1LS4yMzNsLjE5MS0xLjQyNWEyLjA3IDIuMDcgMCAwMS0uNDYuMTI0Yy0uMTI4LjAzLS4yODcuMDMtLjQ2MS4wMy0uMjg2IDAtLjQxNC0uMDc3LS41MDktLjIxNi0uMTExLS4xNC0uMTU5LS4zODctLjE1OS0uNzQ0di04LjM4MnptLTcuMjQ2IDQuNTdjLS43OTUgMC0xLjQ0Ni41NTgtMS42MjEgMS41ODFoMy4wNWMuMDE3LS44OTktLjU4Ny0xLjU4LTEuNDMtMS41OHptMy4zNTMgMy4wMDdIMjMuNjNjLjA5NSAxLjIyNC43OTQgMS44MjggMS43IDEuODI4LjgxIDAgMS4zNjctLjUyNyAxLjQ5NC0xLjI0bDEuODI4IDEuMDA3Yy0uNTQuOTYxLTEuNyAxLjc5OC0zLjMyMiAxLjc5OC0yLjE2IDAtMy43NS0xLjQ3Mi0zLjc1LTMuOTUxIDAtMi40NjQgMS42Mi0zLjk1MSAzLjcwMy0zLjk1MSAyLjA4MSAwIDMuNDY0IDEuNDQgMy40NjQgMy40ODYtLjAxNi42MDQtLjExMSAxLjAyMy0uMTExIDEuMDIzem0tMTEuMDc3IDMuMjA3aDIuMjU3VjEwLjkxNmgtMi4yNTd2NC4xMDdoLTQuMjQzdi00LjA5MUgxMS4wNnYxMC4zNjZoMi4yNTZ2LTQuMjkyaDQuMjQzdjQuMjkyeiIKICAgICAgICBmaWxsPSJjdXJyZW50Q29sb3IiIC8+Cjwvc3ZnPg==";

  return (
    <Header>
      <ActionBar
        title={t("common:applicationName")}
        titleAriaLabel={t("common:applicationName")}
        frontPageLabel={t("common:gotoFrontpage")}
        titleStyle={TitleStyleType.Bold}
        titleHref="/"
        openFrontPageLinksAriaLabel={t("common:applicationName")}
        logo={
          <Logo
            alt={t("common:applicationName")}
            size="large"
            src={base64Logo}
            style={{ filter: "invert(1)" }}
          />
        }
        logoAriaLabel={`${t("common:applicationName")} logo`}
        logoHref={env.NEXT_PUBLIC_BASE_URL}
      >
        {user ? (
          <Header.ActionBarItem
            id="user-menu"
            label={name}
            icon={<IconUser />}
            style={{ color: "white" }}
          >
            <Header.ActionBarButton
              label={t("Navigation.logout")}
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
              key={item.route}
              href={item.route ?? ""}
              title={t(item.title)}
              exact={item.exact}
              count={handlingCount}
            />
          ))}
        </Header.NavigationMenu>
      </NavigationMenuWrapper>
    </Header>
  );
};

export default Navigation;
