import React from "react";
import styled, { css } from "styled-components";
import { useMedia } from "react-use";
import { Breadcrumb } from "common";
import { useTranslation } from "react-i18next";
import { trim } from "lodash";
import { breakpoints } from "common/src/common/style";
import { publicUrl } from "../common/const";
import LinkPrev from "./LinkPrev";

type Alias = {
  slug: string;
  title: string | undefined;
};

// Enforce either route or backLink has to be defined
// TODO could do more extensive checks to remove route and aliases from LinkOnlyProps
type Props = {
  route: string[] | Array<{ slug: string; alias?: string }>;
  aliases?: Alias[];
  backLink?: string;
};

type LinkOnlyProps = {
  backLink: string;
} & Partial<Omit<Props, "backLink">>;

const Wrapper = styled.div`
  display: block;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-black-20);
`;

const navStyling = css`
  line-height: 64px;
  margin: 0 0 0 var(--spacing-2-xs);
  overflow: hidden;
`;
const StyledBreadcrumb = styled(Breadcrumb)`
  ${navStyling}
`;
const StyledLinkPrev = styled(LinkPrev)`
  ${navStyling}
`;
const LinkWrapper = styled.div`
  padding-left: var(--spacing-m);
`;

/**
 * @param route - array of strings or objects with slug and alias
 * @param aliases - deprecated, use route instead
 * @param backLink - if set, renders a back link instead of breadcrumb
 */
const BreadcrumbWrapper = (props: Props | LinkOnlyProps): JSX.Element => {
  const { route, aliases, backLink } = props;
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.s})`, true);

  const routes =
    route?.map((n) => {
      if (typeof n === "object") {
        return {
          title: n.alias || t(`breadcrumb.${trim(n.slug, "/")}`) || "",
          slug: n.slug,
        };
      }

      const title = n.split("/").pop();
      return {
        title:
          aliases?.find((alias) => alias.slug === title)?.title ||
          t(`breadcrumb.${trim(title, "/")}`) ||
          "",
        slug: n.includes("/") ? n : "",
      };
    }) || [];

  if (backLink != null) {
    return (
      <LinkWrapper>
        <StyledLinkPrev route={backLink} />
      </LinkWrapper>
    );
  }

  return (
    <Wrapper>
      <StyledBreadcrumb
        routes={[
          { title: t("breadcrumb.frontpage"), slug: publicUrl ?? "/" },
          ...routes,
        ]}
        isMobile={isMobile}
      />
    </Wrapper>
  );
};

export default BreadcrumbWrapper;
