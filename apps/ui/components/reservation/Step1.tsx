import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import {
  type TermsOfUseTextFieldsFragment,
  type ReservationQuery,
  type ReservationUnitPageFieldsFragment,
} from "@gql/gql-types";
import TermsBox from "common/src/termsbox/TermsBox";
import { Subheading } from "common/src/reservation-form/styles";
import { getTranslation } from "@/modules/util";
import { ActionContainer } from "./styles";
import Sanitize from "../common/Sanitize";
import { MediumButton } from "@/styles/util";
import { JustForMobile } from "@/modules/style/layout";
import {
  ErrorAnchor,
  ErrorBox,
  ErrorList,
  PinkBox,
} from "../reservation-unit/ReservationUnitStyles";
import { useFormContext } from "react-hook-form";
import {
  ApplicationFields,
  GeneralFields,
  type OptionsRecord,
} from "./SummaryFields";
import { type FieldName } from "common/src/metaFieldsHelpers";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  reservationUnit: ReservationUnitPageFieldsFragment;
  handleSubmit: () => void;
  supportedFields: FieldName[];
  options: OptionsRecord;
  requiresHandling: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  genericTerms: TermsOfUseTextFieldsFragment | null;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

function scrollToBox(id: string): void {
  const element = document.getElementById(id);
  const checkbox = document.getElementById(`${id}-terms-accepted`);

  const top = element?.getBoundingClientRect()?.y || 0;
  window.scroll({
    top: window.scrollY + top - 28,
    left: 0,
    behavior: "smooth",
  });
  checkbox?.focus();
}

function Step1({
  reservation,
  reservationUnit,
  handleSubmit,
  supportedFields,
  options,
  requiresHandling,
  setStep,
  genericTerms,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting },
  } = useFormContext();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [areTermsSpaceAccepted, setAreTermsSpaceAccepted] = useState(false);
  const [areServiceSpecificTermsAccepted, setAreServiceSpecificTermsAccepted] =
    useState(false);

  const termsOfUseContent = getTranslation(reservationUnit, "termsOfUse");

  const box = [
    {
      heading: t(
        `reservationCalendar:heading.${
          reservationUnit.cancellationTerms && reservationUnit.paymentTerms
            ? "cancellationPaymentTerms"
            : reservationUnit.cancellationTerms
              ? "cancellationTerms"
              : "paymentTerms"
        }`
      ),
      id: "cancellation-and-payment-terms",
      acceptLabel: t(
        `reservationCalendar:label.${
          reservationUnit.cancellationTerms && reservationUnit.paymentTerms
            ? "termsCancellationPayment"
            : reservationUnit.cancellationTerms
              ? "termsCancellation"
              : "termsPayment"
        }`
      ),
    },
    {
      heading: t("reservationCalendar:heading.termsOfUse"),
      id: "generic-and-service-specific-terms",
      acceptLabel: t(
        `reservationCalendar:label.${
          reservationUnit.serviceSpecificTerms
            ? "termsGeneralSpecific"
            : "termsGeneral"
        }`
      ),
    },
  ];

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        setIsSubmitted(true);
        if (areTermsSpaceAccepted && areServiceSpecificTermsAccepted) {
          handleSubmit();
        }
      }}
      noValidate
    >
      <GeneralFields
        supportedFields={supportedFields}
        reservation={reservation}
        options={options}
      />
      <ApplicationFields
        reservation={reservation}
        options={options}
        supportedFields={supportedFields}
      />
      <TermsBox
        id={box[0].id}
        heading={box[0].heading}
        body={
          <>
            {reservationUnit.cancellationTerms && (
              <Sanitize
                html={getTranslation(reservationUnit.cancellationTerms, "text")}
              />
            )}
            <br />
            {reservationUnit.paymentTerms && (
              <Sanitize
                html={getTranslation(reservationUnit.paymentTerms, "text")}
              />
            )}
          </>
        }
        acceptLabel={box[0].acceptLabel}
        accepted={areServiceSpecificTermsAccepted}
        setAccepted={setAreServiceSpecificTermsAccepted}
        errorText={
          isSubmitted && !areServiceSpecificTermsAccepted
            ? `${t(
                "forms:prefix.approve"
              )} ${box[0].heading.toLocaleLowerCase()}`
            : undefined
        }
      />
      <TermsBox
        id={box[1].id}
        heading={box[1].heading}
        body={
          reservationUnit.serviceSpecificTerms != null ? (
            <Sanitize
              html={getTranslation(
                reservationUnit.serviceSpecificTerms,
                "text"
              )}
            />
          ) : undefined
        }
        links={
          genericTerms != null
            ? [
                {
                  href: "/terms/booking",
                  text: t("reservationCalendar:heading.generalTerms"),
                },
              ]
            : []
        }
        acceptLabel={box[1].acceptLabel}
        accepted={areTermsSpaceAccepted}
        setAccepted={setAreTermsSpaceAccepted}
        errorText={
          isSubmitted && !areTermsSpaceAccepted
            ? `${t(
                "forms:prefix.approve"
              )} ${box[1].heading.toLocaleLowerCase()}`
            : undefined
        }
      />
      {termsOfUseContent && (
        <JustForMobile style={{ marginBottom: "var(--spacing-layout-m)" }}>
          <PinkBox>
            <Subheading>
              {t("reservations:reservationInfoBoxHeading")}
            </Subheading>
            <Sanitize html={termsOfUseContent} />
          </PinkBox>
        </JustForMobile>
      )}
      {isSubmitted &&
        (!areServiceSpecificTermsAccepted || !areTermsSpaceAccepted) && (
          <ErrorBox
            label={t("forms:heading.errorsTitle")}
            type="error"
            position="inline"
          >
            <div>{t("forms:heading.errorsSubtitle")}</div>
            <ErrorList>
              {!areServiceSpecificTermsAccepted && (
                <li>
                  <ErrorAnchor
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToBox(box[0].id);
                    }}
                  >
                    {box[0].heading}
                  </ErrorAnchor>
                </li>
              )}
              {!areTermsSpaceAccepted && (
                <li>
                  <ErrorAnchor
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToBox(box[1].id);
                    }}
                  >
                    {box[1].heading}
                  </ErrorAnchor>
                </li>
              )}
            </ErrorList>
          </ErrorBox>
        )}
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          iconRight={
            requiresHandling ? <IconArrowRight aria-hidden /> : undefined
          }
          data-test="reservation__button--update"
          isLoading={isSubmitting}
          loadingText={t(
            `reservationCalendar:${requiresHandling ? "nextStep" : "makeReservation"}Loading`
          )}
          disabled={!areTermsSpaceAccepted || !areServiceSpecificTermsAccepted}
        >
          {t(
            `reservationCalendar:${
              requiresHandling ? "nextStep" : "makeReservation"
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
    </Form>
  );
}

export default Step1;
