import React from "react";
import { gql } from "@apollo/client";
import { IconClock, IconGroup, IconEuroSign, IconHome, IconSize, IconLock, Tooltip } from "hds-react";
import { type TFunction, useTranslation } from "next-i18next";
import styled from "styled-components";
import { breakpoints } from "ui/src/modules/const";
import { formatDateRange, formatDateTime, formatDuration, formatDate } from "ui/src/modules/date-utils";
import { filterNonNullable, getLocalizationLang, getTranslation, stripHtml } from "ui/src/modules/helpers";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { Flex, H1, H3 } from "ui/src/styled";
import { Sanitize } from "@ui/components/Sanitize";
import { IconWithText } from "@/components/IconWithText";
import {
  getActivePricing,
  getPriceString,
  getReservationUnitAccessPeriods,
  isReservationUnitPaid,
} from "@/modules/reservationUnit";
import { ReservationKind, type ReservationUnitHeadFragment } from "@gql/gql-types";
import { Images } from "./Images";

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

function formatErrorMessages(
  t: TFunction,
  locale: LocalizationLanguages,
  reservationUnit: NonReservableNotificationProps["reservationUnit"]
): string {
  let returnText = t("reservationUnit:notifications.notReservable");
  if (reservationUnit.reservationKind === ReservationKind.Season) {
    returnText = t("reservationUnit:notifications.onlyRecurring");
  } else if (reservationUnit.reservationBeginsAt != null) {
    const begin = new Date(reservationUnit.reservationBeginsAt);
    if (begin > new Date()) {
      const futureOpeningText = t("reservationUnit:notifications.futureOpening", {
        date: formatDateTime(begin, { t, locale }),
      });
      returnText = futureOpeningText;
    }
  }
  return returnText;
}

function NonReservableNotification({ reservationUnit }: NonReservableNotificationProps) {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const returnText = formatErrorMessages(t, lang, reservationUnit);

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
  const lang = getLocalizationLang(i18n.language);
  const reservationUnitName = getTranslation(reservationUnit, "name", lang);
  const unitName = getTranslation(reservationUnit.unit, "name", lang);

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

const TooltipWrapper = styled.div`
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
          <li key={formatDate(accessTypeDuration.beginDate)}>
            <span>
              {t(`reservationUnit:accessTypes.${accessTypeDuration.accessType}`)}
              {": "}
            </span>
            <span>
              {accessTypeDuration.endDate != null
                ? formatDateRange(accessTypeDuration.beginDate, accessTypeDuration.endDate, { includeWeekday: false })
                : t("common:dateGte", { value: formatDate(accessTypeDuration.beginDate) })}
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
  const lang = getLocalizationLang(i18n.language);
  const minDur = reservationUnit.minReservationDuration ?? 0;
  const maxDur = reservationUnit.maxReservationDuration ?? 0;
  const minReservationDuration = formatDuration(t, { seconds: minDur });
  const maxReservationDuration = formatDuration(t, { seconds: maxDur });
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
          text: getTranslation(reservationUnit.reservationUnitType, "name", lang),
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
  const activePricing = getActivePricing(reservationUnit);
  return (
    <IconListWrapper>
      {iconsTexts.map(({ icon, key, text }) => {
        switch (key) {
          case "accessType":
            return (
              <TooltipWrapper key={key}>
                <IconWithText icon={icon} text={text} />
                {reservationUnit.accessTypes.length > 1 && (
                  <AccessTypeTooltip accessTypes={reservationUnit.accessTypes} />
                )}
              </TooltipWrapper>
            );
          case "unitPrice":
            return (
              <TooltipWrapper key={key}>
                <IconWithText icon={icon} text={text} />
                {activePricing && stripHtml(getTranslation(activePricing, "materialPriceDescription", lang)) !== "" && (
                  <Tooltip>
                    <Sanitize html={getTranslation(activePricing, "materialPriceDescription", lang)} />
                  </Tooltip>
                )}
              </TooltipWrapper>
            );
          default:
            return <IconWithText key={key} icon={icon} text={text} />;
        }
      })}
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
    accessTypes(isActiveOrFuture: true, orderBy: [beginDateAsc]) {
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
