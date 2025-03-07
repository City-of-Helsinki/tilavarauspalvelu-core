import { type ApolloQueryResult } from "@apollo/client";
import { trim } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import type { TFunction } from "i18next";
import { add, startOfISOWeek } from "date-fns";
import {
  AccessType,
  CustomerTypeChoice,
  type ReservationQuery,
  ReservationStateChoice,
  useChangeReservationAccessCodeMutation,
  useRepairReservationAccessCodeMutation,
  useReservationQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { ButtonContainer, CenterSpinner } from "common/styles/util";
import ShowWhenTargetInvisible from "@/component/ShowWhenTargetInvisible";
import { StickyHeader } from "@/component/StickyHeader";
import { ReservationWorkingMemo } from "@/component/WorkingMemo";
import { BirthDate } from "@/component/BirthDate";
import {
  createTagString,
  getName,
  getReservatinUnitPricing,
  getTranslationKeyForCustomerTypeChoice,
  reservationPrice,
} from "./util";
import Calendar from "./Calendar";
import VisibleIfPermission from "@/component/VisibleIfPermission";
import ApprovalButtons from "./ApprovalButtons";
import { RecurringReservationsView } from "@/component/RecurringReservationsView";
import { useReservationData } from "./hooks";
import { useRecurringReservations } from "@/hooks";
import { ApprovalButtonsRecurring } from "./ApprovalButtonsRecurring";
import ReservationTitleSection from "./ReservationTitleSection";
import { base64encode, isPriceFree } from "common/src/helpers";
import { formatAgeGroup, formatTime } from "@/common/util";
import Error404 from "@/common/Error404";
import {
  Accordion as AccordionBase,
  Button,
  ButtonSize,
  IconAlertCircleFill,
} from "hds-react";
import {
  ApplicationDatas,
  KVWrapper,
  Label,
  Summary,
  SummaryFourColumns,
  Value,
} from "@/styles/util";
import { errorToast, successToast } from "common/src/common/toast";
import { getValidationErrors } from "common/src/apolloUtils";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;

const Accordion = styled(AccordionBase).attrs({
  closeButton: false,
})`
  > div > div:not([class^="LoadingSpinner-module_loadingSpinner"]) {
    width: 100%;
  }

  && {
    --icon-size: 24px;

    [class^="Accordion-module_accordionHeader__"] {
      --icon-size: 32px;
    }
  }
`;

function DataWrapper({
  label,
  children,
  isWide,
  isSummary,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  isWide?: boolean;
  isSummary?: boolean;
}>): JSX.Element {
  const testSection = isSummary ? "summary" : "info";
  const testId = `reservation__${testSection}--${label}`;
  return (
    <KVWrapper $isWide={isWide} $isSummary={isSummary}>
      <Label $isSummary={isSummary}>{label}:</Label>
      <Value data-testid={testId} $isSummary={isSummary}>
        {children}
      </Value>
    </KVWrapper>
  );
}

function ButtonsWithPermChecks({
  reservation,
  isFree,
  onReservationUpdated,
  disableNonEssentialButtons,
}: Readonly<{
  reservation: ReservationType;
  isFree: boolean;
  onReservationUpdated: () => void;
  disableNonEssentialButtons?: boolean;
}>) {
  const { setModalContent } = useModal();

  const closeDialog = () => {
    setModalContent(null);
  };

  return (
    <VisibleIfPermission
      reservation={reservation}
      permission={UserPermissionChoice.CanManageReservations}
    >
      {reservation.recurringReservation ? (
        <ApprovalButtonsRecurring
          recurringReservation={reservation.recurringReservation}
          handleClose={closeDialog}
          handleAccept={() => {
            onReservationUpdated();
            closeDialog();
          }}
          disableNonEssentialButtons={disableNonEssentialButtons}
        />
      ) : (
        <ApprovalButtons
          state={reservation.state ?? ReservationStateChoice.Confirmed}
          isFree={isFree}
          reservation={reservation}
          handleClose={closeDialog}
          handleAccept={() => {
            onReservationUpdated();
            closeDialog();
          }}
          disableNonEssentialButtons={disableNonEssentialButtons}
        />
      )}
    </VisibleIfPermission>
  );
}

function translateType(res: ReservationType, t: TFunction): string {
  const [part1, part2] = getTranslationKeyForCustomerTypeChoice(
    res.type,
    res.reserveeType,
    res.reserveeIsUnregisteredAssociation
  );
  const part2WithSpace = part2 ? ` ${t(part2)}` : "";
  return `${t(part1)}${part2WithSpace}`;
}

function ReservationSummary({
  reservation,
  isFree,
}: Readonly<{
  reservation: ReservationType;
  isFree: boolean;
}>) {
  const { t } = useTranslation();

  const type =
    reservation.reserveeType != null
      ? {
          l: "RequestedReservation.reserveeType",
          v: translateType(reservation, t),
        }
      : undefined;

  const numPersons =
    reservation.numPersons != null
      ? { l: "RequestedReservation.numPersons", v: reservation.numPersons }
      : undefined;

  const ageGroupParams =
    reservation.ageGroup != null
      ? {
          l: "filters.ageGroup",
          v: `${formatAgeGroup(reservation.ageGroup)} ${t(
            "RequestedReservation.ageGroupSuffix"
          )}`,
        }
      : undefined;

  const purpose =
    reservation.purpose?.nameFi != null
      ? { l: "filters.purpose", v: reservation.purpose.nameFi }
      : undefined;

  const description = reservation.description
    ? { l: "RequestedReservation.description", v: reservation.description }
    : undefined;

  const price = !isFree
    ? {
        l: "RequestedReservation.price",
        v: `${reservationPrice(reservation, t)}${
          reservation.applyingForFreeOfCharge
            ? `, ${t("RequestedReservation.appliesSubvention")}`
            : ""
        }`,
      }
    : undefined;

  const cancelReasonString =
    reservation.state === ReservationStateChoice.Cancelled
      ? {
          l: "RequestedReservation.cancelReason",
          v: reservation?.cancelReason?.reasonFi || "-",
        }
      : undefined;
  const rejectionReasonString =
    reservation.state === ReservationStateChoice.Denied
      ? {
          l: "RequestedReservation.denyReason",
          v: reservation?.denyReason?.reasonFi || "-",
        }
      : undefined;

  const summary = [
    ...(type != null ? [type] : []),
    ...(numPersons != null ? [numPersons] : []),
    ...(ageGroupParams != null ? [ageGroupParams] : []),
    ...(purpose != null ? [purpose] : []),
    ...(description != null ? [description] : []),
    ...(price != null ? [price] : []),
    ...(cancelReasonString != null ? [cancelReasonString] : []),
    ...(rejectionReasonString != null ? [rejectionReasonString] : []),
    ...(reservation.handlingDetails != null &&
    reservation.handlingDetails !== ""
      ? [
          {
            l: "RequestedReservation.handlingDetails",
            v: reservation.handlingDetails,
          },
        ]
      : []),
  ];

  if (summary.length === 0) {
    return null;
  }

  return (
    <Summary>
      {summary
        .filter((e) => e.v != null)
        .map((e) => (
          <DataWrapper
            isSummary
            key={e.l}
            label={t(e.l)}
            isWide={e.l === "RequestedReservation.handlingDetails"}
          >
            {e.v}
          </DataWrapper>
        ))}
    </Summary>
  );
}

export function ReservationKeylessEntry({
  reservation,
  onSuccess,
}: Readonly<{
  reservation: ReservationType;
  onSuccess: () => void;
}>) {
  const { t, i18n } = useTranslation();
  const [changeAccessCodeMutation] = useChangeReservationAccessCodeMutation();
  const [repairAccessCodeAccessCodeMutation] =
    useRepairReservationAccessCodeMutation();

  const handleButton = async (reservationPk: number) => {
    const payload = { variables: { input: { pk: reservationPk } } };

    try {
      if (
        reservation.pindoraInfo?.accessCodeIsActive ===
        reservation.accessCodeShouldBeActive
      ) {
        await changeAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeChangedSuccess"),
        });
      } else {
        await repairAccessCodeAccessCodeMutation(payload);
        successToast({
          text: t("RequestedReservation.accessCodeRepairedSuccess"),
        });
      }
      onSuccess(); // refetch reservation
    } catch (err: unknown) {
      handleError(err);
    }
  };

  const handleError = (e: unknown) => {
    const validationErrors = getValidationErrors(e);
    if (validationErrors.length > 0) {
      const code = validationErrors[0].validation_code;
      if (code && i18n.exists(`errors.backendValidation.${code}`)) {
        errorToast({ text: t(`errors.backendValidation.${code}`) });
        return;
      }
      errorToast({
        text: validationErrors[0].message ?? validationErrors[0].code,
      });
      return;
    }

    if (e instanceof Error) {
      errorToast({ text: e.message });
    } else {
      errorToast({ text: t("errors.descriptive.genericError") });
    }
  };

  return (
    <Accordion
      id="reservation__access-type"
      heading={t("RequestedReservation.keylessEntry")}
      initiallyOpen={false}
    >
      <div>
        <SummaryFourColumns>
          <DataWrapper label={t("RequestedReservation.accessCodeLabel")}>
            {reservation.pindoraInfo?.accessCode ?? "-"}
          </DataWrapper>
          <DataWrapper label={t("RequestedReservation.accessCodeStatusLabel")}>
            {reservation.pindoraInfo?.accessCodeIsActive
              ? t("RequestedReservation.accessCodeStatusActive")
              : t("RequestedReservation.accessCodeStatusInactive")}
            {reservation.pindoraInfo?.accessCodeIsActive !==
              reservation.accessCodeShouldBeActive && <IconAlertCircleFill />}
          </DataWrapper>
          <DataWrapper
            label={t("RequestedReservation.accessCodeValidityLabel")}
          >
            {reservation.pindoraInfo
              ? `${formatTime(reservation.pindoraInfo.accessCodeBeginsAt)}–${formatTime(reservation.pindoraInfo.accessCodeEndsAt)}`
              : "-"}
          </DataWrapper>
          <Button
            size={ButtonSize.Small}
            onClick={() => handleButton(reservation.pk ?? 0)}
          >
            {reservation.pindoraInfo?.accessCodeIsActive ===
            reservation.accessCodeShouldBeActive
              ? t("RequestedReservation.accessCodeChange")
              : t("RequestedReservation.accessCodeRepair")}
          </Button>
        </SummaryFourColumns>
      </div>
    </Accordion>
  );
}

const maybeStringToDate: (s?: string) => Date | undefined = (str) =>
  str ? new Date(str) : undefined;

const onlyFutureDates: (d?: Date) => Date | undefined = (d) =>
  d && d > new Date() ? d : undefined;

function TimeBlock({
  reservation,
  onReservationUpdated,
}: Readonly<{
  reservation: ReservationType;
  onReservationUpdated: () => Promise<ApolloQueryResult<ReservationQuery>>;
}>): JSX.Element {
  const { t } = useTranslation();

  // date focus rules for Calendar
  // (1) if selected => show that
  // (2) else if reservation is in the future => show that
  // (3) else if reservation.recurrance has an event in the future => show that
  // (4) else show today
  const { reservations } = useRecurringReservations(
    reservation.recurringReservation?.pk ?? undefined
  );

  const nextReservation = reservations.find(
    (x) =>
      x.state === ReservationStateChoice.Confirmed &&
      new Date(x.begin) > new Date()
  );

  const shownReservation =
    new Date(reservation.begin) > new Date() ? reservation : nextReservation;

  const [focusDate, setFocusDate] = useState<Date>(
    onlyFutureDates(maybeStringToDate(shownReservation?.begin)) ?? new Date()
  );

  const calendarRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const setSelected = (pk: number) => {
    const params = new URLSearchParams(searchParams);
    if (pk > 0) {
      params.set("selected", pk.toString());
      setSearchParams(params, { replace: true });
      const selectedReservation = reservations.find((x) => x.pk === pk);
      if (selectedReservation) {
        setFocusDate(new Date(selectedReservation.begin));
        calendarRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      params.delete("selected");
      setSearchParams(params, { replace: true });
    }
  };

  // No month view so always query the whole week even if a single day is selected
  // to avoid spamming queries and having to deal with start of day - end of day.
  // focus day can be in the middle of the week.
  const { events: eventsAll, refetch: calendarRefetch } = useReservationData(
    startOfISOWeek(focusDate),
    add(startOfISOWeek(focusDate), { days: 7 }),
    reservation?.reservationUnits?.[0]?.pk ?? undefined,
    reservation?.pk ?? undefined
  );

  // Necessary because the reservation can be removed (denied) from the parent component
  // so update the calendar when that happens.
  useEffect(() => {
    if (reservation != null) {
      calendarRefetch();
    }
  }, [reservation, calendarRefetch]);

  const handleChanged = async (): Promise<
    ApolloQueryResult<ReservationQuery>
  > => {
    // TODO use allSettled
    await calendarRefetch();
    return onReservationUpdated();
  };

  return (
    <>
      {reservation.recurringReservation?.pk && (
        <Accordion
          id="reservation__recurring"
          heading={t("RequestedReservation.recurring")}
        >
          <RecurringReservationsView
            recurringPk={reservation.recurringReservation.pk}
            onSelect={setSelected}
            onReservationUpdated={handleChanged}
            onChange={handleChanged}
            reservationToCopy={reservation}
          />
        </Accordion>
      )}
      <Accordion
        heading={t("RequestedReservation.calendar")}
        initiallyOpen={reservation.recurringReservation != null}
        id="reservation__calendar"
      >
        <Calendar
          ref={calendarRef}
          reservation={reservation}
          focusDate={focusDate}
          refetch={(d) => {
            onReservationUpdated();
            // NOTE setting focus date refetches calendar data, don't double refetch
            if (!d || focusDate === d) {
              calendarRefetch();
            } else {
              setFocusDate(d);
            }
          }}
          events={eventsAll}
        />
      </Accordion>
    </>
  );
}

function RequestedReservation({
  reservation,
  refetch,
}: {
  reservation: NonNullable<ReservationQuery["reservation"]>;
  refetch: () => Promise<ApolloQueryResult<ReservationQuery>>;
}): JSX.Element | null {
  const { t } = useTranslation();

  const ref = useRef<HTMLHeadingElement>(null);

  const resUnit = reservation?.reservationUnits?.[0];
  const pricing = getReservatinUnitPricing(
    resUnit,
    new Date(reservation.begin)
  );

  const isNonFree = pricing != null ? !isPriceFree(pricing) : false;

  const reservationTagline = createTagString(reservation, t);
  const order = reservation.paymentOrder.find(() => true);

  return (
    <>
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={getName(reservation, t)}
          tagline={reservationTagline}
          buttons={
            <ButtonsWithPermChecks
              reservation={reservation}
              isFree={!isNonFree}
              onReservationUpdated={refetch}
              disableNonEssentialButtons
            />
          }
        />
      </ShowWhenTargetInvisible>
      <ReservationTitleSection
        ref={ref}
        reservation={reservation}
        tagline={reservationTagline}
      />
      <ButtonContainer $justifyContent="flex-start">
        <ButtonsWithPermChecks
          reservation={reservation}
          onReservationUpdated={refetch}
          isFree={!isNonFree}
        />
      </ButtonContainer>
      <ReservationSummary reservation={reservation} isFree={!isNonFree} />
      <div>
        <VisibleIfPermission
          permission={UserPermissionChoice.CanViewReservations}
          reservation={reservation}
        >
          <Accordion
            id="reservation__working-memo"
            heading={t("RequestedReservation.workingMemo")}
            initiallyOpen={
              reservation.workingMemo?.length != null &&
              reservation.workingMemo?.length > 0
            }
          >
            <ReservationWorkingMemo
              reservationPk={reservation.pk ?? 0}
              refetch={refetch}
              initialValue={reservation.workingMemo ?? ""}
            />
          </Accordion>
        </VisibleIfPermission>
        {reservation.accessType === AccessType.AccessCode && (
          <ReservationKeylessEntry
            reservation={reservation}
            onSuccess={refetch}
          />
        )}
        <TimeBlock reservation={reservation} onReservationUpdated={refetch} />
        <Accordion
          id="reservation__reservation-details"
          heading={t("RequestedReservation.reservationDetails")}
        >
          <ApplicationDatas>
            <DataWrapper label={t("RequestedReservation.id")}>
              {reservation.pk}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.numPersons")}>
              {reservation.numPersons}
            </DataWrapper>
            {reservation.ageGroup && (
              <DataWrapper label={t("filters.ageGroup")}>
                {`${formatAgeGroup(reservation.ageGroup)} ${t("RequestedReservation.ageGroupSuffix")}`}
              </DataWrapper>
            )}
            <DataWrapper label={t("filters.purpose")}>
              {reservation.purpose?.nameFi}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.description")}>
              {reservation.description}
            </DataWrapper>
          </ApplicationDatas>
        </Accordion>
        <Accordion
          id="reservation__reservation-user"
          heading={t("RequestedReservation.reservationUser")}
        >
          <ApplicationDatas>
            <DataWrapper label={t("RequestedReservation.reserveeType")}>
              {translateType(reservation, t)}
            </DataWrapper>
            <DataWrapper
              label={t(
                reservation.reserveeType === CustomerTypeChoice.Business
                  ? "RequestedReservation.reserveeBusinessName"
                  : "RequestedReservation.reserveeOrganisationName"
              )}
            >
              {reservation.reserveeOrganisationName}
            </DataWrapper>
            <DataWrapper label={t("filters.homeCity")}>
              {reservation.homeCity?.nameFi}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.reserveeId")}>
              {reservation.reserveeId || t("RequestedReservation.noReserveeId")}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.reserveeFirstName")}>
              {reservation.reserveeFirstName}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.reserveeLastName")}>
              {reservation.reserveeLastName}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.reserveePhone")}>
              {reservation.reserveePhone}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.reserveeEmail")}>
              {reservation.reserveeEmail}
            </DataWrapper>
          </ApplicationDatas>
        </Accordion>
        {isNonFree && (
          <Accordion
            id="reservation__pricing-details"
            heading={t("RequestedReservation.pricingDetails")}
          >
            <ApplicationDatas>
              <DataWrapper label={t("RequestedReservation.price")}>
                {reservation.price && reservationPrice(reservation, t)}
              </DataWrapper>
              <DataWrapper label={t("RequestedReservation.paymentState")}>
                {order?.status == null
                  ? "-"
                  : t(`Payment.status.${order?.status}`)}
              </DataWrapper>
              <DataWrapper
                label={t("RequestedReservation.applyingForFreeOfCharge")}
              >
                {t(
                  reservation.applyingForFreeOfCharge
                    ? "common.true"
                    : "common.false"
                )}
              </DataWrapper>
              <DataWrapper label={t("RequestedReservation.freeOfChargeReason")}>
                {reservation.freeOfChargeReason}
              </DataWrapper>
            </ApplicationDatas>
          </Accordion>
        )}
        <Accordion
          id="reservation__reservee-details"
          heading={t("RequestedReservation.reserveeDetails")}
        >
          <ApplicationDatas>
            <DataWrapper label={t("RequestedReservation.user")}>
              {trim(
                `${reservation?.user?.firstName || ""} ${
                  reservation?.user?.lastName || ""
                }`
              ) || t("RequestedReservation.noName")}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.email")}>
              {reservation?.user?.email}
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.birthDate")}>
              <BirthDate reservationPk={reservation?.pk ?? 0} />
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.addressStreet")}>
              <span>{reservation.reserveeAddressStreet || "-"}</span>
              <br />
              <span>
                {reservation.reserveeAddressZip ||
                reservation.reserveeAddressCity
                  ? `${reservation.reserveeAddressZip} ${reservation.reserveeAddressCity}`
                  : ""}
              </span>
            </DataWrapper>
            <DataWrapper label={t("RequestedReservation.addressCity")}>
              {reservation.reserveeAddressCity || "-"}
            </DataWrapper>
          </ApplicationDatas>
        </Accordion>
      </div>
    </>
  );
}

export function ReservationPage() {
  const { id: pk } = useParams() as { id: string };
  const { t } = useTranslation();
  const typename = "ReservationNode";
  const isPkValid = Number(pk) > 0;
  const id = base64encode(`${typename}:${pk}`);
  const { data, loading, refetch, error } = useReservationQuery({
    skip: !isPkValid,
    // NOTE have to be no-cache because we have some key collisions (tag line disappears if cached)
    fetchPolicy: "no-cache",
    variables: { id },
  });

  const { reservation } = data ?? {};

  // Loader check first
  if (loading && reservation == null) {
    return <CenterSpinner />;
  }

  // NOTE incorrect ids don't return an error (they return a null)
  if (!isPkValid || error != null || reservation == null) {
    return <Error404 />;
  }

  return (
    <VisibleIfPermission
      permission={UserPermissionChoice.CanViewReservations}
      reservation={reservation}
      otherwise={
        <div>
          <p>{t("errors.noPermission")}</p>
        </div>
      }
    >
      <RequestedReservation reservation={reservation} refetch={refetch} />
    </VisibleIfPermission>
  );
}
