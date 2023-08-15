import React, { useState } from "react";
import { IconAngleDown, IconAngleUp, IconLocation, IconStar } from "hds-react";
import { useTranslation } from "react-i18next";
import { NavLink, RouteProps, useLocation } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import IconPremises from "common/src/icons/IconPremises";
import { Permission } from "app/modules/permissionHelper";
import IconCalendar from "../images/icon_calendar.svg";
import IconIndividualReservation from "../images/icon_individual-reservation.svg";
import { truncatedText } from "../styles/typography";
import { useData } from "../context/DataContext";
import { prefixes } from "../common/urls";
import usePermission from "./reservations/requested/hooks/usePermission";

const Wrapper = styled.ul<{ $sideMenu?: boolean }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background-color: white;
  margin: 0;
  padding: 1.5rem 1rem;
  list-style: none;
  z-index: var(--tilavaraus-admin-stack-main-menu);
  ${({ $sideMenu }) =>
    $sideMenu &&
    `
      @media (min-width: ${breakpoints.m}) {
        display: flex;
      }

      display: none;
      box-shadow: 8px 0px 12px 0px rgba(0, 0, 0, 0.05);
      width: var(--main-menu-width);
      min-height: calc(100vh - 72px - 3rem);
  `}
`;

const MenuItem = styled.li`
  position: relative;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
`;

const Icon = styled.span`
  display: flex;
  justify-content: center;
  width: 1rem;
  margin-right: var(--spacing-2-xs);
`;

const Heading = styled(NavLink)`
  &.active {
    text-decoration: underline;
  }

  ${truncatedText}
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-body-s);
  line-height: 1.85em;
  max-width: 9.5rem;
`;

const SubItemList = styled.ul`
  flex-basis: 100%;
  margin: 0;
  padding: 0 0 0 calc(1.125rem + var(--spacing-xs));
  list-style: none;
  margin-top: 0.685rem;
`;

const SubItemHeading = styled(NavLink)<{
  $disabled: boolean;
}>`
  &.active {
    text-decoration: underline;
  }

  ${truncatedText}
  color: var(--tilavaraus-admin-content-text-color);
  text-decoration: none;
  user-select: none;
  font-size: var(--fontsize-body-s);
  max-width: 9.5rem;
  font-family: var(--tilavaraus-admin-font);
  font-weight: normal;
  padding-bottom: var(--spacing-2-xs);
  display: inline-flex;
  align-items: flex-start;
`;

const Toggler = styled.button`
  border: none;
  background: transparent;
  position: absolute;
  top: 0;
  cursor: pointer;
  width: 100%;
  height: var(--spacing-layout-xs);

  svg {
    position: absolute;
    top: 0;
    right: 0;
  }
`;

const HandlingCount = styled.div`
  display: inline-block;
  border-radius: 50%;
  background: var(--tilavaraus-admin-handling-count-color);
  height: 1.6em;
  text-align: center;
  line-height: 1.6;
  aspect-ratio: 1;
  margin-left: var(--spacing-xs);
  font-size: 0.6em;
  color: white;
  font-weight: 600;
`;

interface IMenuChild {
  title: string;
  icon?: JSX.Element;
  route?: string;
  routeParams?: RouteProps;
  items?: SubItemChild[];
  exact?: boolean;
  permission?: Permission;
}

interface SubItemChild {
  title: string;
  icon?: JSX.Element;
  route: string;
  routeParams?: RouteProps;
  items?: SubItemChild[];
  permission?: Permission;
  postFix?: JSX.Element;
}

interface SubItemProps {
  items?: SubItemChild[];
  parentTitleKey: string;
  onItemSelection?: () => void;
}

const SubItems = ({
  items,
  parentTitleKey,
  onItemSelection,
}: SubItemProps): JSX.Element | null => {
  const [isMenuOpen, toggleMenu] = useState(true);

  const { t } = useTranslation();
  const parentTitle = t(parentTitleKey);

  return items ? (
    <>
      <Toggler
        onClick={() => toggleMenu(!isMenuOpen)}
        aria-label={t(
          isMenuOpen ? "Navigation.shrinkMenu" : "Navigation.expandMenu",
          { title: parentTitle }
        )}
      >
        {isMenuOpen ? (
          <IconAngleUp aria-hidden />
        ) : (
          <IconAngleDown aria-hidden />
        )}
      </Toggler>
      {isMenuOpen && (
        <SubItemList>
          {items.map((child: SubItemChild) => (
            <li key={child.title}>
              <SubItemHeading
                $disabled={child.route === ""}
                to={child.route}
                onClick={() => onItemSelection && onItemSelection()}
              >
                {t(child.title)}
              </SubItemHeading>
              {child.postFix}
            </li>
          ))}
        </SubItemList>
      )}
    </>
  ) : null;
};

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
          title: "MainMenu.reservations",
          icon: <IconIndividualReservation aria-hidden />,
          route: "/reservations",
          items: [
            {
              title: "MainMenu.requestedReservations",
              route: "/reservations/requested",
            },
            {
              title: "MainMenu.allReservations",
              route: "/reservations/all",
            },
          ],
        },
      ]
    : []),

  ...(hasPermission(Permission.CAN_VALIDATE_APPLICATIONS)
    ? [
        {
          title: "MainMenu.recurringReservations",
          icon: <IconCalendar aria-hidden />,
          route: "/recurring-reservations",
          items: [
            {
              title: "MainMenu.applicationRounds",
              route: "/recurring-reservations/application-rounds",
            },
          ],
        },
      ]
    : []),
  {
    title: "MainMenu.premisesAndSettings",
    icon: <IconLocation aria-hidden />,
    route: "/premises-and-settings",
    items: [
      {
        permission: Permission.CAN_MANAGE_RESERVATION_UNITS,
        title: "MainMenu.reservationUnits",
        route: `/premises-and-settings${prefixes.reservationUnits}`,
      },
      {
        permission: Permission.CAN_MANAGE_SPACES,
        title: "MainMenu.spaces",
        route: "/premises-and-settings/spaces",
      },
      {
        permission: Permission.CAN_MANAGE_RESOURCES,
        title: "MainMenu.resources",
        route: "/premises-and-settings/resources",
      },
      {
        permission: Permission.CAN_MANAGE_UNITS,
        title: "MainMenu.units",
        route: "/premises-and-settings/units",
      },
    ].filter((item) => hasPermission(item.permission)),
  },
];

const Items = ({
  items,
  count,
  onItemSelection,
}: {
  items: IMenuChild[];
  count: number;
  onItemSelection?: () => void;
}) => {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <>
      {items.map((menuItem: IMenuChild) => {
        const isActive = menuItem?.route
          ? pathname.startsWith(menuItem?.route)
          : false;
        return (
          <MenuItem key={menuItem.title}>
            <Icon>{menuItem.icon}</Icon>
            <Heading
              to={menuItem.route || ""}
              className={isActive ? "active" : ""}
              onClick={onItemSelection}
            >
              {t(menuItem.title)}
            </Heading>
            <SubItems
              items={menuItem.items?.map((child) =>
                child.title === "MainMenu.requestedReservations"
                  ? {
                      ...child,
                      postFix:
                        count > 0 ? (
                          <HandlingCount>{count}</HandlingCount>
                        ) : undefined,
                    }
                  : child
              )}
              parentTitleKey={menuItem.title}
              onItemSelection={onItemSelection}
            />
          </MenuItem>
        );
      })}
    </>
  );
};

interface MainMenuProps {
  onItemSelection?: () => void;
  placement?: "default" | "navigation";
}

function MainMenu({
  onItemSelection,
  placement = "default",
}: MainMenuProps): JSX.Element | null {
  const { handlingCount, hasOwnUnits } = useData();

  const { hasSomePermission, user } = usePermission();

  if (!user) return null;

  const menuItems = getFilteredMenu(hasOwnUnits, hasSomePermission).filter(
    (item) => item.items == null || item.items.length > 0
  );

  return (
    <Wrapper $sideMenu={placement === "default"}>
      <Items
        items={menuItems}
        onItemSelection={onItemSelection}
        count={handlingCount}
      />
    </Wrapper>
  );
}

export default MainMenu;
