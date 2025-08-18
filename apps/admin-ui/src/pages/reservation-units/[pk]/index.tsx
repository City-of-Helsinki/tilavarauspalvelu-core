import React, { useEffect } from "react";
import styled from "styled-components";
import { useForm, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EquipmentOrderingChoices,
  ImageType,
  ReservationKind,
  type ReservationUnitEditorParametersQuery,
  type ReservationUnitEditQuery,
  TermsType,
  useCreateImageMutation,
  useCreateReservationUnitMutation,
  useDeleteImageMutation,
  useReservationUnitEditorParametersQuery,
  useReservationUnitEditQuery,
  useReservationUnitCreateUnitQuery,
  useUpdateImageMutation,
  useUpdateReservationUnitMutation,
  UserPermissionChoice,
} from "@gql/gql-types";
import { createNodeId, filterNonNullable, ignoreMaybeArray, toNumber } from "common/src/helpers";
import { Flex } from "common/styled";

import { errorToast, successToast } from "common/src/components/toast";
import { useModal } from "@/context/ModalContext";
import { Error404 } from "@/component/Error404";

import { getReservationUnitUrl } from "@/common/urls";
import { ApolloError, gql } from "@apollo/client";
import { breakpoints } from "common/src/const";
import { useRouter } from "next/router";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { AuthorizationChecker } from "@/component/AuthorizationChecker";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { type GetServerSidePropsContext } from "next";
import {
  convertReservationUnit,
  type ImageFormType,
  type ReservationUnitEditFormValues,
  ReservationUnitEditSchema,
  transformReservationUnit,
  SeasonalSection,
  DisplayUnit,
  BottomButtonsStripe,
  BasicSection,
  TermsSection,
  DescriptionSection,
  OpeningHoursSection,
  CommunicationSection,
  AccessTypeSection,
  ReservationUnitSettingsSection,
  PricingSection,
  ErrorInfo,
} from "@lib/reservation-units/[pk]/";
import { NOT_FOUND_SSR_VALUE } from "@/common/const";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

// Override the Accordion style: force border even if the accordion is open
// because the last section is not an accordion but a button and it looks funny otherwise
// TODO should we limit the width of the text boxes? or the whole form?
const StyledContainerMedium = styled(Flex)`
  & > div:nth-last-of-type(2) > div {
    /* stylelint-disable-next-line csstools/value-no-unknown-custom-properties */
    border-bottom: 1px solid var(--border-color);
  }

  /* NOTE some magic values so the sticky buttons don't hide the bottom of the page */
  padding-bottom: 6rem;
  @media (min-width: ${breakpoints.m}) {
    padding-bottom: 5rem;
  }
`;

// Terms PK is not a number but any valid string
function makeTermsOptions(parameters: ReservationUnitEditorParametersQuery | undefined, termsType: TermsType) {
  return filterNonNullable(parameters?.termsOfUse?.edges.map((e) => e?.node))
    .filter((tou) => termsType === tou?.termsType)
    .map((tou) => {
      return {
        value: tou?.pk ?? "",
        label: tou?.nameFi ?? "no-name",
      };
    });
}

function useImageMutations() {
  const [createImage] = useCreateImageMutation();
  const [delImage] = useDeleteImageMutation();
  const [updateImagetype] = useUpdateImageMutation();

  const reconcileImageChanges = async (resUnitPk: number, images: ImageFormType[]): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = images
        .filter((image) => image.deleted)
        .map((image) => delImage({ variables: { pk: image.pk?.toString() ?? "" } }));
      await Promise.all(deletePromises);
    } catch (_) {
      return false;
    }

    // create images
    try {
      const addPromises = images
        .filter((image) => image.pk == null || image.pk < 0)
        .map((image) =>
          createImage({
            variables: {
              image: image.bytes,
              reservationUnit: resUnitPk,
              imageType: image.imageType ?? ImageType.Other,
            },
          })
        );

      await Promise.all(addPromises);
    } catch (_) {
      return false;
    }

    // change imagetypes
    try {
      const changeTypePromises = images
        .filter((image) => !image.deleted)
        .filter((image) => image.pk && image.pk > 0)
        .filter((image) => image.imageType !== image.originalImageType)
        .map((image) => {
          return updateImagetype({
            variables: {
              pk: image.pk ?? 0,
              imageType: image.imageType ?? ImageType.Other,
            },
          });
        });

      await Promise.all(changeTypePromises);
    } catch (_) {
      return false;
    }

    return true;
  };

  return [reconcileImageChanges];
}

function ReservationUnitEditor({
  reservationUnit,
  form,
  refetch,
  previewUrlPrefix,
  unitPk,
}: {
  reservationUnit?: Node;
  form: UseFormReturn<ReservationUnitEditFormValues>;
  refetch: () => void;
  previewUrlPrefix: string;
  unitPk: number;
}): JSX.Element | null {
  // ----------------------------- State and Hooks ----------------------------
  const { t } = useTranslation();
  const router = useRouter();
  const { setModalContent } = useModal();
  const [reconcileImageChanges] = useImageMutations();

  const [updateMutation] = useUpdateReservationUnitMutation();
  const [createMutation] = useCreateReservationUnitMutation();

  const { data: parametersData } = useReservationUnitEditorParametersQuery({
    onError: (_) => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
    variables: {
      equipmentsOrderBy: EquipmentOrderingChoices.CategoryRankAsc,
    },
  });

  // Fetch unit data only when creating a new reservation unit
  const { data: unitData } = useReservationUnitCreateUnitQuery({
    variables: { id: createNodeId("UnitNode", unitPk) },
    fetchPolicy: "network-only",
    skip: unitPk <= 0,
  });
  const unit = reservationUnit?.unit ?? unitData?.unit;

  // ----------------------------- Constants ---------------------------------

  const taxPercentageOptions = filterNonNullable(parametersData?.taxPercentages?.edges.map((e) => e?.node)).map(
    (n) => ({
      value: Number(n.value),
      pk: n.pk ?? -1,
      label: n.value,
    })
  );
  const pricingTermsOptions = makeTermsOptions(parametersData, TermsType.PricingTerms);

  const serviceSpecificTermsOptions = makeTermsOptions(parametersData, TermsType.ServiceTerms);
  const paymentTermsOptions = makeTermsOptions(parametersData, TermsType.PaymentTerms);
  const cancellationTermsOptions = makeTermsOptions(parametersData, TermsType.CancellationTerms);

  const metadataOptions = filterNonNullable(parametersData?.metadataSets?.edges.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.name ?? "no-name",
  }));
  const cancellationRuleOptions = filterNonNullable(
    parametersData?.reservationUnitCancellationRules?.edges.map((e) => e?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  // ----------------------------- Callbacks ----------------------------------
  const { getValues, watch, handleSubmit } = form;

  const kind = watch("reservationKind");
  const isDirect = kind === ReservationKind.Direct || kind === ReservationKind.DirectAndSeason;
  const isSeasonal = kind === ReservationKind.Season || kind === ReservationKind.DirectAndSeason;

  // unsafe because the handleSubmit doesn't pass return value (so throw is the only way to manipulate control flow)
  const onSubmit = async (formValues: ReservationUnitEditFormValues) => {
    const { pk, ...input } = transformReservationUnit(formValues, taxPercentageOptions);
    const promise =
      pk != null
        ? updateMutation({ variables: { input: { ...input, pk } } })
        : createMutation({
            variables: { input: { ...input, unit: unitPk } },
          });

    const { data, errors: mutationErrors } = await promise;
    if (mutationErrors != null && mutationErrors.length > 0) {
      throw new ApolloError({
        graphQLErrors: mutationErrors,
      });
    }

    const getPk = (d: typeof data) => {
      if (d == null) {
        return null;
      }
      if ("updateReservationUnit" in d) {
        return d.updateReservationUnit?.pk ?? null;
      }
      if ("createReservationUnit" in d) {
        return d.createReservationUnit?.pk ?? null;
      }
      return null;
    };
    const upPk = getPk(data);

    // crude way to handle different logic for archive vs save (avoids double toast)
    if (upPk && !formValues.isArchived) {
      const { images } = formValues;
      // res unit is saved, we can save changes to images
      const success = await reconcileImageChanges?.(upPk, images);
      if (success) {
        // redirect if new one was created
        if (formValues.pk === 0 && upPk > 0) {
          router.push(getReservationUnitUrl(unitPk, upPk));
        }
        const tkey =
          formValues.pk === 0
            ? "reservationUnitEditor:reservationUnitCreatedNotification"
            : "reservationUnitEditor:reservationUnitUpdatedNotification";
        successToast({ text: t(tkey, { name: getValues("nameFi") }) });
      } else {
        const msg = t("reservationUnitEditor:imageSaveFailed");
        throw new Error(msg);
      }
    } else if (upPk == null) {
      const msg = t("reservationUnitEditor:saveFailed", { error: "" });
      throw new Error(msg);
    }
    refetch();
    return upPk;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StyledContainerMedium>
        <DisplayUnit
          heading={reservationUnit?.nameFi ?? t("reservationUnitEditor:defaultHeading")}
          unit={unit}
          reservationState={reservationUnit?.reservationState}
          unitState={reservationUnit?.publishingState}
        />
        <ErrorInfo form={form} />
        <BasicSection form={form} spaces={unit?.spaces ?? []} />
        <DescriptionSection
          form={form}
          equipments={parametersData?.equipmentsAll}
          purposes={parametersData?.purposes}
          reservationUnitTypes={parametersData?.reservationUnitTypes}
        />
        <ReservationUnitSettingsSection
          form={form}
          metadataOptions={metadataOptions}
          cancellationRuleOptions={cancellationRuleOptions}
        />
        <PricingSection
          form={form}
          taxPercentageOptions={taxPercentageOptions}
          pricingTermsOptions={pricingTermsOptions}
        />
        {isDirect && (
          <TermsSection
            form={form}
            options={{
              service: serviceSpecificTermsOptions,
              payment: paymentTermsOptions,
              cancellation: cancellationTermsOptions,
            }}
          />
        )}
        <CommunicationSection form={form} />
        <OpeningHoursSection reservationUnit={reservationUnit} previewUrlPrefix={previewUrlPrefix} />
        {isSeasonal && <SeasonalSection form={form} />}
        <AccessTypeSection form={form} accessTypes={reservationUnit?.accessTypes || []} />
      </StyledContainerMedium>

      <BottomButtonsStripe
        reservationUnit={reservationUnit}
        unit={unit}
        previewUrlPrefix={previewUrlPrefix}
        setModalContent={setModalContent}
        onSubmit={onSubmit}
        form={form}
      />
    </form>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;

/// Wrap the editor so we never reset the form after async loading (because of HDS TimeInput bug)
export default function EditorPage(props: PropsNarrowed): JSX.Element {
  const { reservationUnitPk, unitPk } = props;
  const {
    data,
    loading: isLoading,
    refetch,
  } = useReservationUnitEditQuery({
    variables: { id: createNodeId("ReservationUnitNode", reservationUnitPk) },
    skip: reservationUnitPk <= 0,
  });

  const reservationUnit = data?.reservationUnit ?? undefined;

  const form = useForm<ReservationUnitEditFormValues>({
    mode: "onBlur",
    // NOTE disabling because it throws an error when submitting because it can't focus the field
    // this happens for field errors in the zod schema where the field is created using an array
    // for example notesWhenApplyingEn, notesWhenApplyingFi, notesWhenApplyingSv
    shouldFocusError: false,
    defaultValues: {
      ...convertReservationUnit(reservationUnit),
    },
    resolver: zodResolver(ReservationUnitEditSchema),
  });
  const { reset } = form;
  useEffect(() => {
    if (data?.reservationUnit != null) {
      reset({
        ...convertReservationUnit(data.reservationUnit),
      });
    }
  }, [data, reset]);

  const isNew = unitPk !== 0 && reservationUnitPk === 0;
  if (!isNew && reservationUnitPk === 0) {
    return <Error404 />;
  }
  // the pk is valid but not found in the backend
  if (!isNew && !isLoading && reservationUnit == null) {
    return <Error404 />;
  }

  const cleanPreviewUrlPrefix = props.reservationUnitPreviewUrl.replace(/\/$/, "");

  return (
    <AuthorizationChecker apiUrl={props.apiBaseUrl} permission={UserPermissionChoice.CanManageReservationUnits}>
      <ReservationUnitEditor
        reservationUnit={reservationUnit}
        form={form}
        refetch={refetch}
        previewUrlPrefix={cleanPreviewUrlPrefix}
        unitPk={unitPk}
      />
    </AuthorizationChecker>
  );
}

export async function getServerSideProps({ query, locale }: GetServerSidePropsContext) {
  const reservationUnitPk = toNumber(ignoreMaybeArray(query.pk)) ?? 0;
  const unitPk = toNumber(ignoreMaybeArray(query.id)) ?? 0;

  if (reservationUnitPk <= 0 && unitPk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      unitPk,
      reservationUnitPk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export const RESERVATION_UNIT_EDIT_UNIT_FRAGMENT = gql`
  fragment ReservationUnitEditUnit on UnitNode {
    ...UnitSubpageHead
    spaces {
      id
      pk
      nameFi
      maxPersons
      surfaceArea
      resources {
        id
        pk
        nameFi
        locationType
      }
    }
  }
`;

export const RESERVATION_UNIT_EDIT_QUERY = gql`
  query ReservationUnitEdit($id: ID!) {
    reservationUnit(id: $id) {
      id
      pk
      publishingState
      reservationState
      images {
        pk
        ...Image
      }
      haukiUrl
      cancellationRule {
        id
        pk
      }
      requireReservationHandling
      nameFi
      nameSv
      nameEn
      isDraft
      authentication
      spaces {
        id
        pk
        nameFi
      }
      resources {
        id
        pk
        nameFi
      }
      purposes {
        id
        pk
        nameFi
      }
      pricingTerms {
        id
        pk
      }
      reservationUnitType {
        id
        pk
        nameFi
      }
      extUuid
      requireAdultReservee
      notesWhenApplyingFi
      notesWhenApplyingSv
      notesWhenApplyingEn
      reservationKind
      reservationPendingInstructionsFi
      reservationPendingInstructionsSv
      reservationPendingInstructionsEn
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsSv
      reservationConfirmedInstructionsEn
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsSv
      reservationCancelledInstructionsEn
      maxReservationDuration
      minReservationDuration
      reservationStartInterval
      canApplyFreeOfCharge
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      equipments {
        id
        pk
        nameFi
      }
      unit {
        ...ReservationUnitEditUnit
      }
      minPersons
      maxPersons
      surfaceArea
      descriptionFi
      descriptionSv
      descriptionEn
      paymentTerms {
        id
        pk
      }
      cancellationTerms {
        id
        pk
      }
      serviceSpecificTerms {
        id
        pk
      }
      reservationBlockWholeDay
      bufferTimeBefore
      bufferTimeAfter
      contactInformation
      reservationBeginsAt
      reservationEndsAt
      publishBeginsAt
      publishEndsAt
      maxReservationsPerUser
      metadataSet {
        id
        pk
      }
      pricings {
        pk
        ...PricingFields
        lowestPriceNet
        highestPriceNet
      }
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
      accessTypes(isActiveOrFuture: true) {
        id
        pk
        accessType
        beginDate
      }
    }
  }
`;

export const UPDATE_RESERVATION_UNIT = gql`
  mutation UpdateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
    updateReservationUnit(input: $input) {
      pk
    }
  }
`;

export const CREATE_RESERVATION_UNIT = gql`
  mutation CreateReservationUnit($input: ReservationUnitCreateMutationInput!) {
    createReservationUnit(input: $input) {
      pk
    }
  }
`;

// TODO this allows for a pk input (is it for a change? i.e. not needing to delete and create a new one)
export const CREATE_IMAGE = gql`
  mutation CreateImage($image: Upload!, $reservationUnit: Int!, $imageType: ImageType!) {
    createReservationUnitImage(input: { image: $image, reservationUnit: $reservationUnit, imageType: $imageType }) {
      pk
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation DeleteImage($pk: ID!) {
    deleteReservationUnitImage(input: { pk: $pk }) {
      deleted
    }
  }
`;

export const UPDATE_IMAGE_TYPE = gql`
  mutation UpdateImage($pk: Int!, $imageType: ImageType!) {
    updateReservationUnitImage(input: { pk: $pk, imageType: $imageType }) {
      pk
    }
  }
`;

export const RESERVATION_UNIT_EDITOR_PARAMETERS = gql`
  query ReservationUnitEditorParameters($equipmentsOrderBy: EquipmentOrderingChoices) {
    equipmentsAll(orderBy: [$equipmentsOrderBy]) {
      id
      nameFi
      pk
    }
    taxPercentages {
      edges {
        node {
          id
          pk
          value
        }
      }
    }
    purposes {
      edges {
        node {
          id
          pk
          nameFi
        }
      }
    }
    reservationUnitTypes {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
    termsOfUse {
      edges {
        node {
          id
          pk
          nameFi
          termsType
        }
      }
    }
    reservationUnitCancellationRules {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
    metadataSets {
      edges {
        node {
          id
          name
          pk
        }
      }
    }
  }
`;

export const RESERVATION_UNIT_CREATE_UNIT_QUERY = gql`
  query ReservationUnitCreateUnit($id: ID!) {
    unit(id: $id) {
      id
      pk
      nameFi
      ...ReservationUnitEditUnit
    }
  }
`;
