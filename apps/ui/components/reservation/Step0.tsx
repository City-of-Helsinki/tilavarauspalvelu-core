/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import type { OptionType } from "common/types/common";
import { Notification, IconArrowLeft, IconArrowRight, Button } from "hds-react";
import { useFormContext, UseFormReturn } from "react-hook-form";
import React, { useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import MetaFields from "common/src/reservation-form/MetaFields";
import { ActionContainer } from "./styles";
import InfoDialog from "../common/InfoDialog";
import {
  CustomerTypeChoice,
  type ReservationQuery,
  type ReservationUnitPageFieldsFragment,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { containsField, FieldName } from "common/src/metaFieldsHelpers";
import { getApplicationFields, getGeneralFields } from "./SummaryFields";
import { type Inputs } from "common/src/reservation-form/types";
import { LinkLikeButton } from "common/styles/buttonCss";
import {
  convertLanguageCode,
  getTranslationSafe,
} from "common/src/common/util";

type ReservationT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  reservationUnit: ReservationUnitPageFieldsFragment;
  cancelReservation: () => void;
  reservation: ReservationT;
  options: Record<string, OptionType[]>;
};

export function Step0({
  reservationUnit,
  reservation,
  cancelReservation,
  options,
}: Props): JSX.Element {
  const { t, i18n } = useTranslation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useFormContext<Inputs>();
  const {
    watch,
    formState: { isSubmitting, isValid },
  } = form;

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
    reserveeType: reserveeType ?? CustomerTypeChoice.Individual,
  });

  const isHomeCityValid = !includesHomeCity || Boolean(homeCity);
  const isReserveeTypeValid = !includesReserveeType || Boolean(reserveeType);
  const submitDisabled = !isValid || !isReserveeTypeValid || !isHomeCityValid;

  const lang = convertLanguageCode(i18n.language);
  const pricingTerms = reservationUnit.pricingTerms
    ? getTranslationSafe(reservationUnit.pricingTerms, "text", lang)
    : "";

  return (
    <>
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
        text={pricingTerms}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <Errors
        form={form}
        supportedFields={supportedFields}
        generalFields={generalFields}
      />
      <ActionContainer>
        <Button
          variant="primary"
          type="submit"
          disabled={submitDisabled}
          iconRight={<IconArrowRight aria-hidden />}
          data-testid="reservation__button--continue"
          isLoading={isSubmitting}
          loadingText={t("reservationCalendar:nextStepLoading")}
        >
          {t("reservationCalendar:nextStep")}
        </Button>
        <Button
          variant="secondary"
          type="button"
          iconLeft={<IconArrowLeft aria-hidden />}
          onClick={cancelReservation}
          data-testid="reservation__button--cancel"
        >
          {t("common:cancel")}
        </Button>
      </ActionContainer>
    </>
  );
}

const ErrorBox = styled(Notification)`
  max-width: 360px;
  align-self: flex-end;
  margin-bottom: var(--spacing-m);
`;

const ErrorList = styled.ul`
  margin-top: var(--spacing-2-xs);
`;

const ErrorAnchor = styled.a`
  &,
  &:visited {
    color: var(--color-black) !important;
    text-decoration: underline;
    line-height: var(--lineheight-xl);
  }
`;

function Errors({
  form,
  supportedFields,
  generalFields,
}: {
  form: UseFormReturn<Inputs>;
  supportedFields: FieldName[];
  generalFields: string[];
}) {
  const { t } = useTranslation();

  const { formState, watch } = form;
  const { errors, isSubmitted } = formState;
  // TODO clean this up
  const errorKeys =
    Object.keys(errors).sort((a, b) => {
      const fields = [...supportedFields.map((x) => x.fieldName)];
      // Why?
      return fields.indexOf(a) - fields.indexOf(b);
    }) ?? [];

  const reserveeType = watch("reserveeType");
  const includesReserveeType = containsField(supportedFields, "reserveeType");
  if (includesReserveeType && isSubmitted && !reserveeType) {
    errorKeys.push("reserveeType");
  }

  if (errorKeys.length === 0) {
    return null;
  }

  return (
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
  );
}
