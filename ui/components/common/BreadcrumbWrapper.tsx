import React from "react";
import styled from "styled-components";
import { useMedia } from "react-use";
import { Breadcrumb } from "common";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { trim } from "lodash";
import { breakpoint } from "../../modules/style";

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
  const isMobile = useMedia(`(max-width: ${breakpoint.m})`);

  const routes =
    route
      ?.filter((n) => n)
      .map((n) => ({
        title:
          aliases?.find((alias) => alias.slug === n)?.title ||
          t(`breadcrumb:${trim(n, "/")}`),
        ...(n.includes("/") && { slug: n }),
      })) || [];

  return (
    <Wrapper>
      <Breadcrumb
        linkComponent={Link}
        routes={[{ title: t("breadcrumb:frontpage"), slug: "/" }, ...routes]}
        isMobile={isMobile}
      />
    </Wrapper>
  );
};

export default BreadcrumbWrapper;
