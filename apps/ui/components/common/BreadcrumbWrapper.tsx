import React from "react";
import styled from "styled-components";
import { useMedia } from "react-use";
import Breadcrumb, { RouteItem } from "common/src/breadcrumb/Breadcrumb";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/common/style";
import Link, { LinkProps } from "next/link";
import { trim } from "lodash";

type Alias = {
  slug: string;
  title: string;
};

type Props = {
  route: Array<string | RouteItem>;
  aliases?: Alias[];
  className?: string;
};

const Wrapper = styled.div`
  display: block;
  background-color: var(--color-white);
`;

// Breadcrumbs are shared with admin ui which uses react-router which requires an anchor elem
const LinkWrapper = (props: LinkProps & { children?: React.ReactNode }) => (
  <Link legacyBehavior {...props}>
    {props.children}
  </Link>
);

const BreadcrumbWrapper = ({
  route,
  aliases,
  className,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const routes = route.map((n) => {
    if (typeof n === "object") {
      return n;
    }
    return {
      title:
        aliases?.find((alias) => alias.slug === n)?.title ||
        t(`breadcrumb:${trim(n, "/")}`),
      ...(n.includes("/") && { slug: n }),
    };
  });

  return (
    <Wrapper>
      <Breadcrumb
        linkComponent={LinkWrapper}
        routes={[{ title: t("breadcrumb:frontpage"), slug: "/" }, ...routes]}
        isMobile={isMobile}
        className={className}
      />
    </Wrapper>
  );
};

export default BreadcrumbWrapper;
