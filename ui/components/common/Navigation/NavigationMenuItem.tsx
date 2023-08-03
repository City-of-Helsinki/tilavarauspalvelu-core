import { Navigation as HDSNavigation } from "hds-react";
import styled from "styled-components";

const NavigationMenuItem = styled(HDSNavigation.Item)`
  &&& {
    white-space: nowrap;
    font-family: HelsinkiGrotesk-Medium, sans-serif;
    font-weight: 500;
    width: fit-content;

    &.active {
      border-bottom: 4px solid ${(props) => props.theme.colors.blue.medium};
    }
  }
`;

export { NavigationMenuItem };
