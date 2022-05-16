import React from "react";
import styled from "styled-components";
import { breakpoints } from "../common/style";

type Props = {
  name: string;
  email: string;
};

const Wrapper = styled.div`
  word-break: break-all;
  color: var(--color-black);
  padding: 0 0 var(--spacing-s) 36px;
  border: 0;

  @media (min-width: ${breakpoints.m}) {
    padding: var(--spacing-s) var(--spacing-s) var(--spacing-xs)
      var(--spacing-s);
  }
`;

const Name = styled.div`
  display: none;
  @media (min-width: ${breakpoints.m}) {
    display: block;
  }
`;
const Email = styled.div`
  font-size: var(--fontsize-body-s);
  width: 100%;
  @media (min-width: ${breakpoints.m}) {
    padding-bottom: var(--spacing-xs);
    border-bottom: 1px solid var(--color-black-20);
  }
`;

const UserInfo = ({ name, email }: Props): JSX.Element => (
  <Wrapper>
    <Name>{name}</Name>
    <Email>{email}</Email>
  </Wrapper>
);

export default UserInfo;
