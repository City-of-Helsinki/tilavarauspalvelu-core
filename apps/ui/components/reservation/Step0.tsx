/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import type { OptionType } from "common/types/common";
import { IconArrowLeft, IconArrowRight } from "hds-react";
import { useFormContext } from "react-hook-form";
import React, { useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { fontMedium, fontRegular } from "common/src/common/typography";
import MetaFields from "common/src/reservation-form/MetaFields";
import { MediumButton } from "@/styles/util";
import { ActionContainer } from "./styles";
import { getTranslation } from "../../modules/util";
import InfoDialog from "../common/InfoDialog";
import { JustForMobile } from "@/modules/style/layout";
import {
  ErrorAnchor,
  ErrorBox,
  ErrorList,
  PinkBox,
  Subheading,
} from "../reservation-unit/ReservationUnitStyles";
import Sanitize from "../common/Sanitize";
import type {
  ReservationQuery,
  ReservationUnitPageFieldsFragment,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { containsField } from "common/src/metaFieldsHelpers";
import { getApplicationFields, getGeneralFields } from "./SummaryFields";

type ReservationT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservationUnit: ReservationUnitPageFieldsFragment;
  handleSubmit: () => void;
  cancelReservation: () => void;
  reservation: ReservationT;
  options: Record<string, OptionType[]>;
};

const Form = styled.form`
  display: flex;
  flex-direction: column;

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

const LinkLikeButton = styled.button`
  border: unset;
  background: unset;
  color: blue;
  padding: unset;
  cursor: pointer;
`;

function Step0({
  reservationUnit,
  reservation,
  handleSubmit,
  cancelReservation,
  options,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const termsOfUse = getTranslation(reservationUnit, "termsOfUse");

  const {
    watch,
    formState: { errors, isSubmitted, isSubmitting, isValid },
  } = useFormContext();

  const supportedFields = filterNonNullable(
    reservationUnit.metadataSet?.supportedFields
  );
  const reserveeType = watch("reserveeType");
  const homeCity = watch("homeCity");
  const includesHomeCity = containsField(supportedFields, "homeCity");
  const includesReserveeType = containsField(supportedFields, "reserveeType");

  const generalFields = getGeneralFields({ supportedFields, reservation });
  const reservationApplicationFields = getApplicationFields({
    supportedFields,
    reservation,
  });

  // TODO clean this up
  const errorKeys =
    Object.keys(errors).sort((a, b) => {
      const fields = [...supportedFields.map((x) => x.fieldName)];
      // Why?
      return fields.indexOf(a) - fields.indexOf(b);
    }) ?? [];

  if (includesReserveeType && isSubmitted && !reserveeType) {
    errorKeys.push("reserveeType");
  }

  const isHomeCityValid = !includesHomeCity || Boolean(homeCity);
  const isReserveeTypeValid = !includesReserveeType || Boolean(reserveeType);
  const submitDisabled = !isValid || !isReserveeTypeValid || !isHomeCityValid;

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      noValidate
    >
      <MetaFields
        reservationUnit={reservationUnit}
        options={options}
        generalFields={generalFields}
        reservationApplicationFields={reservationApplicationFields}
        data={{
          termsForDiscount: (
            <Trans
              i18nKey="reservationApplication:label.common.applyingForFreeOfChargeButton"
              defaults="Lue lisää <button>alennusperiaatteista</button>"
              components={{
                button: (
                  <LinkLikeButton
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                  />
                ),
              }}
            />
          ),
        }}
      />
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={
          reservationUnit.pricingTerms
            ? getTranslation(reservationUnit.pricingTerms, "text")
            : ""
        }
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      {termsOfUse && (
        <JustForMobile>
          <PinkBox>
            <Subheading>
              {t("reservations:reservationInfoBoxHeading")}
            </Subheading>
            <Sanitize html={termsOfUse} />
          </PinkBox>
        </JustForMobile>
      )}
      {errorKeys?.length > 0 && (
        <ErrorBox
          label={t("forms:heading.errorsTitle")}
          type="error"
          position="inline"
        >
          <div>{t("forms:heading.errorsSubtitle")}</div>
          <ErrorList>
            {errorKeys.map((key: string) => {
              const fieldType =
                generalFields.find((x) => x === key) != null ||
                key === "reserveeType"
                  ? "common"
                  : reserveeType?.toLocaleLowerCase() || "individual";
              return (
                <li key={key}>
                  <ErrorAnchor
                    href="#!"
                    onClick={(e) => {
                      e.preventDefault();
                      const element =
                        document.getElementById(key) ||
                        document.getElementById(`${key}-label`);
                      const top = element?.getBoundingClientRect()?.y || 0;
                      window.scroll({
                        top: window.scrollY + top - 28,
                        left: 0,
                        behavior: "smooth",
                      });
                      setTimeout(() => {
                        element?.focus();
                      }, 500);
                    }}
                  >
                    {t(`reservationApplication:label.${fieldType}.${key}`)}
                  </ErrorAnchor>
                </li>
              );
            })}
          </ErrorList>
        </ErrorBox>
      )}
      <ActionContainer>
        <MediumButton
          variant="primary"
          type="submit"
          disabled={submitDisabled}
          iconRight={<IconArrowRight aria-hidden />}
          data-test="reservation__button--update"
          isLoading={isSubmitting}
          loadingText={t("reservationCalendar:nextStepLoading")}
        >
          {t("reservationCalendar:nextStep")}
        </MediumButton>
        <MediumButton
          variant="secondary"
          type="button"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={cancelReservation}
          data-test="reservation__button--cancel"
        >
          {t("common:cancel")}
        </MediumButton>
      </ActionContainer>
    </Form>
  );
}

export default Step0;
