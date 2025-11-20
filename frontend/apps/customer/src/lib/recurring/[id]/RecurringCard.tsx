import React from "react";
import { gql } from "@apollo/client";
import {
  IconGroup,
  IconCheck,
  IconPlus,
  IconLinkExternal,
  Button,
  IconSize,
  ButtonSize,
  ButtonVariant,
  IconHome,
  IconLock,
} from "hds-react";
import { useTranslation } from "next-i18next";
import { ButtonLikeLink } from "ui/src/components/ButtonLikeLink";
import Card, { type CardInfoItem } from "ui/src/components/Card";
import { getImageSource, getLocalizationLang, getTranslation, getMainImage } from "ui/src/modules/helpers";
import { getReservationUnitPath } from "@/modules/urls";
import type { RecurringCardFragment } from "@gql/gql-types";

interface CardProps {
  reservationUnit: RecurringCardFragment;
  // TODO all of these are accessible from a hook but does that make testing more difficult?
  selectReservationUnit: (reservationUnit: RecurringCardFragment) => void;
  containsReservationUnit: (reservationUnit: RecurringCardFragment) => boolean;
  removeReservationUnit: (reservationUnit: RecurringCardFragment) => void;
}

export function RecurringCard({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Readonly<CardProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const name = getTranslation(reservationUnit, "name", lang);

  const unitName = getTranslation(reservationUnit.unit, "name", lang);

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslation(reservationUnit.reservationUnitType, "name", lang)
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  const infos: CardInfoItem[] = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: <IconHome size={IconSize.Small} data-testid="reservation-unit-card__icon--home" />,
      value: reservationUnitTypeName,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: <IconGroup size={IconSize.Small} />,
      value: t("reservationUnitCard:maxPersons", {
        count: reservationUnit.maxPersons,
      }),
    });
  }
  if (reservationUnit.effectiveAccessType) {
    infos.push({
      icon: <IconLock aria-hidden="false" aria-label={t("reservationUnit:accessType")} size={IconSize.Small} />,
      value: t(`reservationUnit:accessTypes.${reservationUnit.effectiveAccessType}`),
    });
  }

  const isSelected = containsReservationUnit(reservationUnit);
  const toggleSelect = () => {
    if (isSelected) {
      removeReservationUnit(reservationUnit);
    } else {
      selectReservationUnit(reservationUnit);
    }
  };

  const buttons: JSX.Element[] = [];
  buttons.push(
    <Button
      size={ButtonSize.Small}
      variant={isSelected ? ButtonVariant.Primary : ButtonVariant.Secondary}
      iconEnd={isSelected ? <IconCheck /> : <IconPlus />}
      onClick={toggleSelect}
      data-testid="recurring-card__button--toggle"
      key={"common:selectReservationUnit"}
    >
      {isSelected ? t("common:removeReservationUnit") : t("common:selectReservationUnit")}
    </Button>
  );
  buttons.push(
    <ButtonLikeLink
      href={getReservationUnitPath(reservationUnit.pk)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="reservation-unit-card__button--show"
      key="show"
    >
      <IconLinkExternal />
      {t("common:show")}
    </ButtonLikeLink>
  );

  return <Card imageSrc={imgSrc} heading={name ?? ""} text={unitName ?? ""} infos={infos} buttons={buttons} />;
}

export const RECURRING_CARD_FRAGMENT = gql`
  fragment RecurringCard on ReservationUnitNode {
    ...OrderedReservationUnitCard
    reservationUnitType {
      id
      nameFi
      nameSv
      nameEn
    }
    maxPersons
    currentAccessType
    effectiveAccessType
  }
`;
