import React from "react";
import styled from "styled-components";

interface Props {
  children: React.ReactNode;
  color?: "white" | "black";
  htmlFor: string;
  srOnly?: boolean;
}

const Wrapper = styled.label<{ $color: string; $srOnly: boolean }>`
  color: ${({ $color }) =>
    $color === "white" ? "var(--color-white)" : "var(--color-black)"};
  font-weight: 500;
  line-height: 1.5;

  ${({ $srOnly }) =>
    $srOnly &&
    `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    `}
`;

const SearchLabel: React.FC<Props> = ({
  children,
  color = "white",
  htmlFor,
  srOnly = false,
}) => {
  return (
    <Wrapper $color={color} $srOnly={srOnly} htmlFor={htmlFor}>
      {children}
    </Wrapper>
  );
};

export default SearchLabel;
