import React from "react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReservationPermissionsDocument, UserPermissionChoice } from "@gql/gql-types";
import type {
  ReservationPermissionsQuery,
  ReservationPermissionsQueryVariables,
  Maybe,
  ReservationEditPageFragment,
} from "@gql/gql-types";
import { Button, ButtonVariant, LoadingSpinner, TextInput } from "hds-react";
import { FormProvider, useForm } from "react-hook-form";
import { ErrorBoundary } from "react-error-boundary";
import { ReservationChangeFormSchema, ReservationTypeSchema } from "@/schemas";
import type { ReservationChangeFormType, ReservationFormMeta } from "@/schemas";
import { ReservationTypeForm } from "@/component/ReservationTypeForm";
import { useStaffReservationMutation, useReservationEditData, useSession } from "@/hooks";
import { errorToast } from "common/src/components/toast";
import { ButtonContainer, CenterSpinner, Flex, HR } from "common/styled";
import { createTagString } from "@/modules/reservation";
import { ReservationTitleSection } from "@lib/reservations/[id]";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import type { GetServerSidePropsContext } from "next";
import { createNodeId, getNode, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";
import { Error403 } from "@/component/Error403";
import { createClient } from "@/common/apolloClient";
import { hasPermission } from "@/modules/permissionHelper";

type ReservationType = ReservationEditPageFragment;
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
  const node = getNode(data);
  const unitPk = node?.reservationUnit?.unit?.pk;
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

export const RESERVATION_EDIT_PAGE_FRAGMENT = gql`
  fragment ReservationEditPage on ReservationNode {
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
`;

export const RESERVATION_EDIT_PAGE_QUERY = gql`
  query ReservationEditPage($id: ID!) {
    node(id: $id) {
      ... on ReservationNode {
        ...ReservationEditPage
      }
    }
  }
`;
