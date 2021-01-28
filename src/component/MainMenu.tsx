import React, { useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import { useTranslation } from "react-i18next";
import { Link, RouteProps } from "react-router-dom";
import styled from "styled-components";
import iconApplications from "../images/icon_applications.png";
import iconPeople from "../images/icon_people.png";
import { breakpoints } from "../util/styles";

const Wrapper = styled.ul<{ placement: string }>`
  display: flex;
  flex-direction: column;
  background-color: white;
  margin: 0;
  padding: 1.5em 1.375em 1.5em 3.25em;
  list-style: none;
  ${({ placement }) =>
    placement === "default" &&
    `
      @media (min-width: ${breakpoints.s}) {
        display: flex;
      }

      display: none;
      box-shadow: 8px 0px 12px 0px rgba(0, 0, 0, 0.05);
      width: 13.75em;
  `}
`;

const MenuItem = styled.li`
  position: relative;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 1.25em;
`;

const Icon = styled.span`
  position: absolute;
  top: 0.1em;
  left: -2em;
`;

const Heading = styled(Link)`
  font-family: HelsinkiGrotesk, var(--font-default);
  font-weight: bold;
  font-size: 14px;
  line-height: 1.85em;
  text-decoration: none;
  color: var(--tilavaraus-admin-content-text-color);
  max-width: var(--tilavaraus-breakpoint-s);
`;

const SubItemList = styled.ul`
  flex-basis: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  margin-top: 0.685em;
`;

const SubItemHeading = styled(Heading)`
  font-weight: normal;
`;

const Toggler = styled.button`
  position: absolute;
  right: 0;
  border: none;
  background: transparent;
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
    icon: <img src={iconApplications} alt="" />,
    route: "foo",
  },
  {
    title: "MainMenu.clients",
    icon: <img src={iconPeople} alt="" />,
    route: "baz",
    items: [
      {
        title: "MainMenu.archive",
        route: "bar",
      },
    ],
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
            {menuItem.icon && <Icon>{menuItem.icon}</Icon>}
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
