import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReservationKind,
  type ReservationUnitEditorParametersQuery,
  type ReservationUnitEditPageFragment,
  useCreateImageMutation,
  useCreateReservationUnitMutation,
  useDeleteImageMutation,
  useReservationUnitEditorParametersQuery,
  useReservationUnitEditQuery,
  useReservationUnitCreateUnitQuery,
  useUpdateImageMutation,
  useUpdateReservationUnitMutation,
  EquipmentOrderSet,
  ReservationUnitImageType,
  TermsOfUseTypeChoices,
} from "@gql/gql-types";
import { base64encode, createNodeId, filterNonNullable, toNumber } from "common/src/helpers";
import { CenterSpinner, Flex } from "common/styled";

import { errorToast, successToast } from "common/src/common/toast";
import { useModal } from "@/context/ModalContext";
import Error404 from "@/common/Error404";

import {
  convertReservationUnit,
  type ImageFormType,
  type ReservationUnitEditFormValues,
  ReservationUnitEditSchema,
  transformReservationUnit,
} from "./form";
import { SeasonalSection } from "@/spa/ReservationUnit/edit/components/SeasonalSection";
import { getReservationUnitUrl } from "@/common/urls";
import { ApolloError, gql } from "@apollo/client";
import { DisplayUnit } from "@/spa/ReservationUnit/edit/components/DisplayUnit";
import { breakpoints } from "common/src/const";
import { BottomButtonsStripe } from "@/spa/ReservationUnit/edit/components/BottomButtonsStripe";
import { BasicSection } from "@/spa/ReservationUnit/edit/components/BasicSection";
import { TermsSection } from "@/spa/ReservationUnit/edit/components/TermsSection";
import { DescriptionSection } from "@/spa/ReservationUnit/edit/components/DescriptionSection";
import { OpeningHoursSection } from "@/spa/ReservationUnit/edit/components/OpeningHoursSection";
import { CommunicationSection } from "@/spa/ReservationUnit/edit/components/CommunicationSection";
import { AccessTypeSection } from "@/spa/ReservationUnit/edit/components/AccessTypeSection";
import { ReservationUnitSettingsSection } from "@/spa/ReservationUnit/edit/components/ReservationUnitSettingsSection";
import { PricingSection } from "@/spa/ReservationUnit/edit/components/PricingSection";
import { ErrorInfo } from "@/spa/ReservationUnit/edit/components/ErrorInfo";

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
function makeTermsOptions(parameters: ReservationUnitEditorParametersQuery | undefined, termsType: TermsOfUseTypeChoices) {
  return filterNonNullable(parameters?.allTermsOfUse)
    .filter((tou) => termsType === tou?.termsType)
    .map(({ pk, nameFi }) => {
      return {
        value: pk,
        label: nameFi ?? "",
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
        .filter((image) => image.pk && image.pk > 0)
        .map((image) => delImage({ variables: { pk: image.pk ?? 0 } }));
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
              imageType: image.imageType ?? ReservationUnitImageType.Other,
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
              imageType: image.imageType ?? ReservationUnitImageType.Other,
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
  unitPk,
  form,
  refetch,
  previewUrlPrefix,
}: {
  reservationUnit: ReservationUnitEditPageFragment | null;
  unitPk: number;
  form: UseFormReturn<ReservationUnitEditFormValues>;
  refetch: () => void;
  previewUrlPrefix: string;
}): JSX.Element | null {
  // ----------------------------- State and Hooks ----------------------------
  const { t } = useTranslation();
  const history = useNavigate();
  const { setModalContent } = useModal();
  const [reconcileImageChanges] = useImageMutations();

  const [updateMutation] = useUpdateReservationUnitMutation();
  const [createMutation] = useCreateReservationUnitMutation();

  const { data: parametersData } = useReservationUnitEditorParametersQuery({
    onError: (_) => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
    variables: {
      equipmentsOrderBy: EquipmentOrderSet.CategoryRankAsc,
    },
  });

  // Fetch unit data only when creating a new reservation unit
  const { data: unitData } = useReservationUnitCreateUnitQuery({
    variables: { id: base64encode(`UnitNode:${unitPk}`) },
    fetchPolicy: "network-only",
    skip: !!reservationUnit?.unit,
  });
  const unit = reservationUnit?.unit ?? (unitData?.node != null && "pk" in unitData.node ? unitData.node : null);
    // reservationUnit?.node != null && "pk" in reservationUnit.node ? reservationUnit.node.unit : null;
  // unit ?? unitData?.unit;

  // ----------------------------- Constants ---------------------------------

  const taxPercentageOptions = parametersData?.allTaxPercentages.map(
    (n) => ({
      value: Number(n.value),
      pk: n.pk ?? -1,
      label: n.value,
    })
  ) ?? [];
  const pricingTermsOptions = makeTermsOptions(parametersData, TermsOfUseTypeChoices.PricingTerms);

  const serviceSpecificTermsOptions = makeTermsOptions(parametersData, TermsOfUseTypeChoices.ServiceTerms);
  const paymentTermsOptions = makeTermsOptions(parametersData, TermsOfUseTypeChoices.PaymentTerms);
  const cancellationTermsOptions = makeTermsOptions(parametersData, TermsOfUseTypeChoices.CancellationTerms);

  const metadataOptions = filterNonNullable(parametersData?.allMetadataSets).map((n) => ({
    value: n.pk,
    label: n.name,
  }));
  const cancellationRuleOptions = filterNonNullable(parametersData?.allReservationCancelReasons).map((n) => ({
    value: n.value,
    label: n.reasonFi,
  }));
  const equipmentOptions = filterNonNullable(parametersData?.allEquipments).map((n) => ({
    value: n.pk,
    label: n.nameFi ?? "no-name",
  }));

  const purposeOptions = filterNonNullable(parametersData?.allPurposes).map((n) => ({
    value: n.pk,
    label: n.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = filterNonNullable(parametersData?.allReservationUnitTypes).map((n) => ({
    value: n.pk,
    label: n.nameFi ?? "no-name",
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
          history(getReservationUnitUrl(upPk, unitPk));
        }
        const tkey =
          formValues.pk === 0
            ? "ReservationUnitEditor.reservationUnitCreatedNotification"
            : "ReservationUnitEditor.reservationUnitUpdatedNotification";
        successToast({ text: t(tkey, { name: getValues("nameFi") }) });
      } else {
        const msg = t("ReservationUnitEditor.imageSaveFailed");
        throw new Error(msg);
      }
    } else if (upPk == null) {
      const msg = t("ReservationUnitEditor.saveFailed", { error: "" });
      throw new Error(msg);
    }
    refetch();
    return upPk;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StyledContainerMedium>
        <DisplayUnit
          heading={reservationUnit?.nameFi ?? t("ReservationUnitEditor.defaultHeading")}
          unit={unit}
          reservationState={reservationUnit?.reservationState}
          unitState={reservationUnit?.publishingState}
        />
        <ErrorInfo form={form} />
        <BasicSection form={form} spaces={unit?.spaces ?? []} />
        <DescriptionSection
          form={form}
          equipmentOptions={equipmentOptions}
          purposeOptions={purposeOptions}
          reservationUnitTypeOptions={reservationUnitTypeOptions}
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

type IRouterProps = {
  reservationUnitPk?: string;
  unitPk: string;
};

/// Wrap the editor so we never reset the form after async loading (because of HDS TimeInput bug)
function EditorWrapper({ previewUrlPrefix }: { previewUrlPrefix: string }) {
  const { reservationUnitPk, unitPk: unitPkString } = useParams<IRouterProps>();

  const typename = "ReservationUnitNode";
  const id = createNodeId(typename, toNumber(reservationUnitPk) ?? 0);
  const {
    data,
    loading: isLoading,
    refetch,
  } = useReservationUnitEditQuery({
    variables: { id },
    skip: !reservationUnitPk || Number(reservationUnitPk) === 0 || Number.isNaN(Number(reservationUnitPk)),
  });

  const reservationUnit = data?.node != null && "pk" in data.node ? data.node : null;

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
    if (reservationUnit != null) {
      reset({
        ...convertReservationUnit(reservationUnit),
      });
    }
  }, [reservationUnit, reset]);

  if (isLoading) {
    return <CenterSpinner />;
  }

  const unitPk = Number(unitPkString);
  if (!(unitPk > 0)) {
    return <Error404 />;
  }

  // we use null for "new" units (could also be "new" slug)
  const isNew = reservationUnitPk == null;
  // TODO the unitPk should be removed from the url, not needed since the reservationUnitPk is unique
  // without this we'd move the reservation unit to another unit on save
  if (!isNew && reservationUnit?.unit?.pk !== Number(unitPk)) {
    return <Error404 />;
  }
  if (!isNew && Number.isNaN(Number(reservationUnitPk))) {
    return <Error404 />;
  }
  // the pk is valid but not found in the backend
  if (!isNew && reservationUnit == null) {
    return <Error404 />;
  }

  const cleanPreviewUrlPrefix = previewUrlPrefix.replace(/\/$/, "");

  return (
    <ReservationUnitEditor
      reservationUnit={reservationUnit}
      form={form}
      unitPk={unitPk}
      refetch={refetch}
      previewUrlPrefix={cleanPreviewUrlPrefix}
    />
  );
}

export default EditorWrapper;

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

export const RESERVATION_UNIT_EDIT_QUERY_FRAGMENT = gql`
  fragment ReservationUnitEditPage on ReservationUnitNode {
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
    accessTypes(filter: { isActiveOrFuture: true }) {
      id
      pk
      accessType
      beginDate
    }
  }
`;

export const RESERVATION_UNIT_EDIT_QUERY = gql`
  query ReservationUnitEdit($id: ID!) {
    node(id: $id) {
      ... on ReservationUnitNode {
        ...ReservationUnitEditPage
      }
    }
  }
`;

export const UPDATE_RESERVATION_UNIT = gql`
  mutation UpdateReservationUnit($input: ReservationUnitUpdateMutation!) {
    updateReservationUnit(input: $input) {
      pk
    }
  }
`;

export const CREATE_RESERVATION_UNIT = gql`
  mutation CreateReservationUnit($input: ReservationUnitCreateMutation!) {
    createReservationUnit(input: $input) {
      pk
    }
  }
`;

// TODO this allows for a pk input (is it for a change? i.e. not needing to delete and create a new one)
export const CREATE_IMAGE = gql`
  mutation CreateImage($image: Image!, $reservationUnit: Int!, $imageType: ReservationUnitImageType!) {
    createReservationUnitImage(input: { image: $image, reservationUnit: $reservationUnit, imageType: $imageType }) {
      pk
    }
  }
`;

export const DELETE_IMAGE = gql`
  mutation DeleteImage($pk: Int!) {
    deleteReservationUnitImage(input: { pk: $pk }) {
      pk
    }
  }
`;

export const UPDATE_IMAGE_TYPE = gql`
  mutation UpdateImage($pk: Int!, $imageType: ReservationUnitImageType!) {
    updateReservationUnitImage(input: { pk: $pk, imageType: $imageType }) {
      pk
    }
  }
`;

export const RESERVATION_UNIT_EDITOR_PARAMETERS = gql`
  query ReservationUnitEditorParameters($equipmentsOrderBy: EquipmentOrderSet!) {
    allEquipments(orderBy: [$equipmentsOrderBy]) {
      id
      nameFi
      pk
    }
    allTaxPercentages {
      id
      pk
      value
    }
    allPurposes {
      id
      pk
      nameFi
    }
    allReservationUnitTypes {
      id
      nameFi
      pk
    }
    allTermsOfUse {
      id
      pk
      nameFi
      termsType
    }
    allReservationCancelReasons {
      value
      reasonFi
    }
    allMetadataSets {
      id
      name
      pk
    }
  }
`;

export const RESERVATION_UNIT_CREATE_UNIT_QUERY = gql`
  query ReservationUnitCreateUnit($id: ID!) {
    node(id: $id) {
      ... on UnitNode {
      id
      pk
      nameFi
      ...ReservationUnitEditUnit
    }
}
  }
`;
