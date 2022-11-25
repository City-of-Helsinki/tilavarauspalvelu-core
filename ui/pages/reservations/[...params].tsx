import React, { useEffect, useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import router from "next/router";
import { isFinite } from "lodash";
import { Controller, useForm } from "react-hook-form";
import {
  IconAngleDown,
  IconAngleUp,
  IconArrowRight,
  IconCross,
  IconSignout,
  Notification,
  Select,
  TextArea,
} from "hds-react";
import { useTranslation } from "react-i18next";
import { OptionType } from "common/types/common";
import { breakpoints } from "common/src/common/style";
import NotificationBox from "common/src/common/NotificationBox";
import { fontMedium, H1 } from "common/src/common/typography";
import {
  Query,
  QueryReservationCancelReasonsArgs,
  ReservationCancellationMutationInput,
  ReservationCancellationMutationPayload,
  ReservationType,
} from "common/types/gql-types";
import Sanitize from "../../components/common/Sanitize";
import {
  CANCEL_RESERVATION,
  GET_RESERVATION,
  GET_RESERVATION_CANCEL_REASONS,
} from "../../modules/queries/reservation";
import {
  JustForDesktop,
  JustForMobile,
  NarrowCenteredContainer,
} from "../../modules/style/layout";
import { getSelectedOption, getTranslation } from "../../modules/util";
import { CenterSpinner } from "../../components/common/common";
import { BlackButton, MediumButton } from "../../styles/util";
import { authEnabled, emptyOption, isBrowser } from "../../modules/const";
import ReservationInfoCard from "../../components/reservation/ReservationInfoCard";
import { getReservationUnitInstructionsKey } from "../../modules/reservationUnit";
import { Paragraph } from "../../components/reservation/styles";
import { clearApiAccessToken } from "../../modules/auth/util";

type Props = {
  id: number;
  logout?: () => void;
};

export const getServerSideProps: GetServerSideProps = async ({
  locale,
  query,
}) => {
  const id = Number(query.params[0]);
  const slug = query.params[1];

  if (isFinite(id) && slug === "cancel") {
    return {
      props: {
        ...(await serverSideTranslations(locale)),
        id,
      },
    };
  }

  return {
    notFound: true,
  };
};

const Spinner = styled(CenterSpinner)`
  margin: var(--spacing-layout-xl) auto;
`;

const Wrapper = styled.div`
  background-color: var(--color-white);
`;

const Container = styled(NarrowCenteredContainer)`
  padding: 0 var(--spacing-m) var(--spacing-layout-m);

  @media (min-width: ${breakpoints.m}) {
    max-width: 1000px;
    margin-bottom: var(--spacing-layout-l);
  }
`;

const Heading = styled.div`
  font-size: var(--fontsize-body-l);
  svg {
    color: var(--color-success);
  }
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
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m);
  align-items: flex-start;
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
    register({ name: "reason", required: true });
    register({ name: "description" });
  }, [register]);

  const bylineContent = useMemo(() => {
    const reservationUnit = reservation?.reservationUnits[0];
    return (
      reservation && (
        <>
          <ReservationInfoCard
            reservation={reservation}
            reservationUnit={reservationUnit}
          />
        </>
      )
    );
  }, [reservation]);

  const instructionsKey = useMemo(
    () => getReservationUnitInstructionsKey(reservation?.state),
    [reservation?.state]
  );

  if (!reservation) {
    return <Spinner />;
  }

  const reservationUnit = reservation.reservationUnits[0];

  const onSubmit = (formData: {
    reason: { value: number };
    description?: string;
  }) => {
    const { reason, description } = formData;
    cancelReservation({
      variables: {
        input: {
          pk: reservation.pk,
          cancelReasonPk: reason.value,
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
                  <H1>{t("reservations:cancelReservation")}</H1>
                  <JustForMobile>{bylineContent}</JustForMobile>
                  <p>{t("reservations:cancelReservationBody")}</p>
                </>
              ) : (
                <>
                  <H1>{t("reservations:reservationCancelledTitle")}</H1>
                  <JustForMobile>{bylineContent}</JustForMobile>
                  <p>
                    {t("reservations:reservationCancelledBody", {
                      user: reservation?.user?.email,
                    })}
                  </p>
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
                        as={
                          <StyledSelect
                            id="reservation__button--cancel-reason"
                            label={`${t("reservations:cancelReason")}`}
                            onChange={(val: OptionType) => {
                              setValue("reason", val.value);
                            }}
                            options={[
                              emptyOption(t("common:select")),
                              ...reasons,
                            ]}
                            placeholder={t("common:select")}
                            value={getSelectedOption(
                              getValues("reason"),
                              reasons
                            )}
                            required
                          />
                        }
                        name="reason"
                        control={control}
                      />
                      <TextArea
                        id="reservation__button--cancel-description"
                        name="description"
                        label={t("reservations:cancelDescription")}
                        placeholder={t(
                          "reservations:cancelDescriptionPlaceholder"
                        )}
                        onChange={(e) =>
                          setValue("description", e.target.value)
                        }
                        maxLength={200}
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
                          disabled={!watch("reason")?.value}
                          data-testid="reservation-cancel__button--cancel"
                        >
                          {t("reservations:cancelReservation")}
                        </MediumButton>
                      </Actions>
                    </Form>
                  </>
                ) : (
                  <>
                    {getTranslation(reservationUnit, instructionsKey) && (
                      <Paragraph style={{ margin: "var(--spacing-xl) 0" }}>
                        {getTranslation(reservationUnit, instructionsKey)}
                      </Paragraph>
                    )}
                    <ButtonContainer>
                      <MediumButton
                        variant="supplementary"
                        iconRight={<IconArrowRight aria-hidden />}
                        onClick={() => router.push("/")}
                        data-testid="reservation-cancel__button--back-front"
                      >
                        {t("common:gotoFrontpage")}
                      </MediumButton>
                      {logout && (
                        <MediumButton
                          variant="supplementary"
                          iconRight={<IconSignout aria-hidden />}
                          onClick={() => logout()}
                          data-testid="reservation-cancel__button--logout"
                        >
                          {t("common:logout")}
                        </MediumButton>
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
        <Notification
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
        </Notification>
      )}
    </Wrapper>
  );
};

const ReservationCancellationWithProfileAndLogout = (
  props: Props
): JSX.Element => {
  if (!isBrowser || !authEnabled) {
    return <ReservationCancellation {...props} />;
  }

  const WithOidc = require("../../components/common/WithOidc").default;

  return (
    <WithOidc
      render={(oidcProps: { logout: (() => void) | undefined }) => (
        <ReservationCancellation
          {...props}
          logout={() => {
            clearApiAccessToken();
            oidcProps.logout();
          }}
        />
      )}
    />
  );
};

export default ReservationCancellationWithProfileAndLogout;
