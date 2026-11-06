import type { CSSProperties } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
import { fontMedium, ButtonCss } from "../styled";
import type { ButtonStyleProps } from "../styled";

type ButtonLikeLinkProps = {
  href: string;
  children: React.ReactNode;
  target?: "_blank" | "_self";
  rel?: "noopener noreferrer";
  className?: string;
  title?: string;
  fontSize?: "small" | "normal" | undefined;
  style?: CSSProperties;
  role?: string;
  disabled?: boolean;
  external?: boolean;
  variant?: "primary" | "secondary" | "inverted";
  size?: "normal" | "large";
  width?: "full" | "auto";
  dataTestId?: string;
};

const buttonStyles = css`
  ${ButtonCss}
  ${fontMedium}
  gap: var(--spacing-s);
  white-space: nowrap;
`;

// These props only drive the styles. Do not pass them to the DOM element.
const STYLE_ONLY_PROPS = new Set<string>(["variant", "size", "fontSize", "width"]);
const shouldForwardProp = (prop: string) => !STYLE_ONLY_PROPS.has(prop);

export const NextLink = styled(Link).withConfig({ shouldForwardProp })<ButtonStyleProps>`
  ${buttonStyles}
`;

export const AnchorLink = styled.a.withConfig({ shouldForwardProp })<ButtonStyleProps>`
  ${buttonStyles}
`;

export const ButtonLikeLink = ({ disabled, href, external, ...rest }: ButtonLikeLinkProps) => {
  const realHref = disabled || href == null || href === "" ? undefined : href;
  if (!realHref || !!external) {
    return <AnchorLink {...rest} href={realHref} disabled={realHref == null} />;
  }
  return <NextLink {...rest} href={href} />;
};
