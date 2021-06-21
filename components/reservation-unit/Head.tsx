import {
  Button,
  IconCheck,
  IconGroup,
  IconInfoCircle,
  IconPlus,
  Koros,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import useReservationUnitList from "../../hooks/useReservationUnitList";
import { breakpoint } from "../../modules/style";
import { ReservationUnit as ReservationUnitType } from "../../modules/types";
import { getMainImage, localizedValue } from "../../modules/util";
import Back from "../common/Back";
import Container from "../common/Container";
import IconWithText from "../common/IconWithText";
import Notification from "./Notification";

interface PropsType {
  reservationUnit: ReservationUnitType;
  reservationUnitList: ReturnType<typeof useReservationUnitList>;
}

const TopContainer = styled.div`
  background-color: white;
`;

const RightContainer = styled.div`
  font-size: var(--fontsize-body-m);

  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-s);

  div > h1 {
    margin-top: 0;
  }

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr;
  }
`;

const Props = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-s);
`;

const ReservationUnitName = styled.h1`
  font-size: var(--fontsize-heading-l);
`;

const BuildingName = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const ButtonContainer = styled.div`
  margin-top: var(--spacing-layout-m);

  & > button {
    margin: 0;
  }
`;

const Image = styled.img`
  width: 100%;
  height: 259px;
  object-fit: cover;
  @media (max-width: ${breakpoint.m}) {
    width: 100%;
    height: auto;
  }
`;

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-l);
  fill: var(--tilavaraus-gray);
`;

const Head = ({
  reservationUnit,
  reservationUnitList,
}: PropsType): JSX.Element => {
  const {
    selectReservationUnit,
    containsReservationUnit,
    removeReservationUnit,
  } = reservationUnitList;

  const { t, i18n } = useTranslation();

  return (
    <TopContainer>
      <Notification applicationRound={null} />
      <Container>
        <Back label="reservationUnit:backToSearch" />
        <RightContainer>
          <div>
            <ReservationUnitName>
              {localizedValue(reservationUnit.name, i18n.language)}
            </ReservationUnitName>
            <BuildingName>
              {localizedValue(reservationUnit.building?.name, i18n.language)}
            </BuildingName>
            <Props>
              <div>
                {reservationUnit.reservationUnitType ? (
                  <IconWithText
                    icon={
                      <IconInfoCircle aria-label={t("reservationUnit:type")} />
                    }
                    text={localizedValue(
                      reservationUnit.reservationUnitType?.name,
                      i18n.language
                    )}
                  />
                ) : null}
                <IconWithText
                  icon={
                    <IconGroup aria-label={t("reservationUnit:maxPersons")} />
                  }
                  text={t("reservationUnitCard:maxPersons", {
                    maxPersons: reservationUnit.maxPersons,
                  })}
                />
              </div>
              <div />
            </Props>
            <ButtonContainer>
              {containsReservationUnit(reservationUnit) ? (
                <Button
                  onClick={() => removeReservationUnit(reservationUnit)}
                  iconLeft={<IconCheck />}
                  className="margin-left-s margin-top-s"
                >
                  {t("common:reservationUnitSelected")}
                </Button>
              ) : (
                <Button
                  onClick={() => selectReservationUnit(reservationUnit)}
                  iconLeft={<IconPlus />}
                  className="margin-left-s margin-top-s"
                  variant="secondary"
                >
                  {t("common:selectReservationUnit")}
                </Button>
              )}
            </ButtonContainer>
          </div>
          <Image
            alt={t("common:imgAltForSpace", {
              name: localizedValue(reservationUnit.name, i18n.language),
            })}
            src={
              getMainImage(reservationUnit)?.smallUrl ||
              "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
            }
          />
        </RightContainer>
      </Container>
      <StyledKoros className="koros" type="wave" />
    </TopContainer>
  );
};

export default Head;
