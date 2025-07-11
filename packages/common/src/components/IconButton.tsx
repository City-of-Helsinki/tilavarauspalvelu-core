import React, { type HTMLAttributes } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
import { anchorStyles, focusStyles, fontMedium, visitedStyles, Flex } from "../../styled";

interface IconButtonProps extends HTMLAttributes<HTMLButtonElement> {
  // the button label text
  label: string;
  // a HDS-icon element (use `null` if no icon is desired)
  icon: React.ReactNode;
  // the link URI (defaults to "javascript:void(0);" to not interfere with onClick if not in use)
  href?: string | null;
  // should the link open in a new tab (true if href begins "http...", otherwise false by default)
  openInNewTab?: boolean;
  // an optional function to call when clicking the button
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
}

const linkStyles = css`
  --color-link: var(--color-black);
  color: var(--color-link);
  text-decoration: none;
  &:hover {
    text-decoration: none;
  }
`;

// Allow disabling the visited color so internal links look like buttons without borders
const StyledLink = styled(Link)<{ $disableVisitedStyles?: boolean }>`
  ${({ $disableVisitedStyles }) => $disableVisitedStyles && "--link-visited-color: var(--color-link)"};
  ${linkStyles}
  ${focusStyles}
  ${anchorStyles}
  ${visitedStyles}

  /* required for the focus outline to work */
  display: inline-flex;
`;

const StyledLinkButton = styled.button`
  background: none;
  border: none;
  /* stylelint-disable-next-line property-no-vendor-prefix -- iOS problems */
  -webkit-appearance: none;
  padding: 0;
  ${linkStyles}
  ${focusStyles}
  ${fontMedium}

  /* button user-agent sizes are supper small */
  font-size: var(--fontsize-body-m);

  cursor: pointer;
  &:disabled {
    color: var(--color-black-50);
    & * :hover {
      cursor: not-allowed;
      border-color: transparent;
    }
  }
`;

const Anchor = styled.a`
  width: fit-content;
  display: inline-flex;
  ${focusStyles}
  ${anchorStyles}
  ${visitedStyles}
`;

// TODO can't define padding for this otherwise it's not aligned properly since we have no border
// but a bit of padding around the focus outline would be nice
const Container = styled(Flex).attrs({
  $gap: "xs",
  $direction: "row",
  $alignItems: "center",
})<{ $disabled?: boolean }>`
  border-bottom: 1px solid transparent;
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
  ${fontMedium}
`;

const LinkElement = ({ label, icon, disabled }: { label: string; icon: React.ReactNode; disabled?: boolean }) => (
  <Container $disabled={disabled}>
    <Label>{label}</Label>
    {icon}
  </Container>
);

type LinkWrapperProps = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

function LinkWrapper({ label, icon, href, ...rest }: LinkWrapperProps) {
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
    <StyledLink {...rest} href={href} $disableVisitedStyles>
      <LinkElement label={label} icon={icon} />
    </StyledLink>
  );
}

function IconButtonImpl({
  icon,
  label,
  href,
  openInNewTab = !!href && href.startsWith("http"), // open external links in a new tab by default
  ...rest
}: IconButtonProps): JSX.Element {
  if (href == null || href === "") {
    return (
      <StyledLinkButton type="button" {...rest}>
        <LinkElement label={label} icon={icon} />
      </StyledLinkButton>
    );
  }

  const linkOptions = {
    href,
    target: openInNewTab ? "_blank" : undefined,
    rel: openInNewTab ? "noopener noreferrer" : undefined,
    ...rest,
  };

  return <LinkWrapper {...rest} {...linkOptions} href={href} label={label} icon={icon} />;
}

/**
 *  @prop {string} label - the button label text (required)
 *  @prop {React.ReactNode} icon - an HDS-icon element (required)
 *  @prop {string} [href] - the link URI (optional) if none is provided, renders a non-link button
 *  @prop {boolean} [openInNewTab] - should the link open in a new tab (optional, default true if href begins "http...")
 *  @prop {function} [onClick] - a function to execute upon clicking the button (optional)
 *  @returns {JSX.Element} A `<Link>` for internal or an `<a>` for external `href`s, with the `icon` aligned to the
 *  right of the `label` text. Can also be used as a non-link button via the `onClick` attribute (still renders an
 *  `<a>` element). Accepts other parameters through `...rest` - for id's, aria-attributes, testing etc.
 */
function IconButton(props: IconButtonProps): JSX.Element {
  return (
    // Wrap inside a block so the inner element doesn't respond to clicks outside the content
    <div>
      <IconButtonImpl {...props} />
    </div>
  );
}

export default IconButton;
