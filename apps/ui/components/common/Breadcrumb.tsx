import React, { ElementType, Fragment } from "react";
import styled, { css } from "styled-components";
import { IconAngleLeft, IconAngleRight } from "hds-react";
import { fontMedium } from "common";

export type RouteItem = {
  title: string;
  slug?: string;
};

type Props = {
  routes: RouteItem[];
  isMobile: boolean;
  linkComponent?: ElementType;
  className?: string;
};

const limits = {
  default: 25,
  current: 40,
};

const Nav = styled.nav<{ $isMobile?: boolean }>`
  font-size: var(--fontsize-body-m);
  display: flex;
  align-items: center;
  line-height: var(--spacing-3-xl);

  && > a {
    text-decoration: underline;
  }

  svg {
    margin: 0 var(--spacing-3-xs);
  }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  max-width: 100%;
`;

const currentCss = css`
  color: var(--color-black);
  ${fontMedium}
`;

const Anchor = styled.span<{ $current?: boolean; $isMobile?: boolean }>`
  && {
    ${({ $current }) => {
      switch ($current) {
        case true:
          return currentCss;
        case false:
        default:
          return `
            color: var(--color-black);
            text-decoration: underline;
          `;
      }
    }}
  }

  ${({ $isMobile }) =>
    $isMobile &&
    `
    overflow: hidden;
    text-overflow: ellipsis;
  }
  `};

  white-space: nowrap;
`;

const Slug = styled.span<{ $current?: boolean }>`
  ${({ $current }) => $current && currentCss}

  white-space: nowrap;
`;

export function Breadcrumb({
  routes = [],
  isMobile,
  linkComponent,
  className,
}: Props): JSX.Element {
  const Link = linkComponent || Fragment;

  const routesWithSlug = routes?.filter((n) => n.slug != null && n.slug !== "");
  const lastRoute = routes[routes.length - 1];
  const lastRouteWithSlug = routesWithSlug[routesWithSlug.length - 1];

  // TODO why are we doing this? is there a case where we need to do this?
  // or would it just be better to pass hideMobileBreadcrumb prop to the component
  // instead of having hidden logic here?
  const isMobileEnabled =
    isMobile &&
    routesWithSlug.length > 1 &&
    lastRoute.slug !== lastRouteWithSlug.slug;

  return (
    <Nav
      className={className}
      data-testid="breadcrumb__wrapper"
      $isMobile={isMobile}
    >
      {!isMobile ? (
        routes?.map((item, index) => (
          <Item key={`${item.title}${item.slug}`}>
            {index > 0 && (
              <IconAngleRight size="s" aria-hidden className="angleRight" />
            )}
            {item.slug ? (
              <Link {...(linkComponent && { href: item.slug, passHref: true })}>
                <Anchor
                  {...(!linkComponent && { href: item.slug })}
                  $current={index === routes.length - 1}
                >
                  {index === routes.length - 1
                    ? item.title.length > limits.current
                      ? `${item.title.slice(0, limits.current)}...`
                      : item.title
                    : item.title.length > limits.default
                      ? `${item.title.slice(0, limits.default)}...`
                      : item.title}
                </Anchor>
              </Link>
            ) : (
              <Slug $current={index === routes.length - 1}>
                {index === routes.length - 1
                  ? item.title.length > limits.current
                    ? `${item.title.slice(0, limits.current)}...`
                    : item.title
                  : item.title.length > limits.default
                    ? `${item.title.slice(0, limits.default)}...`
                    : item.title}
              </Slug>
            )}
          </Item>
        ))
      ) : isMobileEnabled ? (
        <Item>
          <IconAngleLeft size="s" aria-hidden className="angleLeft" />
          <Link
            {...(linkComponent && {
              href: lastRouteWithSlug?.slug,
              passHref: true,
            })}
          >
            <Anchor
              {...(!linkComponent && { href: lastRouteWithSlug?.slug })}
              $isMobile
            >
              {lastRouteWithSlug.title}
            </Anchor>
          </Link>
        </Item>
      ) : null}
    </Nav>
  );
}
