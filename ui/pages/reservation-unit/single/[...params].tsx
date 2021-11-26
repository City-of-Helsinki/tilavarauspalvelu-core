import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation } from "@apollo/client";
import router from "next/router";
import { parseISO } from "date-fns";
import {
  Koros,
  Notification,
  TextInput,
  Checkbox,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
} from "hds-react";
import { useForm } from "react-hook-form";
import { GetServerSideProps } from "next";
import { isFinite } from "lodash";
import { Trans, useTranslation } from "react-i18next";
import apolloClient from "../../../modules/apolloClient";
import {
  fontRegular,
  fontMedium,
  H1,
  H2,
  H3,
  Strong,
} from "../../../modules/style/typography";
import { breakpoint } from "../../../modules/style";
import { TwoColumnContainer } from "../../../components/common/common";
import { NarrowCenteredContainer } from "../../../modules/style/layout";
import { AccordionWithState as Accordion } from "../../../components/common/Accordion";
import { isBrowser, reservationUnitSinglePrefix } from "../../../modules/const";
import {
  applicationErrorText,
  capitalize,
  getTranslation,
} from "../../../modules/util";
import { MediumButton } from "../../../styles/util";
import { DataContext } from "../../../context/DataContext";
import {
  ReservationConfirmMutationInput,
  ReservationConfirmMutationPayload,
  ReservationUnitType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
} from "../../../modules/gql-types";
import { RESERVATION_UNIT } from "../../../modules/queries/reservationUnit";
import {
  CONFIRM_RESERVATION,
  UPDATE_RESERVATION,
} from "../../../modules/queries/reservation";
import StepperHz from "../../../components/StepperHz";
import Ticket from "../../../components/reservation/Ticket";
import Sanitize from "../../../components/common/Sanitize";

type Props = {
  reservationUnit: ReservationUnitType;
};

type Inputs = {
  pk: number;
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  name: string;
  description: string;
  spaceTerms: boolean;
  resourceTerms: boolean;
};

type Reservation = {
  pk: number;
  begin: string;
  end: string;
  reservationUnitPks: number[];
  reserveeFirstName: string;
  reserveeLastName: string;
  reserveePhone: string;
  name: string;
  user?: string;
  description: string;
  calendarUrl?: string;
  state?: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.params[0]);
  const path = params.params[1];

  if (isFinite(id) && path === "reservation") {
    const { data } = await apolloClient.query({
      query: RESERVATION_UNIT,
      variables: { pk: id },
    });

    return {
      props: {
        reservationUnit: data.reservationUnitByPk,
        ...(await serverSideTranslations(locale)),
      },
    };
  }

  return {
    notFound: true,
  };
};

const Head = styled.div`
  padding: var(--spacing-layout-m) 0 0;
  background-color: var(--color-white);
`;

const HeadWrapper = styled(NarrowCenteredContainer)`
  padding: 0 var(--spacing-m);

  @media (min-width: ${breakpoint.m}) {
    max-width: 1000px;
  }
`;

const HeadColumns = styled(TwoColumnContainer)`
  margin-top: 0;
  gap: var(--spacing-m);

  @media (min-width: ${breakpoint.m}) {
    & > div:nth-of-type(1) {
      order: 2;
    }

    gap: var(--spacing-layout-xl);
  }
`;

const Title = styled(H1)`
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  svg {
    color: var(--color-tram);
  }
`;

const Stepper = styled(StepperHz)`
  margin-bottom: var(--spacing-l);
`;

const StyledKoros = styled(Koros)`
  margin-top: var(--spacing-l);
  fill: var(--tilavaraus-gray);
`;

const BodyContainer = styled(NarrowCenteredContainer)`
  background-color: var(-color-gray);
  ${fontRegular}

  a {
    color: var(--color-bus);
  }

  @media (min-width: ${breakpoint.m}) {
    max-width: 791px;
    padding-right: 219px;
  }
`;

const StyledTextInput = styled(TextInput)`
  label {
    ${fontMedium}
  }
`;

const StyledNotification = styled(Notification).attrs({
  style: {
    "--notification-padding": "var(--spacing-m)",
  },
})`
  svg {
    position: relative;
    top: -3px;
  }
`;

const OneColumnContainer = styled(TwoColumnContainer)`
  grid-template-columns: 1fr;
  margin-bottom: var(--spacing-3-xl);

  @media (min-width: ${breakpoint.m}) {
    width: 48.638%;
  }
`;

const AccordionContainer = styled.div`
  @media (min-width: ${breakpoint.m}) {
    width: 70%;
  }

  line-height: var(--lineheight-l);

  button {
    margin-bottom: var(--spacing-xs);
  }
`;

const TermContainer = styled.div`
  margin-bottom: var(--spacing-xl);
`;

const ActionContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  button {
    margin-bottom: var(--spacing-m);

    @media (min-width: ${breakpoint.m}) {
      width: 18rem;
    }
  }
`;

const Paragraph = styled.p`
  white-space: pre-line;

  & > span {
    display: block;
  }
`;

const ParagraphAlt = styled.div`
  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;

const ValueParagraph = styled(Paragraph).attrs({
  "data-test": "reservation__confirmation--paragraph",
})``;

const ReservationUnitReservation = ({
  reservationUnit,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const {
    reservation: reservationData,
    setReservation: setContextReservation,
  } = useContext(DataContext);

  const [formStatus, setFormStatus] = useState<"pending" | "error" | "sent">(
    "pending"
  );
  const [step, setStep] = useState(0);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  const { register, handleSubmit, errors } = useForm<Inputs>();

  const [
    updateReservation,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation<
    { updateReservation: ReservationUpdateMutationPayload },
    { input: ReservationUpdateMutationInput }
  >(UPDATE_RESERVATION);

  const [
    confirmReservation,
    { data: confirmData, loading: confirmLoading, error: confirmError },
  ] = useMutation<
    { confirmReservation: ReservationConfirmMutationPayload },
    { input: ReservationConfirmMutationInput }
  >(CONFIRM_RESERVATION);

  useEffect(() => {
    return () => {
      setContextReservation(null);
    };
  }, [setContextReservation]);

  useEffect(() => {
    if (!updateLoading) {
      if (updateError || updateData?.updateReservation?.errors?.length > 0) {
        setErrorMsg(t("reservationUnit:reservationUpdateFailed"));
      } else if (updateData) {
        if (updateData.updateReservation.reservation.state === "CANCELLED") {
          setContextReservation(null);
          router.push(`${reservationUnitSinglePrefix}/${reservationUnit.pk}`);
        } else {
          setReservation({
            ...reservation,
            calendarUrl: updateData.updateReservation?.reservation?.calendarUrl,
          });
          setStep(1);
          window.scrollTo(0, 0);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData, updateLoading, updateError]);

  useEffect(() => {
    if (!confirmLoading) {
      window.scrollTo(0, 0);

      if (confirmError || confirmData?.confirmReservation?.errors?.length > 0) {
        setErrorMsg(t("reservationUnit:reservationUpdateFailed"));
      } else if (confirmData) {
        setReservation({
          ...reservation,
          state: "CONFIRMED",
        });
        setFormStatus("sent");
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmData, confirmLoading, confirmError]);

  if (
    isBrowser &&
    (!reservationData?.pk || !reservationData?.begin || !reservationData?.end)
  ) {
    router.push(`${reservationUnitSinglePrefix}/${reservationUnit.pk}`);
    return null;
  }

  const { pk: reservationPk, begin, end } = reservationData || {};

  const beginDate = t("common:dateWithWeekday", {
    date: begin && parseISO(begin),
  });

  const beginTime = t("common:timeWithPrefix", {
    date: begin && parseISO(begin),
  });

  const endDate = t("common:dateWithWeekday", {
    date: end && parseISO(end),
  });

  const endTime = t("common:time", {
    date: end && parseISO(end),
  });

  const onSubmit1 = (payload) => {
    const input = {
      pk: reservationPk,
      begin,
      end,
      reservationUnitPks: [reservationUnit.pk],
      reserveeFirstName: payload.reserveeFirstName,
      reserveeLastName: payload.reserveeLastName,
      reserveePhone: payload.reserveePhone,
      name: payload.name,
      description: payload.description,
    };

    setReservation(input);

    updateReservation({
      variables: {
        input,
      },
    });
  };

  const onSubmit2 = () => {
    confirmReservation({
      variables: {
        input: {
          pk: reservationPk,
        },
      },
    });
  };

  const cancelReservation = () => {
    updateReservation({
      variables: {
        input: {
          pk: reservationPk,
          state: "CANCELLED",
        },
      },
    });
  };

  if (!isBrowser) {
    return null;
  }

  return (
    <>
      <Head>
        <HeadWrapper>
          <HeadColumns>
            <div>
              <Ticket
                title={getTranslation(reservationUnit, "name")}
                subtitle={getTranslation(reservationUnit.unit, "name")}
                begin={begin}
                end={end}
                state={formStatus === "sent" ? "complete" : "incomplete"}
                isFree
              />
            </div>
            <div>
              {formStatus === "sent" ? (
                <Title>
                  <IconCheck size="l" />
                  {t("reservationUnit:reservationSuccessful")}
                </Title>
              ) : (
                <Title>{t("reservationCalendar:newReservation")}</Title>
              )}
              <Stepper
                steps={[
                  { label: "1" },
                  { label: "2" },
                  { label: "3", done: step === 2 },
                ]}
                active={step}
              />
              <H3>
                {step + 1}. {t(`reservationCalendar:steps.step${step + 1}`)}
              </H3>
            </div>
          </HeadColumns>
        </HeadWrapper>
        <StyledKoros className="koros" type="wave" />
      </Head>
      {formStatus === "pending" && (
        <BodyContainer>
          {step === 0 && (
            <form onSubmit={handleSubmit(onSubmit1)}>
              <H2 style={{ marginTop: "var(--spacing-layout-m)" }}>
                {t("reservationCalendar:reserverInfo")}
              </H2>
              <TwoColumnContainer>
                <StyledTextInput
                  label={`${t("reservationCalendar:label.reserveeFirstName")}*`}
                  id="reserveeFirstName"
                  name="reserveeFirstName"
                  ref={register({ required: true })}
                  errorText={
                    errors.reserveeFirstName &&
                    applicationErrorText(t, "requiredField")
                  }
                  defaultValue={reservation?.reserveeFirstName}
                />
                <StyledTextInput
                  label={`${t("reservationCalendar:label.reserveeLastName")}*`}
                  id="reserveeLastName"
                  name="reserveeLastName"
                  ref={register({ required: true })}
                  errorText={
                    errors.reserveeLastName &&
                    applicationErrorText(t, "requiredField")
                  }
                  defaultValue={reservation?.reserveeLastName}
                />
                <StyledTextInput
                  label={`${t("common:phone")}*`}
                  id="reserveePhone"
                  name="reserveePhone"
                  ref={register({ required: true })}
                  errorText={
                    errors.reserveePhone &&
                    applicationErrorText(t, "requiredField")
                  }
                  defaultValue={reservation?.reserveePhone}
                />
              </TwoColumnContainer>
              <H2 style={{ marginTop: "var(--spacing-layout-xl)" }}>
                {t("reservationCalendar:reservationInfo")}
              </H2>
              <StyledNotification
                type="alert"
                label={`${t(
                  "reservationCalendar:notification.reservationAlertTitle"
                )}`}
              >
                {t("reservationCalendar:notification.reservationAlertBody")}
              </StyledNotification>
              <OneColumnContainer>
                <StyledTextInput
                  label={`${t("reservationCalendar:label.name")}*`}
                  id="name"
                  name="name"
                  ref={register({ required: true })}
                  errorText={
                    errors.name && applicationErrorText(t, "requiredField")
                  }
                  defaultValue={reservation?.name}
                />
                <StyledTextInput
                  label={`${t("reservationCalendar:label.description")}*`}
                  id="description"
                  name="description"
                  ref={register({ required: true })}
                  errorText={
                    errors.description &&
                    applicationErrorText(t, "requiredField")
                  }
                  defaultValue={reservation?.description}
                />
              </OneColumnContainer>
              <ActionContainer>
                <MediumButton
                  variant="primary"
                  type="submit"
                  iconRight={<IconArrowRight />}
                  data-test="reservation__button--update"
                >
                  {t("reservationCalendar:nextStep")}
                </MediumButton>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconArrowLeft />}
                  onClick={() => {
                    cancelReservation();
                  }}
                  data-test="reservation__button--cancel"
                >
                  {t("common:prev")}
                </MediumButton>
              </ActionContainer>
            </form>
          )}
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmit2)}>
              <H2>{t("reservationCalendar:reservationSummary")}</H2>
              <TwoColumnContainer style={{ marginBottom: "var(--spacing-l)" }}>
                <ParagraphAlt>
                  <div>
                    <Strong>
                      {t("reservationCalendar:label.reserveeName")}
                    </Strong>
                  </div>
                  <div>
                    {`${reservation.reserveeFirstName || ""} ${
                      reservation.reserveeLastName || ""
                    }`.trim()}
                  </div>
                </ParagraphAlt>
                <ParagraphAlt>
                  <div>
                    <Strong>{t("common:phone")}</Strong>
                    <div>{reservation.reserveePhone}</div>
                  </div>
                </ParagraphAlt>
                <ParagraphAlt style={{ gridColumn: "1 / -1" }}>
                  <div>
                    <Strong>{t("reservationCalendar:label.name")}</Strong>
                  </div>
                  <div>{reservation.name}</div>
                </ParagraphAlt>
                <ParagraphAlt>
                  <div>
                    <Strong>
                      {t("reservationCalendar:label.description")}
                    </Strong>
                  </div>
                  <div>{reservation.description}</div>
                </ParagraphAlt>
              </TwoColumnContainer>
              <AccordionContainer>
                <TermContainer>
                  <Accordion
                    open
                    heading={t("reservationCalendar:heading.termsOfUse")}
                  >
                    <Sanitize
                      html={getTranslation(reservationUnit, "termsOfUse")}
                    />
                  </Accordion>
                  <Checkbox
                    id="spaceTerms"
                    name="spaceTerms"
                    checked={areTermsSpaceAccepted}
                    onChange={(e) => setAreTermsSpaceAccepted(e.target.checked)}
                    label={`${t("reservationCalendar:label.termsSpace")}*`}
                    ref={register({ required: true })}
                    errorText={
                      !!errors.spaceTerms &&
                      applicationErrorText(t, "requiredField")
                    }
                  />
                </TermContainer>
                <TermContainer>
                  <Accordion
                    open
                    heading={t("reservationCalendar:heading.resourceTerms")}
                  >
                    <p>
                      <Sanitize
                        html={getTranslation(
                          reservationUnit.serviceSpecificTerms,
                          "text"
                        )}
                      />
                    </p>
                  </Accordion>
                  <Checkbox
                    id="resourceTerms"
                    name="resourceTerms"
                    checked={areServiceSpecificTermsAccepted}
                    onChange={(e) =>
                      setAreServiceSpecificTermsAccepted(e.target.checked)
                    }
                    label={`${t("reservationCalendar:label.termsResource")}*`}
                    ref={register({ required: true })}
                    errorText={
                      !!errors.resourceTerms &&
                      applicationErrorText(t, "requiredField")
                    }
                  />
                </TermContainer>
              </AccordionContainer>
              <ActionContainer>
                <MediumButton
                  variant="primary"
                  type="submit"
                  iconRight={<IconArrowRight />}
                  data-test="reservation__button--update"
                >
                  {t("reservationCalendar:nextStep")}
                </MediumButton>
                <MediumButton
                  variant="secondary"
                  iconLeft={<IconArrowLeft />}
                  onClick={() => setStep(step - 1)}
                  data-test="reservation__button--cancel"
                >
                  {t("common:prev")}
                </MediumButton>
              </ActionContainer>
            </form>
          )}
        </BodyContainer>
      )}
      {formStatus === "sent" && (
        <BodyContainer>
          <TwoColumnContainer style={{ alignItems: "flex-start" }}>
            <div>
              <H2>{t("reservationCalendar:reservationSummary")}</H2>
              <Paragraph>
                <Trans
                  i18nKey="reservationUnit:reservationReminderText"
                  t={t}
                  values={{ user: reservation?.user }}
                  components={{
                    emailLink: (
                      <a href={`mailto:${reservation?.user}`}>
                        {reservation?.user}
                      </a>
                    ),
                  }}
                />
              </Paragraph>
              <Paragraph>
                <Trans
                  i18nKey="reservationUnit:loadReservationCalendar"
                  t={t}
                  components={{
                    calendarLink: (
                      <a
                        href={reservation?.calendarUrl}
                        data-test="reservation__confirmation--calendar-url"
                      >
                        {" "}
                      </a>
                    ),
                  }}
                />
              </Paragraph>
              <Paragraph>
                {t("common:thanksForUsingVaraamo")}
                <br />
                <a
                  href={t(`footer:Navigation.feedback.href`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("common:sendFeedback")}
                </a>
              </Paragraph>
              <H3 style={{ marginTop: "var(--spacing-xl)" }}>
                {t("reservationUnit:additionalInfo")}
              </H3>
              <ValueParagraph>
                <Strong>{t("reservationCalendar:label.name")}</Strong>
                <span>{reservation.name}</span>
              </ValueParagraph>
              <ValueParagraph>
                <Strong>{t("reservationCalendar:label.reserveeName")}</Strong>
                <span>
                  {`${reservation.reserveeFirstName || ""} ${
                    reservation.reserveeLastName || ""
                  }`.trim()}
                </span>
              </ValueParagraph>
              <ValueParagraph>
                <Strong>{t("reservationCalendar:label.description")}</Strong>
                <span>{reservation.description}</span>
              </ValueParagraph>
              <ValueParagraph>
                <Strong>
                  {t("reservationCalendar:label.reservationDate")}
                </Strong>
                <span>
                  {capitalize(
                    `${beginDate} ${beginTime} -${
                      endDate !== beginDate ? ` ${endDate}` : ""
                    } ${endTime}`
                  )}
                </span>
              </ValueParagraph>
              <ValueParagraph>
                <Strong>
                  {t("reservationCalendar:label.reservationSpace")}
                </Strong>
                <span>{getTranslation(reservationUnit, "name")}</span>
              </ValueParagraph>
              <ValueParagraph>
                <Strong>{t("common:phone")}</Strong>
                <span>{reservation.reserveePhone}</span>
              </ValueParagraph>
              <ActionContainer style={{ marginTop: "var(--spacing-3-xl)" }}>
                <MediumButton
                  variant="secondary"
                  onClick={() => router.push("/")}
                  iconLeft={<IconArrowLeft />}
                >
                  {t("common:gotoFrontpage")}
                </MediumButton>
              </ActionContainer>
            </div>
          </TwoColumnContainer>
        </BodyContainer>
      )}
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
    </>
  );
};

export default ReservationUnitReservation;
