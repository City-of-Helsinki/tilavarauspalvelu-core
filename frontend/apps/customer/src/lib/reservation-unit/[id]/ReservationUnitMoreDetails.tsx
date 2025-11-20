import React, { useMemo } from "react";
import { gql } from "@apollo/client";
import { Accordion } from "hds-react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { Sanitize } from "@ui/components/Sanitize";
import { useGenericTerms } from "@ui/hooks";
import { formatters as getFormatters } from "@ui/index";
import { breakpoints } from "@ui/modules/const";
import { formatDate, formatTimeRange, timeToMinutes } from "@ui/modules/date-utils";
import {
  filterNonNullable,
  formatListToCSV,
  getLocalizationLang,
  getTranslation,
  isPriceFree,
  toNumber,
} from "@ui/modules/helpers";
import { AddressSection } from "@/components/AddressSection";
import { Map as MapComponent } from "@/components/Map";
import { getFuturePricing, getPriceString } from "@/modules/reservationUnit";
import { JustForMobile } from "@/modules/style/layout";
import {
  type ApplicationRoundTimeSlotFieldsFragment,
  type NoticeWhenReservingFragment,
  type ReservationUnitMoreDetailsFragment,
  TimeSlotType,
  type PricingFieldsFragment,
} from "@gql/gql-types";
import { ReservationInfoSection } from "./ReservationInfoSection";

/// Below the fold content
/// TODO use a client side fetch instead of passing data from SSR (requires more refactors)
export function ReservationUnitMoreDetails({
  reservationUnit,
  isReservable,
}: Readonly<{
  reservationUnit: ReservationUnitMoreDetailsFragment;
  isReservable: boolean;
}>) {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);

  const termsOfUse = useGenericTerms();

  const activeApplicationRounds = reservationUnit.applicationRounds;
  const showApplicationRoundTimeSlots = activeApplicationRounds.length > 0;
  const applicationRoundTimeSlots = reservationUnit.applicationRoundTimeSlots;
  const shouldDisplayPricingTerms = useMemo(() => {
    const pricings = filterNonNullable(reservationUnit?.pricings);
    if (pricings.length === 0) {
      return false;
    }
    const isPaid = pricings.some((pricing) => !isPriceFree(pricing));
    return reservationUnit?.canApplyFreeOfCharge && isPaid;
  }, [reservationUnit?.canApplyFreeOfCharge, reservationUnit?.pricings]);

  const paymentTermsContent = reservationUnit.paymentTerms
    ? getTranslation(reservationUnit.paymentTerms, "text", lang)
    : undefined;
  const cancellationTermsContent = reservationUnit.cancellationTerms
    ? getTranslation(reservationUnit.cancellationTerms, "text", lang)
    : undefined;
  const pricingTermsContent = reservationUnit.pricingTerms
    ? getTranslation(reservationUnit.pricingTerms, "text", lang)
    : undefined;
  const serviceSpecificTermsContent = reservationUnit.serviceSpecificTerms
    ? getTranslation(reservationUnit.serviceSpecificTerms, "text", lang)
    : undefined;

  return (
    <>
      <ReservationInfoSection reservationUnit={reservationUnit} reservationUnitIsReservable={isReservable} />
      <NoticeWhenReservingSection reservationUnit={reservationUnit} />
      {showApplicationRoundTimeSlots && (
        <Accordion headingLevel={2} heading={t("reservationUnit:recurringHeading")} closeButton={false}>
          <p>{t("reservationUnit:recurringBody")}</p>
          {applicationRoundTimeSlots.map((day) => (
            <ApplicationRoundScheduleDay key={day.weekday} {...day} />
          ))}
        </Accordion>
      )}
      {reservationUnit.unit?.tprekId && (
        <Accordion closeButton={false} heading={t("common:location")} initiallyOpen>
          <JustForMobile customBreakpoint={breakpoints.l}>
            <AddressSection unit={reservationUnit.unit} title={getTranslation(reservationUnit, "name", lang) ?? "-"} />
          </JustForMobile>
          <MapComponent tprekId={reservationUnit.unit?.tprekId ?? ""} />
        </Accordion>
      )}
      {(paymentTermsContent || cancellationTermsContent) && (
        <Accordion
          heading={t(`reservationUnit:${paymentTermsContent ? "paymentAndCancellationTerms" : "cancellationTerms"}`)}
          closeButton={false}
          data-testid="reservation-unit__payment-and-cancellation-terms"
        >
          {paymentTermsContent && <Sanitize html={paymentTermsContent} />}
          <Sanitize html={cancellationTermsContent ?? ""} />
        </Accordion>
      )}
      {shouldDisplayPricingTerms && pricingTermsContent && (
        <Accordion
          heading={t("reservationUnit:pricingTerms")}
          closeButton={false}
          data-testid="reservation-unit__pricing-terms"
        >
          <Sanitize html={pricingTermsContent} />
        </Accordion>
      )}
      <Accordion
        heading={t("reservationUnit:termsOfUse")}
        closeButton={false}
        data-testid="reservation-unit__terms-of-use"
      >
        {serviceSpecificTermsContent && <Sanitize html={serviceSpecificTermsContent} />}
        {termsOfUse != null && <Sanitize html={getTranslation(termsOfUse, "text", lang)} />}
      </Accordion>
    </>
  );
}
function NoticeWhenReservingSection({
  reservationUnit,
}: {
  reservationUnit: NoticeWhenReservingFragment;
}): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = getLocalizationLang(i18n.language);
  const notesWhenReserving = getTranslation(reservationUnit, "notesWhenApplying", lang);

  const appRounds = reservationUnit.applicationRounds;
  const futurePricing = getFuturePricing(reservationUnit, appRounds);

  if (!futurePricing && !notesWhenReserving) {
    return null;
  }
  return (
    <Accordion
      heading={t("reservationUnit:terms")}
      headingLevel={2}
      closeButton={false}
      data-testid="reservation-unit__reservation-notice"
    >
      {futurePricing && <PriceChangeNotice futurePricing={futurePricing} />}
      {notesWhenReserving && <Sanitize html={notesWhenReserving} />}
    </Accordion>
  );
}

function PriceChangeNotice({ futurePricing }: { futurePricing: PricingFieldsFragment }): JSX.Element {
  const { t, i18n } = useTranslation();

  const isPaid = !isPriceFree(futurePricing);
  const taxPercentage = toNumber(futurePricing.taxPercentage.value) ?? 0;
  const begins = new Date(futurePricing.begins);
  const priceString = getPriceString({
    t,
    pricing: futurePricing,
  }).toLocaleLowerCase();
  const showTaxNotice = isPaid && taxPercentage > 0;
  const formatters = getFormatters(i18n.language);

  return (
    <p style={{ marginTop: 0 }}>
      <Trans
        i18nKey="reservationUnit:futurePricingNotice"
        defaults="Huomioi <bold>hinnoittelumuutos {{date}} alkaen. Uusi hinta on {{price}}</bold>."
        values={{
          date: formatDate(begins),
          price: priceString,
        }}
        components={{ bold: <strong /> }}
      />
      {showTaxNotice && (
        <strong>
          {t("reservationUnit:futurePriceNoticeTax", {
            tax: formatters.strippedDecimal?.format(taxPercentage),
          })}
        </strong>
      )}
      .
    </p>
  );
}

const StyledApplicationRoundScheduleDay = styled.p`
  span:first-child {
    display: inline-block;
    font-weight: bold;
    width: 9ch;
    margin-right: var(--spacing-s);
  }
`;

function formatTimeSlot(slot: TimeSlotType): string {
  const { begin, end } = slot;
  if (!begin || !end) {
    return "";
  }
  const beginTime = timeToMinutes(begin);
  const endTime = timeToMinutes(end);
  const endTimeChecked = endTime === 0 ? 24 * 60 : endTime;
  return formatTimeRange(beginTime, endTimeChecked, true);
}

// Returns an element for a weekday in the application round timetable, with up to two timespans
function ApplicationRoundScheduleDay(props: ApplicationRoundTimeSlotFieldsFragment) {
  const { t } = useTranslation();
  const { weekday, isClosed } = props;
  const reservableTimes = filterNonNullable(props.reservableTimes);
  return (
    <StyledApplicationRoundScheduleDay>
      <span data-testid="application-round-time-slot__weekday">{t(`common:weekdayLongEnum.${weekday}`)}</span>{" "}
      {isClosed ? (
        <span data-testid="application-round-time-slot__value">-</span>
      ) : (
        reservableTimes.length > 0 && (
          <span data-testid="application-round-time-slot__value">
            {formatListToCSV(
              t,
              reservableTimes.map((slot) => formatTimeSlot(slot))
            )}
          </span>
        )
      )}
    </StyledApplicationRoundScheduleDay>
  );
}

export const APPLICATION_ROUND_TIME_SLOT_FRAGMENT = gql`
  fragment ApplicationRoundTimeSlotFields on ApplicationRoundTimeSlotNode {
    id
    weekday
    isClosed
    reservableTimes {
      begin
      end
    }
  }
`;

export const NOTICE_WHEN_RESERVING_FRAGMENT = gql`
  fragment NoticeWhenReserving on ReservationUnitNode {
    notesWhenApplyingEn
    notesWhenApplyingFi
    notesWhenApplyingSv
    ...PriceReservationUnitFields
    applicationRounds(ongoing: true) {
      id
      reservationPeriodBeginDate
      reservationPeriodEndDate
    }
  }
`;

export const RESERVATION_UNIT_MODE_DETAILS_FRAGMENT = gql`
  fragment ReservationUnitMoreDetails on ReservationUnitNode {
    nameFi
    nameEn
    nameSv
    applicationRoundTimeSlots {
      ...ApplicationRoundTimeSlotFields
    }
    ...TermsOfUse
    ...ReservationQuotaReached
    canApplyFreeOfCharge
    ...NoticeWhenReserving
    ...ReservationInfoSection
    pricings {
      id
      highestPrice
    }
    unit {
      ...AddressFields
    }
  }
`;
