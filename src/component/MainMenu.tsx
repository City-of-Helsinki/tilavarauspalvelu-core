import React, { useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import { useTranslation } from "react-i18next";
import { Link, RouteProps } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "../styles/util";
import { ReactComponent as PremiseApplications } from "../images/icon_premise-applications.svg";
import { ReactComponent as IconCustomers } from "../images/icon_customers.svg";
import { ReactComponent as IconPremises } from "../images/icon_premises.svg";
import { ReactComponent as IconTwoArrows } from "../images/icon_two-arrows.svg";
import { truncatedText } from "../styles/typography";

const Wrapper = styled.ul<{ placement: string }>`
  display: flex;
  flex-direction: column;
  background-color: white;
  margin: 0;
  padding: 1.5rem 1.375rem 1.5rem 1.25rem;
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
  width: 1.125rem;
  margin-right: var(--spacing-xs);
`;

const Heading = styled(Link)`
  ${truncatedText}
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: 14px;
  line-height: 1.85em;
  text-decoration: none;
  color: var(--tilavaraus-admin-content-text-color);
  max-width: 9.5rem;
`;

const SubItemList = styled.ul`
  flex-basis: 100%;
  margin: 0;
  padding: 0 0 0 calc(1.125rem + var(--spacing-xs));
  list-style: none;
  margin-top: 0.685rem;
`;

const SubItemHeading = styled(Heading)`
  font-family: var(--tilavaraus-admin-font);
  font-weight: normal;
`;

const Toggler = styled.button`
  border: none;
  background: transparent;
  position: absolute;
  top: 0;
  right: -12px;
`;

interface IMenuChild {
  title: string;
  icon?: JSX.Element;
  route: string;
  routeParams?: RouteProps;
}

interface SubItemProps {
  items?: IMenuChild[];
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
        {isMenuOpen ? <IconAngleUp /> : <IconAngleDown />}
      </Toggler>
      {isMenuOpen && (
        <SubItemList>
          {items.map((child: IMenuChild) => (
            <li key={child.title}>
              <SubItemHeading
                to={child.route}
                onClick={() => onItemSelection && onItemSelection()}
              >
                {t(child.title)}
              </SubItemHeading>
            </li>
          ))}
        </SubItemList>
      )}
    </>
  ) : null;
};

const menuTree = [
  {
    title: "MainMenu.applications",
    icon: <PremiseApplications />,
    route: "/applications",
  },
  {
    title: "MainMenu.clients",
    icon: <IconCustomers />,
    route: "/baz",
    items: [
      {
        title: "MainMenu.archive",
        route: "/bar",
      },
    ],
  },
  {
    title: "MainMenu.premisesAndSettings",
    icon: <IconPremises />,
    route: "",
    items: [
      {
        title: "MainMenu.services",
        route: "",
      },
      {
        title: "MainMenu.spaceAndHobbyTypes",
        route: "",
      },
      {
        title: "MainMenu.applicationRounds",
        route: "",
      },
      {
        title: "MainMenu.conditionsAndAttachments",
        route: "",
      },
    ],
  },
  {
    title: "MainMenu.userManagement",
    icon: <IconTwoArrows />,
    route: "",
  },
];

interface MainMenuProps {
  placement: string;
  onItemSelection?: () => void;
}

interface IMenuItem {
  title: string;
  icon?: JSX.Element;
  route: string;
  routeParams?: RouteProps;
  items?: IMenuChild[];
}

function MainMenu({
  placement = "default",
  onItemSelection,
}: MainMenuProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Wrapper placement={placement}>
      {menuTree.map((menuItem: IMenuItem) =>
        menuItem ? (
          <MenuItem key={menuItem.title}>
            <Icon>{menuItem.icon}</Icon>
            <Heading
              to={menuItem.route}
              onClick={() => onItemSelection && onItemSelection()}
            >
              {t(menuItem.title)}
            </Heading>
            <SubItems
              items={menuItem.items}
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
