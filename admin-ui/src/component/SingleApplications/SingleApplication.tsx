import { useMutation, useQuery } from "@apollo/client";
import { get } from "lodash";
import {
  Accordion,
  Button,
  IconCalendar,
  IconLocation,
  IconTicket,
  Tag,
  TextArea,
} from "hds-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import {
  Maybe,
  Mutation,
  Query,
  QueryReservationByPkArgs,
  ReservationType,
  ReservationWorkingMemoMutationInput,
  ReservationsReservationStateChoices,
} from "../../common/gql-types";
import { RESERVATION_QUERY, UPDATE_WORKING_MEMO } from "../../common/queries";
import { useNotification } from "../../context/NotificationContext";
import { ContentContainer } from "../../styles/layout";
import {
  breakpoints,
  ButtonsStripe,
  Divider,
  WhiteButton,
} from "../../styles/util";
import LinkPrev from "../LinkPrev";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import { H1 } from "../../styles/typography";
import { ageGroup, reservationDateTime, reservationPrice } from "./util";
import { useModal } from "../../context/ModalContext";
import DenyDialog from "./DenyDialog";
import ApproveDialog from "./ApproveDialog";
import ReturnToRequiredHandlingDialog from "./ReturnToRequiresHandlingDialog";

const ViewWrapper = styled.div`
  display: grid;
  grid-template-columns: 4em 1fr;
  margin: var(--spacing-s);
  align-items: flex-start;
  gap: 0;

  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 0 1fr;
    margin: 0;
  }
`;

const IconContainer = styled.div`
  margin-top: 1.75em;
  display: flex;
  flex-direction: column;
  border-radius: 50%;
  background: var(--color-silver);
  aspect-ratio: 1;
  justify-content: center;
  align-items: center;
  width: 2.5em;

  @media (max-width: ${breakpoints.m}) {
    display: none;
  }
`;

const AlignVertically = styled.div`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: row;
  align-items: center;
`;

const AlignVerticallySmallGap = styled(AlignVertically)`
  margin-top: var(--spacing-3-xs);
  gap: var(--spacing-2-xs);
  margin-right: var(--spacing-l);
`;

const ReservationUnitName = styled.div`
  font-weight: 600;
`;

const ApplicationContent = styled.div``;

const ApplicationHeader = styled.div`
  margin-bottom: var(--spacing-m);
`;

const ApplicationDatas = styled.div`
  display: grid;
  gap: var(--spacing-l);
  grid-template-columns: 1fr 2fr;
`;

const StyledTag = styled(Tag)`
  background: var(--tilavaraus-admin-status-not-handled);
  color: white;
  font-weight: 600;
`;

const WorkingMemoContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  align-items: flex-start;
  gap: var(--spacing-l);
  button {
    width: fit-content;
  }
`;

const ApplicationData = ({
  label,
  data,
  wide = false,
}: {
  label: string;
  data?: Maybe<string> | number;
  wide?: boolean;
}) =>
  data ? (
    <div style={{ gridColumn: wide ? "1 / span 2" : "auto" }}>
      <div style={{ paddingBottom: "var(--spacing-xs)" }}>
        <strong>{label}</strong>
      </div>
      {data}
    </div>
  ) : null;

const SingleApplication = (): JSX.Element | null => {
  const { reservationPk } = useParams() as { reservationPk: string };
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
        pk: Number(reservationPk),
      },
      onCompleted: ({ reservationByPk }) => {
        if (reservationByPk) {
          setReservation(reservationByPk);
          setWorkingMemo(reservationByPk.workingMemo || "");
        }
      },
      onError: () => {
        notifyError(t("SingleApplication.errorFetchingData"));
      },
    }
  );

  const [updateWorkingMemo] = useMutation<Mutation>(UPDATE_WORKING_MEMO);

  const updateMemo = (input: ReservationWorkingMemoMutationInput) =>
    updateWorkingMemo({ variables: { input } });

  const closeDialog = () => {
    setModalContent(null);
  };

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

  return (
    <>
      <ContentContainer style={{ minHeight: "100%" }}>
        <LinkPrev route="/singleApplications" />
        <ViewWrapper>
          <IconContainer>
            <IconCustomers />
          </IconContainer>
          <ApplicationContent>
            <AlignVertically>
              <H1>{t("SingleApplication.heading")}</H1>
              <StyledTag>
                {t(`SingleApplication.state.${reservation.state}`)}
              </StyledTag>
            </AlignVertically>
            <ApplicationHeader>
              <ReservationUnitName>
                {reservation?.reservationUnits
                  ?.map((ru) => ru?.nameFi)
                  .join(", ")}
              </ReservationUnitName>
              <AlignVerticallySmallGap>
                <AlignVerticallySmallGap>
                  <IconLocation />
                  <span>
                    {reservation?.reservationUnits
                      ?.flatMap((ru) => ru?.unit?.nameFi)
                      .join(", ")}
                  </span>
                </AlignVerticallySmallGap>
                <AlignVerticallySmallGap>
                  <IconCalendar />
                  <span>
                    {reservationDateTime(reservation.begin, reservation.end, t)}
                  </span>
                </AlignVerticallySmallGap>
                <IconTicket />
                <span>{reservationPrice(reservation, t)}</span>
              </AlignVerticallySmallGap>
            </ApplicationHeader>
            <Accordion
              heading={t("SingleApplication.workingMemo")}
              initiallyOpen={get(reservation, "workingMemo.length") > 0}
            >
              <WorkingMemoContainer>
                <TextArea
                  id="workingMemo"
                  helperText={t("SingleApplication.workingMemoHelperText")}
                  value={workingMemo}
                  onChange={(e) => setWorkingMemo(e.target.value)}
                />
                <Button
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const res = await updateMemo({
                        pk: reservation.pk,
                        workingMemo,
                      });
                      if (!res.errors) {
                        refetch();
                        notifySuccess(t("SingleApplication.savedWorkingMemo"));
                      } else {
                        notifyError(
                          t("SingleApplication.errorSavingWorkingMemo")
                        );
                      }
                    } catch (ex) {
                      notifyError(
                        t("SingleApplication.errorSavingWorkingMemo")
                      );
                    }
                  }}
                >
                  {t("SingleApplication.save")}
                </Button>
              </WorkingMemoContainer>
            </Accordion>
            <Accordion heading={t("SingleApplication.calendar")}>
              TODO
            </Accordion>
            <h2>{t("SingleApplication.summary")}</h2>
            <ApplicationDatas>
              <ApplicationData
                label={t("SingleApplication.name")}
                data={reservation.name}
              />
              <ApplicationData
                label={t("SingleApplication.description")}
                data={reservation.description}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.purpose")}
                data={reservation.purpose && String(reservation.purpose.nameFi)}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.numPersons")}
                data={reservation.numPersons}
              />
              <ApplicationData
                label={t("SingleApplication.ageGroup")}
                data={ageGroup(reservation.ageGroup)}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeFirstName")}
                data={reservation.reserveeFirstName}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeLastName")}
                data={reservation.reserveeLastName}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeAddressStreet")}
                data={reservation.reserveeAddressStreet}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.reserveeAddressZip")}
                data={reservation.reserveeAddressZip}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeAddressCity")}
                data={reservation.reserveeAddressCity}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeEmail")}
                data={reservation.reserveeEmail}
              />
              <ApplicationData
                label={t("SingleApplication.reserveePhone")}
                data={reservation.reserveePhone}
              />
              <ApplicationData
                label={t("SingleApplication.reserveeOrganisationName")}
                data={reservation.reserveeOrganisationName}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.reserveeId")}
                data={reservation.reserveeId}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.billingAddressStreet")}
                data={reservation.billingAddressStreet}
                wide
              />
              <ApplicationData
                label={t("SingleApplication.billingAddressZip")}
                data={reservation.billingAddressZip}
              />
              <ApplicationData
                label={t("SingleApplication.billingAddressCity")}
                data={reservation.billingAddressCity}
              />
              <ApplicationData
                label={t("SingleApplication.billingEmail")}
                data={reservation.billingEmail}
              />
              <ApplicationData
                label={t("SingleApplication.billingPhone")}
                data={reservation.billingPhone}
              />
              <ApplicationData
                label={t("SingleApplication.homeCity")}
                data={reservation.homeCity?.name}
              />
              <ApplicationData
                label={t("SingleApplication.applyingForFreeOfCharge")}
                data={reservation.applyingForFreeOfCharge ? "Kyllä" : "Ei"}
              />
              <ApplicationData
                label={t("SingleApplication.freeOfChargeReason")}
                data={reservation.freeOfChargeReason}
              />
            </ApplicationDatas>
            <Divider />
          </ApplicationContent>
        </ViewWrapper>
        <ButtonsStripe>
          {reservation.state ===
          ReservationsReservationStateChoices.RequiresHandling ? (
            <>
              <WhiteButton
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
                {t("SingleApplication.reject")}
              </WhiteButton>

              <WhiteButton
                variant="primary"
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
                {t("SingleApplication.approve")}
              </WhiteButton>
            </>
          ) : (
            <>
              <WhiteButton
                variant="secondary"
                disabled={false}
                onClick={goBack}
              >
                {t("SingleApplication.cancel")}
              </WhiteButton>
              <WhiteButton
                variant="primary"
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
                {t("SingleApplication.returnToHandling")}
              </WhiteButton>
            </>
          )}
        </ButtonsStripe>
      </ContentContainer>
    </>
  );
};

export default withMainMenu(SingleApplication);
