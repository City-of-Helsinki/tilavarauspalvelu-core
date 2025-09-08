/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import { Button, ButtonVariant, IconArrowRight, IconCross, LoadingSpinner, Notification } from "hds-react";
import { useFormContext, UseFormReturn } from "react-hook-form";
import React, { useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import MetaFields from "common/src/reservation-form/MetaFields";
import { ActionContainer } from "./styles";
import InfoDialog from "../common/InfoDialog";
import { filterNonNullable } from "common/src/modules/helpers";
import { containsField, FieldName } from "common/src/modules/metaFieldsHelpers";
import {
  type ReservationQuery,
  type ReservationUpdateMutationInput,
  ReserveeType,
  useUpdateReservationMutation,
} from "@gql/gql-types";
import { type InputsT } from "common/src/reservation-form/types";
import { LinkLikeButton } from "common/src/styled";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { getApplicationFields, getGeneralFields } from "common/src/hooks/useApplicationFields";
import { type OptionsRecord } from "common";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { useRouter } from "next/router";
import { getReservationInProgressPath, getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";

type ReservationT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  cancelReservation: () => void;
  reservation: ReservationT;
  options: Omit<OptionsRecord, "municipality">;
};

export function Step0({ reservation, cancelReservation, options }: Props): JSX.Element {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useFormContext<InputsT>();
  const {
    watch,
    formState: { isSubmitting, isValid },
    handleSubmit,
  } = form;

  const { pk: reservationPk } = reservation || {};
  const displayError = useDisplayError();
  const [updateReservation] = useUpdateReservationMutation();

  const onSubmit = async (payload: InputsT): Promise<void> => {
    const {
      // boolean toggles
      applyingForFreeOfCharge,
      freeOfChargeReason,
      showBillingAddress,
      reserveeIsUnregisteredAssociation,
      reserveeIdentifier,
      ...rest
    } = payload;
    const hasReserveeTypeField = containsField(supportedFields, "reserveeType");
    if (hasReserveeTypeField && !reserveeType) {
      throw new Error("Reservee type is required");
    }
    if (reservationPk == null) {
      throw new Error("Reservation pk is required");
    }

    const input: ReservationUpdateMutationInput = {
      // TODO don't use spread it breaks type checking for unknown fields
      ...rest,
      // force update to empty -> NA
      reserveeIdentifier:
        reserveeType !== ReserveeType.Individual && !reserveeIsUnregisteredAssociation ? reserveeIdentifier : "",
      applyingForFreeOfCharge,
      freeOfChargeReason: applyingForFreeOfCharge ? freeOfChargeReason : "",
      pk: reservationPk,
    };

    try {
      const { data } = await updateReservation({
        variables: {
          input,
        },
      });
      if (data?.updateReservation?.state === "CANCELLED") {
        await router.push(getReservationUnitPath(reservation.reservationUnit.pk));
      } else {
        await router.push(getReservationInProgressPath(reservation.reservationUnit.pk, reservation.pk, 1));
      }
    } catch (err) {
      // TODO: NOT_FOUND at least is non-recoverable so we should redirect to the reservation unit page
      displayError(err);
    }
  };

  const supportedFields = filterNonNullable(reservation.reservationUnit.metadataSet?.supportedFields);
  const reserveeType = watch("reserveeType");
  const municipality = watch("municipality");
  const includesHomeCity = containsField(supportedFields, "municipality");
  const includesReserveeType = containsField(supportedFields, "reserveeType");

  const generalFields = getGeneralFields({ supportedFields, reservation });
  const reservationApplicationFields = getApplicationFields({
    supportedFields,
    reservation,
    reserveeType: reserveeType ?? ReserveeType.Individual,
  });

  const isHomeCityValid = !includesHomeCity || Boolean(municipality);
  const isReserveeTypeValid = !includesReserveeType || Boolean(reserveeType);
  const submitDisabled = !isValid || !isReserveeTypeValid || !isHomeCityValid;

  const lang = convertLanguageCode(i18n.language);
  const pricingTerms = reservation.reservationUnit.pricingTerms
    ? getTranslationSafe(reservation.reservationUnit.pricingTerms, "text", lang)
    : "";

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <MetaFields
        reservationUnit={reservation.reservationUnit}
        options={options}
        generalFields={generalFields}
        reservationApplicationFields={reservationApplicationFields}
        data={{
          termsForDiscount: (
            <Trans
              i18nKey="reservationApplication:label.common.applyingForFreeOfChargeButton"
              defaults="Lue lisää <button>alennusperiaatteista</button>"
              components={{
                button: <LinkLikeButton type="button" onClick={() => setIsDialogOpen(true)} />,
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
      <Errors form={form} supportedFields={supportedFields} generalFields={generalFields} />
      <ActionContainer>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconEnd={isSubmitting ? <LoadingSpinner small /> : <IconArrowRight />}
          disabled={submitDisabled || isSubmitting}
          data-testid="reservation__button--continue"
        >
          {t("common:next")}
        </Button>
        <Button
          type="button"
          variant={ButtonVariant.Secondary}
          iconStart={<IconCross />}
          disabled={isSubmitting}
          onClick={cancelReservation}
          data-testid="reservation__button--cancel"
        >
          {t("common:stop")}
        </Button>
      </ActionContainer>
    </NewReservationForm>
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
  form: UseFormReturn<InputsT>;
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
    <ErrorBox label={t("forms:heading.errorsTitle")} type="error" position="inline">
      <div>{t("forms:heading.errorsSubtitle")}</div>
      <ErrorList>
        {errorKeys.map((key: string) => {
          const fieldType =
            generalFields.find((x) => x === key) != null || key === "reserveeType"
              ? "common"
              : reserveeType?.toLocaleLowerCase() || "individual";
          return (
            <li key={key}>
              <ErrorAnchor
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(key) || document.getElementById(`${key}-label`);
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

export const UPDATE_RESERVATION = gql`
  mutation UpdateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      pk
      state
    }
  }
`;
