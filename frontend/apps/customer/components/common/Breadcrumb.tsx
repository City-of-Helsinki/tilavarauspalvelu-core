import React from "react";
import styled, { css } from "styled-components";
import { IconAngleLeft, IconAngleRight, IconSize } from "hds-react";
import { Flex, fontMedium, truncatedText } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import { useMedia } from "react-use";
import Link from "next/link";
import { useTranslation } from "next-i18next";

export type RouteItem = {
  title: string;
  slug?: string;
};

type Props = {
  routes: Readonly<RouteItem[]>;
};

const Nav = styled.nav<{ $isMobile?: boolean }>`
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

const Item = styled(Flex).attrs({
  $alignItems: "center",
  $direction: "row",
  $gap: "none",
})``;

const currentCss = css`
  color: var(--color-black);
  ${fontMedium}
`;

const LIMIT_DEFAULT_CH = 25;
const Anchor = styled(Link)<{ $current?: boolean; $isMobile?: boolean }>`
  && {
    display: inline-block;
    max-width: ${LIMIT_DEFAULT_CH}ch;
    ${truncatedText}
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
`;

const Slug = styled.span<{ $current?: boolean }>`
  ${({ $current }) => $current && currentCss}
  ${truncatedText}
  max-width: ${LIMIT_DEFAULT_CH}ch;
`;

function BreadcrumbImpl({ routes, isMobile }: Pick<Props, "routes"> & { isMobile: boolean }): JSX.Element | null {
  const routesWithSlug = routes?.filter((n) => n.slug != null && n.slug !== "");
  const lastRoute = routes[routes.length - 1];
  const lastRouteWithSlug = routesWithSlug[routesWithSlug.length - 1];
  // TODO why are we doing this? is there a case where we need to do this?
  // or would it just be better to pass hideMobileBreadcrumb prop to the component
  // instead of having hidden logic here?
  const isMobileEnabled =
    isMobile && routesWithSlug.length > 0 && lastRoute != null && lastRoute.slug !== lastRouteWithSlug?.slug;

  if (!isMobileEnabled && isMobile) {
    return null;
  }

  if (isMobile) {
    return (
      <Item>
        <IconAngleLeft size={IconSize.Small} aria-hidden="true" />
        <Anchor href={lastRouteWithSlug?.slug ?? ""} $isMobile>
          {lastRouteWithSlug?.title ?? "-"}
        </Anchor>
      </Item>
    );
  }

  return (
    <>
      {routes.map((item, index) => (
        <Item key={`${item.title}${item.slug}`}>
          {index > 0 && <IconAngleRight size={IconSize.Small} aria-hidden="true" />}
          {item.slug ? (
            <Anchor href={item.slug} $current={index === routes.length - 1} aria-current={index === routes.length - 1}>
              {item.title}
            </Anchor>
          ) : (
            <Slug $current={index === routes.length - 1} aria-current={index === routes.length - 1}>
              {item.title}
            </Slug>
          )}
        </Item>
      ))}
    </>
  );
}

export function Breadcrumb({ routes }: Readonly<Props>): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const routesWithFrontPage = [{ title: t("breadcrumb:frontpage"), slug: "/" }, ...routes];
  return (
    <Nav data-testid="breadcrumb__wrapper" $isMobile={isMobile} aria-label={t("breadcrumb:breadcrumb")}>
      <BreadcrumbImpl routes={routesWithFrontPage} isMobile={isMobile} />
    </Nav>
  );
}
