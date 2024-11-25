import { IconArrowRight } from "hds-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H3 } from "common/src/common/typography";
import type { PurposeNode } from "@gql/gql-types";
import { ShowAllContainer } from "common/src/components";
import { singleSearchPrefix } from "@/modules/urls";
import ReservationUnitSearch from "./ReservationUnitSearch";
import { anchorStyles, focusStyles } from "common/styles/cssFragments";
import { pixel } from "@/styles/util";
import { getTranslationSafe } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import { Flex } from "common/styles/util";

type Props = {
  purposes: Pick<
    PurposeNode,
    "pk" | "nameFi" | "nameEn" | "nameSv" | "smallUrl" | "imageUrl"
  >[];
};

const Top = styled(Flex).attrs({
  $justify: "space-between",
  $direction: "row",
  $wrap: "wrap",
})`
  width: 100%;

  & > * {
    flex-grow: 1;
  }
`;

const PurposeContainer = styled(ShowAllContainer)`
  width: 100%;
  .ShowAllContainer__Content {
    display: grid;
    gap: var(--spacing-l) var(--spacing-m);
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
`;

const PurposeItem = styled(Flex).attrs({
  gap: "xs",
})`
  &:hover {
    text-decoration: underline;
  }
`;

const PurposeLink = styled(Link)`
  ${focusStyles}
  ${anchorStyles}
`;

const Image = styled.img`
  height: 125px;
  object-fit: cover;

  @media (min-width: ${breakpoints.m}) {
    height: 180px;
  }
`;

const Title = styled(Flex).attrs({
  $direction: "row",
  $align: "center",
  $gap: "xs",
})``;

export function Purposes({ purposes }: Props): JSX.Element {
  const { t, i18n } = useTranslation(["home", "common"]);

  const isMobile = useMedia(`(max-width: ${breakpoints.s})`, false);

  const itemLimit = useMemo(() => (isMobile ? 4 : 8), [isMobile]);

  const getImg = (item: Pick<PurposeNode, "smallUrl" | "imageUrl">) => {
    return item.smallUrl || item.imageUrl || pixel;
  };
  const lang = getLocalizationLang(i18n.language);
  const getName = (item: Pick<PurposeNode, "nameFi" | "nameEn" | "nameSv">) => {
    return getTranslationSafe(item, "name", lang);
  };

  // TODO the search (the first section) doesn't belong here
  return (
    <>
      <Top>
        <H3 as="h2" $noMargin>
          {t("purposesHeading")}
        </H3>
        <ReservationUnitSearch />
      </Top>
      <PurposeContainer
        showAllLabel={t("common:showMore")}
        showLessLabel={t("common:showLess")}
        maximumNumber={itemLimit}
        alignButton="right"
        data-testid="front-page__purposes"
      >
        {purposes.map((item) => (
          <PurposeLink
            key={item.pk}
            href={`${singleSearchPrefix}?purposes=${item.pk}#content`}
          >
            <PurposeItem data-testid="front-page__purposes--purpose">
              <Image src={getImg(item)} alt="" aria-hidden="true" />
              <Title>
                <span>{getName(item)} </span>
                <IconArrowRight size="s" aria-hidden="true" />
              </Title>
            </PurposeItem>
          </PurposeLink>
        ))}
      </PurposeContainer>
    </>
  );
}
