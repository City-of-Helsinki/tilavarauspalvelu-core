import {
  IconClock,
  IconGroup,
  IconEuroSign,
  IconHome,
  IconSize,
} from "hds-react";
import React from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  convertLanguageCode,
  formatDuration,
  getTranslationSafe,
} from "common/src/common/util";
import { fontRegular, H1, H3 } from "common/src/common/typography";
import { ReservationKind, type ReservationUnitPageQuery } from "@gql/gql-types";
import { formatDate, orderImages } from "@/modules/util";
import { IconWithText } from "../common/IconWithText";
import { Images } from "./Images";
import {
  getActivePricing,
  getPriceString,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import { isReservationStartInFuture } from "@/modules/reservation";
import { filterNonNullable } from "common/src/helpers";
import { Flex } from "common/styles/util";
import { breakpoints } from "common";

type QueryT = NonNullable<ReservationUnitPageQuery["reservationUnit"]>;
interface HeadProps {
  reservationUnit: QueryT;
  reservationUnitIsReservable?: boolean;
  subventionSuffix?: JSX.Element;
}

const NotificationWrapper = styled.div`
  background-color: var(--color-engel-light);
  font-size: var(--fontsize-body-l);
  padding: var(--spacing-s);
  display: inline-block;
`;

function NonReservableNotification({
  reservationUnit,
}: {
  reservationUnit: Pick<QueryT, "reservationKind" | "reservationBegins">;
}) {
  const { t } = useTranslation();

  let returnText = t("reservationUnit:notifications.notReservable");
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (isReservationStartInFuture(reservationUnit)) {
    const futureOpeningText = t("reservationUnit:notifications.futureOpening", {
      date: reservationUnit.reservationBegins
        ? formatDate(reservationUnit.reservationBegins, "d.M.yyyy")
        : "",
      time: reservationUnit.reservationBegins
        ? formatDate(reservationUnit.reservationBegins, "H.mm")
        : "",
    });
    returnText = futureOpeningText;
  }

  return (
    <NotificationWrapper data-testid="reservation-unit--notification__reservation-start">
      {returnText}
    </NotificationWrapper>
  );
}

const Wrapper = styled.div`
  grid-column: 1 / -1;
  grid-row: 1;

  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
  }
`;

export function Head({
  reservationUnit,
  reservationUnitIsReservable,
  subventionSuffix,
}: HeadProps): JSX.Element {
  const { i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const reservationUnitName = getTranslationSafe(reservationUnit, "name", lang);
  const unitName = getTranslationSafe(reservationUnit.unit ?? {}, "name", lang);

  return (
    <Wrapper>
      <Flex>
        <H1 $noMargin>{reservationUnitName}</H1>
        <H3 as="h2" $noMargin>
          {unitName}
        </H3>
        <IconList
          reservationUnit={reservationUnit}
          subventionSuffix={subventionSuffix}
        />
        {!reservationUnitIsReservable && (
          <NonReservableNotification reservationUnit={reservationUnit} />
        )}
      </Flex>
      <Images
        images={orderImages(reservationUnit.images)}
        contextName={reservationUnitName}
      />
    </Wrapper>
  );
}

const IconListWrapper = styled.div`
  & > div:empty {
    display: none;
  }
  width: 100%;

  ${fontRegular};
  font-size: var(--fontsize-body-s);
  display: grid;
  gap: var(--spacing-m) var(--spacing-s);
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
`;

function IconList({
  reservationUnit,
  subventionSuffix,
}: Pick<HeadProps, "reservationUnit" | "subventionSuffix">): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const minDur = reservationUnit.minReservationDuration ?? 0;
  const maxDur = reservationUnit.maxReservationDuration ?? 0;
  const minReservationDuration = formatDuration(minDur / 60, t, true);
  const maxReservationDuration = formatDuration(maxDur / 60, t, true);
  const pricing = getActivePricing(reservationUnit);
  const isPaid = isReservationUnitPaid(reservationUnit.pricings);
  const unitPrice = pricing ? getPriceString({ t, pricing }) : undefined;
  const hasSubventionSuffix = pricing && isPaid && subventionSuffix != null;

  const iconsTexts = filterNonNullable([
    reservationUnit.reservationUnitType != null
      ? {
          key: "reservationUnitType",
          icon: <IconHome size={IconSize.Small} />,
          text: getTranslationSafe(
            reservationUnit.reservationUnitType,
            "name",
            lang
          ),
        }
      : null,
    reservationUnit.maxPersons != null
      ? {
          key: "maxPersons",
          icon: (
            <IconGroup
              aria-label={t("reservationUnit:maxPersons")}
              aria-hidden="false"
            />
          ),
          text: t("reservationUnitCard:personRange", {
            count: reservationUnit.maxPersons,
            value:
              reservationUnit.minPersons !== reservationUnit.maxPersons &&
              reservationUnit.minPersons != null &&
              reservationUnit.minPersons > 1
                ? `${reservationUnit.minPersons} - ${reservationUnit.maxPersons}`
                : reservationUnit.maxPersons,
          }),
        }
      : null,
    reservationUnit.minReservationDuration ||
    reservationUnit.maxReservationDuration
      ? {
          key: "eventDuration",
          icon: (
            <IconClock
              aria-label={t("reservationCalendar:eventDuration")}
              aria-hidden="false"
            />
          ),
          text: t(`reservationCalendar:eventDurationLiteral`, {
            min: minReservationDuration,
            max: maxReservationDuration,
          }),
        }
      : null,
    unitPrice != null
      ? {
          key: "unitPrice",
          icon: (
            <IconEuroSign
              aria-label={t("prices:reservationUnitPriceLabel")}
              aria-hidden="false"
            />
          ),
          text: (
            <>
              {unitPrice}
              {hasSubventionSuffix ? ": " : null}
              {hasSubventionSuffix ? subventionSuffix : null}
            </>
          ),
        }
      : null,
  ] as const);

  return (
    <IconListWrapper>
      {iconsTexts.map(({ icon, key, text }) => (
        <IconWithText key={key} icon={icon} text={text} />
      ))}
    </IconListWrapper>
  );
}
