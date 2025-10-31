import React, { type HTMLAttributes } from "react";
import { gql } from "@apollo/client";
import { IconArrowDown, IconArrowUp, ButtonSize, ButtonVariant, Button, ButtonPresetTheme } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import Card from "ui/src/components/Card";
import { ErrorText } from "ui/src/components/ErrorText";
import { breakpoints } from "ui/src/modules/const";
import { getImageSource, getLocalizationLang, getMainImage } from "ui/src/modules/helpers";
import { getTranslation } from "ui/src/modules/util";
import { Flex, H6, fontBold, fontMedium, fontRegular } from "ui/src/styled";
import { getReservationUnitName } from "@/modules/reservationUnit";
import type { OrderedReservationUnitCardFragment } from "@gql/gql-types";

const NameCardContainer = styled(Flex).attrs({ $gap: "none" })`
  flex-direction: column;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const PreCardLabel = styled(H6).attrs({ as: "h3" })`
  margin-bottom: var(--spacing-xs);
  margin-top: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-3-xs);
  @media (min-width: ${breakpoints.m}) {
    margin-bottom: 0;
    font-size: var(--fontsize-heading-l);
    width: 3ch;
    overflow: hidden; /* maybe overkill, but this makes sure index numbers > 99 won't end up breaking the layout */
    ${fontRegular}
    span {
      display: none;
    }
  }
`;

const OverlayContainer = styled(Flex).attrs({ $gap: "none" })`
  position: relative;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    width: 100%;
  }
`;

const orderButtonsWidth = "230px";

const CardContainer = styled(Flex).attrs({ $gap: "none" })`
  @media (min-width: ${breakpoints.m}) {
    width: calc(100% - ${orderButtonsWidth});
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
  flex-wrap: wrap;
  background: var(--color-black-5);
  padding: 0 var(--spacing-s) var(--spacing-s);
  @media (min-width: ${breakpoints.m}) {
    display: grid;
    grid-template-columns: 100px 1fr;
    grid-template-rows: 1fr 1fr;
    height: 100%;
    width: ${orderButtonsWidth};
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
  color: var(--color-black-90) !important;
  && {
    ${fontBold};
    --padding-horizontal: var(--spacing-s);
    --padding-vertical: var(--spacing-xs);
  }
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
  &&& {
    --padding-horizontal: var(--spacing-s);
    --padding-vertical: var(--spacing-xs);
    position: relative;
    z-index: 2;
    background-color: var(--color-white);
    ${fontMedium}

    &:disabled {
      z-index: 1;
      background-color: var(--color-black-5);
      ${fontRegular}
    }

    @media (max-width: ${breakpoints.m}) {
      &:not(:disabled) {
        --background-color: var(--color-white);
        --border-color: var(--color-black-90);
        {/* after the button has been pressed it uses --border-color-hover while remaining in focus, thus requiring overriding a hover style in mobile */}
        --border-color-hover: var(--color-black-90);
      }
    }

    @media (min-width: ${breakpoints.m}) {
      background-color: var(--color-black-5);

      &:disabled {
        --border-color-disabled: transparent;
        ${fontRegular}
      }
      &:hover,
      &:focus-within,
      &:focus-within:hover {
        --color-focus: var(--color-black-90);
        --background-color-focus: var(--color-black-5);
        --background-color-hover-focus: var(--color-black-10);
      }
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
    &&:disabled && {
      border-right: 0;
    }
  }
`;

type ReservationUnitType = OrderedReservationUnitCardFragment;
interface Props extends HTMLAttributes<HTMLDivElement> {
  order: number;
  reservationUnit: ReservationUnitType;
  onDelete: (reservationUnit: ReservationUnitType) => void;
  first: boolean;
  last: boolean;
  onMoveUp: (reservationUnit: ReservationUnitType) => void;
  onMoveDown: (reservationUnit: ReservationUnitType) => void;
  error?: string;
}

/// Custom card for selecting reservation units for application
export function OrderedReservationUnitCard({
  reservationUnit,
  order,
  onDelete,
  first,
  last,
  onMoveUp,
  onMoveDown,
  error,
  ...rest
}: Readonly<Props>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const { unit } = reservationUnit;
  const unitName = unit ? getTranslation(unit, "name", lang) : "-";

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "medium");

  return (
    <Flex {...rest} $gap="xs">
      {error && <ErrorText>{error}</ErrorText>}
      <NameCardContainer>
        <PreCardLabel>
          <span>{t("reservationUnitList:option")} </span>
          {order + 1}.
        </PreCardLabel>
        <OverlayContainer>
          <CardContainer>
            <Card heading={getReservationUnitName(reservationUnit) ?? ""} text={unitName} imageSrc={imgSrc} />
          </CardContainer>
          <OrderButtonContainer>
            <DeleteContainer>
              <DeleteButton
                variant={ButtonVariant.Supplementary}
                theme={ButtonPresetTheme.Black}
                size={ButtonSize.Small}
                iconEnd={undefined}
                onClick={() => onDelete(reservationUnit)}
              >
                {t("reservationUnitList:buttonRemove")}
              </DeleteButton>
            </DeleteContainer>
            <UpButton
              iconStart={<IconArrowUp />}
              variant={ButtonVariant.Supplementary}
              theme={ButtonPresetTheme.Black}
              size={ButtonSize.Small}
              onClick={() => onMoveUp(reservationUnit)}
              disabled={first}
            >
              {t("reservationUnitList:buttonUp")}
            </UpButton>
            <DownButton
              iconStart={<IconArrowDown />}
              variant={ButtonVariant.Supplementary}
              theme={ButtonPresetTheme.Black}
              size={ButtonSize.Small}
              onClick={() => onMoveDown(reservationUnit)}
              disabled={last}
            >
              {t("reservationUnitList:buttonDown")}
            </DownButton>
          </OrderButtonContainer>
        </OverlayContainer>
      </NameCardContainer>
    </Flex>
  );
}

// TODO this is functioning as a base fragment for other cards, it should be renamed then
export const ORDERED_RESERVATION_UNIT_CARD_FRAGMENT = gql`
  fragment OrderedReservationUnitCard on ReservationUnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    images {
      ...Image
    }
    unit {
      id
      nameFi
      nameSv
      nameEn
    }
  }
`;
