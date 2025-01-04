import {
  IconArrowDown,
  IconArrowUp,
  Notification,
  ButtonSize,
  ButtonVariant,
  Button,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontBold, fontRegular, H6 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import type { ReservationUnitCardFieldsFragment } from "@gql/gql-types";
import { getMainImage, getTranslation } from "@/modules/util";
import { getReservationUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import { Flex } from "common/styles/util";

type ReservationUnitType = ReservationUnitCardFieldsFragment;
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

const NameCardContainer = styled(Flex).attrs({ $gap: "0" })`
  flex-direction: column;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const PreCardLabel = styled(H6).attrs({ as: "h3" })`
  margin-bottom: 0;
  margin-top: 0;
  @media (min-width: ${breakpoints.m}) {
    display: flex;
    align-items: center;
    font-size: var(--fontsize-heading-l);
    width: 3ch;
    overflow: hidden; /* maybe overkill, but this makes sure index numbers > 99 won't end up breaking the layout */
    ${fontRegular}
    span {
      display: none;
    }
  }
`;

const OverlayContainer = styled(Flex)`
  position: relative;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    width: 100%;
  }
`;

const CardContainer = styled(Flex)`
  @media (min-width: ${breakpoints.m}) {
    width: calc(100% - 230px);
    overflow: hidden;
    [class*="Card__ImageWrapper"] {
      max-width: 147px;
      max-height: 99px !important;
    }
    [class*="Card__Header"],
    [class*="Card__Text"] {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    [class*="Card__Header"] {
      font-size: var(--fontsize-heading-xs);
    }
  }
`;

const OrderButtonContainer = styled.div`
  display: flex;
  margin-top: calc(var(--spacing-m) * -1);
  background: var(--color-black-5);
  padding: 0 var(--spacing-m) var(--spacing-m);
  @media (min-width: ${breakpoints.m}) {
    position: absolute;
    top: 0;
    right: 0;
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-template-rows: 1fr 1fr;
    height: 100%;
    width: 230px;
    margin-top: 0;
    padding: 0;
    background: var(--color-black-20);
    row-gap: 2px;
  }
`;

const DeleteContainer = styled(Flex).attrs({ $justifyContent: "center" })`
  background: var(--color-black-5);
  order: 3;
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1;
    grid-row: 1 / span 2;
    border-right: 2px solid var(--color-black-20);
  }
`;

const DeleteButton = styled(Button)`
  margin: var(--spacing-s) var(--spacing-s) var(--spacing-s) 0;
  color: var(--color-black-90) !important;
  font-family: var(--font-bold), sans-serif !important;
  @media (min-width: ${breakpoints.m}) {
    grid-column: 1;
    grid-row: 1 / 2;
    align-self: flex-end;
  }
  &:hover {
    background-color: var(--color-black-10) !important;
  }
`;

const OrderButton = styled(Button)`
  && {
    position: relative;
    z-index: 2;
    color: var(--color-black-90) !important;
    background-color: var(--color-white);
    border-color: var(--color-black-90) !important;
    ${fontBold}
    &:hover,
    &:focus:hover {
      background-color: var(--color-black-5);
    }

    &:focus {
      background-color: var(--color-white);
    }

    &:disabled {
      background-color: var(--color-black-5);
      border-color: var(--color-black-20) !important;
      color: var(--color-black-20) !important;
      z-index: 1;
      ${fontRegular}
    }
    @media (min-width: ${breakpoints.m}) {
      background-color: var(--color-black-5);
      border-color: var(--color-black-5) !important;

      &:hover,
      &:focus:hover {
        background-color: var(--color-black-10);
      }

      &:focus {
        background-color: var(--color-black-5);
      }

      &:disabled {
        background-color: var(--color-black-5);
        color: var(--color-black-20) !important;
        border-color: transparent !important;
        ${fontRegular}
      }
    }
    svg {
      scale: 1.5;
    }
  }
`;

const UpButton = styled(OrderButton)`
  @media (min-width: ${breakpoints.m}) {
    grid-column: 2;
    grid-row: 1;
  }
`;

const DownButton = styled(OrderButton)`
  margin-left: -2px !important;
  margin-right: auto !important;
  @media (min-width: ${breakpoints.m}) {
    margin-left: 0 !important;
    margin-right: 0 !important;
    grid-column: 2;
    grid-row: 2;
    &&:disabled {
      border-right: 0 !important;
    }
  }
`;

// NOTE size=small causes text to disappear
const ErrorNotification = styled(Notification).attrs({
  type: "error",
})`
  --fontsize-heading-xs: var(--fontsize-body-s);
`;

/// Custom card for selecting reservation units for application
export function ReservationUnitCard({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  invalid,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const { unit } = reservationUnit;
  const unitName = unit ? getTranslation(unit, "name") : "-";

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  return (
    <NameCardContainer>
      <PreCardLabel>
        <span>{t("reservationUnitList:option")} </span>
        {order + 1}.
      </PreCardLabel>
      {invalid ? (
        <ErrorNotification
          label={t("application:validation.reservationUnitTooSmall")}
        />
      ) : null}
      <OverlayContainer>
        <CardContainer>
          <Card
            heading={getReservationUnitName(reservationUnit) ?? ""}
            text={unitName}
            imageSrc={imgSrc}
          />
        </CardContainer>
        <OrderButtonContainer>
          <DeleteContainer>
            <DeleteButton
              variant={ButtonVariant.Supplementary}
              size={ButtonSize.Small}
              iconEnd={undefined}
              onClick={() => onDelete(reservationUnit)}
            >
              {t("reservationUnitList:buttonRemove")}
            </DeleteButton>
          </DeleteContainer>
          <UpButton
            iconStart={<IconArrowUp aria-hidden="true" />}
            onClick={() => onMoveUp(reservationUnit)}
            disabled={first}
          >
            {t("reservationUnitList:buttonUp")}
          </UpButton>
          <DownButton
            iconStart={<IconArrowDown aria-hidden="true" />}
            onClick={() => onMoveDown(reservationUnit)}
            disabled={last}
          >
            {t("reservationUnitList:buttonDown")}
          </DownButton>
        </OrderButtonContainer>
      </OverlayContainer>
    </NameCardContainer>
  );
}
