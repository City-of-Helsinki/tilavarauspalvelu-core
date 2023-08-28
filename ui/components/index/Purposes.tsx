import { IconArrowRight } from "hds-react";
import Link from "next/link";
import React, { useMemo } from "react";
import { useTranslation } from "next-i18next";
import { useMedia } from "react-use";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H3 } from "common/src/common/typography";
import { PurposeType } from "common/types/gql-types";
import { ShowAllContainer } from "common/src/components";
import { singleSearchPrefix } from "../../modules/const";
import { getTranslation } from "../../modules/util";
import ReservationUnitSearch from "./ReservationUnitSearch";

type Props = {
  purposes: PurposeType[];
};

const mobileBreakpoint = "450px";

const Wrapper = styled.div`
  margin-bottom: var(--spacing-layout-m);
`;

const Heading = styled(H3).attrs({ as: "h2" })`
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-m);
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    align-items: flex-end;
  }
`;

const PurposeContainer = styled(ShowAllContainer)`
  .ShowAllContainer__Content {
    display: grid;
    gap: var(--spacing-l) var(--spacing-m);
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
`;

const PurposeItem = styled.div`
  &:hover {
    span {
      text-decoration: underline;
    }
  }

  color: var(--color-black) !important;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  line-height: var(--lineheight-l);
  font-size: 22px;

  svg {
    min-width: 24px;
  }
`;

const Image = styled.img`
  height: 125px;
  object-fit: cover;

  @media (min-width: ${breakpoints.m}) {
    height: 180px;
  }
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--fontsize-heading-xs);
  padding-left: var(--spacing-2-xs);
  gap: var(--spacing-xs);
`;

const Purposes = ({ purposes }: Props): JSX.Element => {
  const { t } = useTranslation(["home", "common"]);

  const isMobile = useMedia(`(max-width: ${mobileBreakpoint})`, false);

  const itemLimit = useMemo(() => (isMobile ? 4 : 8), [isMobile]);

  return (
    <Wrapper>
      <Content>
        <Top>
          <Heading>{t("purposesHeading")}</Heading>
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
            <Link
              key={item.pk}
              href={`${singleSearchPrefix}?purposes=${item.pk}#content`}
            >
              <PurposeItem data-testid="front-page__purposes--purpose">
                <Image src={item.smallUrl} alt="" aria-hidden />
                <Title>
                  <span>{getTranslation(item, "name")}</span>
                  <IconArrowRight size="s" aria-hidden />
                </Title>
              </PurposeItem>
            </Link>
          ))}
        </PurposeContainer>
      </Content>
    </Wrapper>
  );
};

export default Purposes;
