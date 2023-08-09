import styled from "styled-components";
import React from "react";
import Link from "next/link";
import { fontMedium } from "common/src/common/typography";

interface IconLinkProps {
  icon: React.ReactNode | null;
  href: string;
  linkText: string;
  openInNewTab?: boolean;
  callback?: () => void;
  rest?: unknown;
}

const Container = styled.div`
  margin-top: var(--spacing-s);
  display: flex;
  align-items: center;
  text-decoration: none !important;
`;

const Anchor = styled.a`
  color: var(--black) !important;
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

const Name = styled.span`
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

const IconLink = ({
  icon,
  label,
  callback,
  href = "javascript:void(0);",
  openInNewTab = href.substring(0, 4) === "http",
  ...rest
}: IconLinkProps): JSX.Element => {
  const DisplayedIconLink = () => (
    <Container>
      <HoverWrapper>
        <Name>{linkText}</Name>
        <IconContainer>{icon && icon}</IconContainer>
      </HoverWrapper>
    </Container>
  );
  const linkProps = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    style: { color: "--var(color-black)" },
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
    <Anchor {...linkProps}>
      <DisplayedIconLink />
    </Anchor>
  ) : (
    <Link {...linkProps}>
      <DisplayedIconLink />
    </Link>
  );
};
export default IconLink;
