import {
  IconClock,
  IconGroup,
  IconEuroSign,
  IconHome,
  IconSize,
  IconLock,
  Tooltip,
} from "hds-react";
import React from "react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import {
  convertLanguageCode,
  formatDuration,
  getTranslationSafe,
  toUIDate,
} from "common/src/common/util";
import { fontRegular, H1, H3 } from "common/src/common/typography";
import { formatDateTime, orderImages } from "@/modules/util";
import {
  AccessType,
  ReservationKind,
  type ReservationUnitPageQuery,
} from "@gql/gql-types";
import { IconWithText } from "../common/IconWithText";
import { Images } from "./Images";
import {
  getActivePricing,
  getPriceString,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import { filterNonNullable } from "common/src/helpers";
import { Flex } from "common/styles/util";
import { breakpoints } from "common";
import { sub } from "date-fns";

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

type NonReservableNotificationProps = {
  reservationUnit: Readonly<
    Pick<QueryT, "reservationKind" | "reservationBegins">
  >;
};

function formatErrorMessages(
  t: TFunction,
  reservationUnit: NonReservableNotificationProps["reservationUnit"]
): string {
  let returnText = t("reservationUnit:notifications.notReservable");
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (reservationUnit.reservationBegins != null) {
    const begin = new Date(reservationUnit.reservationBegins);
    if (begin > new Date()) {
      const futureOpeningText = t(
        "reservationUnit:notifications.futureOpening",
        {
          date: formatDateTime(t, begin),
        }
      );
      returnText = futureOpeningText;
    }
  }
  return returnText;
}

function NonReservableNotification({
  reservationUnit,
}: NonReservableNotificationProps) {
  const { t } = useTranslation();
  const returnText = formatErrorMessages(t, reservationUnit);

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
}: Readonly<HeadProps>): JSX.Element {
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

const AccessTypeTooltipWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: var(--spacing-xs);
  font-size: var(--fontsize-body-s);
  ul {
    margin: 0;
    padding: 0;
    list-style-type: none;
  }
  li {
    display: flex;
    gap: var(--spacing-2-xs);
    justify-content: space-between;
  }
`;

function addEndDate(accessTypes: QueryT["accessTypes"]) {
  const accessTypeDurations = accessTypes.map((accessType) => ({
    ...accessType,
    endDate: "",
  }));
  for (let idx = 0; idx < accessTypeDurations.length; idx++) {
    const b = accessTypeDurations[idx]?.beginDate;
    if (b == null) {
      continue;
    }
    const beginDate = new Date(b);
    const end = accessTypeDurations[idx + 1]?.beginDate;
    if (end != null) {
      const endDate = sub(new Date(end), {
        days: 1,
      });
      const dur = accessTypeDurations[idx];
      if (dur != null) {
        dur.endDate = toUIDate(endDate);
      }
    }
    const dur = accessTypeDurations[idx];
    if (dur != null) {
      dur.beginDate = toUIDate(beginDate);
    }
  }
  return accessTypeDurations;
}

function AccessTypeTooltip({
  accessTypes,
}: Readonly<{ accessTypes: QueryT["accessTypes"] }>): JSX.Element {
  const { t } = useTranslation();
  const accessTypeDurations = addEndDate(accessTypes);

  return (
    <Tooltip>
      <ul>
        {accessTypeDurations.map((accessTypeDuration) => (
          <li key={accessTypeDuration.beginDate}>
            <span>
              {t(
                `reservationUnit:accessTypes.${accessTypeDuration.accessType}`
              )}
              {": "}
            </span>
            <span>
              {accessTypeDuration.endDate !== ""
                ? `${accessTypeDuration.beginDate} – ${accessTypeDuration.endDate}`
                : `${t("common:beginLabel")} ${accessTypeDuration.beginDate}`}
            </span>
          </li>
        ))}
      </ul>
    </Tooltip>
  );
}

function IconList({
  reservationUnit,
  subventionSuffix,
}: Readonly<
  Pick<HeadProps, "reservationUnit" | "subventionSuffix">
>): JSX.Element {
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

  type IconTextType = ReadonlyArray<{
    key: string;
    icon: Readonly<JSX.Element>;
    text: Readonly<string | JSX.Element>;
  }>;

  const iconsTexts: IconTextType = filterNonNullable([
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
    reservationUnit.currentAccessType &&
    reservationUnit.currentAccessType !== AccessType.Unrestricted
      ? {
          key: "accessType",
          icon: (
            <IconLock
              aria-hidden="false"
              aria-label={t("reservationUnit:accessType")}
            />
          ),
          text: t(
            `reservationUnit:accessTypes.${reservationUnit.currentAccessType}`
          ),
        }
      : null,
  ] as const);

  return (
    <IconListWrapper>
      {iconsTexts.map(({ icon, key, text }) =>
        key !== "accessType" ? (
          <IconWithText key={key} icon={icon} text={text} />
        ) : (
          <AccessTypeTooltipWrapper key={key}>
            <IconWithText icon={icon} text={text} />
            {reservationUnit.accessTypes.length > 1 && (
              <AccessTypeTooltip accessTypes={reservationUnit.accessTypes} />
            )}
          </AccessTypeTooltipWrapper>
        )
      )}
    </IconListWrapper>
  );
}
