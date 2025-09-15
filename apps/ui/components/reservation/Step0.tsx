/**
 *  First part of the Reservation process form
 *  This component needs to be wrapped inside a Form context
 */
import { Button, ButtonVariant, IconArrowRight, IconCross, LoadingSpinner } from "hds-react";
import { useForm, FormProvider, type UseFormReturn, FieldValues } from "react-hook-form";
import React, { useState } from "react";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { ReservationFormReserveeSection, ReservationFormGeneralSection } from "common/src/reservation-form/MetaFields";
import { ActionContainer } from "./styles";
import InfoDialog from "../common/InfoDialog";
import {
  type ReservationQuery,
  type ReservationUpdateMutationInput,
  ReserveeType,
  useUpdateReservationMutation,
} from "@gql/gql-types";
import {
  FormFieldArray,
  getFilteredGeneralFields,
  getFilteredReserveeFields,
  getReservationFormGeneralFields,
} from "common/src/reservation-form/util";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinkLikeButton } from "common/src/styled";
import { getReservationFormSchema, type ReservationFormValueT } from "common/src/schemas";
import { convertLanguageCode, getTranslationSafe } from "common/src/modules/util";
import { type OptionsRecord } from "common";
import { NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "common/src/hooks";
import { useRouter } from "next/router";
import { getReservationInProgressPath, getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";
import { ErrorListBox } from "common/src/components/ErrorListBox";

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

  // Get prefilled profile user fields from the reservation (backend fills them when created).
  // NOTE this is only updated on load (not after mutation or refetch)
  const defaultValues: ReservationFormValueT = {
    pk: reservation.pk ?? 0,
    name: reservation.name ?? "",
    description: reservation.description ?? "",
    reserveeFirstName: reservation.reserveeFirstName ?? "",
    reserveeLastName: reservation.reserveeLastName ?? "",
    reserveePhone: reservation.reserveePhone ?? "",
    reserveeEmail: reservation.reserveeEmail ?? "",
    reserveeIdentifier: reservation.reserveeIdentifier ?? "",
    reserveeOrganisationName: reservation.reserveeOrganisationName ?? "",
    municipality: reservation.municipality ?? undefined,
    reserveeType: reservation.reserveeType ?? undefined,
    applyingForFreeOfCharge: reservation.applyingForFreeOfCharge ?? false,
    freeOfChargeReason: reservation.freeOfChargeReason ?? "",
    purpose: reservation.purpose?.pk ?? undefined,
    numPersons: reservation.numPersons ?? undefined,
    ageGroup: reservation.ageGroup?.pk ?? undefined,
    reserveeIsUnregisteredAssociation: false,
  };
  const formSchema = getReservationFormSchema(reservation.reservationUnit.reservationForm);
  // NOTE infered type is not exactly correct it doesn't create all four discrimating unions
  type FT = z.infer<typeof formSchema>;

  const form = useForm<FT>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(formSchema),
  });
  const {
    watch,
    formState: { isSubmitting },
    handleSubmit,
  } = form;

  const { pk: reservationPk } = reservation || {};
  const displayError = useDisplayError();
  const [updateReservation] = useUpdateReservationMutation();

  const formType = reservation.reservationUnit.reservationForm;

  // TODO move to free function but requires us to type the FT (using ReturnValue + infer probably)
  function transformReservationFom(values: FT): ReservationUpdateMutationInput {
    const {
      reserveeFirstName,
      reserveeLastName,
      reserveePhone,
      reserveeEmail,
      // boolean toggles
      applyingForFreeOfCharge,
      freeOfChargeReason,
      ...rest
    } = values;

    if (reservationPk == null) {
      throw new Error("Reservation pk should never be null");
    }
    // TODO move to ts utilities
    type Writable<T> = {
      -readonly [K in keyof T]: T[K];
    };
    // Use explicit copying of attributes instead of spread so we don't pass unknown fields to the mutation
    // typescript catches invalid fields when they are explicit but not for spread
    const input: Writable<ReservationUpdateMutationInput> = {
      pk: reservationPk,
      reserveeFirstName,
      reserveeLastName,
      reserveePhone,
      reserveeEmail,
      // force update to empty -> NA
      applyingForFreeOfCharge,
      freeOfChargeReason: applyingForFreeOfCharge ? freeOfChargeReason : "",
    };

    if ("reserveeIdentifier" in rest) {
      const { reserveeIsUnregisteredAssociation, reserveeIdentifier, ...d } = rest;
      input.reserveeIdentifier =
        reserveeType !== ReserveeType.Individual && !reserveeIsUnregisteredAssociation ? reserveeIdentifier : "";
      input.name = d.name;
      input.description = d.description;
      input.numPersons = d.numPersons;
      input.reserveeOrganisationName = d.reserveeOrganisationName;
      input.municipality = d.municipality;
      input.reserveeType = d.reserveeType;
    }
    if ("ageGroup" in rest && typeof rest.ageGroup === "number") {
      input.ageGroup = rest.ageGroup;
    }
    if ("purpose" in rest && typeof rest.purpose === "number") {
      input.purpose = rest.purpose;
    }

    return input;
  }

  const onSubmit = async (payload: FT): Promise<void> => {
    const input = transformReservationFom(payload);
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

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <ReservationForm
        reservation={reservation}
        options={options}
        reserveeFields={reserveeFields}
        form={form}
        onSubventionButtonClick={() => setIsDialogOpen(true)}
      />
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={pricingTerms}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <FormErrors form={form} /*formType={formType}*/ reserveeType={reserveeType} />
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

function FormErrors<T extends FieldValues>({
  form,
  reserveeType,
}: {
  form: UseFormReturn<T>;
  reserveeType: ReserveeType;
}) {
  const { t } = useTranslation();

  const {
    formState: { errors },
  } = form;
  // TODO clean this up (wrap it into a function that clearly tells what it's doing)
  /*
  const errorKeys =
    Object.keys(errors).sort((a, b) => {
      const fields = getFormFields(formType).map((x) => x.toString());
      // Why?
      return fields.indexOf(a) - fields.indexOf(b);
    }) ?? [];
  */

  // Doesn't require filtering since we can't get errors if the field doesn't exist
  const generalFields = getReservationFormGeneralFields();
  // FIXME need to drill this if we need different translations

  if (Object.keys(errors).length === 0) {
    return null;
  }

  const errorList = Object.keys(errors).map((key) => {
    // TODO why?
    const parentTrKey =
      generalFields.find((x) => x === key) != null || key === "reserveeType"
        ? "common"
        : reserveeType?.toLocaleLowerCase() || "individual";
    const label = t(`reservationApplication:label.${parentTrKey}.${key}`);
    return {
      key,
      label,
    };
  });

  return <ErrorListBox errors={errorList} label={t("forms:heading.errorsTitle")} />;
}

const MandatoryFieldsInfoText = styled.p`
  font-size: var(--fontsize-body-s);
  margin-top: calc(var(--spacing-xs) * -1);
  && {
    margin-bottom: var(--spacing-s);
  }
`;

interface ReservationFormProps<T extends FieldValues> {
  reservation: NonNullable<ReservationQuery["reservation"]>;
  reserveeFields: FormFieldArray;
  options: Readonly<Omit<OptionsRecord, "municipality">>;
  form: UseFormReturn<T>;
  onSubventionButtonClick: () => void;
}

function ReservationForm<T extends FieldValues>({
  reservation,
  reserveeFields,
  options,
  onSubventionButtonClick,
  form,
}: ReservationFormProps<T>) {
  const { t } = useTranslation();

  const { reservationUnit } = reservation;
  const formType = reservationUnit.reservationForm;
  const generalFields = getFilteredGeneralFields(formType);
  const enableSubvention = reservation.reservationUnit.canApplyFreeOfCharge;

  return (
    <FormProvider {...form}>
      <MandatoryFieldsInfoText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsInfoText>
      <ReservationFormGeneralSection
        fields={generalFields}
        options={options}
        reservationUnit={reservationUnit}
        data={{
          enableSubvention,
          termsForDiscount: (
            <Trans
              i18nKey="reservationApplication:label.common.applyingForFreeOfChargeButton"
              defaults="Lue lisää <button>alennusperiaatteista</button>"
              components={{
                button: <LinkLikeButton type="button" onClick={onSubventionButtonClick} />,
              }}
            />
          ),
        }}
      />
      <ReservationFormReserveeSection fields={reserveeFields} options={options} reservationUnit={reservationUnit} />
    </FormProvider>
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
