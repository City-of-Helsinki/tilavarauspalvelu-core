import { useMutation, useQuery } from "@apollo/client";
import { get, trim } from "lodash";
import { Button, TextArea } from "hds-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
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
  ServiceSectorType,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import {
  ageGroup,
  createTagString,
  getName,
  getReservatinUnitPricing,
  getTranslationKeyForType,
  reservationPrice,
} from "./util";
import { useModal } from "../../../context/ModalContext";
import { RESERVATION_QUERY, UPDATE_WORKING_MEMO } from "./queries";
import BreadcrumbWrapper from "../../BreadcrumbWrapper";
import {
  Container,
  HorisontalFlex,
  VerticalFlex,
} from "../../../styles/layout";
import { publicUrl } from "../../../common/const";
import ShowWhenTargetInvisible from "../../ShowWhenTargetInvisible";
import StickyHeader from "../../StickyHeader";
import Calendar from "./Calendar";
import ReservationUserBirthDate from "./ReservationUserBirthDate";
import VisibleIfPermission from "./VisibleIfPermission";
import { Accordion } from "../../../common/hds-fork/Accordion";
import ApprovalButtons from "./ApprovalButtons";
import { CURRENT_USER } from "../../../context/queries";
import { useAuthState } from "../../../context/AuthStateContext";
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

  const serviceSectorPks =
    reservation?.reservationUnits?.[0]?.unit?.serviceSectors
      ?.map((x) => x?.pk)
      ?.filter((x): x is number => x != null) ?? [];

  const unitPk = reservation?.reservationUnits?.[0]?.unit?.pk ?? undefined;

  const { data: user } = useQuery<Query>(CURRENT_USER);

  const isUsersOwnReservation = reservation?.user?.pk === user?.currentUser?.pk;

  const closeDialog = () => {
    setModalContent(null);
  };

  const { hasPermission } = useAuthState().authState;
  const permission = hasPermission(
    "can_manage_reservations",
    unitPk,
    serviceSectorPks
  );

  const ownPermissions = isUsersOwnReservation
    ? hasPermission("can_create_staff_reservations", unitPk, serviceSectorPks)
    : false;

  const userIsAllowToModify = permission || ownPermissions;
  if (!userIsAllowToModify) {
    return null;
  }

  if (reservation.recurringReservation) {
    return (
      <ApprovalButtonsRecurring
        recurringReservation={reservation.recurringReservation}
        handleClose={closeDialog}
        handleAccept={() => {
          onReservationUpdated();
          closeDialog();
        }}
      />
    );
  }

  return (
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
  );
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
          v: t(
            getTranslationKeyForType(
              reservation.reserveeType,
              reservation.reserveeIsUnregisteredAssociation ?? false
            )
          ),
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

const RequestedReservation = (): JSX.Element | null => {
  const { id } = useParams() as { id: string };
  const [reservation, setReservation] = useState<ReservationType | undefined>(
    undefined
  );
  const [workingMemo, setWorkingMemo] = useState<string>();
  const { notifyError, notifySuccess } = useNotification();

  const { t } = useTranslation();

  const { loading, refetch } = useQuery<Query, QueryReservationByPkArgs>(
    RESERVATION_QUERY,
    {
      fetchPolicy: "no-cache",
      variables: {
        pk: Number(id),
      },
      onCompleted: ({ reservationByPk }) => {
        if (reservationByPk) {
          setReservation(reservationByPk);
          setWorkingMemo(reservationByPk.workingMemo || "");
        }
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  const [updateWorkingMemo] = useMutation<Mutation>(UPDATE_WORKING_MEMO);

  const updateMemo = (input: ReservationWorkingMemoMutationInput) =>
    updateWorkingMemo({ variables: { input } });

  const ref = useRef<HTMLDivElement>(null);

  if (loading) {
    return <Loader />;
  }

  if (!reservation) {
    return null;
  }

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
          <Accordion
            heading={t("RequestedReservation.workingMemo")}
            initiallyOpen={get(reservation, "workingMemo.length", 0) > 0}
          >
            <VerticalFlex>
              <VisibleIfPermission
                permissionName="can_comment_reservations"
                unitPk={
                  reservation?.reservationUnits?.[0]?.unit?.pk ?? undefined
                }
                serviceSectorPks={
                  reservation?.reservationUnits?.[0]?.unit?.serviceSectors
                    ?.filter((x): x is ServiceSectorType => x != null)
                    ?.map((x) => x.pk)
                    ?.filter((x): x is number => x != null) ?? []
                }
                otherwise={<span>{workingMemo || ""}</span>}
              >
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
                    onClick={(e) => {
                      e.preventDefault();
                      setWorkingMemo(reservation.workingMemo || "");
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="small"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        const res = await updateMemo({
                          pk: reservation.pk,
                          workingMemo,
                        });
                        if (!res.errors) {
                          refetch();
                          notifySuccess(
                            t("RequestedReservation.savedWorkingMemo")
                          );
                        } else {
                          notifyError(
                            t("RequestedReservation.errorSavingWorkingMemo")
                          );
                        }
                      } catch (ex) {
                        notifyError(
                          t("RequestedReservation.errorSavingWorkingMemo")
                        );
                      }
                    }}
                  >
                    {t("RequestedReservation.save")}
                  </Button>
                </HorisontalFlex>
              </VisibleIfPermission>
            </VerticalFlex>
          </Accordion>
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
                data={t(
                  getTranslationKeyForType(
                    reservation.reserveeType as ReservationsReservationReserveeTypeChoices,
                    reservation.reserveeIsUnregisteredAssociation ?? false
                  )
                )}
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

export default withMainMenu(RequestedReservation);
