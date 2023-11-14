import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  IconAlertCircleFill,
  IconArrowLeft,
  IconLinkExternal,
  NumberInput,
  RadioButton,
  Select,
  SelectionGroup,
  TextArea,
  TextInput,
  Tooltip,
} from "hds-react";
import { H1, Strong } from "common/src/common/typography";
import i18next from "i18next";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { Controller, UseFormReturn, useForm } from "react-hook-form";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitByPkArgs,
  ReservationUnitCreateMutationInput,
  ReservationUnitUpdateMutationInput,
  Mutation,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitImageCreateMutationInput,
  ReservationUnitsReservationUnitAuthenticationChoices,
  UnitByPkType,
  ReservationState,
  ReservationUnitState,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitPricingStatusChoices,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { H4 } from "common/src/common/typography";
import { breakpoints } from "common";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { previewUrlPrefix, publicUrl } from "@/common/const";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "@/common/queries";
import {
  Container,
  DenseVerticalFlex,
  Grid,
  HorisontalFlex,
  Span12,
  Span6,
  Span4 as DefaultSpan4,
} from "@/styles/layout";
import Loader from "@/component/Loader";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/context/ModalContext";
import { parseAddress } from "@/common/util";
import { Accordion } from '@/component/Accordion';
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { setTimeOnDate } from "@/component/reservations/utils";
import {
  CREATE_IMAGE,
  CREATE_RESERVATION_UNIT,
  DELETE_IMAGE,
  RESERVATIONUNIT_QUERY,
  RESERVATION_UNIT_EDITOR_PARAMETERS,
  UPDATE_IMAGE_TYPE,
  UPDATE_RESERVATION_UNIT,
} from "./queries";
import ArchiveDialog from "./ArchiveDialog";
import { ReservationStateTag, ReservationUnitStateTag } from "./tags";
import { DateTimeInput } from "./DateTimeInput";
import ActivationGroup from "./ActivationGroup";
import ImageEditor from "./ImageEditor";
import { Image } from "./types";
import PricingType from "./PricingType";
import GenericDialog from "./GenericDialog";
import { ReservationUnitEditFormValues, ReservationUnitEditSchema, convert } from "./form";
import Error404 from "@/common/Error404";
import { zodResolver } from "@hookform/resolvers/zod";

const RichTextInput = dynamic(() => import("../../RichTextInput"), {
  ssr: false,
});

const Wrapper = styled.div`
  padding-bottom: 6em;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: var(--spacing-m);
    flex-direction: column;
  @media (width > ${breakpoints.s}) {
    flex-direction: row;
  }
`;

const Span4 = styled(DefaultSpan4)`
  label {
    white-space: nowrap;
  }
`;

const SlimH4 = styled(H4)`
  margin: 0;
`;

const ArchiveButton = styled(Button)`
  margin-top: var(--spacing-m);
`;

const ExpandLink = styled(Accordion)`
  border-bottom: none !important;

  > div:nth-of-type(1) > div {
    display: flex;
    flex-direction: row;
    > div {
      font-size: var(--fontsize-heading-xxs);
      font-family: var(--tilavaraus-admin-font-medium);
      font-weight: normal;
      color: var(--color-bus);
      line-height: 1.5;
    }
    svg {
      margin: 0;
      color: var(--color-bus);
    }
  }
`;

const Preview = styled.a<{ disabled: boolean }>`
  display: flex;
  place-items: center;
  border-color: var(--color-white) !important;
  border: 2px solid;
  background-color: var(--color-bus-dark);
  text-decoration: none;
  &:hover {
    background-color: var(--color-bus-dark);
  }
  ${({ disabled }) =>
    disabled
      ? `
    cursor: not-allowed;
    color: var(--color-white);
    &:hover {
      background-color: var(--color-bus-dark);
      }  `
      : `
      color: var(--color-white);
    cursor: pointer;
    &:hover {
      background-color: var(--color-white);
      color: var(--color-black);
      }

  `}
  > span {
    margin: 0 var(--spacing-m);
  }
`;

const ButtonsStripe = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  justify-content: space-between;
  right: 0;
  display: flex;
  padding: var(--spacing-s);
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);
`;

// Point of this is to have lighter colour buttons on dark background (inverted colours)
const WhiteButton = styled(Button)<{
  disabled?: boolean;
  variant: "secondary" | "primary" | "supplementary";
}>`
  --bg: var(--color-white);
  --fg: var(--color-black);
  --hbg: var(--fg);
  --hfg: var(--bg);
  --border-color: var(--color-white);

  ${({ variant }) => {
    switch (variant) {
      case "secondary":
        return `--fg: var(--color-white);
      --bg: var(--color-bus-dark);`;
      case "supplementary":
        return `--fg: var(--color-white);
        --bg: var(--color-bus-dark);
        --border-color: transparent;`;
      default:
        return "";
    }
  }}

  ${({ disabled }) =>
    disabled
      ? `--hbg: var(--bg);
        --hfg: var(--fg);
      `
      : null}

  height: 52px;
  border: 2px var(--border-color) solid !important;

  color: var(--fg) !important;
  background-color: var(--bg) !important;

  &:hover {
    color: var(--hfg) !important;
    background-color: var(--hbg) !important;
  }
  margin: 0;
`;

const TitleSectionWithTags = styled.div`
  display: flex;
  flex-flow: row wrap;
  gap: var(--spacing-m);
  justify-content: space-between;
  align-items: center;
  margin: var(--spacing-s) 0 var(--spacing-m);
  & > h1 {
    margin: 0;
  }
`;

const TagContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-m);
`;

const bufferTimeOptions = [
  { value: 900, label: "15 minuuttia" },
  { value: 1800, label: "30 minuuttia" },
  { value: 3600, label: "60 minuuttia" },
  { value: 5400, label: "90 minuuttia" },
];

const reservationsMaxDaysBeforeOptions = [
  { value: 14, label: "2 vko" },
  { value: 30, label: "1 kk" },
  { value: 60, label: "2 kk" },
  { value: 90, label: "3 kk" },
  { value: 182, label: "6 kk" },
  { value: 365, label: "12 kk" },
  { value: 730, label: "24 kk" },
];

const durationOptions = [
  { value: 900, label: "15 minuuttia" },
  { value: 1800, label: "30 minuuttia" },
  { value: 3600, label: "60 minuuttia" },
  { value: 5400, label: "90 minuuttia" },
].concat(
  Array.from({ length: (23 - 2) * 2 + 1 })
    .map((_v, i) => 3600 * 2 + i * 1800)
    .map((v) => ({
      value: v,
      label: i18next.t("ReservationUnitEditor.durationHours", {
        hours: (v / 3600).toLocaleString("fi"),
      }),
    }))
);

// Terms PK is not a number but any valid string
const makeTermsOptions = (
  parameters: Query | undefined,
  termsType: TermsOfUseTermsOfUseTermsTypeChoices,
) => {
  const options = (parameters?.termsOfUse?.edges || [])
    .filter((tou) => {
      return termsType === tou?.node?.termsType;
    })
    .map((tou) => {
      return {
        value: tou?.node?.pk ?? "",
        label: tou?.node?.nameFi ?? "no-name",
      };
    })

  return [...options];
};

const FieldGroup = ({
  children,
  id,
  heading,
  tooltip = "",
}: {
  heading: string;
  tooltip?: string;
  id?: string;
  children?: React.ReactNode;
}): JSX.Element => (
  <HorisontalFlex
    style={{
      justifyContent: "space-between",
      width: "100%",
    }}
  >
    <span>
      <Strong style={{ display: "block", paddingBottom: "var(--spacing-xs)" }}>
        {heading}
      </Strong>
      {id ? <span id={id} /> : null}
      {children}
    </span>
    <Tooltip>{tooltip}</Tooltip>
  </HorisontalFlex>
);

const DiscardChangesDialog = ({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("DiscardReservationUnitChangesDialog.description")}
      title={t("DiscardReservationUnitChangesDialog.title")}
      acceptLabel={t("DiscardReservationUnitChangesDialog.discard")}
    />
  );
};

const DisplayUnit = ({
  heading,
  unit,
  unitState,
  reservationState,
}: {
  heading: string;
  unit?: UnitByPkType;
  unitState?: ReservationUnitState;
  reservationState?: ReservationState;
}) => {
  if (!unit) {
    return null;
  }

  return (
    <div>
      <TitleSectionWithTags>
        <H1 $legacy>{heading}</H1>
        <TagContainer>
          {reservationState !== undefined && (
            <ReservationStateTag state={reservationState} />
          )}
          {unitState !== undefined && (
            <ReservationUnitStateTag state={unitState} />
          )}
        </TagContainer>
      </TitleSectionWithTags>
      <div style={{ lineHeight: "24px", fontSize: "var(--fontsize-heading-s)" }}>
        <div>
          <Strong>{unit.nameFi}</Strong>
        </div>
        {unit.location ? <span>{parseAddress(unit.location)}</span> : null}
      </div>
      {unit.location ? <span>{parseAddress(unit.location)}</span> : null}
    </div>
  );
};

const useImageMutations = () => {
  const [createImage] = useMutation<
    Mutation,
    ReservationUnitImageCreateMutationInput
  >(CREATE_IMAGE);

  const [delImage] = useMutation<Mutation>(DELETE_IMAGE);
  const [updateImagetype] = useMutation<Mutation>(UPDATE_IMAGE_TYPE);

  const reconcileImageChanges = async (resUnitPk: number, images: Image[]): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = images
        .filter((image) => image.deleted)
        .map((image) =>
          delImage({ variables: { pk: image.pk, } })
        );
      // TODO getting error: "No permissions to perform delete."
      // here locally
      const res = await Promise.all(deletePromises);
      const hasErrors = res.map((single) => single?.data?.createReservationUnitImage?.errors).filter((e) => e != null).length > 0
      if (hasErrors) {
        return false;
      }
    } catch (e) {
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
              reservationUnitPk: resUnitPk,
              imageType: image.imageType as string,
            },
          })
        );

      const res = await Promise.all(addPromises);
      const hasErrors = res.map((single) => single?.data?.createReservationUnitImage?.errors).filter((e) => e != null).length > 0
      if (hasErrors) {
        return false;
      }
    } catch (e) {
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
              pk: image.pk,
              imageType: image.imageType,
            },
          });
        });

      const res = await Promise.all(changeTypePromises);
      const hasErrors = res.map((single) => single?.data?.createReservationUnitImage?.errors).filter((e) => e != null).length > 0
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  };

  return [reconcileImageChanges];
};

const constructApiDate = (date: string, time: string) => {
  if (date === "" || time === "") {
    return null;
  }
  const d = fromUIDate(date);
  const d2 = setTimeOnDate(d, time);
  return d2.toISOString();
}

const ReservationUnitEditor = ({
  reservationUnit,
  unitPk,
  form,
  refetch,
}: {
  reservationUnit?: ReservationUnitByPkType;
  unitPk: string;
  form: UseFormReturn<ReservationUnitEditFormValues>;
  refetch: () => void;
}): JSX.Element | null => {
  const { t } = useTranslation();
  const history = useNavigate();
  const { notifySuccess, notifyError } = useNotification();


  const [updateReservationUnitMutation] = useMutation<Mutation>(
    UPDATE_RESERVATION_UNIT
  );

  const updateReservationUnit = (input: ReservationUnitUpdateMutationInput) =>
    updateReservationUnitMutation({ variables: { input } });

  const [createReservationUnitMutation] = useMutation<Mutation>(
    CREATE_RESERVATION_UNIT
  );

  const createReservationUnit = (input: ReservationUnitCreateMutationInput) =>
    createReservationUnitMutation({ variables: { input } });

  const { control, register, getValues, setValue, watch, formState, handleSubmit } = form;
  const { isDirty, isSubmitting, errors } = formState;

  const transformReservationUnit = (values: ReservationUnitEditFormValues): ReservationUnitUpdateMutationInput | ReservationUnitCreateMutationInput => {
    const {
      pk,
      isDraft,
      isArchived,
      surfaceArea,
      reservationEndsDate,
      reservationEndsTime,
      reservationBeginsDate,
      reservationBeginsTime,
      publishBeginsDate,
      publishBeginsTime,
      publishEndsDate,
      publishEndsTime,
      pricings,
      hasFuturePricing,
      termsOfUseEn,
      termsOfUseFi,
      termsOfUseSv,
      ...vals
    } = values;

    return {
      ...vals,
      ...(pk ? { pk } : {}),
      surfaceArea: surfaceArea != null && surfaceArea > 0 ? Math.ceil(surfaceArea) : null,
      reservationEnds: constructApiDate(reservationEndsDate, reservationEndsTime),
      reservationBegins: constructApiDate(reservationBeginsDate, reservationBeginsTime),
      publishBegins: constructApiDate(publishBeginsDate, publishBeginsTime),
      publishEnds: constructApiDate(publishEndsDate, publishEndsTime),
      isDraft,
      isArchived,
      termsOfUseEn: termsOfUseEn !== "" ? termsOfUseEn : null,
      termsOfUseFi: termsOfUseFi !== "" ? termsOfUseFi : null,
      termsOfUseSv: termsOfUseSv !== "" ? termsOfUseSv : null,
      pricings: filterNonNullable(pricings).filter((p) => hasFuturePricing || p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active).map((p) => ({
        begins: toApiDate(fromUIDate(p.begins)) ?? "",
        highestPrice: p.highestPrice,
        highestPriceNet: p.highestPriceNet,
        lowestPrice: p.lowestPrice,
        lowestPriceNet: p.lowestPriceNet,
        ...(p.pk != 0 ? { pk: p.pk } : {}),
        priceUnit: p.priceUnit,
        pricingType: p.pricingType,
        status: p.status,
        taxPercentagePk: p.taxPercentage.pk,
      })),
    }
  }

  console.log('errors: ', errors);

  const onSubmit = async (formValues: ReservationUnitEditFormValues) => {
    const input = transformReservationUnit(formValues);
    // FIXME only one active price can be saved
    // FIXME we need to refetch the reservation unit after save if pricing is saved with a new pricing (pk == 0) then
    // all subsequent saves will fail (or create new pricing) because the pk is not updated in the form

    try {
      const promise = "pk" in input ? updateReservationUnit(input) : createReservationUnit(input);
      const { data, errors } = await promise;
        // = await mutation({ ...input });
      if (errors != null) {
        notifyError(t("ReservationUnitEditor.saveFailed", { error: errors }));
        return undefined;
      }

      if (data?.updateReservationUnit?.errors) {
        notifyError(t("ReservationUnitEditor.saveFailed", { error: data?.updateReservationUnit?.errors }));
        return undefined;
      }

      if (data?.createReservationUnit?.errors) {
        notifyError(t("ReservationUnitEditor.saveFailed", { error: data?.createReservationUnit?.errors }));
        return undefined;
      }

      const pk = data?.updateReservationUnit?.pk ?? data?.createReservationUnit?.pk;

      if (pk) {
        console.log('update images for pk', pk);
        // res unit is saved, we can save changes to images
        const success = await reconcileImageChanges(pk, images);
        if (success) {
          // TODO should we refetch? if we stay on the page? maybe but the reset of form isn't working atm
          // NOTE redirect if new one was created
          if (formValues.pk === 0 && pk > 0) {
            history(`/unit/${unitPk}/reservationUnit/edit/${pk}`);
          }
          const tkey = formValues.pk === 0 ? "ReservationUnitEditor.reservationUnitUpdatedNotification" : "ReservationUnitEditor.reservationUnitCreatedNotification"
          notifySuccess(t(tkey, { name: getValues('nameFi') }));
        } else {
          // FIXME error
          notifyError("failed to save images");
          return undefined;
        }
      } else {
        // FIXME error
        notifyError("ei tullut pk");
        return undefined;
      }

      // TODO draft / archive / publish
      notifySuccess(t("ReservationUnitEditor.saveSuccess"));
      refetch();
      return pk;

    } catch (error) {
      notifyError(t("ReservationUnitEditor.saveFailed", { error }));
    }
    return undefined;
  }

  const { data: unitResourcesData } = useQuery<Query, QueryUnitByPkArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    skip: !unitPk,
    variables: { pk: Number(unitPk) },
    onError: (e) => {
      console.error(e);
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const { data: parametersData } = useQuery<Query>(RESERVATION_UNIT_EDITOR_PARAMETERS, {
    onError: (e) => {
      console.error(e);
      notifyError(t("errors.errorFetchingData"));
    },
  });

  const equipmentOptions = filterNonNullable(parametersData?.equipments?.edges?.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const purposeOptions = filterNonNullable(parametersData?.purposes?.edges?.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const qualifierOptions = filterNonNullable(parametersData?.qualifiers?.edges?.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = filterNonNullable(parametersData?.reservationUnitTypes?.edges?.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const paymentTermsOptions = makeTermsOptions(parametersData, TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms);
  const pricingTermsOptions = makeTermsOptions(parametersData, TermsOfUseTermsOfUseTermsTypeChoices.PricingTerms);
  const taxPercentageOptions = filterNonNullable(parametersData?.taxPercentages?.edges.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.value.toString(),
  }));
  const serviceSpecificTermsOptions = makeTermsOptions(parametersData, TermsOfUseTermsOfUseTermsTypeChoices.ServiceTerms)
  const cancellationTermsOptions = makeTermsOptions(parametersData, TermsOfUseTermsOfUseTermsTypeChoices.CancellationTerms)
  const cancellationRuleOptions = filterNonNullable(parametersData?.reservationUnitCancellationRules?.edges.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const metadataOptions = filterNonNullable(parametersData?.metadataSets?.edges.map((e) => e?.node)).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.name ?? "no-name",
  }));

  const [reconcileImageChanges] = useImageMutations();
  const { setModalContent } = useModal();

  // TODO should the images be inside the form state?
  const [images, setImages] = useState<Image[]>(reservationUnit?.images ?? [])
  const handleImageChange = (images: Image[]) => {
    setImages(images)
  }

  const isFuturePriceVisible = watch('hasFuturePricing');
  const isPaid = watch('pricings')
    .filter((p) => p?.pricingType === "PAID")
    .filter((p) => p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active || isFuturePriceVisible)
    .length > 0;

  const unit = unitResourcesData?.unitByPk ?? undefined;
  const spaces = filterNonNullable(unit?.spaces);
  const spaceOptions = spaces.map((s) => ({
    label: String(s?.nameFi),
    value: Number(s?.pk),
  }));

  const resourceOptions = filterNonNullable(spaces.flatMap((s) => s?.resources))
    .map((r) => ({ label: String(r?.nameFi), value: Number(r?.pk) }));

  // FIXME this isn't working
  // the space has 12 m^2 space but when it's selected it doesn't update the surface area only if it's saved and reloaded
  const selectedSpaces = spaces.filter((s) => s.pk != null && watch("spacePks").includes((s.pk)));

  // default is 1 if no spaces selected
  const minSurfaceArea = Math.ceil(selectedSpaces.map((s) => s.surfaceArea ?? 0).reduce((a, x) => a + x, 0) || 1);

   // default is 20 if no spaces selected
  const maxPersons = Math.ceil(selectedSpaces.map((s) => s.maxPersons ?? 0).reduce((a, x) => a + x, 0) || 20);

  const isDirect = watch('reservationKind') === "DIRECT" || watch('reservationKind') === "DIRECT_AND_SEASON";

  // Have to define these like this because otherwise the state changes don't work
  // TODO this seems to not publish (at least the Tag on the page says draft after this, even after refresh)
  const handlePublish = async () => {
    setValue("isDraft", false);
    setValue("isArchived", false);
    await handleSubmit(onSubmit)();
  }

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    await handleSubmit(onSubmit)();
  }

  const handleAcceptArchive = async () => {
    setValue("isArchived", true);
    try {
    await handleSubmit(onSubmit)();
      setModalContent(null);
      notifySuccess(t("ArchiveReservationUnitDialog.success"));
      history(`/unit/${unit?.pk}`);
    } catch (e) {
      console.warn('unable to archive', e);
    }
  };

  const handleArchiveButtonClick = async () => {
    if (reservationUnit != null) {
      setModalContent(
        <ArchiveDialog
          reservationUnit={reservationUnit}
          onAccept={handleAcceptArchive}
          onClose={() => setModalContent(null)}
        />,
        true
      );
    }
  };

  const reservationStartIntervalOptions = Object.values(ReservationUnitsReservationUnitReservationStartIntervalChoices).map((choice) => ({
    value: choice,
    label: t(`reservationStartInterval.${choice}`),
  }))

  const authenticationOptions = Object.values(ReservationUnitsReservationUnitAuthenticationChoices).map((choice) => ({
    value: choice,
    label: t(`authentication.${choice}`),
  }))

  const isSaving = isSubmitting;
  const hasChanges = isDirty;

  // TODO cleanup the grid -> span12 / span6 things -> component
  //  - instead use automatic grid
  //  - directly adjust the column span in the component (span full, span 1)
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Container>
        <DisplayUnit
          heading={reservationUnit?.nameFi ?? t("ReservationUnitEditor.defaultHeading")}
          unit={unit}
          reservationState={reservationUnit?.reservationState ?? undefined}
          unitState={reservationUnit?.state ?? undefined}
        />
        <div>
          <Accordion
            initiallyOpen
            heading={t("ReservationUnitEditor.basicInformation")}
          >
            <Grid>
              <Span12>
                <FieldGroup
                  id="reservationKind"
                  heading={t("ReservationUnitEditor.label.reservationKind")}
                  tooltip={t("ReservationUnitEditor.tooltip.reservationKind")}
                >
                  {errors["reservationKind"]?.message != null && (
                    <div>
                      <IconAlertCircleFill />
                      <span>{errors["reservationKind"].message}</span>
                    </div>
                  )}
                  <Grid>
                    {(["DIRECT_AND_SEASON", "DIRECT", "SEASON"] as const).map((kind) => (
                      <Span4 key={kind}>
                        <Controller
                          control={control}
                          name="reservationKind"
                          render={({ field }) => (
                          <RadioButton
                            {...field}
                            id={`reservationKind.${kind}`}
                            name="reservationKind"
                            label={t(`ReservationUnitEditor.label.reservationKinds.${kind}`)}
                            onChange={() => field.onChange(kind)}
                            checked={field.value === kind}
                          />
                          )}
                        />
                      </Span4>
                    ))}
                  </Grid>
                </FieldGroup>
              </Span12>
              {(['nameFi', 'nameEn', 'nameSv'] as const).map((fieldName) => (
                <Span12 key={fieldName}>
                  <TextInput
                    {...register(fieldName, { required: true })}
                    required
                    id={fieldName}
                    label={t(`ReservationUnitEditor.label.${fieldName}`)}
                    errorText={errors[fieldName]?.message}
                    invalid={errors[fieldName]?.message != null}
                    // tooltipText={ lang === "fi" ? t("ReservationUnitEditor.tooltip.nameFi") : undefined }
                  />
                </Span12>
              ))}
              <Span6>
                <Controller
                  control={control}
                  name="spacePks"
                  render={({ field: { value, onChange } }) => (
                    // @ts-ignore -- fuck HDS
                  <Select<{ label: string; value: number }>
                    id="spacePks"
                    multiselect
                    required
                    label={t("ReservationUnitEditor.label.spacePks")}
                    placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
                    options={spaceOptions}
                    disabled={spaceOptions.length === 0}
                    onChange={(x) => onChange(x.map((y: { value: number; label: string }) => y.value))}
                    value={spaceOptions.filter((x) => value.includes(x.value))}
                    error={errors["spacePks"]?.message}
                    invalid={errors["spacePks"]?.message != null}
                    tooltipText={t("ReservationUnitEditor.tooltip.spacePks")}
                  />
                )}
              />
              </Span6>
              <Span6>
                <Controller
                  control={control}
                  name="resourcePks"
                  render={({ field: { value, onChange } }) => (
                    // @ts-ignore -- fuck HDS
                    <Select<{ label: string; value: number }>
                      id="resourcePks"
                      multiselect
                      label={t("ReservationUnitEditor.label.resourcePks")}
                      placeholder={t("ReservationUnitEditor.resourcesPlaceholder")}
                      options={resourceOptions}
                      disabled={resourceOptions.length === 0}
                      onChange={(x) => onChange(x.map((y: { value: number; label: string }) => y.value))}
                      value={resourceOptions.filter((x) => value.includes(x.value))}
                      error={errors["resourcePks"]?.message}
                      invalid={errors["resourcePks"]?.message != null}
                      tooltipText={t("ReservationUnitEditor.tooltip.resourcePks")}
                    />
                  )}
                />
              </Span6>
              <Span4>
                <NumberInput
                  {...register("surfaceArea", { required: true, valueAsNumber: true })}
                  // value={Math.ceil(state.reservationUnitEdit.surfaceArea || 0)}
                  id="surfaceArea"
                  label={t("ReservationUnitEditor.label.surfaceArea")}
                  helperText={t("ReservationUnitEditor.surfaceAreaHelperText")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  step={1}
                  type="number"
                  min={minSurfaceArea}
                  max={undefined}
                  required
                  errorText={errors["surfaceArea"]?.message}
                  invalid={errors["surfaceArea"]?.message != null}
                  tooltipText={t("ReservationUnitEditor.tooltip.surfaceArea")}
                />
              </Span4>
              <Span4>
                <NumberInput
                  {...register("maxPersons", { required: true, valueAsNumber: true })}
                  id="maxPersons"
                  label={t("ReservationUnitEditor.label.maxPersons")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  step={1}
                  type="number"
                  min={1}
                  max={maxPersons}
                  helperText={t("ReservationUnitEditor.maxPersonsHelperText")}
                  errorText={errors["maxPersons"]?.message}
                  invalid={errors["maxPersons"]?.message != null}
                  required
                  tooltipText={t("ReservationUnitEditor.tooltip.maxPersons")}
                />
              </Span4>
              <Span4>
                <NumberInput
                  {...register("minPersons", { required: true, valueAsNumber: true })}
                  id="minPersons"
                  label={t("ReservationUnitEditor.label.minPersons")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  step={1}
                  type="number"
                  min={0}
                  max={watch('maxPersons') || 1}
                  errorText={errors["minPersons"]?.message}
                  invalid={errors["minPersons"]?.message != null}
                  tooltipText={t("ReservationUnitEditor.tooltip.minPersons")}
                />
              </Span4>
            </Grid>
          </Accordion>
          <Accordion
            initiallyOpen={Object.keys(errors).length > 0}
            heading={t("ReservationUnitEditor.typesProperties")}
          >
            <Grid>
              <Span6>
                {/* TODO what is the difference between Select and SortedSelected? */}
                <Controller
                  control={control}
                  name="reservationUnitTypePk"
                  render={({ field: { value, onChange } }) => (
                  <Select
                    // sort
                    required
                    id="reservationUnitTypePk"
                    label={t(`ReservationUnitEditor.label.reservationUnitTypePk`)}
                    placeholder={t(`ReservationUnitEditor.reservationUnitTypePlaceholder`)}
                    options={reservationUnitTypeOptions}
                    onChange={(x: { value: number; label: string }) => onChange(x.value) }
                    value={spaceOptions.find((x) => x.value === value) ?? null}
                    helper={t("ReservationUnitEditor.reservationUnitTypeHelperText")}
                    error={errors["reservationUnitTypePk"]?.message}
                    invalid={errors["reservationUnitTypePk"]?.message != null}
                    tooltipText={t("ReservationUnitEditor.tooltip.reservationUnitTypePk")}
                  />
                  )}
                />
              </Span6>
              <Span6>
                <Controller
                  control={control}
                  name="purposePks"
                  render={({ field: { value, onChange } }) => (
                    /* @ts-ignore -- fuck HDS */
                    <Select<{ label: string; value: number }>
                      // sort
                      multiselect
                      label={t("ReservationUnitEditor.purposesLabel")}
                      placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
                      options={purposeOptions}
                      disabled={purposeOptions.length === 0}
                      onChange={(x) => onChange(x.map((y: { value: number; label: string }) => y.value))}
                      value={purposeOptions.filter((x) => value.includes(x.value))}
                      tooltipText={t("ReservationUnitEditor.tooltip.purposes")}
                    />
                  )}
                />
              </Span6>
              <Span6>
                <Controller
                  control={control}
                  name="equipmentPks"
                  render={({ field: { value, onChange } }) => (
                    /* @ts-ignore -- fuck HDS */
                    <Select<{ label: string; value: number }>
                      // sort
                      multiselect
                      label={t("ReservationUnitEditor.equipmentsLabel")}
                      placeholder={t("ReservationUnitEditor.equipmentsPlaceholder")}
                      options={equipmentOptions}
                      disabled={equipmentOptions.length === 0}
                      onChange={(x) => onChange(x.map((y: { value: number; label: string }) => y.value))}
                      value={equipmentOptions.filter((x) => value.includes(x.value))}
                      tooltipText={t("ReservationUnitEditor.tooltip.equipments")}
                    />
                  )}
                />
              </Span6>
              <Span6>
                <Controller
                  control={control}
                  name="qualifierPks"
                  render={({ field: { value, onChange } }) => (
                    /* @ts-ignore -- fuck HDS */
                    <Select<{ label: string; value: number }>
                      // sort
                      multiselect
                      label={t("ReservationUnitEditor.qualifiersLabel")}
                      placeholder={t("ReservationUnitEditor.qualifiersPlaceholder")}
                      options={qualifierOptions}
                      disabled={qualifierOptions.length === 0}
                      onChange={(x) => onChange(x.map((y: { value: number; label: string }) => y.value))}
                      value={qualifierOptions.filter((x) => value.includes(x.value))}
                      tooltipText={t("ReservationUnitEditor.tooltip.qualifiers")}
                    />
                  )}
                />
              </Span6>
              {(["descriptionFi", "descriptionEn", "descriptionSv"] as const).map((fieldName) => (
                <Span12 key={fieldName}>
                  <Controller
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                    <RichTextInput
                      {...field}
                      required
                      id={fieldName}
                      label={t(`ReservationUnitEditor.label.${fieldName}`)}
                      errorText={errors[fieldName]?.message}
                      tooltipText={t("ReservationUnitEditor.tooltip.description")}
                    />
                    )}
                  />
                </Span12>
                )
              )}
              <Span12>
                <ImageEditor images={images} setImages={handleImageChange} />
              </Span12>
            </Grid>
          </Accordion>
          {isDirect && (
            <Accordion
              initiallyOpen={Object.keys(errors).length > 0}
              heading={t("ReservationUnitEditor.settings")}
              >
              <Grid>
                <Span12>
                  <FieldGroup
                    heading={t("ReservationUnitEditor.publishingSettings")}
                    tooltip={t("ReservationUnitEditor.tooltip.publishingSettings")}
                  >
                    <ActivationGroup
                      id="useScheduledPublishing"
                      label={t("ReservationUnitEditor.scheduledPublishing")}
                      initiallyOpen={watch('publishBeginsDate') !== '' || watch('publishBeginsTime') !== '' || watch('publishEndsDate') !== '' || watch('publishEndsTime') !== '' }
                      onClose={() => {
                        setValue('publishBeginsDate', '')
                        setValue('publishBeginsTime', '')
                        setValue('publishEndsDate', '')
                        setValue('publishEndsTime', '')
                      }}
                    >
                      <DenseVerticalFlex>
                        <ActivationGroup
                          id="publishBegins"
                          label={t("ReservationUnitEditor.publishBegins")}
                          initiallyOpen={watch('publishBeginsDate') !== '' || watch('publishBeginsTime') !== ''}
                          onClose={() => {
                            setValue('publishBeginsDate', '')
                            setValue('publishBeginsTime', '')
                          }}
                          noIndent
                          noMargin
                        >
                          <DateTimeInput control={control} name={{ date: "publishBeginsDate", time: "publishBeginsTime" }} />
                        </ActivationGroup>

                        <ActivationGroup
                          id="publishEnds"
                          label={t("ReservationUnitEditor.publishEnds")}
                          initiallyOpen={watch('publishEndsDate') !== '' || watch('publishEndsTime') !== ''}
                          // TODO what's the point of this? why are we reseting it on close?
                          onClose={() => {
                            setValue('publishEndsDate', '')
                            setValue('publishEndsTime', '')
                          }}
                          noIndent
                          noMargin
                        >
                          <DateTimeInput control={control} name={{ date: "publishEndsDate", time: "publishEndsTime" }} />
                        </ActivationGroup>
                      </DenseVerticalFlex>
                    </ActivationGroup>
                  </FieldGroup>
                </Span12>
                <Span12>
                  <FieldGroup
                    heading={t("ReservationUnitEditor.reservationSettings")}
                    tooltip={t(
                      "ReservationUnitEditor.tooltip.reservationSettings"
                    )}
                  >
                    <ActivationGroup
                      id="useScheduledReservation"
                      label={t("ReservationUnitEditor.scheduledReservation")}
                      initiallyOpen={watch('reservationBeginsDate') !== '' || watch('reservationEndsDate') !== ''}
                      // TODO what's the point of this? why are we reseting it on close?
                      // we should be using a temporary state for the modal etc. and only save the changes when the user clicks save
                      onClose={() => {
                        setValue('reservationBeginsDate', '')
                        setValue('reservationBeginsTime', '')
                        setValue('reservationEndsDate', '')
                        setValue('reservationEndsTime', '')
                      }}
                    >
                      <ActivationGroup
                        id="reservationBegins"
                        label={t("ReservationUnitEditor.reservationBegins")}
                        // TODO
                        initiallyOpen={watch('reservationBeginsDate') !== ''}
                        onClose={() => { setValue('reservationBeginsDate', ''); setValue('reservationBeginsTime', '');}}
                        noIndent
                      >
                        <DateTimeInput control={control} name={{ date: "reservationBeginsDate", time: "reservationBeginsTime" }} />
                      </ActivationGroup>
                      <ActivationGroup
                        id="reservationEnds"
                        label={t("ReservationUnitEditor.reservationEnds")}
                        // TODO
                        initiallyOpen={watch('reservationEndsDate') !== ''}
                        onClose={() => { setValue('reservationEndsDate', ''); setValue('reservationEndsTime', '');}}
                        noIndent
                      >
                        <DateTimeInput control={control} name={{ date: "reservationEndsDate", time: "reservationEndsTime" }} />
                      </ActivationGroup>
                    </ActivationGroup>
                  </FieldGroup>
                </Span12>
                <Span6>
                  <Controller
                    control={control}
                    name="minReservationDuration"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        id="minReservationDuration"
                        options={durationOptions}
                        placeholder={t("common.select")}
                        required
                        label={t("ReservationUnitEditor.label.minReservationDuration")}
                        onChange={(v: { value: number; label: string }) => onChange(v.value)}
                        value={durationOptions.find((o) => o.value === value) ?? null}
                        error={errors["minReservationDuration"]?.message}
                        invalid={errors["minReservationDuration"]?.message != null}
                        tooltipText={t("ReservationUnitEditor.tooltip.minReservationDuration")}
                      />
                  )}
                />
                </Span6>
                <Span6>
                  <Controller
                    control={control}
                    name="maxReservationDuration"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        id="maxReservationDuration"
                        placeholder={t("common.select")}
                        required
                        options={durationOptions}
                        onChange={(v: { value: number; label: string }) => onChange(v.value)}
                        value={durationOptions.find((o) => o.value === value) ?? null}
                        label={t("ReservationUnitEditor.label.maxReservationDuration")}
                        error={errors["maxReservationDuration"]?.message}
                        invalid={errors["maxReservationDuration"]?.message != null}
                        tooltipText={t("ReservationUnitEditor.tooltip.maxReservationDuration")}
                      />
                    )}
                  />
                </Span6>
                <Span6>
                  <Controller
                    control={control}
                    name="reservationsMaxDaysBefore"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        id="reservationsMaxDaysBefore"
                        options={reservationsMaxDaysBeforeOptions}
                        placeholder={t("common.select")}
                        required
                        label={t("ReservationUnitEditor.label.reservationsMaxDaysBefore")}
                        onChange={(v: { value: number; label: string }) => onChange(v.value)}
                        value={reservationsMaxDaysBeforeOptions.find((o) => o.value === value) ?? null}
                        error={errors["reservationsMaxDaysBefore"]?.message}
                        invalid={errors["reservationsMaxDaysBefore"]?.message != null}
                        tooltipText={t("ReservationUnitEditor.tooltip.reservationsMaxDaysBefore")}
                      />
                    )}
                  />
                </Span6>
                <Span6>
                  <NumberInput
                    {...register("reservationsMinDaysBefore", { required: true })}
                    id="reservationsMinDaysBefore"
                    label={t("ReservationUnitEditor.label.reservationsMinDaysBefore")}
                    minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    step={1}
                    type="number"
                    max={watch('reservationsMaxDaysBefore')}
                    min={0}
                    required
                    errorText={errors["reservationsMinDaysBefore"]?.message}
                    invalid={errors["reservationsMinDaysBefore"]?.message != null}
                    tooltipText={t("ReservationUnitEditor.tooltip.reservationsMinDaysBefore")}
                  />
                </Span6>
                <Span6>
                  <Controller
                    control={control}
                    name="reservationStartInterval"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        id="reservationStartInterval"
                        placeholder={t("common.select")}
                        options={reservationStartIntervalOptions}
                        required
                        value={reservationStartIntervalOptions.find((o) => o.value === value) ?? null}
                        onChange={(val: { value: ReservationUnitsReservationUnitReservationStartIntervalChoices; label: string }) => onChange(val)}
                        error={errors["reservationStartInterval"]?.message}
                        invalid={errors["reservationStartInterval"]?.message != null}
                        label={t("ReservationUnitEditor.label.reservationStartInterval")}
                        tooltipText={t("ReservationUnitEditor.tooltip.reservationStartInterval")}
                      />
                    )}
                  />
                </Span6>
                <Span6 />
                <Span12>
                  <FieldGroup
                    heading={t("ReservationUnitEditor.bufferSettings")}
                    tooltip={t("ReservationUnitEditor.tooltip.bufferSettings")}
                  >
                    <Grid>
                      <Span6>
                        <ActivationGroup
                          id="bufferTimeBeforeGroup"
                          label={t("ReservationUnitEditor.bufferTimeBefore")}
                          initiallyOpen={watch("bufferTimeBefore") !== 0}
                        >
                          <Controller
                            control={control}
                            name="bufferTimeBefore"
                            render={({ field: { value, onChange } }) => (
                              <Select
                                id="bufferTimeBefore"
                                options={bufferTimeOptions}
                                label={t("ReservationUnitEditor.bufferTimeBeforeDuration")}
                                onChange={(v: { value: number; label: string }) => onChange(v.value)}
                                value={bufferTimeOptions.find((o) => o.value === value) ?? null}
                              />
                            )}
                          />
                        </ActivationGroup>
                      </Span6>
                      <Span6>
                        <ActivationGroup
                          id="bufferTimeAfterGroup"
                          label={t("ReservationUnitEditor.bufferTimeAfter")}
                          initiallyOpen={watch("bufferTimeAfter") !== 0}
                        >
                          <Controller
                            control={control}
                            name="bufferTimeAfter"
                            render={({ field: { value, onChange } }) => (
                            <Select
                              id="bufferTimeAfter"
                              label={t("ReservationUnitEditor.bufferTimeAfterDuration")}
                              options={bufferTimeOptions}
                              onChange={(v: { value: number; label: string }) => onChange(v.value)}
                              value={bufferTimeOptions.find((option) => option.value === value) ?? null}
                            />
                            )}
                          />
                        </ActivationGroup>
                      </Span6>
                    </Grid>
                  </FieldGroup>
                </Span12>
                <Span12>
                  {/*
                  <FieldGroup
                    heading={t("ReservationUnitEditor.cancellationSettings")}
                    tooltip={t(
                      "ReservationUnitEditor.tooltip.cancellationSettings"
                    )}
                  >
                  */}
                    <ActivationGroup
                      id="cancellationIsPossible"
                      label={t("ReservationUnitEditor.cancellationIsPossible")}
                      // TODO what's the point of this? why are we reseting it on close?
                      // it's because there is no logic in the send of the form to handle the case where the user has selected a cancellation rule and then unselected it
                      initiallyOpen={watch("cancellationRulePk") != null}
                      onClose={() => setValue('cancellationRulePk', null)}
                    >
                      <Controller
                        control={control}
                        name="cancellationRulePk"
                        render={({ field: { value, onChange } }) => (
                          <SelectionGroup
                            required
                            label={t("ReservationUnitEditor.cancellationGroupLabel")}
                            errorText={errors["cancellationRulePk"]?.message}
                          >
                          {cancellationRuleOptions.map((o) => (
                            <RadioButton
                              key={o.value}
                              id={`cr-${o.value}`}
                              value={o.value.toString()}
                              label={o.label}
                              onChange={(e) => onChange(e.target.value)}
                              checked={value === o.value}
                            />
                          ))}
                          </SelectionGroup>
                        )}
                    />
                  </ActivationGroup>
                </Span12>
                <Span6>
                  <Controller
                    control={control}
                    name="metadataSetPk"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        id="metadataSetPk"
                        // sort
                        required
                        options={metadataOptions}
                        label={t("ReservationUnitEditor.label.metadataSetPk")}
                        onChange={(v: { label: string; value: number }) => onChange(v.value)}
                        value={metadataOptions.find((o) => o.value === value) ?? null}
                        error={errors["metadataSetPk"]?.message}
                        invalid={errors["metadataSetPk"]?.message != null}
                        tooltipText={t("ReservationUnitEditor.tooltip.metadataSetPk")}
                      />
                    )}
                  />
                </Span6>
                <Span6>
                  <Controller
                    control={control}
                    name="authentication"
                    render={({ field: { value, onChange } }) => (
                      <Select
                        // sort
                        id="authentication"
                        required
                        options={authenticationOptions}
                        value={authenticationOptions.find((o) => o.value === value) ?? null}
                        onChange={(val: { value: ReservationUnitsReservationUnitAuthenticationChoices; label: string }) => onChange(val.value)}
                        label={t("ReservationUnitEditor.authenticationLabel")}
                        tooltipText={t("ReservationUnitEditor.tooltip.authentication")}
                      />
                    )}
                    />
                </Span6>
                <Span6>
                  <NumberInput
                    {...register("maxReservationsPerUser", { valueAsNumber: true })}
                    id="maxReservationsPerUser"
                    label={t("ReservationUnitEditor.maxReservationsPerUser")}
                    minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    min={1}
                    // TODO why?
                    max={15}
                    step={1}
                    type="number"
                    tooltipText={t("ReservationUnitEditor.tooltip.maxReservationsPerUser")}
                  />
                </Span6>
                <Span12>
                  <FieldGroup
                    heading={t("ReservationUnitEditor.introductionSettings")}
                    tooltip={t("ReservationUnitEditor.tooltip.introductionSettings")}
                  >
                    <Controller
                      control={control}
                      name={"requireIntroduction"}
                      render={({ field: { value, onChange } }) => (
                        <Checkbox
                          id="requireIntroduction"
                          label={t("ReservationUnitEditor.requireIntroductionLabel")}
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      )}
                    />
                  </FieldGroup>
                </Span12>
                <Span12>
                  <FieldGroup
                    heading={t("ReservationUnitEditor.handlingSettings")}
                    tooltip={t(
                      "ReservationUnitEditor.tooltip.handlingSettings"
                    )}
                  >
                    <Controller
                      control={control}
                      name={"requireReservationHandling"}
                      render={({ field: { value, onChange } }) => (
                        <Checkbox
                          id="requireReservationHandling"
                          label={t("ReservationUnitEditor.requireReservationHandling")}
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      )}
                    />
                  </FieldGroup>
                </Span12>
              </Grid>
            </Accordion>
          )}
          <Accordion
            initiallyOpen={Object.keys(errors).length > 0}
            heading={t("ReservationUnitEditor.label.pricings")}
          >
            <div style={{
              gap: "var(--spacing-m)",
              display: "flex",
              flexDirection: "column",
            }}>
              {watch('pricings').map((pricing, index) => (
                pricing?.status === ReservationUnitsReservationUnitPricingStatusChoices.Active && (
                <>
                  <FieldGroup
                    // TODO add a formKey so we can destroy the pricings without messing the key / index
                    key={index}
                    id="pricings"
                    heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                    tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
                  />
                  {/* TODO form index is bad, use pk or form key */}
                  <PricingType
                    index={index}
                    form={form}
                    taxPercentageOptions={taxPercentageOptions}
                  />
                </>
                )
              ))}
              <Controller
                control={control}
                name={"hasFuturePricing"}
                render={({ field: { value, onChange } }) => (
                  <Checkbox
                    checked={value}
                    onChange={() => onChange(!value)}
                    label={t("ReservationUnitEditor.label.priceChange")}
                    id="hasFuturePrice"
                  />
                )}
              />
              {watch('hasFuturePricing') && watch('pricings').map((pricing, index) => (
                pricing.status === ReservationUnitsReservationUnitPricingStatusChoices.Future && (
                <>
                  <FieldGroup
                    // TODO add a formKey so we can destroy the pricings without messing the key / index
                    key={index}
                    id="pricings"
                    heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                    tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
                  />
                  {/* TODO form index is bad, use pk or form key */}
                  <PricingType
                    index={index}
                    form={form}
                    taxPercentageOptions={taxPercentageOptions}
                  />
                </>
                )
              ))}
              {isPaid && (
                // TODO this should be outside the pricing type because it's reservation unit wide
                <HorisontalFlex style={{ justifyContent: "space-between", width: "100%" }} >
                  <Controller
                    control={control}
                    name={"canApplyFreeOfCharge"}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        label={t("ReservationUnitEditor.label.canApplyFreeOfCharge")}
                        id="canApplyFreeOfCharge"
                      />
                    )}
                  />
                  <Tooltip>
                    {t("ReservationUnitEditor.tooltip.canApplyFreeOfCharge")}
                  </Tooltip>
                </HorisontalFlex>
              )}
            </div>
          </Accordion>
          {watch('canApplyFreeOfCharge') && isPaid && (
            <Span6>
              <Controller
                control={control}
                name={"pricingTerms"}
                render={({ field: { value, onChange } }) => (
                  <Select
                    id="pricingTerms"
                    label={t("ReservationUnitEditor.label.pricingTermsPk")}
                    placeholder={t("common.select")}
                    required
                    clearable
                    options={pricingTermsOptions}
                    value={pricingTermsOptions.find((o) => o.value === value) ?? null}
                    onChange={(val: { value: string; label: string }) => onChange(val.value)}
                    tooltipText={t("ReservationUnitEditor.tooltip.pricingTermsPk") }
                  />
                )}
                />
            </Span6>
          )}
          {isDirect && (
            <Accordion
              initiallyOpen={Object.keys(errors).length > 0}
              heading={t("ReservationUnitEditor.termsInstructions")}
            >
              <Grid>
                {(["serviceSpecificTermsPk", "paymentTermsPk", "cancellationTermsPk"] as const).map((name) => {
                  const options = name === "serviceSpecificTermsPk"
                    ? serviceSpecificTermsOptions
                    : name === "cancellationTermsPk"
                      ? cancellationTermsOptions
                      : paymentTermsOptions;
                  return (
                    <Span6 key={name}>
                      <Controller
                        control={control}
                        name={name}
                        render={({ field }) => (
                          <Select
                            clearable
                            // sort
                            id={name}
                            label={t(`ReservationUnitEditor.label.${name}`)}
                            placeholder={t(`ReservationUnitEditor.termsPlaceholder`)}
                            options={options}
                            value={options.find((o) => o.value === field.value) ?? null}
                            onChange={(val: { value: string; label: string }) => field.onChange(val.value)}
                            // helper={t(`ReservationUnitEditor.${name}.helper`)}
                            tooltipText={t(`ReservationUnitEditor.tooltip.${name}`)}
                          />
                        )}
                        />
                    </Span6>
                  );
                })}
                {(["termsOfUseFi", "termsOfUseEn", "termsOfUseSv"] as const).map((fieldName) => (
                  <Span12 key={fieldName}>
                    <Controller
                      control={control}
                      name={fieldName}
                      render={({ field }) => (
                      <RichTextInput
                        {...field}
                        required
                        id={fieldName}
                        label={t(`ReservationUnitEditor.label.${fieldName}`)}
                        errorText={errors[fieldName]?.message}
                        // TODO do we want to hide the tooltip for others than Fi?
                        tooltipText={t("ReservationUnitEditor.tooltip.termsOfUseFi")}
                      />
                      )}
                    />
                  </Span12>
                ))}
              </Grid>
            </Accordion>
          )}
          <Accordion
            initiallyOpen={Object.keys(errors).length > 0}
            heading={t("ReservationUnitEditor.communication")}
          >
            <Grid>
              <Span12>
                <ExpandLink initiallyOpen heading={t("ReservationUnitEditor.pendingExpandLink")} >
                  <SlimH4>
                    {t("ReservationUnitEditor.pendingInstructions")}
                  </SlimH4>
                  {(["reservationPendingInstructionsFi", "reservationPendingInstructionsEn", "reservationPendingInstructionsSv"] as const).map((fieldName) => (
                    <Controller
                      key={fieldName}
                      control={control}
                      name={fieldName}
                      render={({ field }) => (
                      <TextArea
                        {...field}
                        id={fieldName}
                        label={t(`ReservationUnitEditor.label.${fieldName}`)}
                        errorText={errors[fieldName]?.message}
                        invalid={errors[fieldName]?.message != null}
                        /* FIXME
                        tooltipText={t("ReservationUnitEditor.tooltip.termsOfUseFi")}
                        tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationPendingInstructionsFi") : "" }
                        */
                      />
                      )}
                    />
                  ))}
                </ExpandLink>
              </Span12>
              <Span12>
                <SlimH4>
                  {t("ReservationUnitEditor.confirmedInstructions")}
                </SlimH4>
              </Span12>
              {(["reservationConfirmedInstructionsFi", "reservationConfirmedInstructionsEn", "reservationConfirmedInstructionsSv"] as const).map((fieldName) => (
                <Span12 key={fieldName}>
                  <Controller
                    control={control}
                    name={fieldName}
                    render={({ field }) => (
                    <TextArea
                      {...field}
                      id={fieldName}
                      label={t(`ReservationUnitEditor.label.${fieldName}`)}
                      errorText={errors[fieldName]?.message}
                      invalid={errors[fieldName]?.message != null}
                      /* FIXME tr key
                      label={t( `ReservationUnitEditor.label.instructions${upperFirst( lang)}`)}
                      tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationConfirmedInstructionsFi") : "" }
                      */
                      />
                    )}
                  />
                </Span12>
              ))}
              <Span12>
                <ExpandLink initiallyOpen
                  heading={t("ReservationUnitEditor.cancelledExpandLink")}>
                  <Span12>
                    <SlimH4>
                      {t("ReservationUnitEditor.cancelledInstructions")}
                    </SlimH4>
                  </Span12>
                  {(["reservationCancelledInstructionsFi", "reservationCancelledInstructionsEn", "reservationCancelledInstructionsSv"] as const).map((fieldName) => (
                    <Span12 key={fieldName}>
                      <Controller
                        control={control}
                        name={fieldName}
                        render={({ field }) => (
                        <TextArea
                          {...field}
                          id={fieldName}
                          label={t(`ReservationUnitEditor.label.${fieldName}`)}
                          errorText={errors[fieldName]?.message}
                          invalid={errors[fieldName]?.message != null}
                          /* TODO rename the keys
                          tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationCancelledInstructionsFi") : "" }
                          */
                          />
                        )}
                        />
                    </Span12>
                  ))}
                </ExpandLink>
              </Span12>
              <Span12>
                <TextInput
                  {...register("contactInformation")}
                  id="contactInformation"
                  label={t("ReservationUnitEditor.contactInformationLabel")}
                  helperText={t("ReservationUnitEditor.contactInformationHelperText")}
                  tooltipText={t("ReservationUnitEditor.tooltip.contactInformation")}
                />
              </Span12>
            </Grid>
          </Accordion>
          <Accordion
            initiallyOpen={Object.keys(errors).length > 0}
            heading={t("ReservationUnitEditor.openingHours")}
          >
            {reservationUnit?.haukiUrl?.url ? (
              <>
                <p>
                  {t("ReservationUnitEditor.openingHoursHelperTextHasLink")}
                </p>
                <HorisontalFlex
                  style={{
                    fontSize: "var(--fontsize-body-s)",
                  }}
                >
                  <Button
                    theme="black"
                    variant="secondary"
                    size="small"
                    iconRight={<IconLinkExternal />}
                    onClick={() => {
                      if (reservationUnit?.haukiUrl?.url) {
                        window.open(
                          reservationUnit?.haukiUrl?.url,
                          "_blank"
                        );
                      }
                    }}
                  >
                    {t("ReservationUnitEditor.openingTimesExternalLink")}
                  </Button>
                  <Button
                    theme="black"
                    variant="secondary"
                    size="small"
                    iconRight={<IconLinkExternal />}
                    onClick={() => {
                      if (reservationUnit?.haukiUrl?.url) {
                        window.open(
                          `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}#calendar`,
                          "_blank"
                        );
                      }
                    }}
                  >
                    {t("ReservationUnitEditor.previewCalendarLink")}
                  </Button>
                </HorisontalFlex>
              </>
            ) : (
              <p>{t("ReservationUnitEditor.openingHoursHelperTextNoLink")}</p>
            )}
          </Accordion>
          <ArchiveButton
            onClick={handleArchiveButtonClick}
            variant="secondary"
            disabled={isSaving || getValues("pk") === 0}
            theme="black"
          >
            {t("ReservationUnitEditor.archive")}
          </ArchiveButton>
        </div>
      </Container>
      <ButtonsStripe>
        <WhiteButton
          size="small"
          disabled={isSaving}
          variant="supplementary"
          iconLeft={<IconArrowLeft />}
          onClick={() =>
            setModalContent(
              <DiscardChangesDialog
                onAccept={() => {
                  setModalContent(null);
                  history(-1);
                }}
                onClose={() => setModalContent(null)}
              />,
              true
            )
          }
        >
          {t("common.prev")}
        </WhiteButton>
        <ButtonsContainer>
          <Preview
            target="_blank"
            rel="noopener noreferrer"
            disabled={isSaving}
            href={`${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}`}
            // TODO
            // onClick={(e) => state.hasChanges && e.preventDefault()}
            title={t(
              hasChanges
                ? "ReservationUnitEditor.noPreviewUnsavedChangesTooltip"
                : "ReservationUnitEditor.previewTooltip"
            )}
          >
            <span>{t("ReservationUnitEditor.preview")}</span>
          </Preview>
          <WhiteButton
            size="small"
            variant="secondary"
            // disabled={isSaving || !hasChanges}
            isLoading={isSaving && watch("isDraft")}
            type="button"
            loadingText={t("ReservationUnitEditor.saving")}
            onClick={handleSaveAsDraft}
          >
            {t("ReservationUnitEditor.saveAsDraft")}
          </WhiteButton>
          <WhiteButton
            variant="primary"
            // disabled={isSaving || !hasChanges}
            isLoading={isSaving && !watch("isDraft")}
            loadingText={t("ReservationUnitEditor.saving")}
            type="button"
            onClick={handlePublish}
          >
            {t("ReservationUnitEditor.saveAndPublish")}
          </WhiteButton>
        </ButtonsContainer>
      </ButtonsStripe>
    </form>
  );
};

type IRouterProps = {
  reservationUnitPk?: string;
  unitPk: string;
};

/// Wrap the editor so we never reset the form after async loading (because of HDS TimeInput bug)
function EditorWrapper () {
  const { reservationUnitPk, unitPk } = useParams<IRouterProps>();
  const { t } = useTranslation();

  const { data: reservationUnitData, loading: isLoading, refetch } = useQuery<
    Query,
    QueryReservationUnitByPkArgs
  >(RESERVATIONUNIT_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
    skip: !reservationUnitPk || Number(reservationUnitPk) === 0 || Number.isNaN(Number(reservationUnitPk)),
  });

  const reservationUnit = reservationUnitData?.reservationUnitByPk ?? undefined;
  const unit = reservationUnit?.unit

  // NOTE override the unitPk from the url for new units
  // there is no harm in doing it to existing units either (since it should be valid)
  const form = useForm<ReservationUnitEditFormValues>({
    mode: "onChange",
    // NOTE disabling because it throws an error when submitting because it can't focus the field
    // this happens for field errors in the zod schema where the field is created using an array
    // for example termsOfUseEn, termsOfUseFi, termsOfUseSv
    shouldFocusError: false,
    defaultValues: {
      ...convert(reservationUnit),
      unitPk: Number(unitPk),
    },
    resolver: zodResolver(ReservationUnitEditSchema),
  });
  const { reset } = form;
  useEffect(() => {
    if (reservationUnitData?.reservationUnitByPk != null) {
      const vals = convert(reservationUnitData.reservationUnitByPk);
      reset({
        ...vals,
        unitPk: Number(unitPk),
      });
    }
  }, [reservationUnitData, reset]);

  if (isLoading) {
    return <Loader />;
  }
  if (unitPk == null || Number(unitPk) === 0 || Number.isNaN(Number(unitPk))) {
    return <Error404 />;
  }
  // we use null for "new" units (could also be "new" slug)
  if (reservationUnitPk != null && Number.isNaN(Number(reservationUnitPk))) {
    return <Error404 />;
  }
  // the pk is valid but not found in the backend
  if (reservationUnitPk != null && reservationUnit == null) {
    return <Error404 />;
  }

  // FIXME can't query the unit name through the reservationUnit because new pages don't have reservationUnit
  return (
    <Wrapper>
      <BreadcrumbWrapper
        route={[
          { slug: "", alias: t("breadcrumb.spaces-n-settings") },
          { slug: `${publicUrl}/unit/${unit?.pk ?? ""}`, alias: unit?.nameFi ?? "-" },
          { slug: "", alias: reservationUnit?.nameFi || "-" },
        ]}
      />
      <ReservationUnitEditor reservationUnit={reservationUnit} form={form} unitPk={unitPk} refetch={refetch} />
    </Wrapper>
  )
}

export default EditorWrapper;
