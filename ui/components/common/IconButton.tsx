import styled from "styled-components";
import React from "react";
import Link from "next/link";
import { fontMedium } from "common/src/common/typography";

interface IconButtonProps {
  icon: React.ReactNode | null;
  href?: string;
  label: string;
  openInNewTab?: boolean;
  callback?: () => void;
  rest?: unknown; // for possible id's, aria-attributes etc
}

const Container = styled.div`
  margin-top: var(--spacing-s);
  display: flex;
  align-items: center;
  text-decoration: none !important;
`;

const Anchor = styled.a`
  color: var(--color-black) !important;
`;

const HoverWrapper = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-3-xs);
  border-bottom: 1px solid transparent;
  color: var(--color-black) !important;
  &:hover {
    border-color: var(--color-black-30);
  }
  &:focus,
  &:active {
    border-width: 2px;
  }
  &:focus {
    border-color: var(--color-bus);
  }
  &:active {
    border-color: var(--color-black);
  }
`;

const Label = styled.span`
  display: flex;
  flex-direction: row;
  font-size: var(--fontsize-body-m);
  ${fontMedium}
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: var(--icon-size-m);
`;

const IconButton = ({
  icon,
  label,
  callback,
  href = callback && "javascript:void(0);", // there's no href if using callback
  openInNewTab = href.substring(0, 4) === "http", // open external links in a new tab by default
  ...rest
}: IconButtonProps): JSX.Element => {
  const buttonProps = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    onClick: callback
      ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          callback();
        }
      : undefined,
    ...rest,
  };
  return href.substring(0, 4) === "http" ? (
    <Anchor {...buttonProps}>
      <Container>
        <HoverWrapper>
          <Label>{label}</Label>
          <IconContainer>{icon && icon}</IconContainer>
        </HoverWrapper>
      </Container>
    </Anchor>
  ) : (
    <Link {...buttonProps}>
      <Container>
        <HoverWrapper>
          <Label>{label}</Label>
          <IconContainer>{icon && icon}</IconContainer>
        </HoverWrapper>
      </Container>
    </Link>
  );
};
export default IconButton;
