import React from "react";
import Link from "next/link";
import styled from "styled-components";
import { fontMedium } from "../common/typography";

interface IconButtonProps {
  // the button label text
  label: string;
  // a HDS-icon element (use `null` if no icon is desired)
  icon: React.ReactNode;
  // the link URI (defaults to "javascript:void(0);" to not interfere with onClick if not in use)
  href?: string;
  // should the link open in a new tab (true if href begins "http...", otherwise false by default)
  openInNewTab?: boolean;
  // an optional function to call when clicking the button
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  [rest: string]: unknown; // any other params, like id/aria/testing/etc
}

const Container = styled.div`
  margin: var(--spacing-s) 0;
  display: flex;
  align-items: center;
  text-decoration: none !important;
`;

const linkStyles = `
  color: var(--color-black);
  text-decoration: none;
  &:hover {
    text-decoration: none;
  }
`;

const StyledLink = styled(Link)`
  ${linkStyles}
`;

const StyledLinkButton = styled.button`
  background: none;
  border: none;
  -webkit-appearance: none;
  padding: 0;
`;

const Anchor = styled.a`
  color: var(--color-black) !important;
`;

const HoverWrapper = styled.div`
  display: flex;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-3-xs);
  border-bottom: 1px solid transparent;
  align-items: center;
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
`;

const LinkElement = ({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) => (
  <Container>
    <HoverWrapper>
      <Label>{label}</Label>
      {icon && <IconContainer>{icon}</IconContainer>}
    </HoverWrapper>
  </Container>
);

type LinkWrapperProps = {
  label: string;
  icon: React.ReactNode;
  href: string;
};
const LinkWrapper = ({ label, icon, href, ...rest }: LinkWrapperProps) =>
  String(href).substring(0, 4) !== "http" ? (
    <StyledLink {...rest} href={href}>
      <LinkElement label={label} icon={icon} />
    </StyledLink>
  ) : (
    <Anchor {...rest} href={href}>
      <LinkElement label={label} icon={icon} />
    </Anchor>
  );
/*
 *  @param {string} label - the button label text (required)
 *  @param {React.ReactNode | null} icon - an HDS-icon element (required, use `null` if no icon is desired)
 *  @param {string} [href] - the link URI (optional) if none is provided, renders a non-link button
 *  @param {boolean} [openInNewTab] - should the link open in a new tab (optional, default true if href begins "http...")
 *  @param {function} [onClick] - a function to execute upon clicking the button (optional)
 *  @returns {JSX.Element} A `<Link>` for internal or an `<a>` for external `href`s, with the `icon` aligned to the
 *  right of the `label` text. Can also be used as a non-link button via the `onClick` attribute (still renders an
 *  `<a>` element). Accepts other parameters through `...rest` - for id's, aria-attributes, testing etc.
 */
const IconButton = ({
  icon,
  label,
  href,
  openInNewTab = !!href && href.substring(0, 4) === "http", // open external links in a new tab by default
  ...rest
}: IconButtonProps): JSX.Element => {
  const linkOptions = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    ...rest,
  };

  return href == null ? (
    <StyledLinkButton type="button" {...rest}>
      <LinkElement label={label} icon={icon} />
    </StyledLinkButton>
  ) : (
    <LinkWrapper {...linkOptions} href={href} label={label} icon={icon} />
  );
};
export default IconButton;
