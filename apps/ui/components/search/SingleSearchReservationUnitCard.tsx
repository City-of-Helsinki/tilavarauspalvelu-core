import { IconArrowRight, IconEuroSign, IconGroup, IconHome, IconLock, IconSize } from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import type { SingleSearchCardFragment } from "@gql/gql-types";
import { format, isToday, isTomorrow, isValid } from "date-fns";
import { convertLanguageCode, getTranslationSafe, toUIDate } from "common/src/common/util";
import { getActivePricing, getPriceString } from "@/modules/reservationUnit";
import { isBrowser } from "@/modules/const";
import { ButtonLikeLink } from "common/src/components/ButtonLikeLink";
import { getImageSource, getMainImage } from "common/src/helpers";
import { Card } from "common/src/components/Card";
import { Tag } from "common/src/components/Tag";
import { useSearchParams } from "next/navigation";
import { getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";

function StatusTag(props: Pick<SingleSearchCardFragment, "isClosed" | "firstReservableDatetime">): JSX.Element {
  const { t } = useTranslation();
  const { isClosed, firstReservableDatetime } = props;

  if (isClosed) {
    return <Tag type="error">{t("reservationUnitCard:closed")}</Tag>;
  }

  const availableAt = firstReservableDatetime ? new Date(firstReservableDatetime) : null;
  if (!availableAt || !isValid(availableAt)) {
    return <Tag type="neutral">{t("reservationUnitCard:noTimes")}</Tag>;
  }
  let dayText = toUIDate(availableAt);
  if (isToday(availableAt)) {
    dayText = t("common:today");
  } else if (isTomorrow(availableAt)) {
    dayText = t("common:tomorrow");
  }
  const timeText = format(new Date(availableAt), "HH:mm");
  const ariaLabel = t("reservationUnitCard:firstAvailableTime");
  return (
    <Tag ariaLabel={ariaLabel} type="success">
      {`${dayText} ${timeText}`}
    </Tag>
  );
}

// TODO SSR version (and remove the use hook)
function useConstructLink(reservationUnit: Pick<SingleSearchCardFragment, "pk">): string {
  const params = useSearchParams();
  const date = params.get("startDate");
  const time = params.get("timeBegin");
  const duration = params.get("duration");

  if (!isBrowser) {
    return "";
  }
  if (reservationUnit.pk == null) {
    return "";
  }

  const linkURL = new URL(getReservationUnitPath(reservationUnit.pk), document.baseURI);
  if (duration != null) linkURL.searchParams.set("duration", duration);
  if (date != null) linkURL.searchParams.set("date", date);
  if (time != null) linkURL.searchParams.set("time", time);

  return linkURL.toString();
}

interface PropsT {
  reservationUnit: SingleSearchCardFragment;
}

export function SingleSearchCard({ reservationUnit }: PropsT): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const name = getTranslationSafe(reservationUnit, "name", lang);

  const link = useConstructLink(reservationUnit);
  const unitName = getTranslationSafe(reservationUnit.unit ?? {}, "name", lang);

  const pricing = getActivePricing(reservationUnit);
  const unitPrice = pricing != null ? getPriceString({ t, pricing }) : undefined;

  const reservationUnitTypeName =
    reservationUnit.reservationUnitType != null
      ? getTranslationSafe(reservationUnit.reservationUnitType, "name", lang)
      : undefined;

  const img = getMainImage(reservationUnit);
  const imgSrc = getImageSource(img, "small");

  const tags = [<StatusTag key={`status-tag-${reservationUnit.pk}`} {...reservationUnit} />];

  const infos = [];
  if (reservationUnitTypeName) {
    infos.push({
      icon: <IconHome size={IconSize.Small} />,
      value: reservationUnitTypeName,
    });
  }
  if (unitPrice) {
    infos.push({
      icon: <IconEuroSign aria-label={t("prices:reservationUnitPriceLabel")} aria-hidden="false" />,
      value: unitPrice,
    });
  }
  if (reservationUnit.maxPersons) {
    infos.push({
      icon: (
        <IconGroup
          aria-hidden="false"
          aria-label={t("reservationUnitCard:maxPersons", {
            maxPersons: reservationUnit.maxPersons,
          })}
          size={IconSize.Small}
        />
      ),
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

  const buttons = [
    <ButtonLikeLink href={link} key={link} width="full">
      {t("common:show")}
      <IconArrowRight />
    </ButtonLikeLink>,
  ];

  return (
    <Card
      heading={name ?? ""}
      headingLevel={2}
      text={unitName ?? ""}
      link={link}
      imageSrc={imgSrc}
      tags={tags}
      infos={infos}
      buttons={buttons}
    />
  );
}

export const SINGLE_SEARCH_CARD_FRAGMENT = gql`
  fragment SingleSearchCard on ReservationUnitNode {
    ...RecurringCard
    pricings {
      ...PricingFields
    }
    reservationBeginsAt
    reservationEndsAt
    isClosed
    firstReservableDatetime
    currentAccessType
    accessTypes(orderBy: [beginDateAsc], filter: { isActiveOrFuture: true }) {
      id
      accessType
    }
  }
`;
