import { IconClock, IconGroup, IconEuroSign, IconHome, IconSize, IconLock, Tooltip } from "hds-react";
import React from "react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { convertLanguageCode, formatDuration, getTranslationSafe, toUIDate } from "common/src/common/util";
import { ReservationKind, type ReservationUnitHeadFragment } from "@gql/gql-types";
import { Flex, H1, H3 } from "common/styled";
import { breakpoints } from "common/src/const";
import { formatDateRange, formatDateTime } from "@/modules/util";
import { IconWithText } from "@/components/common/IconWithText";
import { Images } from "./Images";
import {
  getActivePricing,
  getPriceString,
  getReservationUnitAccessPeriods,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import { filterNonNullable } from "common/src/helpers";
import { gql } from "@apollo/client";

interface HeadProps {
  reservationUnit: ReservationUnitHeadFragment;
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
  reservationUnit: Pick<ReservationUnitHeadFragment, "reservationKind" | "reservationBeginsAt">;
};

function formatErrorMessages(t: TFunction, reservationUnit: NonReservableNotificationProps["reservationUnit"]): string {
  let returnText = t("reservationUnit:notifications.notReservable");
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (reservationUnit.reservationBeginsAt != null) {
    const begin = new Date(reservationUnit.reservationBeginsAt);
    if (begin > new Date()) {
      const futureOpeningText = t("reservationUnit:notifications.futureOpening", {
        date: formatDateTime(t, begin),
      });
      returnText = futureOpeningText;
    }
  }
  return returnText;
}

function NonReservableNotification({ reservationUnit }: NonReservableNotificationProps) {
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
        <IconList reservationUnit={reservationUnit} subventionSuffix={subventionSuffix} />
        {!reservationUnitIsReservable && <NonReservableNotification reservationUnit={reservationUnit} />}
      </Flex>
      <Images images={reservationUnit.images} contextName={reservationUnitName} />
    </Wrapper>
  );
}

const IconListWrapper = styled.div`
  & > div:empty {
    display: none;
  }
  width: 100%;

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

function AccessTypeTooltip({ accessTypes }: Pick<ReservationUnitHeadFragment, "accessTypes">): JSX.Element {
  const { t } = useTranslation();

  const accessTypeDurations = getReservationUnitAccessPeriods(accessTypes);
  return (
    <Tooltip>
      <ul>
        {accessTypeDurations.map((accessTypeDuration) => (
          <li key={toUIDate(accessTypeDuration.beginDate)}>
            <span>
              {t(`reservationUnit:accessTypes.${accessTypeDuration.accessType}`)}
              {": "}
            </span>
            <span>
              {accessTypeDuration.endDate != null
                ? formatDateRange(accessTypeDuration.beginDate, accessTypeDuration.endDate)
                : `${t("common:dateGte", { value: toUIDate(accessTypeDuration.beginDate) })}`}
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
}: Readonly<Pick<HeadProps, "reservationUnit" | "subventionSuffix">>): JSX.Element {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const minDur = reservationUnit.minReservationDuration ?? 0;
  const maxDur = reservationUnit.maxReservationDuration ?? 0;
  const minReservationDuration = formatDuration(t, { seconds: minDur }, true);
  const maxReservationDuration = formatDuration(t, { seconds: maxDur }, true);
  const pricing = getActivePricing(reservationUnit);
  const isPaid = isReservationUnitPaid(reservationUnit.pricings);
  const unitPrice = pricing ? getPriceString({ t, pricing }) : undefined;
  const hasSubventionSuffix = pricing && isPaid && subventionSuffix != null;

  type IconTextType = readonly {
    key: string;
    icon: Readonly<JSX.Element>;
    text: Readonly<string | JSX.Element>;
  }[];

  const iconsTexts: IconTextType = filterNonNullable([
    reservationUnit.reservationUnitType != null
      ? {
          key: "reservationUnitType",
          icon: <IconHome size={IconSize.Small} />,
          text: getTranslationSafe(reservationUnit.reservationUnitType, "name", lang),
        }
      : null,
    reservationUnit.maxPersons != null
      ? {
          key: "maxPersons",
          icon: <IconGroup aria-label={t("reservationUnit:maxPersons")} aria-hidden="false" />,
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
    reservationUnit.minReservationDuration || reservationUnit.maxReservationDuration
      ? {
          key: "eventDuration",
          icon: <IconClock aria-label={t("reservationCalendar:eventDuration")} aria-hidden="false" />,
          text: t(`reservationCalendar:eventDurationLiteral`, {
            min: minReservationDuration,
            max: maxReservationDuration,
          }),
        }
      : null,
    unitPrice != null
      ? {
          key: "unitPrice",
          icon: <IconEuroSign aria-label={t("prices:reservationUnitPriceLabel")} aria-hidden="false" />,
          text: (
            <>
              {unitPrice}
              {hasSubventionSuffix ? ": " : null}
              {hasSubventionSuffix ? subventionSuffix : null}
            </>
          ),
        }
      : null,
    reservationUnit.currentAccessType
      ? {
          key: "accessType",
          icon: <IconLock aria-hidden="false" aria-label={t("reservationUnit:accessType")} />,
          text: t(`reservationUnit:accessTypes.${reservationUnit.currentAccessType}`),
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
            {reservationUnit.accessTypes.length > 1 && <AccessTypeTooltip accessTypes={reservationUnit.accessTypes} />}
          </AccessTypeTooltipWrapper>
        )
      )}
    </IconListWrapper>
  );
}

export const RESERVATION_UNIT_HEAD_FRAGMENT = gql`
  fragment ReservationUnitHead on ReservationUnitNode {
    id
    reservationKind
    reservationBeginsAt
    nameFi
    nameSv
    nameEn
    unit {
      id
      nameFi
      nameSv
      nameEn
    }
    minReservationDuration
    maxReservationDuration
    maxPersons
    minPersons
    pricings {
      ...PricingFields
    }
    currentAccessType
    accessTypes(orderBy: [beginDateAsc], filter: { isActiveOrFuture: true }) {
      id
      pk
      accessType
      beginDate
    }
    reservationUnitType {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    images {
      ...Image
    }
  }
`;
