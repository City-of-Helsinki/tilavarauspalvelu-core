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
import { H2 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { BasicLink } from "../../styles/util";
import {
  ReservationUnitsReservationUnitImageImageTypeChoices,
  ReservationUnitType,
} from "../../common/gql-types";
import { ReactComponent as IconDraft } from "../../images/icon_draft.svg";

interface IProps {
  reservationUnit: ReservationUnitType;
  unitId: number;
}

const Wrapper = styled.div`
  background-color: var(--color-black-5);
  display: grid;
  margin-bottom: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 213px auto;
  }
  @media (min-width: ${breakpoints.xl}) {
    width: 90%;
  }
`;

const ImageBox = styled.div`
  display: none;
  height: 160px;

  @media (min-width: ${breakpoints.l}) {
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
  height: 160px;
  width: 100%;
  object-fit: cover;
`;

const Content = styled.div`
  padding: var(--spacing-m) var(--spacing-l);

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
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: var(--spacing-m);
  }
`;

const Prop = styled.div<{ $disabled: boolean }>`
  overflow: hidden;
  display: grid;
  grid-template-columns: 32px 1fr;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}

  &:last-child {
    justify-self: end;
  }
`;

const Published = styled(Tag)`
  background-color: var(--color-success);
  color: var(--color-white);
`;

const NoBr = styled.span`
  white-space: nowrap;
`;

const ReservationUnitCard = ({
  reservationUnit,
  unitId,
}: IProps): JSX.Element => {
  const { t } = useTranslation();

  const image =
    reservationUnit.images?.find(
      (i) =>
        i?.imageType ===
        ReservationUnitsReservationUnitImageImageTypeChoices.Main
    ) || reservationUnit.images?.find(() => true);

  const hasPurposes = (reservationUnit?.purposes?.length || 0) > 0;

  return (
    <Wrapper>
      <ImageBox>
        {image?.mediumUrl ? <Image src={image?.mediumUrl} /> : null}
      </ImageBox>
      <Content>
        <BasicLink
          to={`/unit/${unitId}/reservationUnit/edit/${reservationUnit.pk}`}
        >
          <H2>{reservationUnit.nameFi}</H2>
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
            <NoBr>
              {t(
                hasPurposes
                  ? "ReservationUnitCard.purpose"
                  : "ReservationUnitCard.noPurpose",
                { count: reservationUnit.purposes?.length }
              )}
            </NoBr>
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
          <Prop $disabled={false}>
            {reservationUnit.isDraft ? (
              <>
                <IconDraft />
                {t("ReservationUnitCard.stateDraft")}
              </>
            ) : (
              <>
                <span />
                <Published>{t("ReservationUnitCard.statePublished")}</Published>
              </>
            )}
          </Prop>
        </Props>
      </Content>
    </Wrapper>
  );
};

export default ReservationUnitCard;
