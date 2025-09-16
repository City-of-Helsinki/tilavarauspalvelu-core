import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Maybe,
  type ReservationEditPageQuery,
  ReservationPermissionsDocument,
  type ReservationPermissionsQuery,
  type ReservationPermissionsQueryVariables,
  UserPermissionChoice,
  ReserveeType,
} from "@gql/gql-types";
import { Button, ButtonVariant, LoadingSpinner, TextInput } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationChangeFormSchema, type ReservationChangeFormType } from "common/src/schemas";
import { ReservationTypeForm } from "@/components/ReservationTypeForm";
import { useReservationEditData, useSession, useStaffReservationMutation } from "@/hooks";
import { ButtonContainer, CenterSpinner, Flex, HR } from "common/src/styled";
import { createTagString } from "@/modules/reservation";
import { ReservationTitleSection } from "@lib/reservations/[id]";
import { LinkPrev } from "@/components/LinkPrev";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { GetServerSidePropsContext } from "next";
import { createNodeId, ignoreMaybeArray, toNumber } from "common/src/modules/helpers";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";
import { Error403 } from "@/components/Error403";
import { createClient } from "@/modules/apolloClient";
import { hasPermission } from "@/modules/permissionHelper";

type ReservationType = NonNullable<ReservationEditPageQuery["reservation"]>;
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
  const form = useForm<ReservationChangeFormType>({
    resolver: zodResolver(ReservationChangeFormSchema),
    mode: "onChange",
    defaultValues: {
      seriesName: reservation.reservationSeries?.name ?? "",
      comments: reservation.workingMemo ?? "",
      type: reservation.type ?? undefined,
      name: reservation.name ?? "",
      description: reservation.description ?? "",
      ageGroup: reservation.ageGroup?.pk ?? undefined,
      applyingForFreeOfCharge: reservation.applyingForFreeOfCharge ?? undefined,
      reserveeIsUnregisteredAssociation:
        reservation.reserveeType === ReserveeType.Nonprofit && reservation.reserveeIdentifier === "",
      freeOfChargeReason: reservation.freeOfChargeReason ?? undefined,
      municipality: reservation.municipality ?? undefined,
      numPersons: reservation.numPersons ?? undefined,
      purpose: reservation.purpose?.pk ?? undefined,
      reserveeEmail: reservation.reserveeEmail ?? "",
      reserveeFirstName: reservation.reserveeFirstName ?? "",
      reserveeIdentifier: reservation.reserveeIdentifier ?? "",
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

  const onSubmit = (values: ReservationChangeFormType) => {
    const { seriesName, comments, reserveeIsUnregisteredAssociation, reserveeIdentifier, ...rest } = values;

    const toSubmit = {
      // TODO don't use spread it breaks type checking for unknown fields
      ...rest,
      seriesName,
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
            {t("common:save")}
          </Button>
        </ButtonContainer>
      </Flex>
    </FormProvider>
  );
}

function EditPage({ pk }: { pk: number }): JSX.Element {
  const { t } = useTranslation("reservation", {
    keyPrefix: "EditPage",
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
export default function Page({ pk, unitPk }: PropsNarrowed): JSX.Element {
  const { user } = useSession();
  const hasAccess = hasPermission(user, UserPermissionChoice.CanManageReservations, unitPk);
  if (!hasAccess) {
    return <Error403 />;
  }
  return <EditPage pk={pk} />;
}

export async function getServerSideProps({ locale, query, req }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  const commonProps = await getCommonServerSideProps();
  const apolloClient = createClient(commonProps.apiBaseUrl, req);
  const { data } = await apolloClient.query<ReservationPermissionsQuery, ReservationPermissionsQueryVariables>({
    query: ReservationPermissionsDocument,
    variables: { id: createNodeId("ReservationNode", pk) },
  });
  const unitPk = data?.reservation?.reservationUnit?.unit?.pk;
  if (unitPk == null) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      unitPk,
      ...commonProps,
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
      ...ReservationFormFields
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
