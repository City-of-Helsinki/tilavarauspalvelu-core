import type { CSSProperties } from "react";
import Link from "next/link";
import styled, { css } from "styled-components";
import type { ButtonStyleProps } from "../styled";
import { fontMedium, ButtonCss } from "../styled";

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

export const NextLink = styled(Link)<ButtonStyleProps>`
  ${buttonStyles}
`;

export const AnchorLink = styled.a<ButtonStyleProps>`
  ${buttonStyles}
`;

export const ButtonLikeLink = ({ disabled, href, external, ...rest }: ButtonLikeLinkProps) => {
  const realHref = disabled || href == null || href === "" ? undefined : href;
  if (!realHref || !!external) {
    return <AnchorLink {...rest} href={realHref} disabled={realHref == null} />;
  }
  return <NextLink {...rest} href={href} />;
};
