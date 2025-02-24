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
import React from "react";
import { useTranslation } from "next-i18next";
import type { ReservationUnitCardFieldsFragment } from "@gql/gql-types";
import { getMainImage } from "@/modules/util";
import { getReservationUnitName } from "@/modules/reservationUnit";
import { getImageSource } from "common/src/helpers";
import Card from "common/src/components/Card";
import { getReservationUnitPath } from "@/modules/urls";
import { ButtonLikeLink } from "../common/ButtonLikeLink";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type Node = ReservationUnitCardFieldsFragment;
interface CardProps {
  reservationUnit: Node;
  // TODO all of these are accessible from a hook but does that make testing more difficult?
  selectReservationUnit: (reservationUnit: Node) => void;
  containsReservationUnit: (reservationUnit: Node) => boolean;
  removeReservationUnit: (reservationUnit: Node) => void;
}

export function ReservationUnitCard({
  reservationUnit,
  selectReservationUnit,
  containsReservationUnit,
  removeReservationUnit,
}: Readonly<CardProps>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const name = getReservationUnitName(reservationUnit);

  const unitName = reservationUnit.unit
    ? getTranslationSafe(reservationUnit.unit, "name", lang)
    : "-";

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  const infos = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: <IconHome size={IconSize.Small} />,
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
  if (reservationUnit.currentAccessType) {
    infos.push({
      icon: (
        <IconLock
          aria-hidden="false"
          aria-label={t("reservationUnit:accessType")}
          size={IconSize.Small}
        />
      ),
      value: t(
        `reservationUnit:accessTypes.${reservationUnit.currentAccessType}`
      ),
    });
  }

  const buttons = [];
  if (containsReservationUnit(reservationUnit)) {
    buttons.push(
      <Button
        size={ButtonSize.Small}
        variant={ButtonVariant.Primary}
        iconEnd={<IconCheck />}
        onClick={() => removeReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:removeReservationUnit")}
      >
        {t("common:removeReservationUnit")}
      </Button>
    );
  } else {
    buttons.push(
      <Button
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        iconEnd={<IconPlus />}
        onClick={() => selectReservationUnit(reservationUnit)}
        data-testid="reservation-unit-card__button--select"
        key={t("common:selectReservationUnit")}
      >
        {t("common:selectReservationUnit")}
      </Button>
    );
  }
  buttons.push(
    <ButtonLikeLink
      href={getReservationUnitPath(reservationUnit.pk)}
      target="_blank"
      rel="noopener noreferrer"
      data-testid="reservation-unit-card__button--link"
      key="show"
    >
      <IconLinkExternal />
      {t("common:show")}
    </ButtonLikeLink>
  );

  return (
    <Card
      imageSrc={imgSrc}
      heading={name ?? ""}
      text={unitName ?? ""}
      infos={infos}
      buttons={buttons}
    />
  );
}
