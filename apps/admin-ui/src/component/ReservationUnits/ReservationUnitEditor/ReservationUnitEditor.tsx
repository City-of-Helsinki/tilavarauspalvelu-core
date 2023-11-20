import React, { useEffect, useState } from "react";
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
import i18next from "i18next";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { Controller, UseFormReturn, useForm } from "react-hook-form";
import type { TFunction } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Query,
  type QueryReservationUnitByPkArgs,
  type QueryUnitByPkArgs,
  type ReservationUnitCreateMutationInput,
  type ReservationUnitUpdateMutationInput,
  type Mutation,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  type ReservationUnitImageCreateMutationInput,
  ReservationUnitsReservationUnitAuthenticationChoices,
  type UnitByPkType,
  type ReservationState,
  type ReservationUnitState,
  TermsOfUseTermsOfUseTermsTypeChoices,
  type ReservationUnitByPkType,
  ReservationUnitsReservationUnitPricingStatusChoices,
  type SpaceType,
  type ReservationUnitTypeType,
  type QualifierType,
  type PurposeType,
  type EquipmentType,
  type MutationCreateReservationUnitArgs,
  type MutationUpdateReservationUnitArgs,
} from "common/types/gql-types";
import { DateTimeInput } from "common/src/components/form/DateTimeInput";
import { filterNonNullable } from "common/src/helpers";
import { H1, H4, fontBold } from "common/src/common/typography";
import { breakpoints } from "common";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { addDays } from "date-fns";
import { previewUrlPrefix, publicUrl } from "@/common/const";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "@/common/queries";
import {
  ContainerMedium,
  DenseVerticalFlex,
  Grid,
  HorisontalFlex,
  Span12,
  Span6,
  AutoGrid,
  FullRow,
  VerticalFlex,
} from "@/styles/layout";
import Loader from "@/component/Loader";
import { useNotification } from "@/context/NotificationContext";
import { useModal } from "@/context/ModalContext";
import { parseAddress } from "@/common/util";
import Error404 from "@/common/Error404";
import { Accordion } from "@/component/Accordion";
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
import { ArchiveDialog } from "./ArchiveDialog";
import { ReservationStateTag, ReservationUnitStateTag } from "./tags";
import { ActivationGroup } from "./ActivationGroup";
import { ImageEditor } from "./ImageEditor";
import { Image } from "./types";
import { PricingType } from "./PricingType";
import { GenericDialog } from "./GenericDialog";
import {
  PricingFormValues,
  ReservationUnitEditFormValues,
  ReservationUnitEditSchema,
  convert,
} from "./form";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { reservationUnitsUrl } from "@/common/urls";

const RichTextInput = dynamic(() => import("../../RichTextInput"), {
  ssr: false,
});

// NOTE some magic values so the sticky buttons don't hide the bottom of the page
const Wrapper = styled.div`
  padding-bottom: 16rem;
  @media (width > ${breakpoints.m}) {
    padding-bottom: 8rem;
  }
`;

const SlimH4 = styled(H4)`
  margin: 0;
`;

const ArchiveButton = styled(Button)`
  margin-top: var(--spacing-m);
`;

const SubAccordion = styled(Accordion)`
  border-bottom: none !important;
  & {
    --header-font-size: var(--fontsize-heading-s-2);
    h3 {
      color: var(--color-bus);
    }
  }

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
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-s);
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);

  /* back button should be left aligned */
  gap: var(--spacing-m);
  & > *:first-child {
    margin-right: auto;
  }

  /* four buttons is too much on mobile */
  & > *:nth-child(2) {
    display: none;
  }
  @media (width > ${breakpoints.s}) {
    & > *:nth-child(2) {
      display: flex;
    }
  }
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
  termsType: TermsOfUseTermsOfUseTermsTypeChoices
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
    });

  return [...options];
};

const FieldGroupWrapper = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr 32px;
  justify-content: space-between;
`;

// NOTE using span for easier css selectors
const FieldGroupHeading = styled.span`
  padding-bottom: var(--spacing-xs);
  ${fontBold}
  display: block;
`;

const FieldGroup = ({
  children,
  id,
  heading,
  tooltip = "",
  className,
  style,
}: {
  heading: string;
  tooltip?: string;
  id?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}): JSX.Element => (
  <FieldGroupWrapper className={className} style={style}>
    <div>
      <FieldGroupHeading>{heading}</FieldGroupHeading>
      {id ? <span id={id} /> : null}
      <div className="ReservationUnitEditor__FieldGroup-children">
        {children}
      </div>
    </div>
    <Tooltip>{tooltip}</Tooltip>
  </FieldGroupWrapper>
);

const RadioFieldGroup = styled(FieldGroup)`
  grid-column: 1 / -1;

  & .ReservationUnitEditor__FieldGroup-children {
    grid-template-columns: 1fr;
    display: grid;
    gap: 1rem;
    align-items: center;
    @media (width > ${breakpoints.s}) {
      grid-template-columns: repeat(3, 1fr);
    }
  }
`;

function DiscardChangesDialog({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
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
}

const DisplayUnitWrapper = styled.div`
  margin-bottom: var(--spacing-m);
`;

const UnitInformationWrapper = styled.div`
  line-height: 32px;
  font-size: var(--fontsize-heading-s);
  > div:first-child {
    ${fontBold}
  }
`;

function DisplayUnit({
  heading,
  unit,
  unitState,
  reservationState,
}: {
  heading: string;
  unit?: UnitByPkType;
  unitState?: ReservationUnitState;
  reservationState?: ReservationState;
}): JSX.Element {
  return (
    <DisplayUnitWrapper>
      <TitleSectionWithTags>
        <H1 $legacy>{heading}</H1>
        <TagContainer>
          <ReservationStateTag state={reservationState} />
          <ReservationUnitStateTag state={unitState} />
        </TagContainer>
      </TitleSectionWithTags>
      <UnitInformationWrapper>
        <div>{unit?.nameFi ?? "-"}</div>
        <div>{unit?.location ? parseAddress(unit.location) : "-"}</div>
      </UnitInformationWrapper>
    </DisplayUnitWrapper>
  );
}

const useImageMutations = () => {
  const [createImage] = useMutation<
    Mutation,
    ReservationUnitImageCreateMutationInput
  >(CREATE_IMAGE);

  const [delImage] = useMutation<Mutation>(DELETE_IMAGE);
  const [updateImagetype] = useMutation<Mutation>(UPDATE_IMAGE_TYPE);

  const reconcileImageChanges = async (
    resUnitPk: number,
    images: Image[]
  ): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = images
        .filter((image) => image.deleted)
        .map((image) => delImage({ variables: { pk: image.pk } }));
      // TODO getting error: "No permissions to perform delete."
      // here locally
      const res = await Promise.all(deletePromises);
      const hasErrors =
        res
          .map((single) => single?.data?.createReservationUnitImage?.errors)
          .filter((e) => e != null).length > 0;
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
      const hasErrors =
        res
          .map((single) => single?.data?.createReservationUnitImage?.errors)
          .filter((e) => e != null).length > 0;
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
      const hasErrors =
        res
          .map((single) => single?.data?.createReservationUnitImage?.errors)
          .filter((e) => e != null).length > 0;
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
};

const getTranslatedError = (error: string | undefined, t: TFunction) => {
  if (error == null) {
    return undefined;
  }
  // TODO use a common translation key for these
  return t(`Notifications.form.errors.${error}`);
};

// default is 20 if no spaces selected
const getMaxPersons = (spaceList: NonNullable<SpaceType>[]) => {
  const persons =
    spaceList.map((s) => s.maxPersons ?? 0).reduce((a, x) => a + x, 0) || 20;
  return Math.ceil(persons);
};
// default is 1 if no spaces selected
const getMinSurfaceArea = (spaceList: NonNullable<SpaceType>[]) => {
  const area =
    spaceList.map((s) => s.surfaceArea ?? 0).reduce((a, x) => a + x, 0) || 1;
  return Math.ceil(area);
};

function BasicSection({
  form,
  spaces,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  spaces: SpaceType[];
}) {
  const { t } = useTranslation();
  const { control, formState, register, watch } = form;
  const { errors } = formState;

  const spaceOptions = spaces.map((s) => ({
    label: String(s?.nameFi),
    value: Number(s?.pk),
  }));
  const resourceOptions = filterNonNullable(
    spaces.flatMap((s) => s?.resources)
  ).map((r) => ({ label: String(r?.nameFi), value: Number(r?.pk) }));

  // TODO this doesn't update the form values
  // but if we add that then the user changes are discarded on load
  const spacePks = watch("spacePks");
  const selectedSpaces = filterNonNullable(
    spacePks.map((pk) => spaces.find((s) => s.pk === pk))
  );
  const minSurfaceArea = getMinSurfaceArea(selectedSpaces);
  const maxPersons = getMaxPersons(selectedSpaces);

  const hasErrors =
    errors.reservationKind != null ||
    errors.minPersons != null ||
    errors.maxPersons != null ||
    errors.surfaceArea != null ||
    errors.spacePks != null ||
    errors.resourcePks != null ||
    errors.nameFi != null ||
    errors.nameEn != null ||
    errors.nameSv != null;

  return (
    <Accordion
      initiallyOpen
      open={hasErrors}
      heading={t("ReservationUnitEditor.basicInformation")}
    >
      <AutoGrid>
        <RadioFieldGroup
          id="reservationKind"
          heading={t("ReservationUnitEditor.label.reservationKind")}
          tooltip={t("ReservationUnitEditor.tooltip.reservationKind")}
        >
          {errors.reservationKind?.message != null && (
            <FullRow>
              <IconAlertCircleFill />
              <span>
                {getTranslatedError(errors.reservationKind.message, t)}
              </span>
            </FullRow>
          )}
          {(["DIRECT_AND_SEASON", "DIRECT", "SEASON"] as const).map((kind) => (
            <Controller
              control={control}
              name="reservationKind"
              key={kind}
              render={({ field }) => (
                <RadioButton
                  {...field}
                  id={`reservationKind.${kind}`}
                  name="reservationKind"
                  style={{ margin: 0 }}
                  label={t(
                    `ReservationUnitEditor.label.reservationKinds.${kind}`
                  )}
                  onChange={() => field.onChange(kind)}
                  checked={field.value === kind}
                />
              )}
            />
          ))}
        </RadioFieldGroup>
        {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
          <FullRow key={fieldName}>
            <TextInput
              {...register(fieldName, { required: true })}
              required
              id={fieldName}
              label={t(`ReservationUnitEditor.label.${fieldName}`)}
              errorText={getTranslatedError(errors[fieldName]?.message, t)}
              invalid={errors[fieldName]?.message != null}
              // tooltipText={ lang === "fi" ? t("ReservationUnitEditor.tooltip.nameFi") : undefined }
            />
          </FullRow>
        ))}
        <Controller
          control={control}
          name="spacePks"
          render={({ field: { value, onChange } }) => (
            // @ts-expect-error - HDS multiselect has weird typings
            <Select<{ label: string; value: number }>
              id="spacePks"
              multiselect
              required
              // style={{ gridColumn: "1 / span 2" }}
              label={t("ReservationUnitEditor.label.spacePks")}
              placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
              options={spaceOptions}
              disabled={spaceOptions.length === 0}
              onChange={(vals) => onChange(vals.map((y) => y.value))}
              value={spaceOptions.filter((x) => value.includes(x.value))}
              error={errors.spacePks?.message}
              invalid={errors.spacePks?.message != null}
              tooltipText={t("ReservationUnitEditor.tooltip.spacePks")}
            />
          )}
        />
        <Controller
          control={control}
          name="resourcePks"
          render={({ field: { value, onChange } }) => (
            // @ts-expect-error - HDS multiselect has weird typings
            <Select<{ label: string; value: number }>
              id="resourcePks"
              multiselect
              label={t("ReservationUnitEditor.label.resourcePks")}
              placeholder={t("ReservationUnitEditor.resourcesPlaceholder")}
              options={resourceOptions}
              disabled={resourceOptions.length === 0}
              onChange={(vals) => onChange(vals.map((y) => y.value))}
              value={resourceOptions.filter((x) => value.includes(x.value))}
              error={getTranslatedError(errors.resourcePks?.message, t)}
              invalid={errors.resourcePks?.message != null}
              tooltipText={t("ReservationUnitEditor.tooltip.resourcePks")}
            />
          )}
        />
        <NumberInput
          {...register("surfaceArea", {
            required: true,
            valueAsNumber: true,
          })}
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
          errorText={getTranslatedError(errors.surfaceArea?.message, t)}
          invalid={errors.surfaceArea?.message != null}
          tooltipText={t("ReservationUnitEditor.tooltip.surfaceArea")}
        />
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
          errorText={getTranslatedError(errors.maxPersons?.message, t)}
          invalid={errors.maxPersons?.message != null}
          required
          tooltipText={t("ReservationUnitEditor.tooltip.maxPersons")}
        />
        <NumberInput
          {...register("minPersons", { required: true, valueAsNumber: true })}
          id="minPersons"
          label={t("ReservationUnitEditor.label.minPersons")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          type="number"
          min={0}
          max={watch("maxPersons") || 1}
          errorText={getTranslatedError(errors.minPersons?.message, t)}
          invalid={errors.minPersons?.message != null}
          tooltipText={t("ReservationUnitEditor.tooltip.minPersons")}
        />
      </AutoGrid>
    </Accordion>
  );
}

function ReservationUnitSettings({
  form,
  parametersData,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  // TODO refactor so we don't pass a query result here
  parametersData: Query | undefined;
}) {
  const { t } = useTranslation();
  const { control, register, watch, formState, setValue } = form;
  const { errors } = formState;

  const reservationStartIntervalOptions = Object.values(
    ReservationUnitsReservationUnitReservationStartIntervalChoices
  ).map((choice) => ({
    value: choice,
    label: t(`reservationStartInterval.${choice}`),
  }));

  const authenticationOptions = Object.values(
    ReservationUnitsReservationUnitAuthenticationChoices
  ).map((choice) => ({
    value: choice,
    label: t(`authentication.${choice}`),
  }));

  const cancellationRuleOptions = filterNonNullable(
    parametersData?.reservationUnitCancellationRules?.edges.map((e) => e?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const metadataOptions = filterNonNullable(
    parametersData?.metadataSets?.edges.map((e) => e?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.name ?? "no-name",
  }));

  // TODO this would be better if we split the form values into objects based on section
  const open =
    errors.reservationBeginsDate != null ||
    errors.reservationEndsDate != null ||
    errors.reservationBeginsTime != null ||
    errors.reservationEndsTime != null ||
    errors.metadataSetPk != null ||
    errors.cancellationRulePk != null ||
    errors.reservationStartInterval != null ||
    errors.reservationsMinDaysBefore != null ||
    errors.reservationsMaxDaysBefore != null ||
    errors.maxReservationDuration != null ||
    errors.minReservationDuration != null;

  return (
    <Accordion open={open} heading={t("ReservationUnitEditor.settings")}>
      <AutoGrid $minWidth="20rem">
        <FieldGroup
          heading={t("ReservationUnitEditor.publishingSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.publishingSettings")}
          style={{ gridColumn: "1 / span 1" }}
        >
          <ActivationGroup
            id="useScheduledPublishing"
            label={t("ReservationUnitEditor.scheduledPublishing")}
            open={watch("hasScheduledPublish")}
            onChange={() =>
              setValue("hasScheduledPublish", !watch("hasScheduledPublish"))
            }
          >
            <DenseVerticalFlex>
              <ActivationGroup
                id="publishBegins"
                label={t("ReservationUnitEditor.publishBegins")}
                open={watch("hasPublishBegins")}
                onChange={() =>
                  setValue("hasPublishBegins", !watch("hasPublishBegins"))
                }
                noIndent
                noMargin
              >
                <DateTimeInput
                  control={control}
                  name={{
                    date: "publishBeginsDate",
                    time: "publishBeginsTime",
                  }}
                />
              </ActivationGroup>

              <ActivationGroup
                id="publishEnds"
                label={t("ReservationUnitEditor.publishEnds")}
                open={watch("hasPublishEnds")}
                onChange={() =>
                  setValue("hasPublishEnds", !watch("hasPublishEnds"))
                }
                noIndent
                noMargin
              >
                <DateTimeInput
                  control={control}
                  name={{ date: "publishEndsDate", time: "publishEndsTime" }}
                />
              </ActivationGroup>
            </DenseVerticalFlex>
          </ActivationGroup>
        </FieldGroup>
        <FieldGroup
          heading={t("ReservationUnitEditor.reservationSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.reservationSettings")}
          style={{ gridColumn: "1 / span 1" }}
        >
          <ActivationGroup
            id="useScheduledReservation"
            label={t("ReservationUnitEditor.scheduledReservation")}
            open={watch("hasScheduledReservation")}
            onChange={() =>
              setValue(
                "hasScheduledReservation",
                !watch("hasScheduledReservation")
              )
            }
          >
            <ActivationGroup
              id="reservationBegins"
              label={t("ReservationUnitEditor.reservationBegins")}
              open={watch("hasReservationBegins")}
              onChange={() =>
                setValue("hasReservationBegins", !watch("hasReservationBegins"))
              }
              noIndent
            >
              <DateTimeInput
                control={control}
                name={{
                  date: "reservationBeginsDate",
                  time: "reservationBeginsTime",
                }}
                minDate={addDays(new Date(), 1)}
              />
            </ActivationGroup>
            <ActivationGroup
              id="reservationEnds"
              label={t("ReservationUnitEditor.reservationEnds")}
              open={watch("hasReservationEnds")}
              onChange={() =>
                setValue("hasReservationEnds", !watch("hasReservationEnds"))
              }
              noIndent
            >
              <DateTimeInput
                control={control}
                name={{
                  date: "reservationEndsDate",
                  time: "reservationEndsTime",
                }}
                minDate={addDays(new Date(), 1)}
              />
            </ActivationGroup>
          </ActivationGroup>
        </FieldGroup>
        <Controller
          control={control}
          name="minReservationDuration"
          render={({ field: { value, onChange } }) => (
            <Select
              id="minReservationDuration"
              options={durationOptions}
              placeholder={t("common.select")}
              style={{ gridColumnStart: "1" }}
              required
              label={t("ReservationUnitEditor.label.minReservationDuration")}
              onChange={(v: { value: number; label: string }) =>
                onChange(v.value)
              }
              value={durationOptions.find((o) => o.value === value) ?? null}
              error={getTranslatedError(
                errors.minReservationDuration?.message,
                t
              )}
              invalid={errors.minReservationDuration?.message != null}
              tooltipText={t(
                "ReservationUnitEditor.tooltip.minReservationDuration"
              )}
            />
          )}
        />
        <Controller
          control={control}
          name="maxReservationDuration"
          render={({ field: { value, onChange } }) => (
            <Select
              id="maxReservationDuration"
              placeholder={t("common.select")}
              required
              options={durationOptions}
              onChange={(v: { value: number; label: string }) =>
                onChange(v.value)
              }
              value={durationOptions.find((o) => o.value === value) ?? null}
              label={t("ReservationUnitEditor.label.maxReservationDuration")}
              error={getTranslatedError(
                errors.maxReservationDuration?.message,
                t
              )}
              invalid={errors.maxReservationDuration?.message != null}
              tooltipText={t(
                "ReservationUnitEditor.tooltip.maxReservationDuration"
              )}
            />
          )}
        />
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
              onChange={(v: { value: number; label: string }) =>
                onChange(v.value)
              }
              value={
                reservationsMaxDaysBeforeOptions.find(
                  (o) => o.value === value
                ) ?? null
              }
              error={getTranslatedError(
                errors.reservationsMaxDaysBefore?.message,
                t
              )}
              invalid={errors.reservationsMaxDaysBefore?.message != null}
              tooltipText={t(
                "ReservationUnitEditor.tooltip.reservationsMaxDaysBefore"
              )}
            />
          )}
        />
        <NumberInput
          {...register("reservationsMinDaysBefore", { required: true })}
          id="reservationsMinDaysBefore"
          label={t("ReservationUnitEditor.label.reservationsMinDaysBefore")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          step={1}
          type="number"
          max={watch("reservationsMaxDaysBefore")}
          min={0}
          required
          errorText={getTranslatedError(
            errors.reservationsMinDaysBefore?.message,
            t
          )}
          invalid={errors.reservationsMinDaysBefore?.message != null}
          tooltipText={t(
            "ReservationUnitEditor.tooltip.reservationsMinDaysBefore"
          )}
        />
        <Controller
          control={control}
          name="reservationStartInterval"
          render={({ field: { value, onChange } }) => (
            <Select
              id="reservationStartInterval"
              placeholder={t("common.select")}
              options={reservationStartIntervalOptions}
              required
              value={
                reservationStartIntervalOptions.find(
                  (o) => o.value === value
                ) ?? null
              }
              onChange={(val: {
                value: ReservationUnitsReservationUnitReservationStartIntervalChoices;
                label: string;
              }) => onChange(val)}
              error={getTranslatedError(
                errors.reservationStartInterval?.message,
                t
              )}
              invalid={errors.reservationStartInterval?.message != null}
              label={t("ReservationUnitEditor.label.reservationStartInterval")}
              tooltipText={t(
                "ReservationUnitEditor.tooltip.reservationStartInterval"
              )}
            />
          )}
        />
        <FieldGroup
          heading={t("ReservationUnitEditor.bufferSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.bufferSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <Grid>
            <Span6>
              <ActivationGroup
                id="bufferTimeBeforeGroup"
                label={t("ReservationUnitEditor.bufferTimeBefore")}
                open={watch("hasBufferTimeBefore")}
                onChange={() =>
                  setValue("hasBufferTimeBefore", !watch("hasBufferTimeBefore"))
                }
              >
                <Controller
                  control={control}
                  name="bufferTimeBefore"
                  render={({ field: { value, onChange } }) => (
                    <Select
                      id="bufferTimeBefore"
                      options={bufferTimeOptions}
                      label={t(
                        "ReservationUnitEditor.bufferTimeBeforeDuration"
                      )}
                      onChange={(v: { value: number; label: string }) =>
                        onChange(v.value)
                      }
                      value={
                        bufferTimeOptions.find((o) => o.value === value) ?? null
                      }
                    />
                  )}
                />
              </ActivationGroup>
            </Span6>
            <Span6>
              <ActivationGroup
                id="bufferTimeAfterGroup"
                label={t("ReservationUnitEditor.bufferTimeAfter")}
                open={watch("hasBufferTimeAfter")}
                onChange={() =>
                  setValue("hasBufferTimeAfter", !watch("hasBufferTimeAfter"))
                }
              >
                <Controller
                  control={control}
                  name="bufferTimeAfter"
                  render={({ field: { value, onChange } }) => (
                    <Select
                      id="bufferTimeAfter"
                      label={t("ReservationUnitEditor.bufferTimeAfterDuration")}
                      options={bufferTimeOptions}
                      onChange={(v: { value: number; label: string }) =>
                        onChange(v.value)
                      }
                      value={
                        bufferTimeOptions.find(
                          (option) => option.value === value
                        ) ?? null
                      }
                    />
                  )}
                />
              </ActivationGroup>
            </Span6>
          </Grid>
        </FieldGroup>
        <FieldGroup
          heading={t("ReservationUnitEditor.cancellationSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.cancellationSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <ActivationGroup
            id="cancellationIsPossible"
            label={t("ReservationUnitEditor.cancellationIsPossible")}
            open={watch("hasCancellationRule")}
            onChange={() =>
              setValue("hasCancellationRule", !watch("hasCancellationRule"))
            }
          >
            <Controller
              control={control}
              name="cancellationRulePk"
              render={({ field: { value, onChange } }) => (
                <SelectionGroup
                  required
                  label={t("ReservationUnitEditor.cancellationGroupLabel")}
                  errorText={getTranslatedError(
                    errors.cancellationRulePk?.message,
                    t
                  )}
                >
                  {cancellationRuleOptions.map((o) => (
                    <RadioButton
                      key={o.value}
                      id={`cr-${o.value}`}
                      value={o.value.toString()}
                      label={o.label}
                      onChange={(e) => onChange(Number(e.target.value))}
                      checked={value === o.value}
                    />
                  ))}
                </SelectionGroup>
              )}
            />
          </ActivationGroup>
        </FieldGroup>
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
              onChange={(v: { label: string; value: number }) =>
                onChange(v.value)
              }
              value={metadataOptions.find((o) => o.value === value) ?? null}
              error={getTranslatedError(errors.metadataSetPk?.message, t)}
              invalid={errors.metadataSetPk?.message != null}
              tooltipText={t("ReservationUnitEditor.tooltip.metadataSetPk")}
            />
          )}
        />
        <Controller
          control={control}
          name="authentication"
          render={({ field: { value, onChange } }) => (
            <Select
              // sort
              id="authentication"
              required
              options={authenticationOptions}
              value={
                authenticationOptions.find((o) => o.value === value) ?? null
              }
              onChange={(val: {
                value: ReservationUnitsReservationUnitAuthenticationChoices;
                label: string;
              }) => onChange(val.value)}
              label={t("ReservationUnitEditor.authenticationLabel")}
              tooltipText={t("ReservationUnitEditor.tooltip.authentication")}
            />
          )}
        />
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
          tooltipText={t(
            "ReservationUnitEditor.tooltip.maxReservationsPerUser"
          )}
        />
        <FieldGroup
          heading={t("ReservationUnitEditor.introductionSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.introductionSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <Controller
            control={control}
            name="requireIntroduction"
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
        <FieldGroup
          heading={t("ReservationUnitEditor.handlingSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.handlingSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <Controller
            control={control}
            name="requireReservationHandling"
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
      </AutoGrid>
    </Accordion>
  );
}

function PricingSection({
  form,
  taxPercentageOptions,
  pricingTermsOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: { value: number; label: string }[];
  pricingTermsOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const { control, watch, formState } = form;
  const { errors } = formState;

  const isFuturePriceVisible = watch("hasFuturePricing");
  const isPaid =
    watch("pricings")
      .filter((p) => p?.pricingType === "PAID")
      .filter(
        (p) =>
          p.status ===
            ReservationUnitsReservationUnitPricingStatusChoices.Active ||
          isFuturePriceVisible
      ).length > 0;

  const hasErrors = errors.pricings != null || errors.paymentTypes != null;
  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.label.pricings")}
    >
      <VerticalFlex>
        {watch("pricings").map(
          (pricing, index) =>
            pricing?.status ===
              ReservationUnitsReservationUnitPricingStatusChoices.Active && (
              <FieldGroup
                // eslint-disable-next-line react/no-array-index-key -- TODO refactor to use pk / fake pks
                key={index}
                id="pricings"
                heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
              >
                <PricingType
                  // TODO form index is bad, use pk or form key
                  index={index}
                  form={form}
                  taxPercentageOptions={taxPercentageOptions}
                />
              </FieldGroup>
            )
        )}
        <Controller
          control={control}
          name="hasFuturePricing"
          render={({ field: { value, onChange } }) => (
            <Checkbox
              checked={value}
              onChange={() => onChange(!value)}
              label={t("ReservationUnitEditor.label.priceChange")}
              id="hasFuturePrice"
            />
          )}
        />
        {watch("hasFuturePricing") &&
          watch("pricings").map(
            (pricing, index) =>
              pricing.status ===
                ReservationUnitsReservationUnitPricingStatusChoices.Future && (
                <FieldGroup
                  // eslint-disable-next-line react/no-array-index-key -- TODO refactor to use pk / fake pks
                  key={index}
                  id="pricings"
                  heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                  tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
                >
                  <PricingType
                    // TODO form index is bad, use pk or form key
                    index={index}
                    form={form}
                    taxPercentageOptions={taxPercentageOptions}
                  />
                </FieldGroup>
              )
          )}
        {isPaid && (
          // TODO this should be outside the pricing type because it's reservation unit wide
          <HorisontalFlex style={{ justifyContent: "space-between" }}>
            <Controller
              control={control}
              name="canApplyFreeOfCharge"
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
        {watch("canApplyFreeOfCharge") && isPaid && (
          <Controller
            control={control}
            name="pricingTerms"
            render={({ field: { value, onChange } }) => (
              <Select
                id="pricingTerms"
                label={t("ReservationUnitEditor.label.pricingTermsPk")}
                placeholder={t("common.select")}
                required
                clearable
                options={pricingTermsOptions}
                value={
                  pricingTermsOptions.find((o) => o.value === value) ?? null
                }
                onChange={(val: { value: string; label: string }) =>
                  onChange(val.value)
                }
                tooltipText={t("ReservationUnitEditor.tooltip.pricingTermsPk")}
              />
            )}
          />
        )}
      </VerticalFlex>
    </Accordion>
  );
}

function TermsSection({
  form,
  serviceSpecificTermsOptions,
  paymentTermsOptions,
  cancellationTermsOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  serviceSpecificTermsOptions: { value: string; label: string }[];
  paymentTermsOptions: { value: string; label: string }[];
  cancellationTermsOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const hasErrors =
    errors.termsOfUseFi != null ||
    errors.termsOfUseEn != null ||
    errors.termsOfUseSv != null;
  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.termsInstructions")}
    >
      <AutoGrid $minWidth="20rem">
        {(
          [
            "serviceSpecificTermsPk",
            "paymentTermsPk",
            "cancellationTermsPk",
          ] as const
        ).map((name) => {
          const options =
            name === "serviceSpecificTermsPk"
              ? serviceSpecificTermsOptions
              : name === "cancellationTermsPk"
              ? cancellationTermsOptions
              : paymentTermsOptions;
          return (
            <Controller
              control={control}
              name={name}
              key={name}
              render={({ field }) => (
                <Select
                  clearable
                  // sort
                  id={name}
                  label={t(`ReservationUnitEditor.label.${name}`)}
                  placeholder={t(`ReservationUnitEditor.termsPlaceholder`)}
                  options={options}
                  value={options.find((o) => o.value === field.value) ?? null}
                  onChange={(val?: { value: string; label: string }) =>
                    field.onChange(val?.value)
                  }
                  tooltipText={t(`ReservationUnitEditor.tooltip.${name}`)}
                />
              )}
            />
          );
        })}
        {(["termsOfUseFi", "termsOfUseEn", "termsOfUseSv"] as const).map(
          (fieldName) => (
            <Controller
              control={control}
              name={fieldName}
              key={fieldName}
              render={({ field }) => (
                <RichTextInput
                  {...field}
                  required
                  id={fieldName}
                  label={t(`ReservationUnitEditor.label.${fieldName}`)}
                  errorText={getTranslatedError(errors[fieldName]?.message, t)}
                  style={{ gridColumn: "1 / -1" }}
                  // TODO do we want to hide the tooltip for others than Fi?
                  tooltipText={t("ReservationUnitEditor.tooltip.termsOfUseFi")}
                />
              )}
            />
          )
        )}
      </AutoGrid>
    </Accordion>
  );
}

function CommunicationSection({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const { errors } = formState;

  // NOTE no required fields
  return (
    <Accordion heading={t("ReservationUnitEditor.communication")}>
      <VerticalFlex>
        <SlimH4>{t("ReservationUnitEditor.pendingInstructions")}</SlimH4>
        {(
          [
            "reservationPendingInstructionsFi",
            "reservationPendingInstructionsEn",
            "reservationPendingInstructionsSv",
          ] as const
        ).map((fieldName) => (
          <Controller
            key={fieldName}
            control={control}
            name={fieldName}
            render={({ field }) => (
              <TextArea
                {...field}
                id={fieldName}
                label={t(`ReservationUnitEditor.label.${fieldName}`)}
                errorText={getTranslatedError(errors[fieldName]?.message, t)}
                invalid={errors[fieldName]?.message != null}
                /* FIXME
                tooltipText={t("ReservationUnitEditor.tooltip.termsOfUseFi")}
                tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationPendingInstructionsFi") : "" }
                */
              />
            )}
          />
        ))}
        <SlimH4>{t("ReservationUnitEditor.confirmedInstructions")}</SlimH4>
        {(
          [
            "reservationConfirmedInstructionsFi",
            "reservationConfirmedInstructionsEn",
            "reservationConfirmedInstructionsSv",
          ] as const
        ).map((fieldName) => (
          <Controller
            control={control}
            name={fieldName}
            key={fieldName}
            render={({ field }) => (
              <TextArea
                {...field}
                id={fieldName}
                label={t(`ReservationUnitEditor.label.${fieldName}`)}
                errorText={getTranslatedError(errors[fieldName]?.message, t)}
                invalid={errors[fieldName]?.message != null}
                /* FIXME tr key
                label={t( `ReservationUnitEditor.label.instructions${upperFirst( lang)}`)}
                tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationConfirmedInstructionsFi") : "" }
                */
              />
            )}
          />
        ))}
        <SubAccordion
          // don't open there is no errors under this
          heading={t("ReservationUnitEditor.cancelledSubAccordion")}
          headingLevel="h3"
        >
          <SlimH4>{t("ReservationUnitEditor.cancelledInstructions")}</SlimH4>
          {(
            [
              "reservationCancelledInstructionsFi",
              "reservationCancelledInstructionsEn",
              "reservationCancelledInstructionsSv",
            ] as const
          ).map((fieldName) => (
            <Controller
              control={control}
              name={fieldName}
              key={fieldName}
              render={({ field }) => (
                <TextArea
                  {...field}
                  id={fieldName}
                  label={t(`ReservationUnitEditor.label.${fieldName}`)}
                  errorText={getTranslatedError(errors[fieldName]?.message, t)}
                  invalid={errors[fieldName]?.message != null}
                  /* TODO rename the keys
                    tooltipText={ lang === "fi" ? t( "ReservationUnitEditor.tooltip.reservationCancelledInstructionsFi") : "" }
                    */
                />
              )}
            />
          ))}
        </SubAccordion>
        <TextInput
          {...register("contactInformation")}
          id="contactInformation"
          label={t("ReservationUnitEditor.contactInformationLabel")}
          helperText={t("ReservationUnitEditor.contactInformationHelperText")}
          tooltipText={t("ReservationUnitEditor.tooltip.contactInformation")}
        />
      </VerticalFlex>
    </Accordion>
  );
}

function OpeningHoursSection({
  reservationUnit,
}: {
  // TODO can we simplify this by passing the hauki url only?
  reservationUnit: ReservationUnitByPkType | undefined;
}) {
  const { t } = useTranslation();

  const previewUrl = `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}#calendar`;
  const previewDisabled =
    !previewUrlPrefix || !reservationUnit?.pk || !reservationUnit?.uuid;

  // TODO refactor this to inner wrapper (so we don't have a ternary in the middle)
  return (
    <Accordion heading={t("ReservationUnitEditor.openingHours")}>
      {reservationUnit?.haukiUrl?.url ? (
        <AutoGrid>
          <p style={{ gridColumn: "1 / -1" }}>
            {t("ReservationUnitEditor.openingHoursHelperTextHasLink")}
          </p>
          <ButtonLikeLink
            disabled={!reservationUnit?.haukiUrl?.url}
            to={reservationUnit?.haukiUrl?.url ?? ""}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("ReservationUnitEditor.openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
          <ButtonLikeLink
            disabled={previewDisabled}
            to={previewUrl}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("ReservationUnitEditor.previewCalendarLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
        </AutoGrid>
      ) : (
        <p>{t("ReservationUnitEditor.openingHoursHelperTextNoLink")}</p>
      )}
    </Accordion>
  );
}

function DescriptionSection({
  form,
  equipments,
  purposes,
  qualifiers,
  reservationUnitTypes,
  images,
  handleImageChange,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  equipments: EquipmentType[];
  purposes: PurposeType[];
  qualifiers: QualifierType[];
  reservationUnitTypes: ReservationUnitTypeType[];
  images: Image[];
  handleImageChange: (images: Image[]) => void;
}) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const equipmentOptions = equipments.map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const purposeOptions = purposes.map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const qualifierOptions = qualifiers.map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = reservationUnitTypes.map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const hasErrors =
    errors.reservationUnitTypePk != null ||
    errors.descriptionFi != null ||
    errors.descriptionEn != null ||
    errors.descriptionSv != null;

  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.typesProperties")}
    >
      <Grid>
        <Span6>
          <Controller
            control={control}
            name="reservationUnitTypePk"
            render={({ field: { value, onChange } }) => (
              <Select
                // sort
                required
                id="reservationUnitTypePk"
                label={t(`ReservationUnitEditor.label.reservationUnitTypePk`)}
                placeholder={t(
                  `ReservationUnitEditor.reservationUnitTypePlaceholder`
                )}
                options={reservationUnitTypeOptions}
                onChange={(x: { value: number; label: string }) =>
                  onChange(x.value)
                }
                value={
                  reservationUnitTypeOptions.find((x) => x.value === value) ??
                  null
                }
                helper={t(
                  "ReservationUnitEditor.reservationUnitTypeHelperText"
                )}
                error={getTranslatedError(
                  errors.reservationUnitTypePk?.message,
                  t
                )}
                invalid={errors.reservationUnitTypePk?.message != null}
                tooltipText={t(
                  "ReservationUnitEditor.tooltip.reservationUnitTypePk"
                )}
              />
            )}
          />
        </Span6>
        <Span6>
          <Controller
            control={control}
            name="purposePks"
            render={({ field: { value, onChange } }) => (
              // @ts-expect-error - HDS multiselect has weird typings
              <Select<{ label: string; value: number }>
                multiselect
                label={t("ReservationUnitEditor.purposesLabel")}
                placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
                options={purposeOptions}
                disabled={purposeOptions.length === 0}
                onChange={(vals) => onChange(vals.map((y) => y.value))}
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
              // @ts-expect-error - HDS multiselect has weird typings
              <Select<{ label: string; value: number }>
                multiselect
                label={t("ReservationUnitEditor.equipmentsLabel")}
                placeholder={t("ReservationUnitEditor.equipmentsPlaceholder")}
                options={equipmentOptions}
                disabled={equipmentOptions.length === 0}
                onChange={(vals) => onChange(vals.map((y) => y.value))}
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
              // @ts-expect-error - HDS multiselect has weird typings
              <Select<{ label: string; value: number }>
                multiselect
                label={t("ReservationUnitEditor.qualifiersLabel")}
                placeholder={t("ReservationUnitEditor.qualifiersPlaceholder")}
                options={qualifierOptions}
                disabled={qualifierOptions.length === 0}
                onChange={(vals) => onChange(vals.map((y) => y.value))}
                value={qualifierOptions.filter((x) => value.includes(x.value))}
                tooltipText={t("ReservationUnitEditor.tooltip.qualifiers")}
              />
            )}
          />
        </Span6>
        {(["descriptionFi", "descriptionEn", "descriptionSv"] as const).map(
          (fieldName) => (
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
                    errorText={getTranslatedError(
                      errors[fieldName]?.message,
                      t
                    )}
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
  );
}

// TODO move to form.ts
function transformReservationUnit(
  values: ReservationUnitEditFormValues
): ReservationUnitUpdateMutationInput | ReservationUnitCreateMutationInput {
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
    hasScheduledPublish, // ignored just a ui variables
    hasScheduledReservation, // ignored just a ui variables
    hasPublishBegins,
    hasPublishEnds,
    hasReservationBegins,
    hasReservationEnds,
    hasBufferTimeBefore,
    hasBufferTimeAfter,
    hasCancellationRule,
    bufferTimeAfter,
    bufferTimeBefore,
    cancellationRulePk,
    termsOfUseEn,
    termsOfUseFi,
    termsOfUseSv,
    ...vals
  } = values;

  const shouldSavePricing = (p: PricingFormValues) =>
    hasFuturePricing ||
    p.status === ReservationUnitsReservationUnitPricingStatusChoices.Active;
  return {
    ...vals,
    ...(pk ? { pk } : {}),
    surfaceArea:
      surfaceArea != null && surfaceArea > 0 ? Math.ceil(surfaceArea) : null,
    reservationBegins: hasReservationBegins
      ? constructApiDate(reservationBeginsDate, reservationBeginsTime)
      : null,
    reservationEnds: hasReservationEnds
      ? constructApiDate(reservationEndsDate, reservationEndsTime)
      : null,
    publishBegins: hasPublishBegins
      ? constructApiDate(publishBeginsDate, publishBeginsTime)
      : null,
    publishEnds: hasPublishEnds
      ? constructApiDate(publishEndsDate, publishEndsTime)
      : null,
    bufferTimeAfter: hasBufferTimeAfter ? bufferTimeAfter : null,
    bufferTimeBefore: hasBufferTimeBefore ? bufferTimeBefore : null,
    isDraft,
    isArchived,
    termsOfUseEn: termsOfUseEn !== "" ? termsOfUseEn : null,
    termsOfUseFi: termsOfUseFi !== "" ? termsOfUseFi : null,
    termsOfUseSv: termsOfUseSv !== "" ? termsOfUseSv : null,
    cancellationRulePk: hasCancellationRule ? cancellationRulePk : null,
    // TODO only one active price can be saved
    // the form doesn't allow multiples but make sure here that we only have one active and one future and warn the user if not
    pricings: filterNonNullable(pricings)
      .filter(shouldSavePricing)
      .map((p) => ({
        begins: toApiDate(fromUIDate(p.begins)) ?? "",
        highestPrice: Number(p.highestPrice),
        highestPriceNet: Number(p.highestPriceNet),
        lowestPrice: Number(p.lowestPrice),
        lowestPriceNet: Number(p.lowestPriceNet),
        ...(p.pk !== 0 ? { pk: p.pk } : {}),
        ...(p.priceUnit != null ? { priceUnit: p.priceUnit } : {}),
        pricingType: p.pricingType,
        status: p.status,
        ...(p.taxPercentage.pk !== 0
          ? { taxPercentagePk: p.taxPercentage.pk }
          : {}),
      })),
  };
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
  // ----------------------------- State and Hooks ----------------------------
  const { t } = useTranslation();
  const history = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const { setModalContent } = useModal();
  const [reconcileImageChanges] = useImageMutations();
  // TODO should the images be inside the form state?
  const [images, setImages] = useState<Image[]>(reservationUnit?.images ?? []);

  const [updateMutation] = useMutation<
    Mutation,
    MutationUpdateReservationUnitArgs
  >(UPDATE_RESERVATION_UNIT);
  const [createMutation] = useMutation<
    Mutation,
    MutationCreateReservationUnitArgs
  >(CREATE_RESERVATION_UNIT);
  // Helper functions (can we remove these?)
  const updateReservationUnit = (input: ReservationUnitUpdateMutationInput) =>
    updateMutation({ variables: { input } });
  const createReservationUnit = (input: ReservationUnitCreateMutationInput) =>
    createMutation({ variables: { input } });

  const { data: unitResourcesData } = useQuery<Query, QueryUnitByPkArgs>(
    UNIT_WITH_SPACES_AND_RESOURCES,
    {
      skip: !unitPk,
      variables: { pk: Number(unitPk) },
      onError: (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

  const { data: parametersData } = useQuery<Query>(
    RESERVATION_UNIT_EDITOR_PARAMETERS,
    {
      onError: (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
        notifyError(t("errors.errorFetchingData"));
      },
    }
  );

  // ----------------------------- Constants ---------------------------------
  const { getValues, setValue, watch, formState, handleSubmit } = form;
  const { isDirty, isSubmitting } = formState;

  const paymentTermsOptions = makeTermsOptions(
    parametersData,
    TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms
  );
  const pricingTermsOptions = makeTermsOptions(
    parametersData,
    TermsOfUseTermsOfUseTermsTypeChoices.PricingTerms
  );
  const taxPercentageOptions = filterNonNullable(
    parametersData?.taxPercentages?.edges.map((e) => e?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.value.toString(),
  }));
  const serviceSpecificTermsOptions = makeTermsOptions(
    parametersData,
    TermsOfUseTermsOfUseTermsTypeChoices.ServiceTerms
  );
  const cancellationTermsOptions = makeTermsOptions(
    parametersData,
    TermsOfUseTermsOfUseTermsTypeChoices.CancellationTerms
  );

  const unit = unitResourcesData?.unitByPk ?? undefined;
  const spaces = filterNonNullable(unit?.spaces);
  const equipments = filterNonNullable(
    parametersData?.equipments?.edges?.map((e) => e?.node)
  );
  const purposes = filterNonNullable(
    parametersData?.purposes?.edges?.map((e) => e?.node)
  );
  const qualifiers = filterNonNullable(
    parametersData?.qualifiers?.edges?.map((e) => e?.node)
  );
  const reservationUnitTypes = filterNonNullable(
    parametersData?.reservationUnitTypes?.edges?.map((e) => e?.node)
  );

  const isDirect =
    watch("reservationKind") === "DIRECT" ||
    watch("reservationKind") === "DIRECT_AND_SEASON";

  // ----------------------------- Callbacks ----------------------------------
  const handleImageChange = (imgs: Image[]) => {
    setImages(imgs);
  };

  const onSubmit = async (formValues: ReservationUnitEditFormValues) => {
    const input = transformReservationUnit(formValues);
    try {
      const promise =
        "pk" in input
          ? updateReservationUnit(input)
          : createReservationUnit(input);
      const { data, errors: mutationErrors } = await promise;
      if (mutationErrors != null) {
        notifyError(
          t("ReservationUnitEditor.saveFailed", { error: mutationErrors })
        );
        return undefined;
      }

      const dataErrors =
        data?.updateReservationUnit?.errors ??
        data?.createReservationUnit?.errors;

      if (dataErrors) {
        notifyError(
          t("ReservationUnitEditor.saveFailed", { error: dataErrors })
        );
        return undefined;
      }

      const pk =
        data?.updateReservationUnit?.pk ?? data?.createReservationUnit?.pk;

      if (pk) {
        // res unit is saved, we can save changes to images
        const success = await reconcileImageChanges(pk, images);
        if (success) {
          // TODO should we refetch? if we stay on the page? maybe but the reset of form isn't working atm
          // NOTE redirect if new one was created
          if (formValues.pk === 0 && pk > 0) {
            history(`/unit/${unitPk}/reservationUnit/edit/${pk}`);
          }
          const tkey =
            formValues.pk === 0
              ? "ReservationUnitEditor.reservationUnitUpdatedNotification"
              : "ReservationUnitEditor.reservationUnitCreatedNotification";
          notifySuccess(t(tkey, { name: getValues("nameFi") }));
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
  };

  // Have to define these like this because otherwise the state changes don't work
  // TODO this seems to not publish (at least the Tag on the page says draft after this, even after refresh)
  const handlePublish = async () => {
    setValue("isDraft", false);
    setValue("isArchived", false);
    await handleSubmit(onSubmit)();
  };

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    await handleSubmit(onSubmit)();
  };

  const handleAcceptArchive = async () => {
    setValue("isArchived", true);
    try {
      await handleSubmit(onSubmit)();
      setModalContent(null);
      notifySuccess(t("ArchiveReservationUnitDialog.success"));
      history(`/unit/${unit?.pk}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("unable to archive", e);
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

  const isSaving = isSubmitting;
  const hasChanges = isDirty;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ContainerMedium>
        <DisplayUnit
          heading={
            reservationUnit?.nameFi ?? t("ReservationUnitEditor.defaultHeading")
          }
          unit={unit}
          reservationState={reservationUnit?.reservationState ?? undefined}
          unitState={reservationUnit?.state ?? undefined}
        />
        <BasicSection form={form} spaces={spaces} />
        <DescriptionSection
          form={form}
          equipments={equipments}
          purposes={purposes}
          qualifiers={qualifiers}
          reservationUnitTypes={reservationUnitTypes}
          images={images}
          handleImageChange={handleImageChange}
        />
        {isDirect && (
          <ReservationUnitSettings
            form={form}
            parametersData={parametersData}
          />
        )}
        <PricingSection
          form={form}
          taxPercentageOptions={taxPercentageOptions}
          pricingTermsOptions={pricingTermsOptions}
        />
        {isDirect && (
          <TermsSection
            form={form}
            serviceSpecificTermsOptions={serviceSpecificTermsOptions}
            paymentTermsOptions={paymentTermsOptions}
            cancellationTermsOptions={cancellationTermsOptions}
          />
        )}
        <CommunicationSection form={form} />
        <OpeningHoursSection reservationUnit={reservationUnit} />
        <div>
          <ArchiveButton
            onClick={handleArchiveButtonClick}
            variant="secondary"
            disabled={isSaving || getValues("pk") === 0}
            theme="black"
          >
            {t("ReservationUnitEditor.archive")}
          </ArchiveButton>
        </div>
      </ContainerMedium>
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
      </ButtonsStripe>
    </form>
  );
};

type IRouterProps = {
  reservationUnitPk?: string;
  unitPk: string;
};

/// Wrap the editor so we never reset the form after async loading (because of HDS TimeInput bug)
function EditorWrapper() {
  const { reservationUnitPk, unitPk } = useParams<IRouterProps>();
  const { t } = useTranslation();

  const {
    data: reservationUnitData,
    loading: isLoading,
    refetch,
  } = useQuery<Query, QueryReservationUnitByPkArgs>(RESERVATIONUNIT_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
    skip:
      !reservationUnitPk ||
      Number(reservationUnitPk) === 0 ||
      Number.isNaN(Number(reservationUnitPk)),
  });

  const reservationUnit = reservationUnitData?.reservationUnitByPk ?? undefined;

  // NOTE override the unitPk from the url for new units
  // there is no harm in doing it to existing units either (since it should be valid)
  const form = useForm<ReservationUnitEditFormValues>({
    mode: "onSubmit",
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
  }, [reservationUnitData, reset, unitPk]);

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

  const route = [
    { slug: "", alias: t("breadcrumb.spaces-n-settings") },
    {
      slug: `${publicUrl}${reservationUnitsUrl}`,
      alias: t("breadcrumb.reservation-units"),
    },
    { slug: "", alias: reservationUnit?.nameFi || "-" },
  ];
  const backLink = reservationUnitPk == null ? `/unit/${unitPk}` : undefined;
  return (
    <Wrapper>
      <BreadcrumbWrapper route={route} backLink={backLink} />
      <ReservationUnitEditor
        reservationUnit={reservationUnit}
        form={form}
        unitPk={unitPk}
        refetch={refetch}
      />
    </Wrapper>
  );
}

export default EditorWrapper;
