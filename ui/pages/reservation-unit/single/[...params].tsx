import React, {
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  RadioButton,
  Select,
} from "hds-react";
import { Controller, useForm } from "react-hook-form";
import { GetServerSideProps } from "next";
import { camelCase, get, isFinite, omit } from "lodash";
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
import {
  CheckboxWrapper,
  TwoColumnContainer,
} from "../../../components/common/common";
import { NarrowCenteredContainer } from "../../../modules/style/layout";
import { AccordionWithState as Accordion } from "../../../components/common/Accordion";
import { isBrowser, reservationUnitSinglePrefix } from "../../../modules/const";
import {
  applicationErrorText,
  capitalize,
  getTranslation,
  reservationsUrl,
} from "../../../modules/util";
import { MediumButton } from "../../../styles/util";
import { DataContext } from "../../../context/DataContext";
import {
  AgeGroupType,
  CityType,
  Query,
  QueryAgeGroupsArgs,
  QueryCitiesArgs,
  QueryReservationPurposesArgs,
  QueryReservationUnitByPkArgs,
  QueryTermsOfUseArgs,
  ReservationConfirmMutationInput,
  ReservationConfirmMutationPayload,
  ReservationPurposeType,
  ReservationUnitType,
  ReservationUpdateMutationInput,
  ReservationUpdateMutationPayload,
  TermsOfUseType,
} from "../../../modules/gql-types";
import {
  RESERVATION_UNIT,
  TERMS_OF_USE,
} from "../../../modules/queries/reservationUnit";
import {
  CONFIRM_RESERVATION,
  GET_CITIES,
  UPDATE_RESERVATION,
} from "../../../modules/queries/reservation";
import StepperHz from "../../../components/StepperHz";
import Ticket from "../../../components/reservation/Ticket";
import Sanitize from "../../../components/common/Sanitize";
import { getPrice } from "../../../modules/reservationUnit";
import {
  getReservationApplicationFields,
  getReservationApplicationMutationValues,
  ReserveeType,
} from "../../../modules/reservation";
import {
  AGE_GROUPS,
  RESERVATION_PURPOSES,
} from "../../../modules/queries/params";

type Props = {
  reservationUnit: ReservationUnitType;
  reservationPurposes: ReservationPurposeType[];
  ageGroups: AgeGroupType[];
  cities: CityType[];
  termsOfUse: Record<string, TermsOfUseType>;
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
  purpose: number;
  numPersons: number;
  ageGroup: number;
  reserveeAddressStreet: string;
  reserveeAddressZip: string;
  reserveeAddressCity: string;
  reserveeEmail: string;
  reserveeOrganisationName: string;
  showBillingAddress?: boolean;
  billingFirstName: string;
  billingLastName: string;
  billingPhone: string;
  billingEmail: string;
  billingAddressStreet: string;
  billingAddressCity: string;
  billingAddressZip: string;
  homeCity: number;
  applyingForFreeOfCharge: boolean;
  freeOfChargeReason: string;
};

type Reservation = {
  pk: number;
  begin: string;
  end: string;
  reservationUnitPks: number[];
  reserveeFirstName?: string;
  reserveeLastName?: string;
  reserveePhone?: string;
  name?: string;
  user?: string;
  description?: string;
  calendarUrl?: string;
  state?: string;
  price?: number;
  spaceTerms?: boolean;
  resourceTerms?: boolean;
  purpose?: number;
  numPersons?: number;
  ageGroup?: number;
  reserveeAddressStreet?: string;
  reserveeAddressZip?: string;
  reserveeAddressCity?: string;
  reserveeEmail?: string;
  reserveeOrganisationName?: string;
  showBillingAddress?: boolean;
  billingFirstName?: string;
  billingLastName?: string;
  billingPhone?: string;
  billingEmail?: string;
  billingAddressStreet?: string;
  billingAddressCity?: string;
  billingAddressZip?: string;
  homeCity?: number;
  applyingForFreeOfCharge?: boolean;
  freeOfChargeReason?: string;
};

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getServerSideProps: GetServerSideProps = async ({
  locale,
  params,
}) => {
  const id = Number(params.params[0]);
  const path = params.params[1];
  let reservationPurposes = [];
  let ageGroups = [];
  let cities = [];

  if (isFinite(id) && path === "reservation") {
    const { data: reservationUnitData } = await apolloClient.query<
      Query,
      QueryReservationUnitByPkArgs
    >({
      query: RESERVATION_UNIT,
      variables: { pk: id },
    });

    const { data: genericTermsData } = await apolloClient.query<
      Query,
      QueryTermsOfUseArgs
    >({
      query: TERMS_OF_USE,
      variables: {
        termsType: "generic_terms",
      },
    });
    const genericTerms = genericTermsData.termsOfUse?.edges[0]?.node || {};

    if (reservationUnitData?.reservationUnitByPk) {
      if (reservationUnitData.reservationUnitByPk?.metadataSet) {
        const { data: reservationPurposesData } = await apolloClient.query<
          Query,
          QueryReservationPurposesArgs
        >({
          query: RESERVATION_PURPOSES,
        });
        reservationPurposes =
          reservationPurposesData.reservationPurposes.edges?.map(
            (edge) => edge.node
          );

        const { data: ageGroupsData } = await apolloClient.query<
          Query,
          QueryAgeGroupsArgs
        >({
          query: AGE_GROUPS,
        });
        ageGroups = ageGroupsData.ageGroups.edges?.map((edge) => edge.node);

        const { data: citiesData } = await apolloClient.query<
          Query,
          QueryCitiesArgs
        >({
          query: GET_CITIES,
        });
        cities = citiesData.cities.edges?.map((edge) => edge.node);
      }

      return {
        props: {
          reservationUnit: reservationUnitData.reservationUnitByPk,
          reservationPurposes,
          ageGroups,
          cities,
          genericTerms,
          ...(await serverSideTranslations(locale)),
        },
      };
    }

    return {
      notFound: true,
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

const StyledTextInput = styled(TextInput)<{
  $isWide?: boolean;
  $hidden?: boolean;
  $break?: boolean;
}>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1"};
  ${({ $hidden }) => $hidden && "display: none"};
  ${({ $break }) => $break && "grid-column: 1 / -2"};

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
  white-space: pre-line;

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
  gap: var(--spacing-m);
  margin-bottom: var(--spacing-layout-m);

  button {
    margin-bottom: var(--spacing-m);

    @media (min-width: ${breakpoint.m}) {
      width: 18rem;
    }
  }

  @media (min-width: ${breakpoint.m}) {
    & > button:first-of-type {
      order: 1;
    }

    grid-template-columns: 1fr 1fr;
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

const ApplicationForm = styled.form`
  label {
    ${fontMedium};

    span {
      line-height: unset;
      transform: unset;
      margin-left: 0;
      display: inline;
      font-size: unset;
    }
  }

  input[type="radio"] + label {
    ${fontRegular};
  }
`;

const ReservationUnitReservation = ({
  reservationUnit,
  reservationPurposes,
  ageGroups,
  cities,
  termsOfUse,
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

  const [reserveeType, setReserveeType] = useState<ReserveeType>(null);

  const { register, handleSubmit, watch, errors, control } = useForm<Inputs>();

  const numFields = ["numPersons"];
  const emailFields = ["reserveeEmail", "billingEmail"];

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

  const doesReservationNeedApplication =
    !!reservationUnit?.requireReservationHandling;
  const hasMetadataSet = !!reservationUnit?.metadataSet?.supportedFields;

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
          const payload = {
            ...omit(updateData.updateReservation.reservation, "__typename"),
            purpose: updateData.updateReservation.reservation.purpose?.pk,
            ageGroup: updateData.updateReservation.reservation.ageGroup?.pk,
            homeCity: updateData.updateReservation.reservation.homeCity?.pk,
            showBillingAddress: watch("showBillingAddress"),
          };
          setReservation({
            ...reservation,
            ...payload,
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

  const options = useMemo(
    () => ({
      purpose: reservationPurposes.map((purpose) => ({
        label: getTranslation(purpose, "name"),
        value: purpose.pk,
      })),
      ageGroup: ageGroups.map((ageGroup) => ({
        label: `${ageGroup.minimum} - ${ageGroup.maximum}`,
        value: ageGroup.pk,
      })),
      homeCity: cities.map((city) => ({
        label: city.name,
        value: city.pk,
      })),
    }),
    [reservationPurposes, ageGroups, cities]
  );

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

  const onSubmitOpen1 = (payload) => {
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

  const onSubmitOpen2 = () => {
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

  const onSubmitApplication1 = (payload) => {
    if (!reserveeType) {
      setErrorMsg(t("reservationApplication:errors.noFormType"));
      return;
    }

    const normalizedPayload = Object.keys(payload).reduce((acc, key) => {
      if (["showBillingAddress"].includes(key)) return acc;
      acc[key] = {}.propertyIsEnumerable.call(payload[key] || {}, "value")
        ? payload[key].value
        : payload[key];
      return acc;
    }, {});

    const input = getReservationApplicationMutationValues(
      normalizedPayload,
      reservationUnit.metadataSet.supportedFields,
      reserveeType
    );

    updateReservation({
      variables: {
        input: {
          pk: reservationPk,
          ...input,
        },
      },
    });
  };

  const isWideRow = (field: string): boolean =>
    [
      "name",
      "description",
      "reserveeAddressStreet",
      "reserveeOrganisationName",
      "billingAddressStreet",
    ].includes(field);

  const isBreakingColumn = (field: string): boolean =>
    ["showBillingAddress", "applyingForFreeOfCharge"].includes(field);

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
                isFree={!getPrice(reservationUnit)}
                reservationPrice={reservationData.price}
                // taxPercentage={reservationUnit.taxPercentage}
              />
            </div>
            <div>
              {doesReservationNeedApplication ? (
                formStatus === "sent" ? (
                  <Title>
                    <IconCheck size="l" />
                    {t("reservationApplication:titleSent")}
                  </Title>
                ) : (
                  <Title>{t("reservationApplication:title")}</Title>
                )
              ) : formStatus === "sent" ? (
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
          {step === 0 && !hasMetadataSet && (
            <form onSubmit={handleSubmit(onSubmitOpen1)}>
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
                </MediumButton>{" "}
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
          {step === 0 && hasMetadataSet && (
            <ApplicationForm onSubmit={handleSubmit(onSubmitApplication1)}>
              <H2
                style={{
                  margin: "var(--spacing-layout-m) 0 var(--spacing-xs)",
                }}
              >
                {t(
                  doesReservationNeedApplication
                    ? "reservationApplication:applicationInfo"
                    : "reservationCalendar:reserverInfo"
                )}
              </H2>
              <p>{t("reservationApplication:reserveeTypePrefix")}</p>
              <OneColumnContainer
                style={{
                  width: "100%",
                  gap: "var(--spacing-xs)",
                  marginTop: "var(--spacing-xs)",
                }}
              >
                {["nonprofit", "individual", "business"].map(
                  (id: ReserveeType) => (
                    <RadioButton
                      key={id}
                      name={id}
                      id={id}
                      label={t(
                        `reservationApplication:reserveeTypes.labels.${id}`
                      )}
                      onClick={() => {
                        setReserveeType(id);
                      }}
                      checked={reserveeType === id}
                    />
                  )
                )}
              </OneColumnContainer>
              <StyledNotification
                type="alert"
                label={`${t(
                  "reservationCalendar:notification.reservationApplicationAlertTitle"
                )}`}
              >
                {t("reservationCalendar:notification.reservationAlertBody")}
              </StyledNotification>
              <TwoColumnContainer
                style={{
                  margin: "var(--spacing-layout-m) 0 var(--spacing-layout-xl)",
                }}
              >
                {getReservationApplicationFields(
                  reservationUnit.metadataSet?.supportedFields,
                  reserveeType,
                  true
                ).map((field) => {
                  const required = reservationUnit.metadataSet.requiredFields
                    .map(camelCase)
                    .includes(field);
                  return Object.keys(options).includes(field) ? (
                    <Controller
                      as={
                        <Select
                          label={t(
                            `reservationApplication:label.${reserveeType}.${field}`
                          )}
                          id={field}
                          options={options[field]}
                          defaultValue={options[field].find(
                            (n) => n.value === get(reservation, field)
                          )}
                          error={get(errors, field) && t("forms:requiredField")}
                          required={required}
                          invalid={!!get(errors, field)}
                        />
                      }
                      name={field}
                      control={control}
                      key={field}
                      rules={{ required }}
                    />
                  ) : field === "applyingForFreeOfCharge" ? (
                    <CheckboxWrapper
                      key={field}
                      $break={isBreakingColumn(field)}
                    >
                      <Controller
                        name={field}
                        control={control}
                        defaultValue={get(reservation, field)}
                        rules={{ required }}
                        render={(props) => (
                          <Checkbox
                            id={field}
                            onChange={(e) => props.onChange(e.target.checked)}
                            checked={props.value}
                            label={`${t(
                              `reservationApplication:label.${reserveeType}.${field}`
                            )}${required ? " * " : ""}`}
                            errorText={
                              get(errors, field) && t("forms:requiredField")
                            }
                          />
                        )}
                      />
                    </CheckboxWrapper>
                  ) : field === "reserveeIsUnregisteredAssociation" ? (
                    <CheckboxWrapper key={field}>
                      <Controller
                        name={field}
                        control={control}
                        defaultValue={get(reservation, field)}
                        rules={{ required }}
                        render={(props) => (
                          <Checkbox
                            id={field}
                            onChange={(e) => props.onChange(e.target.checked)}
                            checked={props.value}
                            defaultChecked={get(reservation, field)}
                            label={`${t(
                              `reservationApplication:label.${reserveeType}.${field}`
                            )}${required ? " * " : ""}`}
                            errorText={
                              get(errors, field) && t("forms:requiredField")
                            }
                          />
                        )}
                      />
                    </CheckboxWrapper>
                  ) : field === "showBillingAddress" ? (
                    <CheckboxWrapper
                      key={field}
                      $break={isBreakingColumn(field)}
                    >
                      <Controller
                        name={field}
                        control={control}
                        defaultValue={get(reservation, field)}
                        rules={{ required }}
                        render={(props) => (
                          <Checkbox
                            id={field}
                            onChange={(e) => props.onChange(e.target.checked)}
                            checked={props.value}
                            defaultChecked={get(reservation, field)}
                            label={`${t(
                              `reservationApplication:label.${reserveeType}.${field}`
                            )}${required ? " * " : ""}`}
                            errorText={
                              get(errors, field) && t("forms:requiredField")
                            }
                          />
                        )}
                      />
                    </CheckboxWrapper>
                  ) : field === "freeOfChargeReason" ? (
                    <StyledTextInput
                      label={`${t(
                        `reservationApplication:label.${reserveeType}.${field}`
                      )}${required ? " * " : ""}`}
                      id={field}
                      name={field}
                      ref={register({ required })}
                      key={field}
                      defaultValue={get(reservation, field) || ""}
                      errorText={get(errors, field) && t("forms:requiredField")}
                      invalid={!!get(errors, field)}
                      $hidden={!watch("applyingForFreeOfCharge")}
                      $isWide
                    />
                  ) : (
                    <StyledTextInput
                      label={`${t(
                        `reservationApplication:label.${reserveeType}.${field}`
                      )}${required ? " * " : ""}`}
                      id={field}
                      name={field}
                      ref={register({
                        required,
                        ...(emailFields.includes(field) && {
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "email",
                          },
                        }),
                      })}
                      key={field}
                      type={numFields.includes(field) ? "number" : "text"}
                      defaultValue={get(reservation, field)}
                      errorText={
                        get(errors, field) &&
                        t(
                          `forms:${
                            get(errors, field)?.message === "email"
                              ? "invalidEmail"
                              : "requiredField"
                          }`
                        )
                      }
                      invalid={!!get(errors, field)}
                      $isWide={isWideRow(field)}
                      $hidden={
                        field.includes("billing") &&
                        watch("showBillingAddress") !== true
                      }
                      $break={isBreakingColumn(field)}
                    />
                  );
                })}
              </TwoColumnContainer>
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
            </ApplicationForm>
          )}
          {step === 1 && (
            <form onSubmit={handleSubmit(onSubmitOpen2)}>
              <H2>{t("reservationCalendar:reservationSummary")}</H2>
              <TwoColumnContainer style={{ marginBottom: "var(--spacing-l)" }}>
                {hasMetadataSet ? (
                  <>
                    {getReservationApplicationFields(
                      reservationUnit.metadataSet?.supportedFields,
                      reserveeType,
                      true
                    )
                      .filter(
                        (key) =>
                          !["", undefined, false, 0, null].includes(
                            get(reservation, key)
                          )
                      )
                      .map((key) => {
                        const rawValue = get(reservation, key);
                        const value = get(options, key)
                          ? get(options, key).find(
                              (option) => option.value === rawValue
                            )?.label
                          : typeof rawValue === "boolean"
                          ? t(`common:${String(rawValue)}`)
                          : rawValue;
                        return (
                          <ParagraphAlt key={`summary_${key}`}>
                            <div>
                              <Strong>
                                {t(
                                  `reservationApplication:label.${reserveeType}.${key}`
                                )}
                              </Strong>
                            </div>
                            <div>{value}</div>
                          </ParagraphAlt>
                        );
                      })}
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </TwoColumnContainer>
              <AccordionContainer>
                <TermContainer>
                  <Accordion
                    open
                    heading={t("reservationCalendar:heading.termsOfUse")}
                  >
                    <Sanitize html={getTranslation(termsOfUse, "text")} />
                  </Accordion>
                  <Checkbox
                    id="spaceTerms"
                    name="spaceTerms"
                    checked={areTermsSpaceAccepted}
                    onChange={(e) => setAreTermsSpaceAccepted(e.target.checked)}
                    label={`${t("reservationCalendar:label.termsSpace")} *`}
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
                        html={getTranslation(reservationUnit, "termsOfUse")}
                      />
                    </p>
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
                    label={`${t("reservationCalendar:label.termsResource")} *`}
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
              {getTranslation(reservationUnit, "additionalInstructions") && (
                <>
                  <H3 style={{ marginTop: "var(--spacing-xl)" }}>
                    {t("reservations:reservationInfo")}
                  </H3>
                  <Paragraph>
                    {getTranslation(reservationUnit, "additionalInstructions")}
                  </Paragraph>
                </>
              )}
              <H3 style={{ marginTop: "var(--spacing-xl)" }}>
                {t("reservationUnit:additionalInfo")}
              </H3>
              {hasMetadataSet ? (
                <>
                  {getReservationApplicationFields(
                    reservationUnit.metadataSet?.supportedFields,
                    reserveeType,
                    true
                  )
                    .filter(
                      (key) =>
                        !["", undefined, false, 0, null].includes(
                          get(reservation, key)
                        )
                    )
                    .map((key) => {
                      const rawValue = get(reservation, key);
                      const value = get(options, key)
                        ? get(options, key).find(
                            (option) => option.value === rawValue
                          )?.label
                        : typeof rawValue === "boolean"
                        ? t(`common:${String(rawValue)}`)
                        : rawValue;
                      return (
                        <ValueParagraph key={`summary_${key}`}>
                          <Strong>
                            {t(
                              `reservationApplication:label.${reserveeType}.${key}`
                            )}
                          </Strong>
                          <span>{value}</span>
                        </ValueParagraph>
                      );
                    })}
                </>
              ) : (
                <>
                  <ValueParagraph>
                    <Strong>{t("reservationCalendar:label.name")}</Strong>
                    <span>{reservation.name}</span>
                  </ValueParagraph>
                  <ValueParagraph>
                    <Strong>
                      {t("reservationCalendar:label.reserveeName")}
                    </Strong>
                    <span>
                      {`${reservation.reserveeFirstName || ""} ${
                        reservation.reserveeLastName || ""
                      }`.trim()}
                    </span>
                  </ValueParagraph>
                  <ValueParagraph>
                    <Strong>
                      {t("reservationCalendar:label.description")}
                    </Strong>
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
                </>
              )}
              <ActionContainer
                style={{
                  marginTop: "var(--spacing-3-xl)",
                  gridTemplateColumns: "1fr",
                }}
              >
                <MediumButton
                  variant="primary"
                  onClick={() => router.push(reservationsUrl)}
                >
                  {t("reservations:gotoReservations")}
                </MediumButton>
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
          autoClose
          autoCloseDuration={2000}
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
