import React, { useState } from "react";
import { Button, ButtonVariant, IconArrowRight, IconCross, LoadingSpinner } from "hds-react";
import { useForm, FormProvider, type UseFormReturn, FieldValues } from "react-hook-form";
import { Trans, useTranslation } from "next-i18next";
import styled from "styled-components";
import { ReservationFormGeneralSection, ReservationFormReserveeSection } from "@ui/reservation-form";
import InfoDialog from "@/components/InfoDialog";
import {
  type ReservationQuery,
  type ReservationUpdateMutationInput,
  ReserveeType,
  useUpdateReservationMutation,
} from "@gql/gql-types";
import { zodResolver } from "@hookform/resolvers/zod";
import { getReservationFormSchema, ReservationFormValues, type ReservationFormValueT } from "@ui/schemas";
import { getExtendedGeneralFormFields } from "@ui/reservation-form/util";
import { Flex, LinkLikeButton } from "@ui/styled";
import { convertLanguageCode, getTranslationSafe } from "@ui/modules/util";
import { type OptionsRecord } from "@ui/types";
import { ActionContainer, NewReservationForm } from "@/styled/reservation";
import { useDisplayError } from "@ui/hooks";
import { useRouter } from "next/router";
import { getReservationInProgressPath, getReservationUnitPath } from "@/modules/urls";
import { gql } from "@apollo/client";
import { ErrorListBox } from "@ui/components/ErrorListBox";
import { isNotFoundError } from "@ui/modules/apolloUtils";

type ReservationT = NonNullable<ReservationQuery["reservation"]>;
type Props = {
  cancelReservation: () => void;
  reservation: ReservationT;
  options: OptionsRecord;
};

export function ReservationStep0({ reservation, cancelReservation, options }: Props): JSX.Element {
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
  const formSchema = getReservationFormSchema(reservation.reservationUnit);

  const form = useForm<ReservationFormValues>({
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

  // TODO move to free function but requires us to type the FT (using ReturnValue + infer probably)
  function transformReservationFom(values: ReservationFormValues): ReservationUpdateMutationInput {
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
      input.description = d.description;
      input.numPersons = d.numPersons;
      input.reserveeOrganisationName = d.reserveeOrganisationName;
      input.municipality = d.municipality;
      input.reserveeType = d.reserveeType;
    }
    if ("ageGroup" in rest && typeof rest.ageGroup === "number") {
      input.ageGroup = rest.ageGroup;
    }
    if ("name" in rest && typeof rest.name === "string") {
      input.name = rest.name;
    }
    if ("purpose" in rest && typeof rest.purpose === "number") {
      input.purpose = rest.purpose;
    }

    return input;
  }

  const onSubmit = async (payload: ReservationFormValues): Promise<void> => {
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
      // NOT_FOUND is non-recoverable so redirect to the reservation unit page
      if (isNotFoundError(err)) {
        router.push(getReservationUnitPath(reservation.reservationUnit?.pk));
      }
      displayError(err);
    }
  };

  const reserveeType = watch("reserveeType");

  const lang = convertLanguageCode(i18n.language);
  const pricingTerms = reservation.reservationUnit.pricingTerms
    ? getTranslationSafe(reservation.reservationUnit.pricingTerms, "text", lang)
    : "";

  return (
    <NewReservationForm onSubmit={handleSubmit(onSubmit)} noValidate>
      <Flex>
        <ReservationForm
          reservation={reservation}
          options={options}
          form={form}
          onSubventionButtonClick={() => setIsDialogOpen(true)}
        />
        <FormErrors form={form} reserveeType={reserveeType} />
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
      </Flex>
      <InfoDialog
        id="pricing-terms"
        heading={t("reservationUnit:pricingTerms")}
        text={pricingTerms}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
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

  // Doesn't require filtering since we can't get errors if the field doesn't exist
  const generalFields = getExtendedGeneralFormFields();

  if (Object.keys(errors).length === 0) {
    return null;
  }

  const errorList = Object.keys(errors).map((key) => {
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
  margin-top: 0;
`;

interface ReservationFormProps<T extends FieldValues> {
  reservation: NonNullable<ReservationQuery["reservation"]>;
  options: OptionsRecord;
  form: UseFormReturn<T>;
  onSubventionButtonClick: () => void;
}

function ReservationForm<T extends FieldValues>({
  reservation,
  options,
  onSubventionButtonClick,
  form,
}: ReservationFormProps<T>) {
  const { t } = useTranslation();

  const { reservationUnit } = reservation;
  const enableSubvention = reservation.reservationUnit.canApplyFreeOfCharge;

  return (
    <FormProvider {...form}>
      <MandatoryFieldsInfoText>{t("forms:mandatoryFieldsText")}</MandatoryFieldsInfoText>
      <ReservationFormGeneralSection
        reservationUnit={reservationUnit}
        options={options}
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
      <ReservationFormReserveeSection reservationUnit={reservationUnit} />
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
