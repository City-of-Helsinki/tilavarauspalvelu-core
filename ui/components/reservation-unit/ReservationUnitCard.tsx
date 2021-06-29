import {
  Button,
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconTrash,
  Notification,
} from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { ReservationUnit } from "../../modules/types";
import { getAddress, getMainImage, localizedValue } from "../../modules/util";
import { breakpoint } from "../../modules/style";

type Props = {
  order: number;
  reservationUnit: ReservationUnit;
  onDelete: (reservationUnit: ReservationUnit) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnit) => void;
  onMoveDown: (reservationUnit: ReservationUnit) => void;
  invalid: boolean;
};

const NameCardContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const PreCardLabel = styled.div`
  font-size: var(--fontsize-heading-xs);
  font-weight: 700;
`;

const CardButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 4fr 1fr;
  margin-top: var(--spacing-s);
  align-items: center;

  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 3fr 1fr;
  }
`;

const CardContainer = styled.div`
  gap: var(--spacing-s);
  background-color: white;
  display: grid;
  grid-template-columns: 76px 5fr 1fr 1fr;
  align-items: center;

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-xs);
  }
`;

const Image = styled.img`
  width: 76px;
  height: 99px;
  object-fit: cover;

  @media (max-width: ${breakpoint.s}) {
    width: 50px;
    height: auto;
  }
`;

const Name = styled.div`
  font-size: var(--fontsize-heading-m);
  font-family: var(--font-bold);
`;

const BuildingName = styled.div`
  font-family: var(--font-bold);
  font-size: var(--fontsize-body-l);
`;

const Address = styled.div`
  font-size: var(--fontsize-body-s);
`;

const MaxPersonsContainer = styled.div`
  display: flex;
  justify-items: center;
  font-size: var(--fontsize-body-l);
  font-weight: bold;
`;

const MaxPersonsCountContainer = styled.span`
  margin-left: var(--spacing-xs);
`;

const ArrowContainer = styled.div`
  display: flex;

  @media (max-width: ${breakpoint.s}) {
    flex-direction: column;
  }
`;

const Circle = styled.div<{ passive: boolean }>`
  margin-left: var(--spacing-xs);
  height: var(--spacing-layout-m);
  width: var(--spacing-layout-m);
  background-color: ${(props) =>
    props.passive ? "var(--color-black-10)" : "var(--color-bus)"};
  color: ${(props) => (props.passive ? "var(--color-black-50)" : "white")};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ReservationUnitCard = ({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  invalid,
}: Props): JSX.Element => {
  const { i18n, t } = useTranslation();

  return (
    <NameCardContainer>
      <PreCardLabel>
        {t("reservationUnitList:option")} {order + 1}.
      </PreCardLabel>
      {invalid ? (
        <Notification
          type="error"
          label={t("application:error.reservationUnitTooSmall")}
        >
          {t("application:error.reservationUnitTooSmall")}
        </Notification>
      ) : null}
      <CardButtonContainer>
        <CardContainer>
          <Image
            src={getMainImage(reservationUnit)?.smallUrl}
            alt={t("common:imgAltForSpace", {
              name: localizedValue(reservationUnit.name, i18n.language),
            })}
          />
          <div>
            <Name>{localizedValue(reservationUnit.name, i18n.language)}</Name>
            <BuildingName>
              {localizedValue(reservationUnit.building.name, i18n.language)}
            </BuildingName>
            <Address>{getAddress(reservationUnit)}</Address>
          </div>
          <MaxPersonsContainer>
            <IconGroup aria-hidden />
            <MaxPersonsCountContainer>
              {reservationUnit.maxPersons}
            </MaxPersonsCountContainer>
          </MaxPersonsContainer>
          <div>
            <Button
              variant="supplementary"
              iconLeft={<IconTrash aria-hidden />}
              onClick={() => {
                onDelete(reservationUnit);
              }}
            >
              {t("reservationUnitList:buttonRemove")}
            </Button>
          </div>
        </CardContainer>
        <ArrowContainer>
          <Circle passive={first}>
            <button
              className="button-reset"
              disabled={first}
              type="button"
              aria-label={t("reservationUnitList:buttonUp")}
              onClick={() => onMoveUp(reservationUnit)}
            >
              <IconArrowUp aria-hidden size="m" />
            </button>
          </Circle>
          <Circle passive={last}>
            <button
              className="button-reset"
              aria-label={t("reservationUnitList:buttonDown")}
              type="button"
              disabled={last}
              onClick={() => onMoveDown(reservationUnit)}
            >
              <IconArrowDown aria-hidden size="m" />
            </button>
          </Circle>
        </ArrowContainer>
      </CardButtonContainer>
    </NameCardContainer>
  );
};

export default ReservationUnitCard;
