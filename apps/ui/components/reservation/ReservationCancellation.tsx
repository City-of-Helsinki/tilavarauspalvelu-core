import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import router from "next/router";
import { Controller, useForm } from "react-hook-form";
import { IconArrowRight, IconCross, IconSignout, Select } from "hds-react";
import { useTranslation } from "next-i18next";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import NotificationBox from "common/src/common/NotificationBox";
import { fontMedium, H2 } from "common/src/common/typography";
import type {
  Query,
  QueryReservationCancelReasonsArgs,
  ReservationCancellationMutationInput,
  ReservationCancellationMutationPayload,
} from "common/types/gql-types";
import { Container as CommonContainer } from "common";
import { IconButton, ShowAllContainer } from "common/src/components";
import { filterNonNullable } from "common/src/helpers";
import Sanitize from "../common/Sanitize";
import {
  CANCEL_RESERVATION,
  GET_RESERVATION,
  GET_RESERVATION_CANCEL_REASONS,
} from "@/modules/queries/reservation";
import { JustForDesktop, JustForMobile } from "@/modules/style/layout";
import { getSelectedOption, getTranslation } from "@/modules/util";
import { CenterSpinner } from "../common/common";
import { BlackButton, MediumButton, Toast } from "@/styles/util";
import ReservationInfoCard from "./ReservationInfoCard";
import { Paragraph } from "./styles";
import { signOut } from "@/hooks/auth";

type Props = {
  id: number;
  apiBaseUrl: string;
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

const TermsContainer = styled(ShowAllContainer)`
  .ShowAllContainer__ToggleButton {
    color: var(--color-bus);
  }
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

const StyledSelect = styled(Select<OptionType>)`
  margin-bottom: var(--spacing-l);

  @media (min-width: ${breakpoints.l}) {
    width: 50%;
  }
`;

const ReturnLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const ReturnLinkList = ({
  apiBaseUrl,
  style,
}: {
  apiBaseUrl: string;
  style?: React.CSSProperties;
}): JSX.Element => {
  const { t } = useTranslation();
  return (
    <ReturnLinkContainer style={style}>
      <IconButton
        href="/reservations"
        label={t("reservations:gotoReservations")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        href="/"
        label={t("common:gotoFrontpage")}
        icon={<IconArrowRight aria-hidden />}
      />
      <IconButton
        icon={<IconSignout aria-hidden />}
        onClick={() => signOut(apiBaseUrl)}
        label={t("common:logout")}
      />
    </ReturnLinkContainer>
  );
};

const ReservationCancellation = ({ id, apiBaseUrl }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formState, setFormState] = useState<"unsent" | "sent">("unsent");

  const { data: reservationData } = useQuery(GET_RESERVATION, {
    fetchPolicy: "no-cache",
    skip: !id,
    variables: {
      pk: id,
    },
  });

  const reservation = reservationData?.reservationByPk ?? null;

  const { data: cancelReasonsData } = useQuery<
    Query,
    QueryReservationCancelReasonsArgs
  >(GET_RESERVATION_CANCEL_REASONS, {
    fetchPolicy: "cache-first",
  });

  const reasons: { label: string; value: number }[] = filterNonNullable(
    cancelReasonsData?.reservationCancelReasons?.edges.map((edge) => edge?.node)
  ).map((node) => ({
    label: getTranslation(node, "reason"),
    value: node?.pk != null ? node?.pk : 0,
  }));

  const [cancelReservation, { data, loading, error }] = useMutation<
    { cancelReservation: ReservationCancellationMutationPayload },
    { input: ReservationCancellationMutationInput }
  >(CANCEL_RESERVATION);

  const { register, handleSubmit, getValues, setValue, watch, control } =
    useForm();

  useEffect(() => {
    if (!loading) {
      if (error || Number(data?.cancelReservation?.errors?.length) > 0) {
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

  const reservationUnit = reservation?.reservationUnits?.[0] ?? null;

  const bylineContent = useMemo(() => {
    return (
      reservation && (
        <ReservationInfoCard
          reservation={reservation}
          reservationUnit={reservationUnit}
          type="confirmed"
        />
      )
    );
  }, [reservation, reservationUnit]);

  if (!reservation) {
    return <Spinner />;
  }

  const instructions = reservationUnit
    ? getTranslation(reservationUnit, "reservationCancelledInstructions")
    : undefined;

  const onSubmit = (formData: { reason?: number; description?: string }) => {
    const { reason, description } = formData;
    cancelReservation({
      variables: {
        input: {
          pk: Number(reservation.pk),
          cancelReasonPk: Number(reason),
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
                    <TermsContainer
                      showAllLabel={t("reservations:showCancellationTerms")}
                      showLessLabel={t("reservations:hideCancellationTerms")}
                      maximumNumber={0}
                    >
                      {reservationUnit?.cancellationTerms != null && (
                        <NotificationBox
                          heading={t("reservationUnit:cancellationTerms")}
                          body={
                            <Sanitize
                              html={getTranslation(
                                reservationUnit?.cancellationTerms,
                                "text"
                              )}
                            />
                          }
                        />
                      )}
                    </TermsContainer>
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
                          isLoading={loading}
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
                    <ReturnLinkList
                      apiBaseUrl={apiBaseUrl}
                      style={{
                        marginTop: "var(--spacing-3-xl)",
                      }}
                    />
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
