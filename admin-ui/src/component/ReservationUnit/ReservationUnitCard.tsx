import React from "react";
import styled from "styled-components";
import { IconArrowRight, IconLocate, IconLayers, IconHome } from "hds-react";
import { useTranslation } from "react-i18next";
import { ReservationUnitType } from "../../common/types";
import { H2 } from "../../styles/typography";
import { BasicLink, breakpoints } from "../../styles/util";

interface IProps {
  reservationUnit: ReservationUnitType;
}

const Wrapper = styled.div`
  background-color: var(--color-black-5);
  display: grid;
  margin-bottom: var(--spacing-2-xs);

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 213px auto;
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

  @media (min-width: ${breakpoints.xl}) {
    width: 80%;
  }
`;

const Prop = styled.div<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  font-family: var(--tilavaraus-admin-font-medium);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);

  ${({ $disabled }) => $disabled && "opacity: 0.4;"}
`;

const ReservationUnitCard = ({ reservationUnit }: IProps): JSX.Element => {
  const { t } = useTranslation();

  const image =
    reservationUnit.images.find((i) => i.imageType === "main") ||
    reservationUnit.images.find(() => true);

  return (
    <Wrapper>
      <ImageBox>{image ? <Image src={image?.mediumUrl} /> : null}</ImageBox>
      <Content>
        <BasicLink to={`/reservationUnit/${reservationUnit.pk}`}>
          <H2>{reservationUnit.name}</H2>
          <IconArrowRight />
        </BasicLink>
        <ComboType>
          {t(
            reservationUnit.resources?.length > 1
              ? "ReservationUnitCard.spaceAndResource"
              : "ReservationUnitCard.spaceOnly"
          )}
        </ComboType>
        <Props>
          <Prop $disabled={!(reservationUnit.purposes?.length > 1)}>
            <IconLayers />{" "}
            {t(
              reservationUnit.purposes?.length > 0
                ? "ReservationUnitCard.purpose"
                : "ReservationUnitCard.noPurpose",
              { count: reservationUnit.purposes?.length }
            )}
          </Prop>
          <Prop $disabled={!reservationUnit.reservationUnitType}>
            <IconHome />{" "}
            {reservationUnit.reservationUnitType?.name ||
              t("ReservationUnitCard.noReservationUnitType")}
          </Prop>
          <Prop $disabled={!reservationUnit.maxPersons}>
            <IconLocate />{" "}
            {reservationUnit.maxPersons ||
              t("ReservationUnitCard.noMaxPersons")}
          </Prop>
        </Props>
      </Content>
    </Wrapper>
  );
};

export default ReservationUnitCard;
