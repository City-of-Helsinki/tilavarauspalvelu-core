import React from "react";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";

const MobileWrapper = styled.div<{ $breakpoint: string }>`
  @media (min-width: ${({ $breakpoint }) => $breakpoint}) {
    display: none;
  }
`;

export const JustForMobile = ({
  children,
  customBreakpoint = breakpoints.m,
  style,
}: {
  children: React.ReactNode;
  customBreakpoint?: string;
  style?: React.CSSProperties;
}): JSX.Element => {
  return (
    <MobileWrapper $breakpoint={customBreakpoint} style={style}>
      {children}
    </MobileWrapper>
  );
};

const DesktopWrapper = styled.div<{ $breakpoint: string }>`
  @media (max-width: ${({ $breakpoint }) => $breakpoint}) {
    display: none;
  }
`;

export const JustForDesktop = ({
  children,
  customBreakpoint = breakpoints.m,
  style,
}: {
  children: React.ReactNode;
  customBreakpoint?: string;
  style?: React.CSSProperties;
}): JSX.Element => {
  return (
    <DesktopWrapper $breakpoint={customBreakpoint} style={style}>
      {children}
    </DesktopWrapper>
  );
};
