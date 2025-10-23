import React, { useMemo } from "react";
import { Trans, useTranslation } from "next-i18next";
import {
  type ApplicationRoundTimeSlotFieldsFragment,
  type NoticeWhenReservingFragment,
  TimeSlotType,
  type PricingFieldsFragment,
  useReservationUnitMoreDetailsQuery,
} from "@gql/gql-types";
import { Map as MapComponent } from "@/components/Map";
import { getFuturePricing, getPriceString, getReservationUnitName } from "@/modules/reservationUnit";
import { JustForMobile } from "@/modules/style/layout";
import { Accordion } from "hds-react";
import { gql } from "@apollo/client";
import { filterNonNullable, formatListToCSV, isPriceFree, toNumber } from "common/src/helpers";
import { convertLanguageCode, getTranslationSafe } from "common/src/common/util";
import { formatDate, formatTimeRange, timeToMinutes } from "common/src/date-utils";
import { ReservationInfoSection } from "./ReservationInfoSection";
import { Sanitize } from "common/src/components/Sanitize";
import styled from "styled-components";
import { formatters as getFormatters } from "common";
import { breakpoints } from "common/src/const";
import { AddressSection } from "./AddressSection";
import { useGenericTerms } from "common/src/hooks";

type ReservationUnitMoreDetailsProps = {
  reservationUnit: Readonly<{
    id: string;
  }>;
  isReservable: boolean;
};

/// Below the fold content so uses a client side query for data
export function ReservationUnitMoreDetails({
  reservationUnit: { id },
  isReservable,
}: Readonly<ReservationUnitMoreDetailsProps>) {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);

  const query = useReservationUnitMoreDetailsQuery({ variables: { id } });
  const { data } = query;
  const reservationUnit = data?.reservationUnit ?? undefined;

  const termsOfUse = useGenericTerms();

  const activeApplicationRounds = reservationUnit?.applicationRounds ?? [];
  const showApplicationRoundTimeSlots = activeApplicationRounds.length > 0;
  const applicationRoundTimeSlots = reservationUnit?.applicationRoundTimeSlots ?? [];
  const shouldDisplayPricingTerms = useMemo(() => {
    const pricings = filterNonNullable(reservationUnit?.pricings);
    if (pricings.length === 0) {
      return false;
    }
    const isPaid = pricings.some((pricing) => !isPriceFree(pricing));
    return reservationUnit?.canApplyFreeOfCharge && isPaid;
  }, [reservationUnit?.canApplyFreeOfCharge, reservationUnit?.pricings]);

  const paymentTermsContent = reservationUnit?.paymentTerms
    ? getTranslationSafe(reservationUnit.paymentTerms, "text", lang)
    : undefined;
  const cancellationTermsContent = reservationUnit?.cancellationTerms
    ? getTranslationSafe(reservationUnit.cancellationTerms, "text", lang)
    : undefined;
  const pricingTermsContent = reservationUnit?.pricingTerms
    ? getTranslationSafe(reservationUnit.pricingTerms, "text", lang)
    : undefined;
  const serviceSpecificTermsContent = reservationUnit?.serviceSpecificTerms
    ? getTranslationSafe(reservationUnit.serviceSpecificTerms, "text", lang)
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
      {reservationUnit?.unit?.tprekId && (
        <Accordion closeButton={false} heading={t("common:location")} initiallyOpen>
          <JustForMobile customBreakpoint={breakpoints.l}>
            <AddressSection unit={reservationUnit.unit} title={getReservationUnitName(reservationUnit) ?? "-"} />
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
        <Sanitize html={getTranslationSafe(termsOfUse ?? {}, "text", lang)} />
      </Accordion>
    </>
  );
}
function NoticeWhenReservingSection({
  reservationUnit,
}: {
  reservationUnit: NoticeWhenReservingFragment | undefined;
}): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const lang = convertLanguageCode(i18n.language);
  const notesWhenReserving = reservationUnit
    ? getTranslationSafe(reservationUnit, "notesWhenApplying", lang)
    : undefined;

  const appRounds = reservationUnit?.applicationRounds ?? [];
  const futurePricing = reservationUnit ? getFuturePricing(reservationUnit, appRounds) : undefined;

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
    ...MetadataSets
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

export const RESERVATION_UNIT_MODE_DETAILS_QUERY = gql`
  query ReservationUnitMoreDetails($id: ID!) {
    reservationUnit(id: $id) {
      id
      ...ReservationUnitMoreDetails
    }
  }
`;
