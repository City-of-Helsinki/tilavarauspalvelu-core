import styled from "styled-components";
import React from "react";
import Link from "next/link";
import { fontMedium } from "common/src/common/typography";

interface IconButtonProps {
  // the button label text
  label: string;
  // a HDS-icon element (use `null` if no icon is desired)
  icon: React.ReactNode | null;
  // the link URI (defaults to "javascript:void(0);" to not interfere with onClick if not in use)
  href?: string;
  // should the link open in a new tab (true if href begins "http...", otherwise false by default)
  openInNewTab?: boolean;
  // an optional function to call when clicking the button
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  rest?: unknown; // any other params, like id/aria/testing/etc
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

/*
 *  @param {string} label - the button label text (required)
 *  @param {React.ReactNode | null} icon - a HDS-icon element (required, use `null` if no icon is desired)
 *  @param {string} [href] - the link URI (optional, defaults to "javascript:void(0);")
 *  @param {boolean} [openInNewTab] - should the link open in a new tab (optional, default true if href begins "http...")
 *  @param {function} [onClick] - a function to execute upon clicking the button (optional)
 *  @returns {JSX.Element} A `<Link>` for internal or an `<a>` for external `href`s, with the `icon` aligned to the
 *  right of the `label` text. Can also be used as a non-link button via the `onClick` attribute (still renders an
 *  `<a>` element). Accepts other parameters through `...rest` - for id's, aria-attributes, testing etc.
 */
const IconButton = ({
  icon,
  label,
  onClick,
  href = onClick && "javascript:void(0);", // there's no href if using callback
  openInNewTab = !!href && href.substring(0, 4) === "http", // open external links in a new tab by default
  ...rest
}: IconButtonProps): JSX.Element => {
  const buttonProps = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    onClick: onClick ? (e) => onClick(e) : undefined,
    ...rest,
  };
  return !!href && href.substring(0, 4) !== "http" ? (
    <Link {...buttonProps}>
      <Container>
        <HoverWrapper>
          <Label>{label}</Label>
          {icon && <IconContainer>{icon}</IconContainer>}
        </HoverWrapper>
      </Container>
    </Link>
  ) : (
    <Anchor {...buttonProps}>
      <Container>
        <HoverWrapper>
          <Label>{label}</Label>
          {icon && <IconContainer>{icon}</IconContainer>}
        </HoverWrapper>
      </Container>
    </Anchor>
  );
};
export default IconButton;
