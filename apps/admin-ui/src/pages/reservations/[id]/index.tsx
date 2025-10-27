import React, { useRef } from "react";
import { type ApolloQueryResult, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import {
  ReserveeType,
  type ReservationPageQuery,
  ReservationStateChoice,
  UserPermissionChoice,
  ReservationPageDocument,
  useReservationPageLazyQuery,
} from "@gql/gql-types";
import { useModal } from "@/context/ModalContext";
import { ButtonContainer } from "common/src/styled";
import { ShowWhenTargetInvisible } from "@/components/ShowWhenTargetInvisible";
import { StickyHeader } from "@/components/StickyHeader";
import { ReservationWorkingMemo } from "@/components/WorkingMemo";
import {
  createTagString,
  getName,
  getReservationUnitPricing,
  reservationPrice,
  translateReservationCustomerType,
} from "@/modules/reservation";
import VisibleIfPermission from "@/components/VisibleIfPermission";
import {
  ApprovalButtons,
  ApprovalButtonsRecurring,
  ReservationTitleSection,
  ReservationKeylessEntry,
  TimeBlockSection,
  ReservationReserveeDetailsSection,
  DataWrapper,
} from "@lib/reservations/[id]/";
import { Accordion, ApplicationDatas, Summary } from "@/styled";
import { createNodeId, ignoreMaybeArray, isPriceFree, toNumber } from "common/src/modules/helpers";
import { formatAgeGroup } from "@/modules/util";
import { formatDateTime } from "common/src/modules/date-utils";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { createClient } from "@/modules/apolloClient";
import { hasPermission } from "@/modules/permissionHelper";
import { useSession } from "@/hooks";
import { Error403 } from "@/components/Error403";

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
      {reservation.reservationSeries ? (
        <ApprovalButtonsRecurring
          reservationSeries={reservation.reservationSeries}
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

  return (
    <Summary>
      {reservation.reserveeType && (
        <DataWrapper isSummary label={t("reservation:reserveeType")}>
          {translateReservationCustomerType(reservation, t)}
        </DataWrapper>
      )}
      {reservation.numPersons && (
        <DataWrapper isSummary label={t("reservation:numPersons")}>
          {reservation.numPersons}
        </DataWrapper>
      )}
      {reservation.ageGroup && (
        <DataWrapper isSummary label={t("filters:ageGroup")}>
          {`${formatAgeGroup(reservation.ageGroup)} ${t("reservation:ageGroupSuffix")}`}
        </DataWrapper>
      )}
      {reservation.purpose?.nameFi && (
        <DataWrapper isSummary label={t("filters:purpose")}>
          {reservation.purpose.nameFi}
        </DataWrapper>
      )}
      {reservation.description && (
        <DataWrapper isSummary label={t("reservation:description")}>
          {reservation.description}
        </DataWrapper>
      )}
      {!isFree && (
        <DataWrapper isSummary label={t("reservation:price")}>
          {`${reservationPrice(reservation, t)}${
            reservation.paymentOrder?.handledPaymentDueBy
              ? ` ${t("reservation.dueByParenthesis", {
                  date: formatDateTime(new Date(reservation.paymentOrder.handledPaymentDueBy), {
                    includeTimeSeparator: true,
                  }),
                })}`
              : ""
          }${reservation.applyingForFreeOfCharge ? `, ${t("reservation:appliesSubvention")}` : ""}`}
        </DataWrapper>
      )}
      {reservation.state === ReservationStateChoice.Cancelled && (
        <DataWrapper isSummary label={t("reservation:cancelReason")}>
          {reservation.cancelReason ? t(`reservation:CancelReasons.${reservation.cancelReason}`) : "-"}
        </DataWrapper>
      )}
      {reservation.state === ReservationStateChoice.Denied && (
        <DataWrapper isSummary label={t("reservation:denyReason")}>
          {reservation?.denyReason?.reasonFi || "-"}
        </DataWrapper>
      )}
      {reservation.handlingDetails && reservation.handlingDetails !== "" && (
        <DataWrapper isSummary label={t("reservation:handlingDetails")} isWide>
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
        heading={t("reservation:workingMemo")}
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
    <Accordion id="reservation__reservation-details" heading={t("reservation:reservationDetails")}>
      <ApplicationDatas>
        <DataWrapper label={t("reservation:id")}>{reservation.pk}</DataWrapper>
        <DataWrapper label={t("reservation:numPersons")}>{reservation.numPersons}</DataWrapper>
        {reservation.ageGroup && (
          <DataWrapper label={t("filters:ageGroup")}>
            {`${formatAgeGroup(reservation.ageGroup)} ${t("reservation:ageGroupSuffix")}`}
          </DataWrapper>
        )}
        <DataWrapper label={t("filters:purpose")}>{reservation.purpose?.nameFi}</DataWrapper>
        <DataWrapper label={t("reservation:description")}>{reservation.description}</DataWrapper>
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
    <Accordion id="reservation__reservation-user" heading={t("reservation:reservationUser")}>
      <ApplicationDatas>
        <DataWrapper label={t("reservation:reserveeType")}>
          {translateReservationCustomerType(reservation, t)}
        </DataWrapper>
        <DataWrapper
          label={t(
            reservation.reserveeType === ReserveeType.Company
              ? "reservation:reserveeBusinessName"
              : "reservation:reserveeOrganisationName"
          )}
        >
          {reservation.reserveeOrganisationName}
        </DataWrapper>
        <DataWrapper label={t("filters:municipality")}>
          {reservation?.municipality ? t(`common:municipalities.${reservation.municipality.toUpperCase()}`) : "-"}
        </DataWrapper>
        <DataWrapper label={t("reservation:reserveeIdentifier")}>
          {reservation.reserveeIdentifier || t("reservation:noReserveeId")}
        </DataWrapper>
        <DataWrapper label={t("reservation:reserveeFirstName")}>{reservation.reserveeFirstName}</DataWrapper>
        <DataWrapper label={t("reservation:reserveeLastName")}>{reservation.reserveeLastName}</DataWrapper>
        <DataWrapper label={t("reservation:reserveePhone")}>{reservation.reserveePhone}</DataWrapper>
        <DataWrapper label={t("reservation:reserveeEmail")}>{reservation.reserveeEmail}</DataWrapper>
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
    <Accordion id="reservation__pricing-details" heading={t("reservation:pricingDetails")}>
      <ApplicationDatas>
        <DataWrapper label={t("reservation:price")}>
          {reservation.price && reservationPrice(reservation, t)}
        </DataWrapper>
        <DataWrapper label={t("reservation:paymentState")}>
          {reservation.paymentOrder?.status == null
            ? "-"
            : t(`translation:orderStatus.${reservation.paymentOrder?.status}`)}
        </DataWrapper>
        <DataWrapper label={t("reservation:applyingForFreeOfCharge")}>
          {t(reservation.applyingForFreeOfCharge ? "common:true" : "common:false")}
        </DataWrapper>
        <DataWrapper label={t("reservation:freeOfChargeReason")}>{reservation.freeOfChargeReason}</DataWrapper>
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

  const pricing = getReservationUnitPricing(reservation.reservationUnit, new Date(reservation.beginsAt));

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

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page({ reservation }: PropsNarrowed): JSX.Element {
  const [_fetch, query] = useReservationPageLazyQuery({
    // NOTE have to be no-cache because we have some key collisions (tag line disappears if cached)
    fetchPolicy: "no-cache",
    variables: { id: createNodeId("ReservationNode", reservation.pk ?? 0) },
  });

  const { user } = useSession();
  const unitPk = reservation.reservationUnit?.unit?.pk;
  const hasAccess = hasPermission(user, UserPermissionChoice.CanViewReservations, unitPk);
  if (!hasAccess) {
    return <Error403 />;
  }

  const reservationRefreshed = query.data?.reservation ?? reservation;

  return <RequestedReservation reservation={reservationRefreshed} refetch={query.refetch} />;
}

export async function getServerSideProps({ locale, query, req }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, req);
  const reservationPageQuery = await apolloClient.query<ReservationPageQuery>({
    query: ReservationPageDocument,
    variables: { id: createNodeId("ReservationNode", pk) },
  });

  const reservation = reservationPageQuery.data.reservation;
  if (reservation == null) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      reservation,
      ...commonProps,
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
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
      reservationSeries {
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
      reservationUnit {
        id
        pk
        reservationStartInterval
        ...ReservationTypeFormFields
      }
      ...ReservationMetaFields
    }
  }
`;
