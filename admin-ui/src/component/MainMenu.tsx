import React, { useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import { useTranslation } from "react-i18next";
import { NavLink, RouteProps } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "../styles/util";
import { ReactComponent as IconCalendar } from "../images/icon_calendar.svg";
import { ReactComponent as IconIndividualReservation } from "../images/icon_individual-reservation.svg";
import { ReactComponent as IconPremises } from "../images/icon_premises.svg";
import { truncatedText } from "../styles/typography";
import { useData } from "../context/DataContext";
import { prefixes } from "../common/urls";

const Wrapper = styled.ul<{ placement: string }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background-color: white;
  margin: 0;
  padding: 1.5rem 1rem;
  list-style: none;
  z-index: var(--tilavaraus-admin-stack-main-menu);
  ${({ placement }) =>
    placement === "default" &&
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

const Heading = styled.div`
  ${truncatedText}
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

const SubItemHeading = styled(NavLink).attrs({ exact: true })<{
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
}

interface SubItemChild {
  title: string;
  icon?: JSX.Element;
  route: string;
  routeParams?: RouteProps;
  items?: SubItemChild[];
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
                isActive={(match, location) => {
                  return location.pathname.startsWith(child.route);
                }}
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

const menuTree: IMenuChild[] = [
  {
    title: "MainMenu.reservations",
    icon: <IconIndividualReservation aria-hidden />,
    items: [
      {
        title: "MainMenu.requestedReservations",
        route: "/reservations/requested",
      },
    ],
  },

  {
    title: "MainMenu.recurringReservations",
    icon: <IconCalendar aria-hidden />,
    items: [
      {
        title: "MainMenu.applicationRounds",
        route: "/recurring-reservations/application-rounds",
      },
    ],
  },
  {
    title: "MainMenu.premisesAndSettings",
    icon: <IconPremises aria-hidden />,
    items: [
      {
        title: "MainMenu.reservationUnits",
        route: prefixes.reservationUnits,
      },
      {
        title: "MainMenu.spaces",
        route: "/spaces",
      },
      {
        title: "MainMenu.resources",
        route: "/resources",
      },
      {
        title: "MainMenu.units",
        route: "/units",
      },
    ],
  },
];

interface MainMenuProps {
  placement: string;
  onItemSelection?: () => void;
}

function MainMenu({
  placement = "default",
  onItemSelection,
}: MainMenuProps): JSX.Element {
  const { t } = useTranslation();

  const { handlingCount } = useData();

  const count = handlingCount ? (
    <HandlingCount>{handlingCount}</HandlingCount>
  ) : undefined;

  return (
    <Wrapper placement={placement}>
      {menuTree.map((menuItem: IMenuChild) =>
        menuItem ? (
          <MenuItem key={menuItem.title}>
            <Icon>{menuItem.icon}</Icon>
            <Heading>{t(menuItem.title)}</Heading>
            <SubItems
              items={menuItem.items?.map((child) =>
                child.title === "MainMenu.requestedReservations"
                  ? { ...child, postFix: count }
                  : child
              )}
              parentTitleKey={menuItem.title}
              onItemSelection={onItemSelection}
            />
          </MenuItem>
        ) : null
      )}
    </Wrapper>
  );
}

export default MainMenu;
