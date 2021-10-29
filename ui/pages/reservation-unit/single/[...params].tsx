import React, { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useMutation } from "@apollo/client";
import router from "next/router";
import { differenceInMinutes, parseISO } from "date-fns";
import {
  IconCalendar,
  Koros,
  Notification,
  TextInput,
  Checkbox,
  IconArrowLeft,
  IconCheckCircle,
} from "hds-react";
import { useForm } from "react-hook-form";
import { GetServerSideProps } from "next";
import { isFinite } from "lodash";
import { Trans, useTranslation } from "react-i18next";
import { UserProfile } from "../../../modules/types";
import apolloClient from "../../../modules/apolloClient";
import {
  fontRegular,
  fontMedium,
  H1,
  H2,
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
  formatDurationMinutes,
  getTranslation,
} from "../../../modules/util";
import WithUserProfile from "../../../components/WithUserProfile";
import { MediumButton } from "../../../styles/util";
import { DataContext } from "../../../context/DataContext";
import {
  ReservationUnitType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
} from "../../../modules/gql-types";
import { RESERVATION_UNIT } from "../../../modules/queries/reservationUnit";
import { UPDATE_RESERVATION } from "../../../modules/queries/reservation";

type Props = {
  reservationUnit: ReservationUnitType;
  profile: UserProfile | null;
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
  description: string;
  calendarUrl?: string;
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

const Description = styled.div``;

const DescriptionItem = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  ${fontMedium}
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

const Heading = styled(H1)`
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);

  svg {
    color: var(--color-tram);
  }
`;

const Subheading = styled(H2)`
  margin-top: var(--spacing-2-xs);
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

  white-space: pre-line;
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
  & > span {
    display: block;
  }
`;

const ValueParagraph = styled(Paragraph).attrs({
  "data-test": "reservation__confirmation--paragraph",
})``;

const ReservationUnitReservation = ({
  reservationUnit,
  profile,
}: Props): JSX.Element => {
  const { t } = useTranslation();
  const { reservation: reservationData } = useContext(DataContext);

  const [formStatus, setFormStatus] = useState<"pending" | "error" | "sent">(
    "pending"
  );
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areTermsResourceAccepted, setAreTermsResourceAccepted] =
    useState(false);

  const { register, handleSubmit, errors } = useForm<Inputs>();

  const [updateReservation, { data, loading, error }] = useMutation<
    { updateReservation: ReservationUpdateMutationPayload },
    { input: ReservationUpdateMutationInput }
  >(UPDATE_RESERVATION);

  useEffect(() => {
    if (!loading) {
      if (error || data?.updateReservation?.errors?.length > 0) {
        setErrorMsg(t("reservationUnit:reservationFailed"));
      } else if (data) {
        setReservation({
          ...reservation,
          calendarUrl: data?.updateReservation?.reservation?.calendarUrl,
        });
        setFormStatus("sent");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, error]);

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

  const duration = differenceInMinutes(new Date(end), new Date(begin));
  const timeString = `${beginDate} ${beginTime} - ${
    endDate !== beginDate ? endDate : ""
  }${endTime} (${t("common:duration", {
    duration: formatDurationMinutes(duration),
  })})`;

  const onSubmit = (payload) => {
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

  if (!isBrowser) {
    return null;
  }

  return (
    <>
      <Head>
        <NarrowCenteredContainer>
          <H1 data-test="reservation__title">
            {getTranslation(reservationUnit, "name")}
          </H1>
          <H2>{getTranslation(reservationUnit.unit, "name")}</H2>
          <Description>
            <DescriptionItem data-test="reservation__time-range">
              <IconCalendar /> {capitalize(timeString)}
            </DescriptionItem>
          </Description>
        </NarrowCenteredContainer>
        <StyledKoros className="koros" type="wave" />
      </Head>
      {formStatus === "pending" && (
        <BodyContainer>
          <H1>{t("reservationCalendar:newReservation")}</H1>
          <form onSubmit={handleSubmit(onSubmit)}>
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
              />
              <StyledTextInput
                label={`${t("reservationCalendar:label.description")}*`}
                id="description"
                name="description"
                ref={register({ required: true })}
                errorText={
                  errors.description && applicationErrorText(t, "requiredField")
                }
              />
            </OneColumnContainer>
            <AccordionContainer>
              <TermContainer>
                <Accordion
                  open
                  heading={t("reservationCalendar:heading.termsOfUse")}
                >
                  {t("reservationCalendar:spaceTerms")}
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
                  {t("reservationCalendar:resourceTerms")}
                </Accordion>
                <Checkbox
                  id="resourceTerms"
                  name="resourceTerms"
                  checked={areTermsResourceAccepted}
                  onChange={(e) =>
                    setAreTermsResourceAccepted(e.target.checked)
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
                data-test="reservation__button--update"
              >
                {t("reservationCalendar:saveReservation")}
              </MediumButton>
              <MediumButton
                variant="secondary"
                iconLeft={<IconArrowLeft />}
                onClick={() =>
                  router.push(
                    `${reservationUnitSinglePrefix}/${reservationUnit.pk}`
                  )
                }
                data-test="reservation__button--cancel"
              >
                {t("common:prev")}
              </MediumButton>
            </ActionContainer>
          </form>
        </BodyContainer>
      )}
      {formStatus === "sent" && (
        <BodyContainer>
          <TwoColumnContainer style={{ alignItems: "flex-start" }}>
            <div>
              <Heading>
                <IconCheckCircle size="m" />
                {t("reservationUnit:reservationSuccessful")}
              </Heading>
              <Paragraph>
                <Trans
                  i18nKey="reservationUnit:reservationReminderText"
                  t={t}
                  values={{ profile }}
                  components={{
                    emailLink: (
                      <a href={`mailto:${profile?.email}`}>{profile?.email}</a>
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
            <div>
              <Subheading>{t("reservationUnit:additionalInfo")}</Subheading>
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

export default WithUserProfile(ReservationUnitReservation);
