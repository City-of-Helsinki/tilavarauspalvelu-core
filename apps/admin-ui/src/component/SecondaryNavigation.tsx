import React from "react";
import styled from "styled-components";
import { IconAngleDown } from "hds-react";

interface IProps {
  items: NaviItem[];
}

interface NaviItem {
  title: string;
}

const Wrapper = styled.ul`
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;

  li {
    svg {
      margin-left: 1em;
    }
  }
`;

const MenuButton = styled.button`
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1em;
  padding: 1em;
  background: none;
  white-space: nowrap;
`;

function SecondaryNavigation({ items }: IProps): JSX.Element {
  return (
    <Wrapper>
      {items.map((item) => (
        <li key={item.title}>
          <MenuButton>
            {item.title}
            <IconAngleDown />
          </MenuButton>
        </li>
      ))}
    </Wrapper>
  );
}

export default SecondaryNavigation;
