import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import router from "next/router";
import { Controller, useForm } from "react-hook-form";
import {
  IconAngleDown,
  IconAngleUp,
  IconArrowRight,
  IconCross,
  IconSignout,
  Select,
} from "hds-react";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import NotificationBox from "common/src/common/NotificationBox";
import { fontMedium, H2 } from "common/src/common/typography";
import {
  Query,
  QueryReservationCancelReasonsArgs,
  ReservationCancellationMutationInput,
  ReservationCancellationMutationPayload,
  ReservationType,
} from "common/types/gql-types";
import { Container as CommonContainer } from "common";

import Sanitize from "../common/Sanitize";
import {
  CANCEL_RESERVATION,
  GET_RESERVATION,
  GET_RESERVATION_CANCEL_REASONS,
} from "../../modules/queries/reservation";
import { JustForDesktop, JustForMobile } from "../../modules/style/layout";
import { getSelectedOption, getTranslation } from "../../modules/util";
import { CenterSpinner } from "../common/common";
import { BlackButton, MediumButton, Toast } from "../../styles/util";
import ReservationInfoCard from "./ReservationInfoCard";
import { Paragraph } from "./styles";

type Props = {
  id: number;
  logout?: () => void;
};

const Spinner = styled(CenterSpinner)`
  margin: var(--spacing-layout-xl) auto;
`;

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Container = styled(CommonContainer)`
  @media (min-width: ${breakpoints.m}) {
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Title = styled(H2).attrs({ as: "h1" })``;

const Heading = styled.div`
  font-size: var(--fontsize-body-l);
`;

const TermsToggleButton = styled(MediumButton)`
  font-size: var(--fontsize-body-m);
  ${fontMedium};
  margin-bottom: var(--spacing-s);
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  margin-top: var(--spacing-xl);
  justify-content: space-between;

  @media (min-width: ${breakpoints.s}) {
    flex-direction: row;

    button {
      max-width: 300px;
    }
  }
`;

const Content = styled.div`
  font-size: var(--fontsize-body-l);
`;

const ContentContainer = styled.div`
  margin-bottom: var(--spacing-xl);
  white-space: pre-line;

  div[role="heading"] {
    font-size: var(--fontsize-heading-s);
  }
`;

const Columns = styled.div`
  grid-template-columns: 1fr;
  display: grid;
  align-items: flex-start;
  gap: var(--spacing-l);

  @media (min-width: ${breakpoints.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    margin-top: var(--spacing-xl);
    grid-template-columns: 1fr 378px;
  }
`;

const Form = styled.form`
  margin-top: var(--spacing-m);

  label {
    ${fontMedium};
  }
`;

const StyledSelect = styled(Select)`
  margin-bottom: var(--spacing-l);

  @media (min-width: ${breakpoints.l}) {
    width: 50%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  align-items: flex-start;
  font-size: var(--fontsize-body-m);
  margin-top: var(--spacing-layout-m);
`;

const StyledLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: var(--spacing-2-xs);
  text-decoration: underline;
  color: var(--color-black) !important;
  ${fontMedium}
  cursor: pointer;
`;

const ReservationCancellation = ({ id, logout }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formState, setFormState] = useState<"unsent" | "sent">("unsent");
  const [reservation, setReservation] = useState<ReservationType>();
  const [reasons, setReasons] = useState<OptionType[]>([]);
  const [areTermsVisible, setAreTermsVisible] = useState(false);

  useQuery(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    variables: {
      pk: id,
    },
    onCompleted: (data) => {
      setReservation(data.reservationByPk);
    },
  });

  useQuery<Query, QueryReservationCancelReasonsArgs>(
    GET_RESERVATION_CANCEL_REASONS,
    {
      fetchPolicy: "cache-first",
      onCompleted: (data) => {
        setReasons(
          data.reservationCancelReasons.edges.map((edge) => ({
            label: getTranslation(edge.node, "reason"),
            value: edge.node.pk,
          }))
        );
      },
    }
  );

  const [cancelReservation, { data, loading, error }] = useMutation<
    { cancelReservation: ReservationCancellationMutationPayload },
    { input: ReservationCancellationMutationInput }
  >(CANCEL_RESERVATION);

  const { register, handleSubmit, getValues, setValue, watch, control } =
    useForm();

  useEffect(() => {
    if (!loading) {
      if (error || data?.cancelReservation?.errors?.length > 0) {
        setErrorMsg(t("reservations:reservationCancellationFailed"));
      } else if (data) {
        setFormState("sent");
        window.scrollTo(0, 0);
      }
    }
  }, [data, loading, error, t]);

  useEffect(() => {
    register("reason", { required: true });
    register("description");
  }, [register]);

  const bylineContent = useMemo(() => {
    const reservationUnit = reservation?.reservationUnits[0];
    return (
      reservation && (
        <ReservationInfoCard
          reservation={reservation}
          reservationUnit={reservationUnit}
          type="confirmed"
        />
      )
    );
  }, [reservation]);

  if (!reservation) {
    return <Spinner />;
  }

  const reservationUnit = reservation.reservationUnits[0];
  const instructions = getTranslation(
    reservationUnit,
    "reservationCancelledInstructions"
  );

  const onSubmit = (formData: { reason: number; description?: string }) => {
    const { reason, description } = formData;
    cancelReservation({
      variables: {
        input: {
          pk: reservation.pk,
          cancelReasonPk: reason,
          cancelDetails: description,
        },
      },
    });
  };

  return (
    <Wrapper>
      <Container>
        <Columns>
          <div>
            <JustForDesktop>{bylineContent}</JustForDesktop>
          </div>
          <div>
            <Heading>
              {formState === "unsent" ? (
                <>
                  <Title>{t("reservations:cancelReservation")}</Title>
                  <JustForMobile>{bylineContent}</JustForMobile>
                  <p>{t("reservations:cancelReservationBody")}</p>
                </>
              ) : (
                <>
                  <Title>{t("reservations:reservationCancelledTitle")}</Title>
                  <JustForMobile>{bylineContent}</JustForMobile>
                  <p>{t("reservations:reservationCancelledBody")}</p>
                </>
              )}
            </Heading>
            <Content>
              <ContentContainer>
                {formState === "unsent" ? (
                  <>
                    <p>{t("reservations:cancelInfoBody")}</p>
                    <TermsToggleButton
                      variant="supplementary"
                      size="small"
                      onClick={() => setAreTermsVisible(!areTermsVisible)}
                      iconRight={
                        areTermsVisible ? (
                          <IconAngleUp aria-hidden />
                        ) : (
                          <IconAngleDown aria-hidden />
                        )
                      }
                    >
                      {t(
                        `reservations:${
                          areTermsVisible ? "hide" : "show"
                        }CancellationTerms`
                      )}
                    </TermsToggleButton>
                    {areTermsVisible && (
                      <NotificationBox
                        heading={t("reservationUnit:cancellationTerms")}
                        body={
                          <Sanitize
                            html={getTranslation(
                              reservationUnit.cancellationTerms,
                              "text"
                            )}
                          />
                        }
                      />
                    )}
                    <Form onSubmit={handleSubmit(onSubmit)}>
                      <Controller
                        name="reason"
                        control={control}
                        render={() => (
                          <StyledSelect
                            id="reservation__button--cancel-reason"
                            label={`${t("reservations:cancelReason")}`}
                            onChange={(val: OptionType) => {
                              setValue("reason", val.value);
                            }}
                            options={[...reasons]}
                            placeholder={t("common:select")}
                            value={getSelectedOption(
                              getValues("reason"),
                              reasons
                            )}
                            required
                          />
                        )}
                      />
                      <Actions>
                        <BlackButton
                          variant="secondary"
                          iconLeft={<IconCross aria-hidden />}
                          onClick={() => router.back()}
                          data-testid="reservation-cancel__button--back"
                        >
                          {t("reservations:cancelReservationCancellation")}
                        </BlackButton>
                        <MediumButton
                          variant="primary"
                          type="submit"
                          disabled={!watch("reason")}
                          data-testid="reservation-cancel__button--cancel"
                        >
                          {t("reservations:cancelReservation")}
                        </MediumButton>
                      </Actions>
                    </Form>
                  </>
                ) : (
                  <>
                    {formState === "sent" && instructions && (
                      <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
                        {instructions}
                      </Paragraph>
                    )}
                    <ButtonContainer>
                      <StyledLink
                        href="/"
                        data-testid="reservation-cancel__button--back-front"
                      >
                        {t("common:gotoFrontpage")}
                        <IconArrowRight size="m" aria-hidden />
                      </StyledLink>
                      {logout && (
                        <StyledLink
                          as="button"
                          onClick={() => logout()}
                          data-testid="reservation-cancel__button--logout"
                        >
                          {t("common:logout")}
                          <IconSignout size="m" aria-hidden />
                        </StyledLink>
                      )}
                    </ButtonContainer>
                  </>
                )}
              </ContentContainer>
            </Content>
          </div>
        </Columns>
      </Container>
      {errorMsg && (
        <Toast
          type="error"
          label={t("common:error.error")}
          position="top-center"
          autoClose={false}
          displayAutoCloseProgress={false}
          onClose={() => setErrorMsg(null)}
          dismissible
          closeButtonLabelText={t("common:error.closeErrorMsg")}
        >
          {errorMsg}
        </Toast>
      )}
    </Wrapper>
  );
};

export default ReservationCancellation;
