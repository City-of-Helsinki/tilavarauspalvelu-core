import React, { ElementType, Fragment } from "react";
import styled from "styled-components";
import { IconAngleLeft, IconAngleRight } from "hds-react";

export type RouteItem = {
  title: string;
  slug: string;
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

const Wrapper = styled.nav<{ $isMobile: boolean }>`
  background-color: var(--color-white);
  font-size: var(--fontsize-body-m);
  display: flex;
  align-items: center;
  max-width: var(--container-width-xl);
  margin: 0 auto;
  line-height: var(--spacing-3-xl);
  color: var(--color-black);
  padding: 0 var(--spacing-m);

  && > a {
    color: var(--color-black);
    text-decoration: underline;
  }

  ${({ $isMobile }) =>
    $isMobile &&
    `
      padding-left: var(--spacing-xs);
    `};

  svg {
    margin: 0 var(--spacing-3-xs);
  }
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  max-width: 100%;
`;

const Anchor = styled.a<{ $current?: boolean; $isMobile?: boolean }>`
  &&& {
    ${({ $current }) => {
      switch ($current) {
        case true:
          return `
            color: var(--color-black);
            font-family: HelsinkiGrotesk-Medium, var(--font-default);
            font-weight: 500;
          `;
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
  ${({ $current }) => {
    switch ($current) {
      case true:
        return `
          color: var(--color-black);
          font-family: HelsinkiGrotesk-Medium, var(--font-default);
          font-weight: 500;
        `;
      case false:
      default:
        return ``;
    }
  }}

  white-space: nowrap;
`;

const Breadcrumb = ({
  routes = [],
  isMobile,
  linkComponent,
  className,
}: Props): JSX.Element => {
  const Link = linkComponent || Fragment;

  const routesWithSlug = routes?.filter((n) => n.slug);
  const lastRoute = routes[routes.length - 1];
  const lastRouteWithSlug = routesWithSlug[routesWithSlug.length - 1];

  return (
    <Wrapper
      className={className}
      data-testid="breadcrumb__wrapper"
      $isMobile={isMobile}
    >
      {isMobile &&
        routesWithSlug.length > 1 &&
        lastRoute.slug !== lastRouteWithSlug.slug && (
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
                title={lastRouteWithSlug.title}
                $isMobile
              >
                {lastRouteWithSlug.title}
              </Anchor>
            </Link>
          </Item>
        )}
      {!isMobile &&
        routes?.map((item, index) => (
          <Item key={`${item.title}${item.slug}`}>
            {index > 0 && (
              <IconAngleRight size="s" aria-hidden className="angleRight" />
            )}
            {item.slug ? (
              <Link {...(linkComponent && { href: item.slug, passHref: true })}>
                <Anchor
                  {...(!linkComponent && { href: item.slug })}
                  title={item.title}
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
              <Slug $current={index === routes.length - 1} title={item.title}>
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
        ))}
    </Wrapper>
  );
};

export default Breadcrumb;
