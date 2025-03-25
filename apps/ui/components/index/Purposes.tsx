import { IconArrowRight, IconSize } from "hds-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import type { PurposeCardFragment } from "@gql/gql-types";
import { getSingleSearchPath } from "@/modules/urls";
import { ReservationUnitSearch } from "./ReservationUnitSearch";
import { pixel } from "@/styled/util";
import { breakpoints } from "common/src/common/style";
import { H3 } from "common/src/common/typography";
import { ShowAllContainer } from "common/src/components";
import { anchorStyles, focusStyles } from "common/styles/cssFragments";
import { getTranslationSafe } from "common/src/common/util";
import { getLocalizationLang } from "common/src/helpers";
import { Flex } from "common/styles/util";
import { gql } from "@apollo/client";

const Top = styled(Flex).attrs({
  $justifyContent: "space-between",
  $direction: "row",
  $wrap: "wrap",
})`
  width: 100%;

  & > * {
    flex-grow: 0;
  }
  @media (max-width: ${breakpoints.s}) {
    & > * {
      flex-grow: 1;
    }
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
  $gap: "xs",
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

type Props = {
  purposes: PurposeCardFragment[];
};

export function Purposes({ purposes }: Props): JSX.Element {
  const { t, i18n } = useTranslation(["home", "common"]);
  const isMobile = useMedia(`(max-width: ${breakpoints.s})`, false);
  const itemLimit = useMemo(() => (isMobile ? 4 : 8), [isMobile]);

  const getImg = (item: Pick<PurposeCardFragment, "smallUrl" | "imageUrl">) => {
    return item.smallUrl || item.imageUrl || pixel;
  };
  const lang = getLocalizationLang(i18n.language);
  const getName = (
    item: Pick<PurposeCardFragment, "nameFi" | "nameEn" | "nameSv">
  ) => {
    return getTranslationSafe(item, "name", lang);
  };

  const getSearchLink = (purpose: PurposeCardFragment): string => {
    const params = new URLSearchParams();
    // next/link so it's safer to return invalid search params than empty link
    params.set("purposes", purpose.pk?.toString() ?? "");
    return `${getSingleSearchPath(params)}#content`;
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
          <PurposeLink key={item.pk} href={getSearchLink(item)}>
            <PurposeItem data-testid="front-page__purposes--purpose">
              <Image src={getImg(item)} alt="" aria-hidden="true" />
              <Flex $direction="row" $gap="xs" $alignItems="center">
                <span>{getName(item)} </span>
                <IconArrowRight size={IconSize.Small} />
              </Flex>
            </PurposeItem>
          </PurposeLink>
        ))}
      </PurposeContainer>
    </>
  );
}

export const PURPOSE_CARD_FRAGMENT = gql`
  fragment PurposeCard on PurposeNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    imageUrl
    smallUrl
  }
`;
