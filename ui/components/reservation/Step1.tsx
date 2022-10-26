import { breakpoints } from "common/src/common/style";
import { OptionType } from "common/types/common";
import { get } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DeepMap, FieldError } from "react-hook-form";
import styled from "styled-components";
import { Checkbox, IconArrowLeft, IconArrowRight } from "hds-react";
import { Inputs, Reservation } from "../../modules/types";
import {
  applicationErrorText,
  capitalize,
  getTranslation,
} from "../../modules/util";
import { ActionContainer, Subheading, TwoColumnContainer } from "./styles";
import { AccordionWithState as Accordion } from "../common/Accordion";
import Sanitize from "../common/Sanitize";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
  TermsOfUseType,
} from "../../modules/gql-types";
import { MediumButton } from "../../styles/util";

type Props = {
  reservation: Reservation;
  reservationUnit: ReservationUnitType;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  options: Record<string, OptionType[]>;
  reserveeType: ReservationsReservationReserveeTypeChoices;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  errors: DeepMap<Inputs, FieldError>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  termsOfUse: Record<string, TermsOfUseType>;
};

const ParagraphAlt = styled.div<{ $isWide?: boolean }>`
  ${({ $isWide }) => $isWide && "grid-column: 1 / -1;"}

  & > div:first-of-type {
    margin-bottom: var(--spacing-3-xs);
  }
`;

const PreviewLabel = styled.span`
  display: block;
  color: var(--color-black-70);
  padding-bottom: var(--spacing-2-xs);
`;

const PreviewValue = styled.span`
  display: block;
  font-size: var(--fontsize-body-l);
`;

const AccordionContainer = styled.div`
  @media (min-width: ${breakpoints.m}) {
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

const Step1 = ({
  reservation,
  reservationUnit,
  handleSubmit,
  generalFields,
  reservationApplicationFields,
  options,
  reserveeType,
  setStep,
  errors,
  register,
  termsOfUse,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <Subheading>{t("reservationCalendar:reservationInfo")}</Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          {generalFields
            .filter(
              (key) =>
                !["", undefined, false, 0, null].includes(get(reservation, key))
            )
            .map((key) => {
              const rawValue = get(reservation, key);
              const value = get(options, key)
                ? get(options, key).find((option) => option.value === rawValue)
                    ?.label
                : typeof rawValue === "boolean"
                ? t(`common:${String(rawValue)}`)
                : rawValue;
              return (
                <ParagraphAlt
                  key={`summary_${key}`}
                  $isWide={[
                    "name",
                    "description",
                    "freeOfChargeReason",
                  ].includes(key)}
                >
                  <PreviewLabel>
                    {t(`reservationApplication:label.common.${key}`)}
                  </PreviewLabel>
                  <PreviewValue>{value}</PreviewValue>
                </ParagraphAlt>
              );
            })}
        </>
      </TwoColumnContainer>
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          <ParagraphAlt $isWide>
            <PreviewLabel>
              {t("reservationApplication:reserveeTypePrefix")}
            </PreviewLabel>
            <PreviewValue>
              {capitalize(
                t(
                  `reservationApplication:reserveeTypes.labels.${reserveeType.toLowerCase()}`
                )
              )}
            </PreviewValue>
          </ParagraphAlt>
          {reservationApplicationFields
            .filter(
              (key) =>
                !["", undefined, false, 0, null].includes(get(reservation, key))
            )
            .map((key) => {
              const rawValue = get(reservation, key);
              const value = get(options, key)
                ? get(options, key).find((option) => option.value === rawValue)
                    ?.label
                : typeof rawValue === "boolean"
                ? t(`common:${String(rawValue)}`)
                : rawValue;
              return (
                <ParagraphAlt key={`summary_${key}`}>
                  <PreviewLabel>
                    {t(
                      `reservationApplication:label.${reserveeType.toLocaleLowerCase()}.${key}`
                    )}
                  </PreviewLabel>
                  <PreviewValue>{value}</PreviewValue>
                </ParagraphAlt>
              );
            })}
        </>
      </TwoColumnContainer>
      <AccordionContainer>
        <TermContainer>
          <Accordion open heading={t("reservationCalendar:heading.termsOfUse")}>
            <Sanitize html={getTranslation(termsOfUse.genericTerms, "text")} />
          </Accordion>
          <Checkbox
            id="spaceTerms"
            name="spaceTerms"
            checked={areTermsSpaceAccepted}
            onChange={(e) => setAreTermsSpaceAccepted(e.target.checked)}
            label={`${t("reservationCalendar:label.termsSpace")} *`}
            ref={register({ required: true })}
            errorText={
              !!errors.spaceTerms && applicationErrorText(t, "requiredField")
            }
          />
        </TermContainer>
        <TermContainer>
          <Accordion
            open
            heading={t("reservationCalendar:heading.resourceTerms")}
          >
            <p>
              <Sanitize html={getTranslation(reservationUnit, "termsOfUse")} />
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
              !!errors.resourceTerms && applicationErrorText(t, "requiredField")
            }
          />
        </TermContainer>
      </AccordionContainer>
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={<IconArrowRight aria-hidden />}
          data-test="reservation__button--update"
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={() => setStep(0)}
          data-test="reservation__button--cancel"
        >
          {t("common:cancel")}
        </MediumButton>
      </ActionContainer>
    </form>
  );
};

export default Step1;
