import { OptionType } from "common/types/common";
import { get } from "lodash";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationUnitType,
  TermsOfUseType,
} from "common/types/gql-types";
import { Reservation, ReservationStep } from "../../modules/types";
import { capitalize, getTranslation } from "../../modules/util";
import { ActionContainer, Subheading, TwoColumnContainer } from "./styles";
import Sanitize from "../common/Sanitize";
import { MediumButton } from "../../styles/util";
import TermsBox from "../common/TermsBox";

type Props = {
  reservation: Reservation;
  reservationUnit: ReservationUnitType;
  handleSubmit: () => void;
  generalFields: string[];
  reservationApplicationFields: string[];
  options: Record<string, OptionType[]>;
  reserveeType: ReservationsReservationReserveeTypeChoices;
  steps: ReservationStep[];
  setStep: React.Dispatch<React.SetStateAction<number>>;
  termsOfUse: Record<string, TermsOfUseType>;
  setErrorMsg: React.Dispatch<React.SetStateAction<string>>;
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

const Step1 = ({
  reservation,
  reservationUnit,
  handleSubmit,
  generalFields,
  reservationApplicationFields,
  options,
  reserveeType,
  steps,
  setStep,
  termsOfUse,
  setErrorMsg,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!areTermsSpaceAccepted || !areServiceSpecificTermsAccepted) {
          setErrorMsg(t("reservationCalendar:errors.termsNotAccepted"));
        } else {
          handleSubmit();
        }
      }}
    >
      {generalFields?.length > 0 && (
        <>
          <Subheading>{t("reservationCalendar:reservationInfo")} </Subheading>
          <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
            <>
              {generalFields
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
        </>
      )}
      <Subheading>{t("reservationCalendar:reserverInfo")}</Subheading>
      <TwoColumnContainer style={{ marginBottom: "var(--spacing-2-xl)" }}>
        <>
          {reservationApplicationFields.includes("reserveeType") && (
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
          )}
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
                      `reservationApplication:label.${
                        reserveeType?.toLocaleLowerCase() || "individual"
                      }.${key}`
                    )}
                  </PreviewLabel>
                  <PreviewValue>{value}</PreviewValue>
                </ParagraphAlt>
              );
            })}
        </>
      </TwoColumnContainer>
      <TermsBox
        id="generic-and-service-specific-terms"
        heading={t("reservationCalendar:heading.termsOfUse")}
        body={
          <>
            <Sanitize
              html={getTranslation(
                reservationUnit.serviceSpecificTerms,
                "text"
              )}
            />
          </>
        }
        links={
          termsOfUse.genericTerms && [
            {
              href: "/terms/general",
              text: t("reservationCalendar:heading.generalTerms"),
            },
          ]
        }
        acceptLabel={t(
          `reservationCalendar:label.${
            reservationUnit.serviceSpecificTerms
              ? "termsGeneralSpecific"
              : "termsGeneral"
          }`
        )}
        accepted={areTermsSpaceAccepted}
        setAccepted={setAreTermsSpaceAccepted}
      />
      <TermsBox
        id="cancellation-and-payment-terms"
        heading={t(
          `reservationCalendar:heading.${
            reservationUnit.cancellationTerms && reservationUnit.paymentTerms
              ? "cancellationPaymentTerms"
              : reservationUnit.cancellationTerms
              ? "cancellationTerms"
              : "paymentTerms"
          }`
        )}
        body={
          <>
            <Sanitize
              html={getTranslation(reservationUnit.cancellationTerms, "text")}
            />
            <br />
            <Sanitize
              html={getTranslation(reservationUnit.paymentTerms, "text")}
            />
          </>
        }
        acceptLabel={t(
          `reservationCalendar:label.${
            reservationUnit.cancellationTerms && reservationUnit.paymentTerms
              ? "termsCancellationPayment"
              : reservationUnit.cancellationTerms
              ? "termsCancellation"
              : "termsPayment"
          }`
        )}
        accepted={areServiceSpecificTermsAccepted}
        setAccepted={setAreServiceSpecificTermsAccepted}
      />
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={<IconArrowRight aria-hidden />}
          data-test="reservation__button--update"
        >
          {t(
            `reservationCalendar:${
              steps.length > 2 ? "nextStep" : "makeReservation"
            }`
          )}
        </MediumButton>
        <MediumButton
          variant="secondary"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={() => setStep(0)}
          data-test="reservation__button--cancel"
        >
          {t("common:prev")}
        </MediumButton>
      </ActionContainer>
    </form>
  );
};

export default Step1;
