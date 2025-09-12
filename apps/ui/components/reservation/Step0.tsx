/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import { Button, ButtonVariant, IconArrowRight, IconCross, LoadingSpinner, Notification } from "hds-react";
import { useFormContext, UseFormReturn } from "react-hook-form";
import React, { useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { ReservationFormReserveeSection, ReservationFormGeneralSection } from "common/src/reservation-form/MetaFields";
import { ActionContainer } from "./styles";
import InfoDialog from "../common/InfoDialog";
import {
  type ReservationQuery,
  type ReservationUpdateMutationInput,
  type MetadataSetsFragment,
  ReservationFormType,
  ReserveeType,
  useUpdateReservationMutation,
} from "@gql/gql-types";
import {
  getFilteredGeneralFields,
  getFilteredReserveeFields,
  formContainsField,
  getFormFields,
  type FormFieldArray,
  type ExtendedFormFieldArray,
} from "common/src/reservation-form/util";
import { LinkLikeButton } from "common/src/styled";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { type OptionsRecord } from "common";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { useRouter } from "next/router";
import { getReservationInProgressPath, getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";
import { type ReservationFormValueT } from "common/src/schemas";

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

  const form = useFormContext<ReservationFormValueT>();
  const {
    watch,
    formState: { isSubmitting },
    handleSubmit,
  } = form;

  const { pk: reservationPk } = reservation || {};
  const displayError = useDisplayError();
  const [updateReservation] = useUpdateReservationMutation();

  const formType = reservation.reservationUnit.reservationForm;
  const onSubmit = async (payload: ReservationFormValueT): Promise<void> => {
    const {
      // boolean toggles
      applyingForFreeOfCharge,
      freeOfChargeReason,
      reserveeIsUnregisteredAssociation,
      reserveeIdentifier,
      ...rest
    } = payload;
    const hasReserveeTypeField = formContainsField(formType, "reserveeType");
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

  const generalFields = getFilteredGeneralFields(formType);
  const reserveeType = watch("reserveeType");
  const reserveeFields = getFilteredReserveeFields({
    formType,
    reservation,
    reserveeType: reserveeType ?? ReserveeType.Individual,
  });

  const lang = convertLanguageCode(i18n.language);
  const pricingTerms = reservation.reservationUnit.pricingTerms
    ? getTranslationSafe(reservation.reservationUnit.pricingTerms, "text", lang)
    : "";

  const enableSubvention = reservation.reservationUnit.canApplyFreeOfCharge;

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <ReservationForm
        reservationUnit={reservation.reservationUnit}
        options={options}
        generalFields={generalFields}
        reservationApplicationFields={reserveeFields}
        data={{
          enableSubvention,
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
      <FormErrors form={form} formType={formType} generalFields={generalFields} />
      <ActionContainer>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconEnd={isSubmitting ? <LoadingSpinner small /> : <IconArrowRight />}
          disabled={isSubmitting}
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
  margin: var(--spacing-m) 0;
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

// TODO this should be a general component -> or at least the error display part should be
function FormErrors({
  form,
  formType,
  generalFields,
}: {
  form: UseFormReturn<ReservationFormValueT>;
  formType: ReservationFormType;
  generalFields: FormFieldArray;
}) {
  const { t } = useTranslation();

  const { formState, watch } = form;
  const { errors, isSubmitted } = formState;
  // TODO clean this up (wrap it into a function that clearly tells what it's doing)
  const errorKeys =
    Object.keys(errors).sort((a, b) => {
      const fields = getFormFields(formType).map((x) => x.toString());
      // Why?
      return fields.indexOf(a) - fields.indexOf(b);
    }) ?? [];

  const reserveeType = watch("reserveeType");
  const includesReserveeType = formContainsField(formType, "reserveeType");
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
        {errorKeys.map((key) => {
          // TODO why?
          const parentTrKey =
            generalFields.find((x) => x === key) != null || key === "reserveeType"
              ? "common"
              : reserveeType?.toLocaleLowerCase() || "individual";
          const label = t(`reservationApplication:label.${parentTrKey}.${key}`);
          return (
            <li key={key}>
              <ErrorAnchor
                href="#!"
                onClick={(e) => {
                  // TODO this is awful -> move to handler func and refactor
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
                {label}
              </ErrorAnchor>
            </li>
          );
        })}
      </ErrorList>
    </ErrorBox>
  );
}

const MandatoryFieldsInfoText = styled.p`
  font-size: var(--fontsize-body-s);
  margin-top: calc(var(--spacing-xs) * -1);
  && {
    margin-bottom: var(--spacing-s);
  }
`;

interface ReservationFormProps {
  reservationUnit: MetadataSetsFragment;
  generalFields: FormFieldArray;
  reservationApplicationFields: ExtendedFormFieldArray;
  options: Readonly<Omit<OptionsRecord, "municipality">>;
  data?: {
    termsForDiscount?: JSX.Element | string;
    enableSubvention?: boolean;
  };
}

function ReservationForm({
  reservationUnit,
  generalFields,
  reservationApplicationFields,
  options,
  data,
}: ReservationFormProps) {
  const { t } = useTranslation();
  return (
    <>
      <MandatoryFieldsInfoText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsInfoText>
      <ReservationFormGeneralSection
        fields={generalFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
      />
      <ReservationFormReserveeSection
        fields={reservationApplicationFields}
        options={options}
        reservationUnit={reservationUnit}
        data={data}
        // inconsistency between admin and customer ui (could handle by refactoring customer to have gap on the parent)
        style={{ marginTop: "var(--spacing-xl)" }}
      />
    </>
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
