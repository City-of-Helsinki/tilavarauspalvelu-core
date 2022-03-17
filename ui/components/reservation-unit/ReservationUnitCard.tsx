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
import { ReservationUnit } from "../../modules/types";
import {
  getMainImage,
  getTranslation,
  localizedValue,
} from "../../modules/util";
import { breakpoint } from "../../modules/style";
import { MediumButton } from "../../styles/util";
import { fontBold } from "../../modules/style/typography";

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
  font-size: var(--fontsize-heading-s);
  font-family: var(--font-bold);
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
  gap: var(--spacing-m);
  background-color: var(--tilavaraus-gray);
  display: grid;
  grid-template-columns: 163px 5fr 1fr;
  align-items: flex-start;

  @media (max-width: ${breakpoint.m}) {
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-xs);
  }
`;

const PaddedCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--spacing-m) 0;
  gap: var(--spacing-s);
`;

const Image = styled.img`
  width: 100%;
  max-height: 120px;
`;

const Name = styled.div`
  ${fontBold};
  font-size: var(--fontsize-heading-s);
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

  @media (max-width: ${breakpoint.s}) {
    flex-direction: column;
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
  const { t, i18n } = useTranslation();

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
          <Image src={getMainImage(reservationUnit)?.smallUrl} alt="" />
          <PaddedCell>
            <Name>
              {getTranslation(reservationUnit, "name") ||
                localizedValue(reservationUnit.name, i18n.language)}
            </Name>
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
