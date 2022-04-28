import React from "react";
import styled from "styled-components";
import { useMedia } from "react-use";
import { Breadcrumb } from "common";
import { useTranslation } from "react-i18next";
import { trim } from "lodash";
import { breakpoints } from "../styles/util";

type Alias = {
  slug: string;
  title: string;
};

type Props = {
  route: string[];
  aliases?: Alias[];
};

const Wrapper = styled.div`
  display: block;
  background-color: var(--color-white);
`;

const BreadcrumbWrapper = ({ route, aliases }: Props): JSX.Element => {
  const { t } = useTranslation();
  const isMobile = useMedia(`(max-width: ${breakpoints.s})`, true);

  const routes =
    route?.map((n) => ({
      title:
        aliases?.find((alias) => alias.slug === n)?.title ||
        t(`breadcrumb:${trim(n, "/")}`) ||
        "",
      slug: n.includes("/") ? n : "",
    })) || [];

  return (
    <Wrapper>
      <Breadcrumb
        routes={[{ title: t("breadcrumb:frontpage"), slug: "/" }, ...routes]}
        isMobile={isMobile}
      />
    </Wrapper>
  );
};

export default BreadcrumbWrapper;
