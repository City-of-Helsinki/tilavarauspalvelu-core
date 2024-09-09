import React, { useState } from "react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import {
  type ReservationQuery,
  type ReservationUnitPageFieldsFragment,
} from "@gql/gql-types";
import { Subheading } from "common/src/reservation-form/styles";
import { getTranslation } from "@/modules/util";
import { ActionContainer } from "./styles";
import Sanitize from "../common/Sanitize";
import { MediumButton } from "@/styles/util";
import { JustForMobile } from "@/modules/style/layout";
import { PinkBox } from "../reservation-unit/ReservationUnitStyles";
import { useFormContext } from "react-hook-form";
import {
  ApplicationFields,
  GeneralFields,
  type OptionsRecord,
} from "./SummaryFields";
import { type FieldName } from "common/src/metaFieldsHelpers";
import { AcceptTerms } from "./AcceptTerms";

type NodeT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservation: NodeT;
  reservationUnit: ReservationUnitPageFieldsFragment;
  handleSubmit: () => void;
  supportedFields: FieldName[];
  options: OptionsRecord;
  requiresHandling: boolean;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

function Step1({
  reservation,
  reservationUnit,
  handleSubmit,
  supportedFields,
  options,
  requiresHandling,
  setStep,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const {
    formState: { isSubmitting },
  } = useFormContext();

  const [isTermsAccepted, setIsTermsAccepted] = useState({
    space: false,
    service: false,
  });
  const handleTermsAcceptedChange = (
    key: "space" | "service",
    val: boolean
  ) => {
    setIsTermsAccepted({ ...isTermsAccepted, [key]: val });
  };

  const termsOfUseContent = getTranslation(reservationUnit, "termsOfUse");

  const areTermsAccepted = isTermsAccepted.space && isTermsAccepted.service;
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        if (areTermsAccepted) {
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
      <AcceptTerms
        reservationUnit={reservationUnit}
        isTermsAccepted={isTermsAccepted}
        setIsTermsAccepted={handleTermsAcceptedChange}
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
          disabled={!areTermsAccepted}
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
