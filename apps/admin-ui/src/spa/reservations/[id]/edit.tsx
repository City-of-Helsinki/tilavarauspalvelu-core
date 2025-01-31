import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ReservationQuery } from "@gql/gql-types";
import { Button, ButtonVariant, LoadingSpinner, TextInput } from "hds-react";
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
import { HR } from "@/component/Table";
import { useReservationEditData } from "./hooks";
import { useStaffReservationMutation } from "../hooks";
import { errorToast } from "common/src/common/toast";
import { ButtonContainer, CenterSpinner } from "common/styles/util";
import { createTagString } from "./util";
import ReservationTitleSection from "./ReservationTitleSection";
import { LinkPrev } from "@/component/LinkPrev";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type ReservationUnitType = NonNullable<ReservationType["reservationUnits"]>[0];
type FormValueType = ReservationChangeFormType & ReservationFormMeta;

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
  onSuccess,
}: {
  onCancel: () => void;
  reservation: ReservationType;
  reservationUnit: ReservationUnitType;
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
      comments: reservation.workingMemo ?? "",
      type: ReservationTypeSchema.optional().parse(
        reservation.type?.toUpperCase()
      ),
      name: reservation.name ?? "",
      description: reservation.description ?? "",
      ageGroup: reservation.ageGroup?.pk ?? undefined,
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
      homeCity: reservation.homeCity?.pk ?? undefined,
      numPersons: reservation.numPersons ?? undefined,
      purpose: reservation.purpose?.pk ?? undefined,
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

    const { seriesName, comments, showBillingAddress: _, ...rest } = values;

    const toSubmit = {
      ...rest,
      seriesName: seriesName !== "" ? seriesName : undefined,
      workingMemo: comments,
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
          // backend doesn't allow changing type for series but does allow it for single reservations
          disableTypeSelect={reservation.recurringReservation?.pk != null}
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
            variant={ButtonVariant.Secondary}
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting}
            variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
            iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
          >
            {t("Reservation.EditPage.save")}
          </Button>
        </ButtonContainer>
      </Form>
    </FormProvider>
  );
}

export function EditPage() {
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

  return (
    <EditPageWrapper reservation={reservation} title={t("title")}>
      {loading ? (
        <CenterSpinner />
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
            onSuccess={handleSuccess}
          />
        </ErrorBoundary>
      )}
    </EditPageWrapper>
  );
}

function EditPageWrapper({
  children,
  reservation,
  title,
}: {
  title: string;
  reservation?: ReservationType;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const tagline = reservation ? createTagString(reservation, t) : "";

  return (
    <>
      <LinkPrev />
      {reservation && (
        <ReservationTitleSection
          reservation={reservation}
          tagline={tagline}
          overrideTitle={title}
          noMargin
        />
      )}
      {children}
    </>
  );
}
