import React from "react";
import styled from "styled-components";

const StyledUserInfo = styled.div`
  word-break: break-all;
  padding-bottom: ${(props) => props.theme.spacing.s};
  padding-left: 36px;
  border: 0;

  @media (min-width: ${(props) => props.theme.breakpoints.s}) {
    padding: ${(props) => props.theme.spacing.s};
    padding-bottom: ${(props) => props.theme.spacing.xs};
  }
`;

const Name = styled.div`
  display: none;
  color: ${(props) => props.theme.colors.black.dark};

  @media (min-width: ${(props) => props.theme.breakpoints.m}) {
    display: block;
  }
`;

const Email = styled.div`
  color: ${(props) => props.theme.colors.black.medium};
  font-size: ${(props) => props.theme.fontSizes.body.s};
  width: 100%;

  @media (min-width: ${(props) => props.theme.breakpoints.m}) {
    padding-bottom: ${(props) => props.theme.spacing.xs};
    border-bottom-style: 1px solid ${(props) => props.theme.colors.black.light};
  }
`;

type Props = {
  user: { name?: string | null; email?: string | null };
};

const NavigationUserMenuUserCard = ({
  user: { name = "Anon", email = " - " },
}: Props): JSX.Element => (
  <StyledUserInfo>
    <Name>{name}</Name>
    <Email>{email}</Email>
  </StyledUserInfo>
);

export { NavigationUserMenuUserCard };
