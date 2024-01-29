import React from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
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

const focusStyles = css`
  --background-color-focus: transparent;
  --color-focus: var(--color-black);
  --focus-outline-color: var(--color-focus-outline);
  --outline-width: 3px;

  &:focus-within,
  &:focus-visible {
    transition-property: background-color, border-color, color;
    transition-duration: 85ms;
    transition-timing-function: ease-out;
    background-color: var(--background-color-focus, transparent);
    color: var(--color-focus);
    outline: none;
    box-shadow: 0 0 2px var(--outline-width) var(--focus-outline-color);
  }
`;

const linkStyles = css`
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
  /* stylelint-disable-next-line property-no-vendor-prefix -- iOS problems */
  -webkit-appearance: none;
  padding: 0;
  ${linkStyles}
  ${focusStyles}

  &:disabled {
    color: var(--color-black-50);
    & * :hover {
      cursor: not-allowed;
      border-color: transparent;
    }
  }
`;

/* allow disabled links */
const Anchor = styled.a`
  && {
    color: var(--color-black-30);
    cursor: default;
    &:link {
      color: var(--color-black);
      cursor: pointer;
    }
  }
`;

const HoverWrapper = styled.div<{ $disabled?: boolean }>`
  display: flex;
  gap: var(--spacing-xs);
  padding-bottom: var(--spacing-3-xs);
  border-bottom: 1px solid transparent;
  align-items: center;
  ${focusStyles}
  ${({ $disabled }) => $disabled && "pointer-events: none;"}
  &:hover {
    ${({ $disabled }) => !$disabled && "border-color: var(--color-black-30);"}
  }
  &:active {
    border-width: 2px;
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
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
}) => (
  <Container>
    <HoverWrapper $disabled={disabled}>
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

const LinkWrapper = ({ label, icon, href, ...rest }: LinkWrapperProps) => {
  const isExternal = href.startsWith("http");

  // next/link doesn't work with empty hrefs
  if (href === "") {
    return (
      <Anchor {...rest}>
        <LinkElement label={label} icon={icon} disabled />
      </Anchor>
    );
  }
  if (isExternal) {
    return (
      <Anchor {...rest} href={href}>
        <LinkElement label={label} icon={icon} />
      </Anchor>
    );
  }
  return (
    <StyledLink {...rest} href={href}>
      <LinkElement label={label} icon={icon} />
    </StyledLink>
  );
};

/*
 *  @param {string} label - the button label text (required)
 *  @param {React.ReactNode} icon - an HDS-icon element (required)
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
  openInNewTab = !!href && href.startsWith("http"), // open external links in a new tab by default
  ...rest
}: IconButtonProps): JSX.Element => {
  const linkOptions = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    // role: openInNewTab ? "link" : "button",
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
