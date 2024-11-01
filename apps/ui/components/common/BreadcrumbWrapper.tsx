import React from "react";
import { useMedia } from "react-use";
import { Breadcrumb, RouteItem } from "common/src/breadcrumb/Breadcrumb";
import { useTranslation } from "next-i18next";
import { breakpoints } from "common/src/common/style";
import Link, { LinkProps } from "next/link";
import { trim } from "lodash";

type Props = {
  route: Array<string | RouteItem>;
  className?: string;
};

// Breadcrumbs are shared with admin ui which uses react-router which requires an anchor elem
const LinkWrapper = (props: LinkProps & { children?: React.ReactNode }) => (
  <Link {...props}>{props.children}</Link>
);

function BreadcrumbWrapper({ route, className }: Props): JSX.Element {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.m})`, false);

  const routes = route.map((n) => {
    if (typeof n === "object") {
      return n;
    }
    return {
      title: t(`breadcrumb:${trim(n, "/")}`),
      ...(n.includes("/") && { slug: n }),
    };
  });

  return (
    <Breadcrumb
      linkComponent={LinkWrapper}
      routes={[{ title: t("breadcrumb:frontpage"), slug: "/" }, ...routes]}
      isMobile={isMobile}
      className={className}
    />
  );
}

export default BreadcrumbWrapper;
