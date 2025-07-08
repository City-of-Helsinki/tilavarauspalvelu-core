import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Maybe, type ReservationEditPageQuery } from "@gql/gql-types";
import { Button, ButtonVariant, LoadingSpinner, TextInput } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import { ErrorBoundary } from "react-error-boundary";
import {
  ReservationChangeFormSchema,
  type ReservationChangeFormType,
  type ReservationFormMeta,
  ReservationTypeSchema,
} from "@/schemas";
import ReservationTypeForm from "@/component/ReservationTypeForm";
import { useStaffReservationMutation, useReservationEditData } from "@/hooks";
import { errorToast } from "common/src/common/toast";
import { ButtonContainer, CenterSpinner, Flex, HR } from "common/styled";
import { createTagString } from "@/component/reservations/util";
import { ReservationTitleSection } from "@/component/reservations";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { GetServerSidePropsContext } from "next";
import { ignoreMaybeArray, toNumber } from "common/src/helpers";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import Error403 from "@/common/Error403";
import { useCheckReservationPermissions } from "@/hooks/useCheckReservationPermissions";

type ReservationType = NonNullable<ReservationEditPageQuery["reservation"]>;
type FormValueType = ReservationChangeFormType & ReservationFormMeta;

const InnerTextInput = styled(TextInput)`
  grid-column: 1 / -1;
  max-width: var(--prose-width);
`;

function EditReservation({
  onCancel,
  reservation,
  onSuccess,
}: {
  onCancel: () => void;
  reservation: ReservationType;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();

  const reservationUnit = reservation.reservationUnit;

  // TODO recurring requires a description and a name box
  const form = useForm<FormValueType>({
    // @ts-expect-error -- schema refinement breaks typing
    resolver: zodResolver(
      ReservationChangeFormSchema.refine((x) => x.seriesName || !reservation.reservationSeries, {
        path: ["seriesName"],
        message: "Required",
      })
    ),
    mode: "onChange",
    defaultValues: {
      seriesName: reservation.reservationSeries?.name ?? "",
      comments: reservation.workingMemo ?? "",
      type: ReservationTypeSchema.optional().parse(reservation.type?.toUpperCase()),
      name: reservation.name ?? "",
      description: reservation.description ?? "",
      ageGroup: reservation.ageGroup?.pk ?? undefined,
      applyingForFreeOfCharge: reservation.applyingForFreeOfCharge ?? undefined,
      freeOfChargeReason: reservation.freeOfChargeReason ?? undefined,
      municipality: reservation.municipality ?? undefined,
      numPersons: reservation.numPersons ?? undefined,
      purpose: reservation.purpose?.pk ?? undefined,
      reserveeAddressCity: reservation.reserveeAddressCity ?? "",
      reserveeAddressStreet: reservation.reserveeAddressStreet ?? "",
      reserveeAddressZip: reservation.reserveeAddressZip ?? "",
      reserveeEmail: reservation.reserveeEmail ?? "",
      reserveeFirstName: reservation.reserveeFirstName ?? "",
      reserveeIdentifier: reservation.reserveeIdentifier ?? "",
      reserveeIsUnregisteredAssociation: !!reservation.reserveeIdentifier,
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

  const onSubmit = (values: FormValueType) => {
    if (!reservationUnit.pk) {
      errorToast({ text: "ERROR: Can't update without reservation unit" });
      return;
    }
    if (!reservation.pk) {
      errorToast({ text: "ERROR: Can't update without reservation" });
      return;
    }

    const { seriesName, comments, reserveeIsUnregisteredAssociation, reserveeIdentifier, ...rest } = values;

    const toSubmit = {
      ...rest,
      seriesName: seriesName !== "" ? seriesName : undefined,
      // force update to empty -> NA
      reserveeIdentifier: !reserveeIsUnregisteredAssociation ? reserveeIdentifier : "",
      workingMemo: comments,
    };

    return changeStaffReservation(toSubmit);
  };

  const {
    handleSubmit,
    register,
    formState: { errors, isDirty, isSubmitting },
  } = form;

  const translateError = (errorMsg?: string) => (errorMsg ? t(`reservationForm:errors.${errorMsg}`) : "");

  return (
    <FormProvider {...form}>
      <Flex as="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <ReservationTypeForm
          reservationUnit={reservationUnit}
          disableBufferToggle
          // backend doesn't allow changing type for series but does allow it for single reservations
          disableTypeSelect={reservation.reservationSeries?.pk != null}
        >
          {reservation.reservationSeries?.pk && (
            <InnerTextInput
              id="seriesName"
              disabled={reservationUnit == null}
              label={t(`myUnits:ReservationSeriesForm.name`)}
              required
              {...register("seriesName")}
              invalid={errors.seriesName != null}
              errorText={translateError(errors.seriesName?.message)}
            />
          )}
        </ReservationTypeForm>
        <HR />
        <ButtonContainer>
          <Button variant={ButtonVariant.Secondary} onClick={onCancel} disabled={isSubmitting}>
            {t("common:cancel")}
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
      </Flex>
    </FormProvider>
  );
}

function EditPage({ pk }: { pk: number }): JSX.Element {
  const { t } = useTranslation("translation", {
    keyPrefix: "Reservation.EditPage",
  });
  const router = useRouter();

  const { reservation, loading, refetch } = useReservationEditData(pk);

  const handleCancel = () => {
    router.back();
  };

  const handleSuccess = async () => {
    await refetch();
    router.back();
  };

  return (
    <Wrapper reservation={reservation} title={t("title")}>
      {loading ? (
        <CenterSpinner />
      ) : !reservation ? (
        t("Reservation failed to load", { pk })
      ) : (
        <ErrorBoundary fallback={<div>{t("pageThrewError")}</div>}>
          <EditReservation reservation={reservation} onCancel={handleCancel} onSuccess={handleSuccess} />
        </ErrorBoundary>
      )}
    </Wrapper>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;
export default function Page(props: PropsNarrowed): JSX.Element {
  // TODO should be done in SSR
  const { hasPermission } = useCheckReservationPermissions(props.pk);
  return hasPermission ? <EditPage pk={props.pk} /> : <Error403 />;
}

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

function Wrapper({
  children,
  reservation,
  title,
}: {
  title: string;
  reservation: Maybe<ReservationType> | undefined;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const tagline = reservation ? createTagString(reservation, t) : "";

  return (
    <>
      <LinkPrev />
      {reservation && (
        <ReservationTitleSection reservation={reservation} tagline={tagline} overrideTitle={title} noMargin />
      )}
      {children}
    </>
  );
}

export const RESERVATION_EDIT_PAGE_QUERY = gql`
  query ReservationEditPage($id: ID!) {
    reservation(id: $id) {
      id
      pk
      ...CreateTagString
      ...ReservationCommonFields
      ...ReservationMetaFields
      ...ReservationTitleSectionFields
      ...UseStaffReservation
      reservationSeries {
        id
        pk
        name
      }
      reservationUnit {
        id
        pk
        ...ReservationTypeFormFields
      }
    }
  }
`;
