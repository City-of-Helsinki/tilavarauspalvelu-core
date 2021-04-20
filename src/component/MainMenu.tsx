import React, { useState } from "react";
import { IconAngleDown, IconAngleUp } from "hds-react";
import { useTranslation } from "react-i18next";
import { NavLink, RouteProps } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "../styles/util";
import { ReactComponent as PremiseApplications } from "../images/icon_premise-applications.svg";
import { truncatedText } from "../styles/typography";
// import { ReactComponent as IconCustomers } from "../images/icon_customers.svg";
// import { ReactComponent as IconPremises } from "../images/icon_premises.svg";
// import { ReactComponent as IconTwoArrows } from "../images/icon_two-arrows.svg";

const Wrapper = styled.ul<{ placement: string }>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
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
  width: 1.125rem;
  margin-right: var(--spacing-xs);
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

const SubItemHeading = styled(NavLink)<{ $disabled: boolean }>`
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
  display: inline-block;
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
        {isMenuOpen ? <IconAngleUp /> : <IconAngleDown />}
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
            </li>
          ))}
        </SubItemList>
      )}
    </>
  ) : null;
};

const menuTree: IMenuChild[] = [
  {
    title: "MainMenu.applications",
    icon: <PremiseApplications />,
    items: [
      {
        title: "MainMenu.handling",
        route: "/applicationRounds",
      },
      {
        title: "MainMenu.approvals",
        route: "/applicationRounds/approvals",
      },
    ],
  },
  // {
  //   title: "MainMenu.clients",
  //   icon: <IconCustomers />,
  //   items: [
  //     {
  //       title: "MainMenu.archive",
  //       route: "",
  //     },
  //   ],
  // },
  // {
  //   title: "MainMenu.premisesAndSettings",
  //   icon: <IconPremises />,
  //   items: [
  //     {
  //       title: "MainMenu.services",
  //       route: "",
  //     },
  //     {
  //       title: "MainMenu.spaceAndHobbyTypes",
  //       route: "",
  //     },
  //     {
  //       title: "MainMenu.applicationRounds",
  //       route: "",
  //     },
  //     {
  //       title: "MainMenu.conditionsAndAttachments",
  //       route: "",
  //     },
  //   ],
  // },
  // {
  //   title: "MainMenu.userManagement",
  //   icon: <IconTwoArrows />,
  // },
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

  return (
    <Wrapper placement={placement}>
      {menuTree.map((menuItem: IMenuChild) =>
        menuItem ? (
          <MenuItem key={menuItem.title}>
            <Icon>{menuItem.icon}</Icon>
            <Heading>{t(menuItem.title)}</Heading>
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
