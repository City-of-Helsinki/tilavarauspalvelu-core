import React, { useRef } from "react";
import { type ApolloQueryResult, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  CustomerTypeChoice,
  type ReservationPageQuery,
  ReservationStateChoice,
  useReservationCancelReasonsQuery,
  useReservationPageQuery,
  UserPermissionChoice,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { ButtonContainer, CenterSpinner } from "common/styled";
import ShowWhenTargetInvisible from "@/component/ShowWhenTargetInvisible";
import { StickyHeader } from "@/component/StickyHeader";
import { ReservationWorkingMemo } from "@/component/WorkingMemo";
import {
  createTagString,
  getName,
  getReservationUnitPricing,
  reservationPrice,
  translateReservationCustomerType,
} from "./util";
import VisibleIfPermission from "@/component/VisibleIfPermission";
import ApprovalButtons from "./ApprovalButtons";
import { ApprovalButtonsRecurring } from "./ApprovalButtonsRecurring";
import ReservationTitleSection from "./ReservationTitleSection";
import { base64encode, isPriceFree } from "common/src/helpers";
import { formatAgeGroup } from "@/common/util";
import Error404 from "@/common/Error404";
import { ApplicationDatas, Summary } from "@/styled";
import { Accordion, DataWrapper } from "./components";
import { ReservationKeylessEntry } from "./ReservationKeylessEntrySection";
import { TimeBlockSection } from "./ReservationTimeBlockSection";
import { ReservationReserveeDetailsSection } from "@/spa/reservations/[id]/ReservationReserveeDetailsSection";
import { toUIDateTime } from "common/src/common/util";

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

function ApprovalButtonsWithPermChecks({
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
    <VisibleIfPermission reservation={reservation} permission={UserPermissionChoice.CanManageReservations}>
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

function ReservationSummary({
  reservation,
  isFree,
}: Readonly<{
  reservation: ReservationType;
  isFree: boolean;
}>) {
  const { t } = useTranslation();

  const { data } = useReservationCancelReasonsQuery({
    skip: reservation.state !== ReservationStateChoice.Cancelled,
  });

  const reservationCancelReasons = data?.reservationCancelReasons ?? [];
  let cancelReason;
  if (reservationCancelReasons) {
    cancelReason = reservationCancelReasons.find((reason) => reservation.cancelReason === reason.value)?.reasonFi;
  }

  return (
    <Summary>
      {reservation.reserveeType && (
        <DataWrapper isSummary label={t("RequestedReservation.reserveeType")}>
          {translateReservationCustomerType(reservation, t)}
        </DataWrapper>
      )}
      {reservation.numPersons && (
        <DataWrapper isSummary label={t("RequestedReservation.numPersons")}>
          {reservation.numPersons}
        </DataWrapper>
      )}
      {reservation.ageGroup && (
        <DataWrapper isSummary label={t("filters.ageGroup")}>
          {`${formatAgeGroup(reservation.ageGroup)} ${t("RequestedReservation.ageGroupSuffix")}`}
        </DataWrapper>
      )}
      {reservation.purpose?.nameFi && (
        <DataWrapper isSummary label={t("filters.purpose")}>
          {reservation.purpose.nameFi}
        </DataWrapper>
      )}
      {reservation.description && (
        <DataWrapper isSummary label={t("RequestedReservation.description")}>
          {reservation.description}
        </DataWrapper>
      )}
      {!isFree && (
        <DataWrapper isSummary label={t("RequestedReservation.price")}>
          {`${reservationPrice(reservation, t)}${
            reservation.paymentOrder?.handledPaymentDueBy
              ? ` ${t("RequestedReservation.dueByParenthesis", {
                  date: toUIDateTime(new Date(reservation.paymentOrder?.handledPaymentDueBy)),
                })}`
              : ""
          }${reservation.applyingForFreeOfCharge ? `, ${t("RequestedReservation.appliesSubvention")}` : ""}`}
        </DataWrapper>
      )}
      {reservation.state === ReservationStateChoice.Cancelled && (
        <DataWrapper isSummary label={t("RequestedReservation.cancelReason")}>
          {cancelReason || reservation.cancelReason || "-"}
        </DataWrapper>
      )}
      {reservation.state === ReservationStateChoice.Denied && (
        <DataWrapper isSummary label={t("RequestedReservation.denyReason")}>
          {reservation?.denyReason?.reasonFi || "-"}
        </DataWrapper>
      )}
      {reservation.handlingDetails && reservation.handlingDetails !== "" && (
        <DataWrapper isSummary label={t("RequestedReservation.handlingDetails")} isWide>
          {reservation.handlingDetails}
        </DataWrapper>
      )}
    </Summary>
  );
}

function ReservationWorkingMemoAccordion({
  reservation,
  onReservationUpdated,
}: Readonly<{
  reservation: ReservationType;
  onReservationUpdated: () => void;
}>) {
  const { t } = useTranslation();

  return (
    <VisibleIfPermission permission={UserPermissionChoice.CanViewReservations} reservation={reservation}>
      <Accordion
        id="reservation__working-memo"
        heading={t("RequestedReservation.workingMemo")}
        initiallyOpen={reservation.workingMemo?.length != null && reservation.workingMemo?.length > 0}
      >
        <ReservationWorkingMemo
          reservationPk={reservation.pk ?? 0}
          refetch={onReservationUpdated}
          initialValue={reservation.workingMemo ?? ""}
        />
      </Accordion>
    </VisibleIfPermission>
  );
}

function ReservationDetailsAccordion({
  reservation,
}: Readonly<{
  reservation: ReservationType;
}>) {
  const { t } = useTranslation();

  return (
    <Accordion id="reservation__reservation-details" heading={t("RequestedReservation.reservationDetails")}>
      <ApplicationDatas>
        <DataWrapper label={t("RequestedReservation.id")}>{reservation.pk}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.numPersons")}>{reservation.numPersons}</DataWrapper>
        {reservation.ageGroup && (
          <DataWrapper label={t("filters.ageGroup")}>
            {`${formatAgeGroup(reservation.ageGroup)} ${t("RequestedReservation.ageGroupSuffix")}`}
          </DataWrapper>
        )}
        <DataWrapper label={t("filters.purpose")}>{reservation.purpose?.nameFi}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.description")}>{reservation.description}</DataWrapper>
      </ApplicationDatas>
    </Accordion>
  );
}

function ReservationUserAccordion({
  reservation,
}: Readonly<{
  reservation: ReservationType;
}>) {
  const { t } = useTranslation();

  return (
    <Accordion id="reservation__reservation-user" heading={t("RequestedReservation.reservationUser")}>
      <ApplicationDatas>
        <DataWrapper label={t("RequestedReservation.reserveeType")}>
          {translateReservationCustomerType(reservation, t)}
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
        <DataWrapper label={t("filters.homeCity")}>{reservation.homeCity?.nameFi}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.reserveeId")}>
          {reservation.reserveeId || t("RequestedReservation.noReserveeId")}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.reserveeFirstName")}>{reservation.reserveeFirstName}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.reserveeLastName")}>{reservation.reserveeLastName}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.reserveePhone")}>{reservation.reserveePhone}</DataWrapper>
        <DataWrapper label={t("RequestedReservation.reserveeEmail")}>{reservation.reserveeEmail}</DataWrapper>
      </ApplicationDatas>
    </Accordion>
  );
}

function ReservationPricingDetailsAccordion({
  reservation,
}: Readonly<{
  reservation: ReservationType;
}>) {
  const { t } = useTranslation();

  return (
    <Accordion id="reservation__pricing-details" heading={t("RequestedReservation.pricingDetails")}>
      <ApplicationDatas>
        <DataWrapper label={t("RequestedReservation.price")}>
          {reservation.price && reservationPrice(reservation, t)}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.paymentState")}>
          {reservation.paymentOrder?.status == null ? "-" : t(`Payment.status.${reservation.paymentOrder?.status}`)}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.applyingForFreeOfCharge")}>
          {t(reservation.applyingForFreeOfCharge ? "common.true" : "common.false")}
        </DataWrapper>
        <DataWrapper label={t("RequestedReservation.freeOfChargeReason")}>{reservation.freeOfChargeReason}</DataWrapper>
      </ApplicationDatas>
    </Accordion>
  );
}

function RequestedReservation({
  reservation,
  refetch,
}: {
  reservation: ReservationType;
  refetch: () => Promise<ApolloQueryResult<ReservationPageQuery>>;
}): JSX.Element | null {
  const { t } = useTranslation();

  const ref = useRef<HTMLHeadingElement>(null);

  const resUnit = reservation?.reservationUnits?.[0];
  const pricing = resUnit != null ? getReservationUnitPricing(resUnit, new Date(reservation.begin)) : null;

  const isNonFree = pricing != null ? !isPriceFree(pricing) : false;

  const reservationTagline = createTagString(reservation, t);

  return (
    <>
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={getName(reservation, t)}
          tagline={reservationTagline}
          buttons={
            <ApprovalButtonsWithPermChecks
              reservation={reservation}
              isFree={!isNonFree}
              onReservationUpdated={refetch}
              disableNonEssentialButtons
            />
          }
        />
      </ShowWhenTargetInvisible>

      <ReservationTitleSection ref={ref} reservation={reservation} tagline={reservationTagline} />
      <ButtonContainer $justifyContent="flex-start">
        <ApprovalButtonsWithPermChecks reservation={reservation} onReservationUpdated={refetch} isFree={!isNonFree} />
      </ButtonContainer>

      <ReservationSummary reservation={reservation} isFree={!isNonFree} />

      <div>
        <ReservationWorkingMemoAccordion reservation={reservation} onReservationUpdated={refetch} />

        <ReservationKeylessEntry reservation={reservation} onSuccess={refetch} />

        <TimeBlockSection reservation={reservation} onReservationUpdated={refetch} />

        <ReservationDetailsAccordion reservation={reservation} />

        <ReservationUserAccordion reservation={reservation} />

        {isNonFree && <ReservationPricingDetailsAccordion reservation={reservation} />}

        <ReservationReserveeDetailsSection reservation={reservation} />
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
  const { data, loading, refetch, error } = useReservationPageQuery({
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

export const RESERVATION_PAGE_QUERY = gql`
  query ReservationPage($id: ID!) {
    reservation(id: $id) {
      id
      ...CreateTagString
      ...ReservationCommonFields
      ...TimeBlockSection
      ...ReservationTitleSectionFields
      ...ReservationKeylessEntry
      recurringReservation {
        id
        pk
        beginDate
        beginTime
        endDate
        endTime
        weekdays
        name
        description
      }
      ...ApprovalButtons
      cancelReason
      denyReason {
        id
        reasonFi
      }
      reservationUnits {
        id
        pk
        reservationStartInterval
        ...ReservationTypeFormFields
      }
      ...ReservationMetaFields
    }
  }
`;

export const RESERVATION_CANCEL_REASONS_QUERY = gql`
  query ReservationCancelReasons {
    reservationCancelReasons {
      ...CancelReasonFields
    }
  }
`;
