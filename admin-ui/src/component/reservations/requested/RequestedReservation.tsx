import { useMutation, useQuery } from "@apollo/client";
import { get, trim } from "lodash";
import { Button, TextArea } from "hds-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { TFunction } from "i18next";
import { breakpoints } from "common/src/common/style";
import {
  Maybe,
  Mutation,
  Query,
  QueryReservationByPkArgs,
  ReservationType,
  ReservationWorkingMemoMutationInput,
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { Permission } from "app/context/authStateReducer";
import { ReservationTypeSchema } from "app/schemas";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import {
  ageGroup,
  createTagString,
  getName,
  getReservatinUnitPricing,
  getTranslationKeyForReserveeType,
  reservationPrice,
} from "./util";
import { useModal } from "../../../context/ModalContext";
import { RESERVATION_QUERY, UPDATE_WORKING_MEMO } from "./queries";
import BreadcrumbWrapper from "../../BreadcrumbWrapper";
import { Container, HorisontalFlex } from "../../../styles/layout";
import { publicUrl } from "../../../common/const";
import ShowWhenTargetInvisible from "../../ShowWhenTargetInvisible";
import StickyHeader from "../../StickyHeader";
import Calendar from "./Calendar";
import ReservationUserBirthDate from "./ReservationUserBirthDate";
import VisibleIfPermission from "./VisibleIfPermission";
import { Accordion } from "../../../common/hds-fork/Accordion";
import ApprovalButtons from "./ApprovalButtons";
import RecurringReservationsView from "./RecurringReservationsView";
import { useRecurringReservations } from "./hooks";
import ApprovalButtonsRecurring from "./ApprovalButtonsRecurring";
import ReservationTitleSection from "./ReservationTitleSection";

const ApplicationDatas = styled.div`
  display: grid;
  gap: var(--spacing-l);
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Summary = styled(ApplicationDatas)`
  padding: var(--spacing-m);
  gap: var(--spacing-s);
  background: var(--color-black-5);

  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const ApplicationProp = ({
  label,
  data,
}: {
  label: string;
  data?: Maybe<string> | number;
}) =>
  data ? (
    <div>
      {label}: <strong>{data}</strong>
    </div>
  ) : null;

const ApplicationData = ({
  label,
  data,
  wide,
}: {
  label: string;
  data?: Maybe<string> | number | JSX.Element;
  wide?: boolean;
}) => (
  <div style={{ fontWeight: "400", gridColumn: wide ? "1 / span 2" : "auto" }}>
    <div
      style={{
        paddingBottom: "var(--spacing-xs)",
        color: "var(--color-black-70)",
      }}
    >
      <span>{label}</span>
    </div>
    <span style={{ fontSize: "var(--fontsize-body-l)" }}>{data}</span>
  </div>
);

const ButtonsWithPermChecks = ({
  reservation,
  isFree,
  onReservationUpdated,
}: {
  reservation: ReservationType;
  isFree: boolean;
  // Hack to deal with reservation query not being cached so we need to refetch
  onReservationUpdated: () => void;
}) => {
  const { setModalContent } = useModal();

  const closeDialog = () => {
    setModalContent(null);
  };

  return (
    <VisibleIfPermission
      reservation={reservation}
      permission={Permission.CAN_MANAGE_RESERVATIONS}
    >
      {reservation.recurringReservation ? (
        <ApprovalButtonsRecurring
          recurringReservation={reservation.recurringReservation}
          handleClose={closeDialog}
          handleAccept={() => {
            onReservationUpdated();
            closeDialog();
          }}
        />
      ) : (
        <ApprovalButtons
          state={reservation.state}
          isFree={isFree}
          reservation={reservation}
          handleClose={closeDialog}
          handleAccept={() => {
            onReservationUpdated();
            closeDialog();
          }}
        />
      )}
    </VisibleIfPermission>
  );
};

const translateType = (res: ReservationType, t: TFunction) => {
  const reservationType = ReservationTypeSchema.optional().parse(res.type);

  const [part1, part2] = getTranslationKeyForReserveeType(
    reservationType,
    res.reserveeType ?? undefined,
    res.reserveeIsUnregisteredAssociation ?? false
  );
  return `${t(part1)}${part2 ? `: ${t(part2)}` : ""}`;
};

const ReservationSummary = ({
  reservation,
  isFree,
}: {
  reservation: ReservationType;
  isFree: boolean;
}) => {
  const { t } = useTranslation();

  const type =
    reservation.reserveeType != null
      ? {
          l: "reserveeType",
          v: translateType(reservation, t),
        }
      : undefined;

  const numPersons =
    reservation.numPersons != null
      ? { l: "numPersons", v: reservation.numPersons }
      : undefined;

  const ageGroupParams =
    reservation.ageGroup != null
      ? {
          l: "ageGroup",
          v: `${ageGroup(reservation.ageGroup)} ${t(
            "RequestedReservation.ageGroupSuffix"
          )}`,
        }
      : undefined;

  const purpose =
    reservation.purpose?.nameFi != null
      ? { l: "purpose", v: reservation.purpose.nameFi }
      : undefined;

  const description = reservation.description
    ? { l: "description", v: reservation.description }
    : undefined;

  const price = !isFree
    ? {
        l: "price",
        v: `${reservationPrice(reservation, t)}${
          reservation.applyingForFreeOfCharge
            ? `, ${t("RequestedReservation.appliesSubvention")}`
            : ""
        }`,
      }
    : undefined;

  const summary = [
    ...(type != null ? [type] : []),
    ...(numPersons != null ? [numPersons] : []),
    ...(ageGroupParams != null ? [ageGroupParams] : []),
    ...(purpose != null ? [purpose] : []),
    ...(description != null ? [description] : []),
    ...(price != null ? [price] : []),
  ];

  if (summary.length === 0) {
    return null;
  }

  return (
    <Summary>
      {summary.map((e) => (
        <ApplicationProp
          key={e.l}
          label={t(`RequestedReservation.${e.l}`)}
          data={e.v}
        />
      ))}
    </Summary>
  );
};

const maybeStringToDate: (s?: string) => Date | undefined = (str) =>
  str ? new Date(str) : undefined;

const onlyFutureDates: (d?: Date) => Date | undefined = (d) =>
  d && d > new Date() ? d : undefined;

const TimeBlock = ({
  reservation,
  onReservationUpdated,
}: {
  reservation: ReservationType;
  onReservationUpdated: () => void;
}) => {
  const [selected, setSelected] = useState<ReservationType | undefined>(
    undefined
  );

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
      x.state === ReservationsReservationStateChoices.Confirmed &&
      new Date(x.begin) > new Date()
  );

  const shownReservation =
    new Date(reservation.begin) > new Date() ? reservation : nextReservation;

  const focusDate =
    maybeStringToDate(selected?.begin) ??
    onlyFutureDates(maybeStringToDate(shownReservation?.begin)) ??
    new Date();

  return (
    <>
      {reservation.recurringReservation && (
        <Accordion heading={t("RequestedReservation.recurring")}>
          <RecurringReservationsView
            reservation={reservation}
            onSelect={setSelected}
            onReservationUpdated={onReservationUpdated}
          />
        </Accordion>
      )}
      <Accordion
        heading={t("RequestedReservation.calendar")}
        initiallyOpen={reservation.recurringReservation != null}
        id="reservation-calendar"
      >
        <Calendar
          reservationUnitPk={String(reservation?.reservationUnits?.[0]?.pk)}
          reservation={reservation}
          selected={selected}
          focusDate={focusDate}
        />
      </Accordion>
    </>
  );
};

const WorkingMemo = ({
  initialValue,
  reservationPk,
  refetch,
}: {
  initialValue: string;
  reservationPk: number;
  refetch: () => void;
}) => {
  const [workingMemo, setWorkingMemo] = useState<string>(initialValue);
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();

  const [updateWorkingMemo] = useMutation<
    Mutation,
    ReservationWorkingMemoMutationInput
  >(UPDATE_WORKING_MEMO, {
    onCompleted: () => {
      refetch();
      notifySuccess(t("RequestedReservation.savedWorkingMemo"));
    },
    onError: () => {
      notifyError(t("RequestedReservation.errorSavingWorkingMemo"));
    },
  });

  const updateMemo = (memo: string) =>
    updateWorkingMemo({
      variables: { pk: reservationPk, workingMemo: memo },
    });

  const handleSave = async () => {
    try {
      await updateMemo(workingMemo);
    } catch (ex) {
      notifyError(t("RequestedReservation.errorSavingWorkingMemo"));
    }
  };

  return (
    <>
      <TextArea
        label={t("RequestedReservation.workingMemoLabel")}
        id="workingMemo"
        helperText={t("RequestedReservation.workingMemoHelperText")}
        value={workingMemo}
        onChange={(e) => setWorkingMemo(e.target.value)}
      />
      <HorisontalFlex style={{ justifyContent: "flex-end" }}>
        <Button
          size="small"
          variant="secondary"
          onClick={() => setWorkingMemo(initialValue || "")}
        >
          {t("common.cancel")}
        </Button>
        <Button size="small" onClick={handleSave}>
          {t("RequestedReservation.save")}
        </Button>
      </HorisontalFlex>
    </>
  );
};

const RequestedReservation = ({
  reservation,
  refetch,
}: {
  reservation: ReservationType;
  refetch: () => void;
}): JSX.Element | null => {
  const { t } = useTranslation();

  const ref = useRef<HTMLHeadingElement>(null);

  const pricing = reservation?.reservationUnits?.[0]
    ? getReservatinUnitPricing(
        reservation?.reservationUnits?.[0],
        reservation.begin
      )
    : undefined;

  const isNonFree =
    pricing?.pricingType ===
      ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid &&
    pricing.highestPrice >= 0;

  const reservationTagline = createTagString(reservation, t);

  return (
    <>
      <BreadcrumbWrapper
        route={[
          "reservations",
          `${publicUrl}/reservations/requested`,
          "requested-reservation",
        ]}
        aliases={[
          {
            slug: "requested",
            title: t("breadcrumb.requested-reservations"),
          },
          { slug: "requested-reservation", title: getName(reservation, t) },
        ]}
      />
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={getName(reservation, t)}
          tagline={reservationTagline}
          buttons={
            <ButtonsWithPermChecks
              reservation={reservation}
              isFree={!isNonFree}
              onReservationUpdated={refetch}
            />
          }
        />
      </ShowWhenTargetInvisible>
      <Container>
        <ReservationTitleSection
          ref={ref}
          reservation={reservation}
          tagline={reservationTagline}
        />
        <ButtonsWithPermChecks
          reservation={reservation}
          onReservationUpdated={refetch}
          isFree={!isNonFree}
        />
        <ReservationSummary reservation={reservation} isFree={!isNonFree} />
        <div>
          <VisibleIfPermission
            permission={Permission.CAN_COMMENT_RESERVATIONS}
            reservation={reservation}
          >
            <Accordion
              heading={t("RequestedReservation.workingMemo")}
              initiallyOpen={get(reservation, "workingMemo.length", 0) > 0}
            >
              <WorkingMemo
                initialValue={reservation.workingMemo ?? ""}
                reservationPk={reservation.pk ?? 0}
                refetch={refetch}
              />
            </Accordion>
          </VisibleIfPermission>
          <TimeBlock reservation={reservation} onReservationUpdated={refetch} />
          <Accordion heading={t("RequestedReservation.reservationDetails")}>
            <ApplicationDatas>
              <ApplicationData
                label={t("RequestedReservation.id")}
                data={reservation.pk}
              />
              <ApplicationData
                label={t("RequestedReservation.numPersons")}
                data={reservation.numPersons}
              />
              {reservation.ageGroup && (
                <ApplicationData
                  label={t("RequestedReservation.ageGroup")}
                  data={`${ageGroup(reservation.ageGroup)} ${t(
                    "RequestedReservation.ageGroupSuffix"
                  )}`}
                />
              )}
              <ApplicationData
                label={t("RequestedReservation.purpose")}
                data={reservation.purpose?.nameFi}
              />
              <ApplicationData
                label={t("RequestedReservation.description")}
                data={reservation.description}
              />
            </ApplicationDatas>
          </Accordion>
          <Accordion heading={t("RequestedReservation.reservationUser")}>
            <ApplicationDatas>
              <ApplicationData
                label={t("RequestedReservation.reserveeType")}
                data={translateType(reservation, t)}
                wide={
                  reservation.reserveeType ===
                  ReservationsReservationReserveeTypeChoices.Individual
                }
              />
              <ApplicationData
                label={t(
                  reservation.reserveeType ===
                    ReservationsReservationReserveeTypeChoices.Business
                    ? "RequestedReservation.reserveeBusinessName"
                    : "RequestedReservation.reserveeOrganisationName"
                )}
                data={reservation.reserveeOrganisationName}
              />
              <ApplicationData
                label={t("RequestedReservation.homeCity")}
                data={reservation.homeCity?.nameFi}
              />
              <ApplicationData
                label={t("RequestedReservation.reserveeId")}
                data={
                  reservation.reserveeId ||
                  t("RequestedReservation.noReserveeId")
                }
              />
              <ApplicationData
                label={t("RequestedReservation.reserveeFirstName")}
                data={reservation.reserveeFirstName}
              />
              <ApplicationData
                label={t("RequestedReservation.reserveeLastName")}
                data={reservation.reserveeLastName}
              />
              <ApplicationData
                label={t("RequestedReservation.reserveePhone")}
                data={reservation.reserveePhone}
              />
              <ApplicationData
                label={t("RequestedReservation.reserveeEmail")}
                data={reservation.reserveeEmail}
              />
            </ApplicationDatas>
          </Accordion>

          {isNonFree && (
            <Accordion heading={t("RequestedReservation.pricingDetails")}>
              <ApplicationDatas>
                <ApplicationData
                  label={t("RequestedReservation.price")}
                  data={reservation.price && reservationPrice(reservation, t)}
                />
                <ApplicationData
                  label={t("RequestedReservation.paymentState")}
                  data={
                    reservation.orderStatus === null
                      ? "-"
                      : t(`Payment.status.${reservation.orderStatus}`)
                  }
                />
                <ApplicationData
                  label={t("RequestedReservation.applyingForFreeOfCharge")}
                  data={t(
                    reservation.applyingForFreeOfCharge
                      ? "common.true"
                      : "common.false"
                  )}
                />
                <ApplicationData
                  label={t("RequestedReservation.freeOfChargeReason")}
                  data={reservation.freeOfChargeReason}
                />
              </ApplicationDatas>
            </Accordion>
          )}
          <Accordion heading={t("RequestedReservation.reserveeDetails")}>
            <ApplicationDatas>
              <ApplicationData
                label={t("RequestedReservation.user")}
                data={
                  trim(
                    `${reservation?.user?.firstName || ""} ${
                      reservation?.user?.lastName || ""
                    }`
                  ) || t("RequestedReservation.noName")
                }
              />
              <ApplicationData
                label={t("RequestedReservation.email")}
                data={reservation?.user?.email}
              />
              <ApplicationData
                label={t("RequestedReservation.birthDate")}
                data={
                  <ReservationUserBirthDate
                    reservationPk={reservation.pk as number}
                    showLabel={t("RequestedReservation.showBirthDate")}
                    hideLabel={t("RequestedReservation.hideBirthDate")}
                  />
                }
              />
              <ApplicationData
                label={t("RequestedReservation.addressStreet")}
                data={
                  <>
                    <span>{reservation.reserveeAddressStreet || "-"}</span>
                    <br />
                    <span>
                      {reservation.reserveeAddressZip ||
                      reservation.reserveeAddressCity
                        ? `${reservation.reserveeAddressZip} ${reservation.reserveeAddressCity}`
                        : ""}
                    </span>
                  </>
                }
              />
              <ApplicationData
                label={t("RequestedReservation.addressCity")}
                data={reservation.reserveeAddressCity || "-"}
              />
            </ApplicationDatas>
          </Accordion>
        </div>
      </Container>
    </>
  );
};

const PermissionWrappedReservation = () => {
  const { id } = useParams() as { id: string };
  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const { data, loading, refetch } = useQuery<Query, QueryReservationByPkArgs>(
    RESERVATION_QUERY,
    {
      skip: !id || Number.isNaN(Number(id)),
      fetchPolicy: "no-cache",
      variables: {
        pk: Number(id),
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  const reservation = data?.reservationByPk;

  if (loading) {
    return <Loader />;
  }

  if (!reservation) {
    return null;
  }

  return (
    <VisibleIfPermission
      permission={Permission.CAN_VIEW_RESERVATIONS}
      reservation={reservation}
      otherwise={
        <Container>
          <p>{t("errors.noPermission")}</p>
        </Container>
      }
    >
      <RequestedReservation reservation={reservation} refetch={refetch} />
    </VisibleIfPermission>
  );
};

export default withMainMenu(PermissionWrappedReservation);
