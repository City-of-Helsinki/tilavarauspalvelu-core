import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReservationQuery } from "@gql/gql-types";
import { Button, TextInput } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import {
  type ReservationFormMeta,
  ReservationTypeSchema,
  type ReservationChangeFormType,
  ReservationChangeFormSchema,
} from "@/schemas";
import ReservationTypeForm from "@/component/ReservationTypeForm";
import Loader from "@/component/Loader";
import { HR } from "@/component/Table";
import { useOptions } from "@/hooks";
import EditPageWrapper from "./EditPageWrapper";
import { useReservationEditData } from "./requested/hooks";
import { useStaffReservationMutation } from "./hooks";
import { filterNonNullable } from "common/src/helpers";
import { flattenMetadata } from "@/common/util";
import { errorToast } from "common/src/common/toast";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type ReservationUnitType = NonNullable<ReservationType["reservationUnit"]>[0];
type FormValueType = ReservationChangeFormType & ReservationFormMeta;

type PossibleOptions = {
  ageGroup: Array<{ label: string; value: number }>;
  purpose: Array<{ label: string; value: number }>;
  homeCity: Array<{ label: string; value: number }>;
};

const ButtonContainer = styled.div`
  gap: 1rem;
  display: flex;
  justify-content: flex-end;
  border-top-width: 2px;
`;

const noSeparateBillingDefined = (reservation: ReservationType): boolean =>
  !reservation.billingAddressCity &&
  !reservation.billingAddressStreet &&
  !reservation.billingAddressZip &&
  !reservation.billingEmail &&
  !reservation.billingFirstName &&
  !reservation.billingLastName &&
  !reservation.billingPhone;

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

const Form = styled.form`
  display: flex;
  gap: 1rem;
  flex-direction: column;
`;

function EditReservation({
  onCancel,
  reservation,
  reservationUnit,
  options,
  onSuccess,
}: {
  onCancel: () => void;
  reservation: ReservationType;
  reservationUnit: ReservationUnitType;
  options: PossibleOptions;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();

  // TODO recurring requires a description and a name box
  const form = useForm<FormValueType>({
    resolver: zodResolver(
      ReservationChangeFormSchema.refine(
        (x) => x.seriesName || !reservation.recurringReservation,
        {
          path: ["seriesName"],
          message: "Required",
        }
      )
    ),
    mode: "onChange",
    defaultValues: {
      seriesName: reservation.recurringReservation?.name ?? "",
      comments: reservation.workingMemo ?? undefined,
      type: ReservationTypeSchema.optional().parse(
        reservation.type?.toUpperCase()
      ),
      name: reservation.name ?? "",
      description: reservation.description ?? "",
      ageGroup: options.ageGroup.find(
        (x) => x.value === reservation.ageGroup?.pk
      ),
      applyingForFreeOfCharge: reservation.applyingForFreeOfCharge ?? undefined,
      showBillingAddress: !noSeparateBillingDefined(reservation),
      billingAddressCity: reservation.billingAddressCity ?? "",
      billingAddressStreet: reservation.billingAddressStreet ?? "",
      billingAddressZip: reservation.billingAddressZip ?? "",
      billingEmail: reservation.billingEmail ?? "",
      billingFirstName: reservation.billingFirstName ?? "",
      billingLastName: reservation.billingLastName ?? "",
      billingPhone: reservation.billingPhone ?? "",
      freeOfChargeReason: reservation.freeOfChargeReason ?? undefined,
      homeCity: options.homeCity.find(
        (x) => x.value === reservation.homeCity?.pk
      ),
      numPersons: reservation.numPersons ?? undefined,
      purpose: options.purpose.find((x) => x.value === reservation.purpose?.pk),
      reserveeAddressCity: reservation.reserveeAddressCity ?? "",
      reserveeAddressStreet: reservation.reserveeAddressStreet ?? "",
      reserveeAddressZip: reservation.reserveeAddressZip ?? "",
      reserveeEmail: reservation.reserveeEmail ?? "",
      reserveeFirstName: reservation.reserveeFirstName ?? "",
      reserveeId: reservation.reserveeId ?? "",
      reserveeIsUnregisteredAssociation:
        reservation.reserveeIsUnregisteredAssociation ?? undefined,
      reserveeLastName: reservation.reserveeLastName ?? "",
      reserveeOrganisationName: reservation.reserveeOrganisationName ?? "",
      reserveePhone: reservation.reserveePhone ?? "",
      reserveeType: reservation.reserveeType ?? undefined,
    },
  });

  const changeStaffReservation = useStaffReservationMutation({
    reservation,
    onSuccess,
  });

  const onSubmit = async (values: FormValueType) => {
    if (!reservationUnit.pk) {
      errorToast({ text: "ERROR: Can't update without reservation unit" });
      return;
    }
    if (!reservation.pk) {
      errorToast({ text: "ERROR: Can't update without reservation" });
      return;
    }

    const metadataSetFields = filterNonNullable(
      reservationUnit.metadataSet?.supportedFields
    );

    const flattenedMetadataSetValues = flattenMetadata(
      values,
      metadataSetFields
    );

    const toSubmit = {
      pk: reservation.pk,
      reservationUnitPks: [reservationUnit.pk],
      seriesName: values.seriesName !== "" ? values.seriesName : undefined,
      workingMemo: values.comments,
      type: values.type,
      ...flattenedMetadataSetValues,
    };

    return changeStaffReservation(toSubmit);
  };

  const {
    handleSubmit,
    register,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const translateError = (errorMsg?: string) =>
    errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "";

  return (
    <FormProvider {...form}>
      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <ReservationTypeForm
          reservationUnit={reservationUnit}
          disableBufferToggle
        >
          {reservation.recurringReservation?.pk && (
            <InnerTextInput
              id="seriesName"
              disabled={reservationUnit == null}
              label={t(`MyUnits.RecurringReservationForm.name`)}
              required
              {...register("seriesName")}
              invalid={errors.seriesName != null}
              errorText={translateError(errors.seriesName?.message)}
            />
          )}
        </ReservationTypeForm>
        <HR />
        <ButtonContainer>
          <Button
            variant="secondary"
            onClick={onCancel}
            theme="black"
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={!isDirty} isLoading={isSubmitting}>
            {t("Reservation.EditPage.save")}
          </Button>
        </ButtonContainer>
      </Form>
    </FormProvider>
  );
}

function EditPage() {
  const params = useParams();
  const id = params.id ?? undefined;

  const { t } = useTranslation("translation", {
    keyPrefix: "Reservation.EditPage",
  });
  const navigate = useNavigate();

  const { reservation, reservationUnit, loading, refetch } =
    useReservationEditData(id);

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSuccess = async () => {
    await refetch();
    navigate(-1);
  };

  const options = useOptions();

  return (
    <EditPageWrapper reservation={reservation} title={t("title")}>
      {loading ? (
        <Loader />
      ) : !reservation ? (
        t("Reservation failed to load", { pk: id })
      ) : !reservationUnit ? (
        t("Reservation unit failed to load")
      ) : (
        <ErrorBoundary fallback={<div>{t("pageThrewError")}</div>}>
          <EditReservation
            reservation={reservation}
            reservationUnit={reservationUnit}
            onCancel={handleCancel}
            options={options}
            onSuccess={handleSuccess}
          />
        </ErrorBoundary>
      )}
    </EditPageWrapper>
  );
}

export default EditPage;
