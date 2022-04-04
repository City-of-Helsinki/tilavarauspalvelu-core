import {
  IconArrowDown,
  IconArrowUp,
  IconGroup,
  IconCross,
  Notification,
} from "hds-react";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { getMainImage, getTranslation } from "../../modules/util";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";
import { fontBold, H6 } from "../../modules/style/typography";
import { ReservationUnitType } from "../../modules/gql-types";

type Props = {
  order: number;
  reservationUnit: ReservationUnitType;
  onDelete: (reservationUnit: ReservationUnitType) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnitType) => void;
  onMoveDown: (reservationUnit: ReservationUnitType) => void;
  invalid: boolean;
};

const NameCardContainer = styled.div`
  margin-top: var(--spacing-l);
`;

const PreCardLabel = styled(H6).attrs({ as: "h3" })``;

const CardButtonContainer = styled.div`
  display: grid;
  grid-template-columns: 4fr 1fr;
  margin-top: var(--spacing-s);
  align-items: center;
  position: relative;

  @media (max-width: ${breakpoint.s}) {
    grid-template-columns: 1fr;
  }
`;

const CardContainer = styled.div`
  background-color: var(--tilavaraus-gray);
  display: grid;
  align-items: flex-start;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoint.s}) {
    grid-template-columns: 163px 4fr 2fr;
    gap: var(--spacing-xs);
  }
`;

const PaddedCell = styled.div`
  &:first-of-type {
    padding: var(--spacing-s);
  }

  padding: var(--spacing-m) 0;

  @media (min-width: ${breakpoint.s}) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-s);
  }
`;

const Image = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
`;

const Name = styled.div`
  ${fontBold};
  font-size: var(--fontsize-heading-s);
  line-height: var(--lineheight-xl);
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoint.s}) {
    margin-bottom: 0;
  }
`;

const MaxPersonsContainer = styled.div`
  display: flex;
  align-items: center;
  font-size: var(--fontsize-body-m);

  svg {
    margin-right: var(--spacing-2-xs);
  }
`;

const DeleteButton = styled(MediumButton)`
  margin-right: var(--spacing-s);
`;

const ArrowContainer = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  right: var(--spacing-m);
  bottom: var(--spacing-m);

  @media (min-width: ${breakpoint.s}) {
    position: static;
  }
`;

const Circle = styled.div<{ passive: boolean }>`
  margin-left: var(--spacing-xs);
  height: var(--spacing-layout-m);
  width: var(--spacing-layout-m);
  background-color: ${(props) =>
    props.passive ? "var(--color-black-10)" : "var(--color-white)"};
  color: ${(props) =>
    props.passive ? "var(--color-black-50)" : "var(--color-bus)"};
  border-width: 2px;
  border-style: solid;
  border-color: ${(props) =>
    props.passive ? "var(--color-black-10)" : "var(--color-bus)"};
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  button {
    &:disabled {
      color: var(--color-black-40);
      cursor: default;
    }

    border: 0;
    background-color: transparent;
    color: var(--color-bus);
    cursor: pointer;
  }
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
  const { t } = useTranslation();

  return (
    <NameCardContainer>
      <PreCardLabel>
        {t("reservationUnitList:option")} {order + 1}.
      </PreCardLabel>
      {invalid ? (
        <Notification
          type="error"
          label={t("application:error.reservationUnitTooSmall")}
        />
      ) : null}
      <CardButtonContainer>
        <CardContainer>
          <Image src={getMainImage(reservationUnit)?.mediumUrl} alt="" />
          <PaddedCell>
            <Name>{getTranslation(reservationUnit, "name")}</Name>
            <MaxPersonsContainer>
              {reservationUnit.maxPersons && (
                <>
                  <IconGroup aria-hidden />
                  {t("reservationUnitCard:maxPersons", {
                    count: reservationUnit.maxPersons,
                  })}
                </>
              )}
            </MaxPersonsContainer>
          </PaddedCell>
          <PaddedCell>
            <DeleteButton
              variant="supplementary"
              iconLeft={<IconCross aria-hidden />}
              size="small"
              onClick={() => {
                onDelete(reservationUnit);
              }}
            >
              {t("reservationUnitList:buttonRemove")}
            </DeleteButton>
          </PaddedCell>
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
