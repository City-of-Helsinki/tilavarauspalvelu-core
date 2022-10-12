import React from "react";
import styled from "styled-components";
import { useMedia } from "react-use";
import { Breadcrumb } from "common";
import { useTranslation } from "react-i18next";
import { trim } from "lodash";
import { breakpoints } from "common/src/common/style";
import { publicUrl } from "../common/const";

type Alias = {
  slug: string;
  title: string | undefined;
};

type Props = {
  route: string[];
  aliases?: Alias[];
};

const Wrapper = styled.div`
  display: block;
  background-color: var(--color-white);
  border-bottom: 1px solid var(--color-black-20);
`;

const StyledBreadcrumb = styled(Breadcrumb)`
  line-height: 64px;
  margin: 0 0 0 var(--spacing-2-xs);
  overflow: hidden;
`;

const BreadcrumbWrapper = ({ route, aliases }: Props): JSX.Element => {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.s})`, true);

  const routes =
    route?.map((n) => {
      const title = n.split("/").pop();
      return {
        title:
          aliases?.find((alias) => alias.slug === title)?.title ||
          t(`breadcrumb.${trim(title, "/")}`) ||
          "",
        slug: n.includes("/") ? n : "",
      };
    }) || [];

  return (
    <Wrapper>
      <StyledBreadcrumb
        routes={[
          { title: t("breadcrumb.frontpage"), slug: publicUrl },
          ...routes,
        ]}
        isMobile={isMobile}
      />
    </Wrapper>
  );
};

export default BreadcrumbWrapper;
