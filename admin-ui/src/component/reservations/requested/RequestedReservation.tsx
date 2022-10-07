import { useMutation, useQuery } from "@apollo/client";
import { get, trim } from "lodash";
import { Accordion, Button, TextArea } from "hds-react";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { breakpoints } from "common/src/common/style";
import {
  Maybe,
  Mutation,
  Query,
  QueryReservationByPkArgs,
  ReservationType,
  ReservationWorkingMemoMutationInput,
  ReservationsReservationStateChoices,
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitType,
} from "../../../common/gql-types";
import { useNotification } from "../../../context/NotificationContext";
import { Divider } from "../../../styles/util";
import Loader from "../../Loader";
import withMainMenu from "../../withMainMenu";
import {
  ageGroup,
  getReservatinUnitPricing,
  getTranslationKeyForType,
  reservationDateTime,
  reservationDuration,
  reservationPrice,
  reservationUnitName,
} from "./util";
import { useModal } from "../../../context/ModalContext";
import DenyDialog from "./DenyDialog";
import ApproveDialog from "./ApproveDialog";
import ReturnToRequiredHandlingDialog from "./ReturnToRequiresHandlingDialog";
import { RESERVATION_QUERY, UPDATE_WORKING_MEMO } from "./queries";
import BreadcrumbWrapper from "../../BreadcrumbWrapper";
import { H1 } from "../../../styles/new-typography";
import { HorisontalFlex, VerticalFlex } from "../../../styles/layout";
import { publicUrl } from "../../../common/const";
import ShowWhenTargetInvisible from "../../ShowWhenTargetInvisible";
import StickyHeader from "../../StickyHeader";
import { formatDateTime } from "../../../common/util";
import Calendar from "./Calendar";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-layout-2-xs);

  padding: var(--spacing-layout-2-xs) 0 var(--spacing-layout-m)
    var(--spacing-layout-m);
  max-width: var(--container-width-l);
`;

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
  margin-bottom: var(--spacing-l);
  font-size: var(--fontsize-body-s);
`;

const getName = (reservation: ReservationType) => {
  if (reservation.name) {
    return trim(`${reservation.pk}, ${reservation.name}`);
  }

  return trim(
    `${reservation.pk}, ${reservation.reserveeFirstName || ""} ${
      reservation.reserveeOrganisationName
        ? reservation.reserveeOrganisationName
        : reservation.reserveeLastName || ""
    }
    `
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
  data?: Maybe<string> | number;
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

const RequestedReservation = (): JSX.Element | null => {
  const { id } = useParams() as { id: string };
  const [reservation, setReservation] = useState<ReservationType>();
  const [workingMemo, setWorkingMemo] = useState<string>();
  const { notifyError, notifySuccess } = useNotification();
  const { t } = useTranslation();
  const { goBack } = useHistory();
  const { setModalContent } = useModal();

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

  const closeDialog = () => {
    setModalContent(null);
  };

  const ref = useRef<HTMLHeadingElement>(null);

  const closeDialogAndRefetch = () => {
    closeDialog();
    refetch();
  };

  if (loading) {
    return <Loader />;
  }

  if (!reservation) {
    return null;
  }

  const pricing = getReservatinUnitPricing(
    reservation?.reservationUnits?.[0] as ReservationUnitType,
    reservation.begin
  );

  const isNonFree =
    pricing?.pricingType ===
      ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid &&
    pricing.highestPrice >= 0;
  const buttons =
    reservation.state ===
    ReservationsReservationStateChoices.RequiresHandling ? (
      <>
        <Button
          theme="black"
          size="small"
          variant="secondary"
          disabled={false}
          onClick={(e) => {
            e.preventDefault();
            setModalContent(
              <ApproveDialog
                reservation={reservation}
                onAccept={closeDialogAndRefetch}
                onClose={closeDialog}
              />,
              true
            );
          }}
        >
          {t("RequestedReservation.approve")}
        </Button>
        <Button
          size="small"
          theme="black"
          variant="secondary"
          disabled={false}
          onClick={(e) => {
            e.preventDefault();
            setModalContent(
              <DenyDialog
                reservation={reservation}
                onReject={closeDialogAndRefetch}
                onClose={closeDialog}
              />,
              true
            );
          }}
        >
          {t("RequestedReservation.reject")}
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="secondary"
          theme="black"
          size="small"
          disabled={false}
          onClick={goBack}
        >
          {t("RequestedReservation.cancel")}
        </Button>
        <Button
          size="small"
          variant="secondary"
          theme="black"
          disabled={false}
          onClick={(e) => {
            e.preventDefault();
            setModalContent(
              <ReturnToRequiredHandlingDialog
                reservation={reservation}
                onAccept={closeDialogAndRefetch}
                onClose={closeDialog}
              />,
              true
            );
          }}
        >
          {t("RequestedReservation.returnToHandling")}
        </Button>
      </>
    );

  const reservationTagline = `${reservationDateTime(
    reservation.begin,
    reservation.end,
    t
  )} ${reservationDuration(
    reservation.begin,
    reservation.end
  )}t | ${reservation?.reservationUnits?.map(reservationUnitName).join(", ")}`;

  return (
    <>
      <BreadcrumbWrapper
        route={[
          "reservations",
          `${publicUrl}/reservations/requested`,
          "requested-reservation",
        ]}
        aliases={[
          { slug: "requested-reservation", title: getName(reservation) },
        ]}
      />
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={getName(reservation)}
          tagline={reservationTagline}
          buttons={buttons}
        />
      </ShowWhenTargetInvisible>
      <Wrapper style={{ gap: 0 }}>
        <NameState ref={ref}>
          <H1>{getName(reservation)}</H1>
          <AlignVertically style={{ gap: "var(--spacing-xs)" }}>
            <Dot />
            {t(`RequestedReservation.state.${reservation.state}`)}
          </AlignVertically>
        </NameState>
        <Tagline>{reservationTagline}</Tagline>
        <DateTime>
          {t("RequestedReservation.createdAt")}{" "}
          {formatDateTime(reservation.createdAt as string)}
        </DateTime>
        <HorisontalFlex style={{ marginBottom: "var(--spacing-l)" }}>
          {buttons}
        </HorisontalFlex>
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
              v: reservation.purpose
                ? `${reservation.purpose.nameFi}`
                : undefined,
            },
            { l: "description", v: reservation.description },
            {
              l: "price",
              v: isNonFree
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
        <div>
          <Accordion
            heading={t("RequestedReservation.workingMemo")}
            initiallyOpen={get(reservation, "workingMemo.length") > 0}
          >
            <VerticalFlex>
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
            </VerticalFlex>
          </Accordion>
          <Accordion heading={t("RequestedReservation.calendar")}>
            <Calendar
              key={reservation.state}
              begin={reservation.begin}
              reservationUnitPk={String(reservation?.reservationUnits?.[0]?.pk)}
              reservation={reservation}
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
                  data="-"
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
                data={reservation.user}
              />
            </ApplicationDatas>
          </Accordion>
        </div>
        <Divider />
      </Wrapper>
    </>
  );
};

export default withMainMenu(RequestedReservation);
