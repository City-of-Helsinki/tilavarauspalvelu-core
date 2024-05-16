import React from "react";
import styled from "styled-components";
import {
  IconArrowRight,
  IconLayers,
  IconHome,
  IconGroup,
  Tag,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { H2, fontMedium } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { ImageType, type UnitQuery } from "@gql/gql-types";
import { BasicLink } from "@/styles/util";
import IconDraft from "@/images/icon_draft.svg";
import { getImageSource } from "common/src/helpers";

type UnitType = NonNullable<UnitQuery["unit"]>;
type ReservationUnitType = NonNullable<UnitType["reservationunitSet"]>[0];
interface IProps {
  reservationUnit: ReservationUnitType;
  unitId: number;
}

const Wrapper = styled.div`
  background-color: var(--color-black-5);
  display: grid;

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 213px auto;
  }
  @media (min-width: ${breakpoints.xl}) {
    width: 90%;
  }
`;

// NOTE height is weird, we should have the card height defined then wouldn't this kinda hacks
// with 160px the text overflows, 100% without image => 213px (becomes a square)
const ImageBox = styled.div`
  display: none;
  height: 160px;

  @media (min-width: ${breakpoints.l}) {
    height: 100%;
    max-height: 180px;
    background-color: var(--color-silver);
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      transform: scale(1.4);
    }
  }
`;

const Image = styled.img`
  height: 100%;
  width: 100%;
  object-fit: cover;
`;

const Content = styled.div`
  padding: var(--spacing-m);

  ${H2} {
    margin: 0;
  }
`;

const ComboType = styled.div`
  padding: var(--spacing-xs) 0 var(--spacing-s) 0;
`;

const Props = styled.div`
  @media (min-width: ${breakpoints.s}) {
    display: grid;
    grid-template-columns: repeat(4, auto);
    gap: var(--spacing-m);
  }
`;

const Prop = styled.div<{ $disabled?: boolean }>`
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  ${fontMedium}

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}

  &:last-child {
    justify-self: end;
  }
`;

const Published = styled(Tag)`
  background-color: var(--color-success);
  color: var(--color-white);
`;

const NoWrap = styled.span`
  white-space: nowrap;
`;

export function ReservationUnitCard({
  reservationUnit,
  unitId,
}: IProps): JSX.Element {
  const { t } = useTranslation();

  const image =
    reservationUnit.images?.find((i) => i?.imageType === ImageType.Main) ??
    reservationUnit.images?.find(() => true) ??
    null;

  const hasPurposes = (reservationUnit?.purposes?.length || 0) > 0;

  // TODO use urlBuilder
  const link = `/unit/${unitId}/reservationUnit/edit/${reservationUnit.pk}`;
  const imgSrc = getImageSource(image, "medium");

  return (
    <Wrapper>
      <ImageBox>
        <Image src={imgSrc} alt="" />
      </ImageBox>
      <Content>
        <BasicLink to={link}>
          <H2 $legacy>{reservationUnit.nameFi}</H2>
          <IconArrowRight />
        </BasicLink>
        <ComboType>
          {t(
            (reservationUnit?.resources?.length || 0) > 1
              ? "ReservationUnitCard.spaceAndResource"
              : "ReservationUnitCard.spaceOnly"
          )}
        </ComboType>
        <Props>
          <Prop $disabled={!hasPurposes}>
            <IconLayers />{" "}
            <NoWrap>
              {t(
                hasPurposes
                  ? "ReservationUnitCard.purpose"
                  : "ReservationUnitCard.noPurpose",
                { count: reservationUnit.purposes?.length }
              )}
            </NoWrap>
          </Prop>
          <Prop $disabled={!reservationUnit.reservationUnitType}>
            <IconHome />{" "}
            {reservationUnit.reservationUnitType?.nameFi ||
              t("ReservationUnitCard.noReservationUnitType")}
          </Prop>
          <Prop $disabled={!reservationUnit.maxPersons}>
            <IconGroup />{" "}
            {reservationUnit.maxPersons ||
              t("ReservationUnitCard.noMaxPersons")}
          </Prop>
          <Prop>
            {reservationUnit.isArchived ? (
              <>
                <IconDraft />
                {t("ReservationUnitCard.stateArchived")}
              </>
            ) : reservationUnit.isDraft ? (
              <>
                <IconDraft />
                {t("ReservationUnitCard.stateDraft")}
              </>
            ) : (
              <Published>{t("ReservationUnitCard.statePublished")}</Published>
            )}
          </Prop>
        </Props>
      </Content>
    </Wrapper>
  );
}
