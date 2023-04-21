import { useMutation, useQuery } from "@apollo/client";
import { get, trim } from "lodash";
import { Button, Tag, TextArea } from "hds-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import { H1 } from "common/src/common/typography";
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
} from "common/types/gql-types";
import { useNotification } from "../../../context/NotificationContext";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import {
  ageGroup,
  getReservatinUnitPricing,
  getReserveeName,
  getTranslationKeyForType,
  reservationDateTime,
  reservationDuration,
  reservationPrice,
  reservationUnitName,
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
import { formatDate, formatDateTime, formatTime } from "../../../common/util";
import Calendar from "./Calendar";
import ReservationUserBirthDate from "./ReservationUserBirthDate";
import VisibleIfPermission from "./VisibleIfPermission";
import { Accordion } from "../../../common/hds-fork/Accordion";
import ApprovalButtons from "./ApprovalButtons";
import { CURRENT_USER } from "../../../context/queries";
import { useAuthState } from "../../../context/AuthStateContext";
import RecurringReservationsView from "./RecurringReservationsView";

const Dot = styled.div`
  display: inline-block;
  border-radius: 50%;
  background: var(--tilavaraus-admin-status-not-handled);
  height: 1.6em;
  text-align: center;
  line-height: 1.6;
  aspect-ratio: 1;
  font-size: 0.6em;
  color: white;
  font-weight: 600;
  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
  }
`;

const AlignVertically = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
  align-items: center;
`;

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

const NameState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);

  @media (min-width: ${breakpoints.m}) {
    flex-direction: row;
    margin-bottom: 0;
  }
`;

const Tagline = styled.div`
  font-size: var(--fontsize-body-xl);
  margin-bottom: var(--spacing-xs);
`;

const DateTime = styled.div`
  margin-bottom: var(--spacing-s);
  font-size: var(--fontsize-body-s);
`;

const getName = (reservation: ReservationType, t: TFunction) => {
  if (reservation.name) {
    return trim(`${reservation.pk}, ${reservation.name}`);
  }

  return trim(
    `${reservation.pk}, ${
      getReserveeName(reservation) || t("RequestedReservation.noName")
    }`.trim()
  );
};

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
}) =>
  data ? (
    <div
      style={{ fontWeight: "400", gridColumn: wide ? "1 / span 2" : "auto" }}
    >
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
  ) : null;

const ButtonsWithPermChecks = ({
  reservation,
  refetch,
  isFree,
}: {
  reservation: ReservationType;
  refetch: () => void;
  isFree: boolean;
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

  const closeDialogAndRefetch = () => {
    closeDialog();
    refetch();
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

  if (permission || ownPermissions) {
    return (
      <ApprovalButtons
        state={reservation.state}
        isFree={isFree}
        reservation={reservation}
        handleClose={closeDialog}
        handleAccept={closeDialogAndRefetch}
      />
    );
  }

  return null;
};

const ReservationSummary = ({
  reservation,
  isFree,
}: {
  reservation: ReservationType;
  isFree: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <Summary>
      {[
        {
          l: "reserveeType",
          v: reservation.reserveeType
            ? t(
                getTranslationKeyForType(
                  reservation.reserveeType as ReservationsReservationReserveeTypeChoices,
                  reservation.reserveeIsUnregisteredAssociation
                )
              )
            : undefined,
        },
        { l: "numPersons", v: reservation.numPersons },
        {
          l: "ageGroup",
          v: reservation.ageGroup
            ? `${ageGroup(reservation.ageGroup)} ${t(
                "RequestedReservation.ageGroupSuffix"
              )}`
            : "",
        },
        {
          l: "purpose",
          v: reservation.purpose ? `${reservation.purpose.nameFi}` : undefined,
        },
        { l: "description", v: reservation.description },
        {
          l: "price",
          v: !isFree
            ? `${reservationPrice(reservation, t)}${
                reservation.applyingForFreeOfCharge
                  ? `, ${t("RequestedReservation.appliesSubvention")}`
                  : ""
              }`
            : undefined,
        },
      ].map((e) => (
        <ApplicationProp
          key={e.l}
          label={t(`RequestedReservation.${e.l}`)}
          data={e.v}
        />
      ))}
    </Summary>
  );
};

// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
// single format   : {weekday} {date} {time}, {duration} | {unit}
const createTagString = (reservation: ReservationType, t: TFunction) => {
  const recurringTag =
    reservation.recurringReservation?.beginDate &&
    reservation.recurringReservation?.endDate
      ? `${formatDate(reservation.recurringReservation.beginDate)}-${formatDate(
          reservation.recurringReservation.endDate
        )}`
      : "";
  const unitTag = reservation?.reservationUnits
    ?.map(reservationUnitName)
    .join(", ");

  const singleDateTimeTag = `${reservationDateTime(
    reservation.begin,
    reservation.end,
    t
  )}`;

  const weekDayTag = reservation.recurringReservation?.weekdays
    ?.sort()
    ?.map((x) => t(`dayShort.${x}`))
    ?.reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const recurringDateTag =
    reservation.begin && reservation.end
      ? `${weekDayTag} ${formatTime(reservation.begin, "HH:mm")}-${formatTime(
          reservation.end,
          "HH:mm"
        )}`
      : "";

  const durationTag = `${reservationDuration(
    reservation.begin,
    reservation.end
  )}`;

  const reservationTagline = `${
    reservation.recurringReservation ? recurringDateTag : singleDateTimeTag
  }, ${durationTag}t ${
    recurringTag.length > 0 ? " | " : ""
  } ${recurringTag} | ${unitTag}`;

  return reservationTagline;
};

const RequestedReservation = (): JSX.Element | null => {
  const { id } = useParams() as { id: string };
  const [reservation, setReservation] = useState<ReservationType | undefined>(
    undefined
  );
  const [workingMemo, setWorkingMemo] = useState<string>();
  const { notifyError, notifySuccess } = useNotification();
  const [selectedReservation, setSelectedReservation] = useState<
    ReservationType | undefined
  >(undefined);
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
          setSelectedReservation(reservationByPk);
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

  const ref = useRef<HTMLHeadingElement>(null);

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
              refetch={refetch}
              isFree={!isNonFree}
            />
          }
        />
      </ShowWhenTargetInvisible>
      <Container>
        <div>
          <NameState ref={ref}>
            <H1 $legacy>{getName(reservation, t)}</H1>

            <HorisontalFlex>
              <AlignVertically>
                {reservation.orderStatus && (
                  <Tag
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    theme={{ "--tag-background": "var(--color-engel-light)" }}
                    id="orderStatus"
                  >
                    {t(`Payment.status.${reservation.orderStatus}`)}
                  </Tag>
                )}
              </AlignVertically>
              <AlignVertically style={{ gap: "var(--spacing-xs)" }}>
                <Dot />
                {t(`RequestedReservation.state.${reservation.state}`)}
              </AlignVertically>
            </HorisontalFlex>
          </NameState>
          <Tagline>{reservationTagline}</Tagline>
          <DateTime>
            {t("RequestedReservation.createdAt")}{" "}
            {formatDateTime(reservation.createdAt as string)}
          </DateTime>
        </div>
        <HorisontalFlex style={{ marginBottom: "var(--spacing-s)" }}>
          <ButtonsWithPermChecks
            reservation={reservation}
            refetch={refetch}
            isFree={!isNonFree}
          />
        </HorisontalFlex>
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
          {reservation.recurringReservation && (
            <Accordion heading={t("RequestedReservation.recurring")}>
              <RecurringReservationsView
                reservation={reservation}
                onSelect={setSelectedReservation}
              />
            </Accordion>
          )}
          <Accordion heading={t("RequestedReservation.calendar")}>
            <Calendar
              reservationUnitPk={String(reservation?.reservationUnits?.[0]?.pk)}
              reservation={selectedReservation ?? reservation}
            />
          </Accordion>
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
                    reservation.reserveeIsUnregisteredAssociation
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
                data={reservation.reserveeId}
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
              <ApplicationData
                label={t("RequestedReservation.addressStreet")}
                data={reservation.reserveeAddressStreet}
              />
              <ApplicationData
                label={t("RequestedReservation.addressZipCity")}
                data={
                  reservation.reserveeAddressZip ||
                  reservation.reserveeAddressCity
                    ? `${reservation.reserveeAddressZip} ${reservation.reserveeAddressCity}`
                    : undefined
                }
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
            </ApplicationDatas>
          </Accordion>
        </div>
      </Container>
    </>
  );
};

export default withMainMenu(RequestedReservation);
