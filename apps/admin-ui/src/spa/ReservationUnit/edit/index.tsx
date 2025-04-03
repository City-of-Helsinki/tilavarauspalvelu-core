import React, { useEffect } from "react";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  IconArrowLeft,
  IconLinkExternal,
  LoadingSpinner,
  Notification,
  TextInput,
  Tooltip,
} from "hds-react";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import dynamic from "next/dynamic";
import {
  Control,
  Controller,
  UseFormReturn,
  useController,
  useForm,
} from "react-hook-form";
import { type TFunction, useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReservationStartInterval,
  Authentication,
  type ReservationUnitPublishingState,
  type ReservationUnitReservationState,
  TermsType,
  ImageType,
  useUnitWithSpacesAndResourcesQuery,
  useDeleteImageMutation,
  useUpdateImageMutation,
  type UnitWithSpacesAndResourcesQuery,
  useReservationUnitEditorParametersQuery,
  type ReservationUnitEditorParametersQuery,
  type ReservationUnitEditQuery,
  useCreateImageMutation,
  useCreateReservationUnitMutation,
  useUpdateReservationUnitMutation,
  useReservationUnitEditQuery,
  EquipmentOrderingChoices,
  ReservationKind,
} from "@gql/gql-types";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { DateTimeInput } from "common/src/components/form/DateTimeInput";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { H1, H4, fontBold, fontMedium } from "common/src/common/typography";
import { breakpoints } from "common";
import {
  AutoGrid,
  FullRow,
  Flex,
  TitleSection,
  CenterSpinner,
  WhiteButton,
} from "common/styles/util";
import { errorToast, successToast } from "common/src/common/toast";
import { useModal } from "@/context/ModalContext";
import { parseAddress, getTranslatedError } from "@/common/util";
import Error404 from "@/common/Error404";
import { Accordion as AccordionBase } from "@/component/Accordion";
import { ControlledNumberInput } from "common/src/components/form/ControlledNumberInput";
import { ArchiveDialog } from "./ArchiveDialog";
import { ReservationStateTag, ReservationUnitStateTag } from "./tags";
import { ActivationGroup } from "./ActivationGroup";
import { ImageEditor } from "./ImageEditor";
import { PricingTypeView, TaxOption } from "./PricingType";
import { GenericDialog } from "./GenericDialog";
import {
  type ReservationUnitEditFormValues,
  ReservationUnitEditSchema,
  convertReservationUnit,
  transformReservationUnit,
  type ImageFormType,
  BUFFER_TIME_OPTIONS,
} from "./form";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { SeasonalSection } from "./SeasonalSection";
import { getValidationErrors } from "common/src/apolloUtils";
import { getReservationUnitUrl, getUnitUrl } from "@/common/urls";
import { pageSideMargins } from "common/styles/layout";
import { ControlledCheckbox } from "common/src/components/form/ControlledCheckbox";
import { ControlledRadioGroup } from "common/src/components/form";
import { gql } from "@apollo/client";

const RichTextInput = dynamic(
  () => import("../../../component/RichTextInput"),
  {
    ssr: false,
  }
);

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

const Accordion = styled(AccordionBase)`
  & h2 {
    --header-padding: var(--spacing-s);
  }
`;

// Override the Accordion style: force border even if the accordion is open
// because the last section is not an accordion but a button and it looks funny otherwise
// TODO should we limit the width of the text boxes? or the whole form?
const StyledContainerMedium = styled(Flex)`
  & > div:nth-last-of-type(2) > div {
    /* stylelint-disable-next-line csstools/value-no-unknown-custom-properties */
    border-bottom: 1px solid var(--border-color);
  }

  /* NOTE some magic values so the sticky buttons don't hide the bottom of the page */
  padding-bottom: 16rem;
  @media (min-width: ${breakpoints.m}) {
    padding-bottom: 8rem;
  }
`;

const SubAccordion = styled(Accordion)`
  border-bottom: none !important;
  & {
    --header-font-size: var(--fontsize-heading-xs);
    h3 {
      color: var(--color-bus);
    }
  }

  > div:nth-of-type(1) > div {
    display: flex;
    flex-direction: row;
    > div {
      font-size: var(--fontsize-heading-xxs);
      ${fontMedium}
      color: var(--color-bus);
      line-height: 1.5;
    }
    svg {
      margin: 0;
      color: var(--color-bus);
    }
  }
`;

const PreviewLink = styled.a`
  display: flex;
  place-items: center;
  border: 2px solid var(--color-white);
  background-color: transparent;
  text-decoration: none;

  opacity: 0.5;
  cursor: not-allowed;
  color: var(--color-white);

  :link,
  :visited {
    opacity: 1;
    color: var(--color-white);
    cursor: pointer;
    &:hover {
      background-color: var(--color-white);
      color: var(--color-black);
    }
  }

  > span {
    margin: 0 var(--spacing-m);
  }
`;

const ButtonsStripe = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);

  padding: var(--spacing-s) 0;
  ${pageSideMargins}

  /* back button should be left aligned */
  gap: var(--spacing-m);
  & > *:first-child {
    margin-right: auto;
  }

  /* four buttons is too much on mobile */
  & > *:nth-child(2) {
    display: none;
  }
  @media (min-width: ${breakpoints.s}) {
    & > *:nth-child(2) {
      display: flex;
    }
  }
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

// Terms PK is not a number but any valid string
const makeTermsOptions = (
  parameters: ReservationUnitEditorParametersQuery | undefined,
  termsType: TermsType
) => {
  return filterNonNullable(parameters?.termsOfUse?.edges.map((e) => e?.node))
    .filter((tou) => termsType === tou?.termsType)
    .map((tou) => {
      return {
        value: tou?.pk ?? "",
        label: tou?.nameFi ?? "no-name",
      };
    });
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
  display: block;
  ${fontBold}
`;

function FieldGroup({
  children,
  heading,
  tooltip = "",
  className,
  style,
  required,
}: {
  heading: string;
  tooltip?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
}): JSX.Element {
  return (
    <FieldGroupWrapper className={className} style={style}>
      <div>
        <FieldGroupHeading>
          {heading} {required ? "*" : ""}
        </FieldGroupHeading>
        <div className="ReservationUnitEditor__FieldGroup-children">
          {children}
        </div>
      </div>
      <Tooltip>{tooltip}</Tooltip>
    </FieldGroupWrapper>
  );
}

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

const UnitInformationWrapper = styled.div`
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
  unit?: UnitWithSpacesAndResourcesQuery["unit"];
  unitState?: ReservationUnitPublishingState;
  reservationState?: ReservationUnitReservationState;
}): JSX.Element {
  const location = unit?.location;
  return (
    <>
      <TitleSection>
        <H1 $noMargin>{heading}</H1>
        <Flex $direction="row" $gap="xs">
          <ReservationStateTag state={reservationState} />
          <ReservationUnitStateTag state={unitState} />
        </Flex>
      </TitleSection>
      <UnitInformationWrapper>
        <div>{unit?.nameFi ?? "-"}</div>
        <div>{location != null ? parseAddress(location) : "-"}</div>
      </UnitInformationWrapper>
    </>
  );
}

const useImageMutations = () => {
  const [createImage] = useCreateImageMutation();
  const [delImage] = useDeleteImageMutation();
  const [updateImagetype] = useUpdateImageMutation();

  const reconcileImageChanges = async (
    resUnitPk: number,
    images: ImageFormType[]
  ): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = images
        .filter((image) => image.deleted)
        .map((image) =>
          delImage({ variables: { pk: image.pk?.toString() ?? "" } })
        );
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
};

// For these fields only Fi has tooltips
const getTranslatedTooltipTex = (t: TFunction, fieldName: string) => {
  if (fieldName === "reservationCancelledInstructionsFi") {
    return t(
      "ReservationUnitEditor.tooltip.reservationCancelledInstructionsFi"
    );
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t("ReservationUnitEditor.tooltip.reservationPendingInstructionsFi");
  }
  if (fieldName === "reservationConfirmedInstructionsFi") {
    return t(
      "ReservationUnitEditor.tooltip.reservationConfirmedInstructionsFi"
    );
  }
  if (fieldName === "contactInformation") {
    return t("ReservationUnitEditor.tooltip.contactInformation");
  }
  if (fieldName === "termsOfUseFi") {
    return t("ReservationUnitEditor.tooltip.termsOfUseFi");
  }
  if (fieldName === "descriptionFi") {
    return t("ReservationUnitEditor.tooltip.description");
  }
  return "";
};

// default is 20 if no spaces selected
function getMaxPersons(spaceList: Pick<Node, "maxPersons">[]) {
  const persons =
    spaceList.map((s) => s.maxPersons ?? 0).reduce((a, x) => a + x, 0) || 20;
  return Math.floor(persons);
}

// default is 1 if no spaces selected
function getMinSurfaceArea(spaceList: Pick<Node, "surfaceArea">[]) {
  const area =
    spaceList.map((s) => s.surfaceArea ?? 0).reduce((a, x) => a + x, 0) || 1;
  return Math.floor(area);
}

function CustomNumberInput({
  name,
  form,
  max,
  min,
  required,
}: {
  name:
    | "maxPersons"
    | "minPersons"
    | "surfaceArea"
    | "reservationsMinDaysBefore"
    | "maxReservationsPerUser";
  form: UseFormReturn<ReservationUnitEditFormValues>;
  max?: number;
  min?: number;
  required?: boolean;
}) {
  const { t } = useTranslation();

  const { formState, control } = form;
  const { errors } = formState;

  const errMsg = errors[name]?.message;
  const tErrMsg = getTranslatedError(t, errMsg);

  const label = t(`ReservationUnitEditor.label.${name}`);
  const tooltipText = t(`ReservationUnitEditor.tooltip.${name}`);
  const helperText = t(`ReservationUnitEditor.${name}HelperText`);

  return (
    <ControlledNumberInput
      control={control}
      name={name}
      min={min}
      max={max}
      required={required}
      label={label}
      tooltipText={tooltipText}
      helperText={helperText}
      errorText={tErrMsg}
    />
  );
}

function SpecializedRadioGroup({
  name,
  options,
  control,
  noLabel,
  noTooltip,
  direction,
  required,
}: {
  name: "reservationKind" | "bufferType" | "cancellationRule";
  options: readonly string[] | readonly { label: string; value: number }[];
  control: Control<ReservationUnitEditFormValues>;
  noLabel?: boolean;
  noTooltip?: boolean;
  direction?: "horizontal" | "vertical";
  required?: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const { fieldState } = useController({ name, control });
  const { error } = fieldState;

  const groupLabel = !noLabel
    ? t(`ReservationUnitEditor.label.${name}`)
    : undefined;
  const tooltip = !noTooltip
    ? t(`ReservationUnitEditor.tooltip.${name}`)
    : undefined;
  const opts = options.map((opt) => {
    const prefix = `ReservationUnitEditor.label.options.${name}`;
    const label = typeof opt === "string" ? `${prefix}.${opt}` : opt.label;
    const value = typeof opt === "string" ? opt : opt.value;
    return {
      value,
      label,
    };
  });

  return (
    <ControlledRadioGroup
      name={name}
      control={control}
      label={groupLabel}
      tooltip={tooltip}
      required={required}
      direction={direction}
      error={getTranslatedError(t, error?.message)}
      options={opts}
    />
  );
}

function BasicSection({
  form,
  unit,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  unit: UnitWithSpacesAndResourcesQuery["unit"] | undefined;
}) {
  const { t } = useTranslation();
  const { control, formState, register, watch, setValue } = form;
  const { errors } = formState;
  const { spaces } = unit ?? {};

  const spaceOptions = filterNonNullable(spaces).map((s) => ({
    label: s?.nameFi ?? "-",
    value: s?.pk ?? 0,
  }));
  const resourceOptions = filterNonNullable(
    spaces?.flatMap((s) => s?.resources)
  ).map((r) => ({ label: r?.nameFi ?? "-", value: r?.pk ?? 0 }));

  const spacePks = watch("spaces");
  const selectedSpaces = filterNonNullable(
    spacePks.map((pk) => spaces?.find((s) => s.pk === pk))
  );
  const minSurfaceArea = getMinSurfaceArea(selectedSpaces);
  const maxPersons = getMaxPersons(selectedSpaces);

  const hasErrors =
    errors.reservationKind != null ||
    errors.minPersons != null ||
    errors.maxPersons != null ||
    errors.surfaceArea != null ||
    errors.spaces != null ||
    errors.resources != null ||
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
        <FullRow>
          <SpecializedRadioGroup
            name="reservationKind"
            options={["DIRECT_AND_SEASON", "DIRECT", "SEASON"] as const}
            control={control}
            direction="horizontal"
            required
          />
        </FullRow>
        {(["nameFi", "nameEn", "nameSv"] as const).map((fieldName) => (
          <FullRow key={fieldName}>
            <TextInput
              {...register(fieldName, { required: true })}
              required
              id={fieldName}
              label={t(`ReservationUnitEditor.label.${fieldName}`)}
              errorText={getTranslatedError(t, errors[fieldName]?.message)}
              invalid={errors[fieldName]?.message != null}
              // tooltipText={ lang === "fi" ? t("ReservationUnitEditor.tooltip.nameFi") : undefined }
            />
          </FullRow>
        ))}
        <ControlledSelect
          control={control}
          name="spaces"
          multiselect
          required
          label={t("ReservationUnitEditor.label.spaces")}
          placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
          options={spaceOptions}
          afterChange={(vals) => {
            // recalculate the min surface area and max persons after update
            const sPks = Array.isArray(vals) ? vals.map((y) => y) : [];
            const sspaces = filterNonNullable(
              sPks.map((pk) => spaces?.find((s) => s.pk === pk))
            );
            const minArea = getMinSurfaceArea(sspaces);
            const maxPer = getMaxPersons(sspaces);
            if (minArea > 0) {
              setValue("surfaceArea", minArea);
            }
            if (maxPer > 0) {
              setValue("maxPersons", maxPer);
            }
          }}
          error={getTranslatedError(t, errors.spaces?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.spaces")}
        />
        <ControlledSelect
          control={control}
          name="resources"
          multiselect
          label={t("ReservationUnitEditor.label.resources")}
          placeholder={t("ReservationUnitEditor.resourcesPlaceholder")}
          options={resourceOptions}
          disabled={resourceOptions.length === 0}
          error={getTranslatedError(t, errors.resources?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.resources")}
        />
        <CustomNumberInput
          name="surfaceArea"
          min={minSurfaceArea}
          max={undefined}
          form={form}
        />
        <CustomNumberInput
          name="maxPersons"
          min={0}
          max={maxPersons}
          form={form}
        />
        <CustomNumberInput
          name="minPersons"
          min={0}
          max={watch("maxPersons") || 1}
          form={form}
        />
      </AutoGrid>
    </Accordion>
  );
}

function ReservationUnitSettings({
  form,
  metadataOptions,
  cancellationRuleOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  metadataOptions: Array<{ value: number; label: string }>;
  cancellationRuleOptions: Array<{ value: number; label: string }>;
}) {
  const { t } = useTranslation();
  const { control, watch, formState } = form;
  const { errors } = formState;

  const reservationStartIntervalOptions = Object.values(
    ReservationStartInterval
  ).map((choice) => ({
    value: choice,
    label: t(`reservationStartInterval.${choice}`),
  }));

  const authenticationOptions = Object.values(Authentication).map((choice) => ({
    value: choice,
    label: t(`authentication.${choice}`),
  }));

  const isDirect =
    watch("reservationKind") === "DIRECT" ||
    watch("reservationKind") === "DIRECT_AND_SEASON";

  const hasErrors =
    errors.reservationBeginsDate != null ||
    errors.reservationEndsDate != null ||
    errors.reservationBeginsTime != null ||
    errors.reservationEndsTime != null ||
    errors.metadataSet != null ||
    errors.cancellationRule != null ||
    errors.reservationStartInterval != null ||
    errors.reservationsMinDaysBefore != null ||
    errors.reservationsMaxDaysBefore != null ||
    errors.maxReservationDuration != null ||
    errors.minReservationDuration != null;

  const durationOptions = bufferTimeOptions.concat(
    Array.from({ length: (23 - 2) * 2 + 1 })
      .map((_v, i) => 3600 * 2 + i * 1800)
      .map((v) => ({
        value: v,
        label: t("ReservationUnitEditor.durationHours", {
          hours: (v / 3600).toLocaleString("fi"),
        }),
      }))
  );

  return (
    <Accordion open={hasErrors} heading={t("ReservationUnitEditor.settings")}>
      <AutoGrid $minWidth="24rem">
        {isDirect && (
          <FieldGroup
            heading={t("ReservationUnitEditor.publishingSettings")}
            tooltip={t("ReservationUnitEditor.tooltip.publishingSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("ReservationUnitEditor.scheduledPublishing")}
              control={control}
              name="hasScheduledPublish"
            >
              <Flex $gap="xs">
                {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
                <ActivationGroup
                  label={t("ReservationUnitEditor.publishBegins")}
                  control={control}
                  name="hasPublishBegins"
                  noIndent
                  noMargin
                >
                  <DateTimeInput
                    control={control}
                    name={{
                      date: "publishBeginsDate",
                      time: "publishBeginsTime",
                    }}
                    translateError={(err) => getTranslatedError(t, err)}
                  />
                </ActivationGroup>
                <ActivationGroup
                  label={t("ReservationUnitEditor.publishEnds")}
                  control={control}
                  name="hasPublishEnds"
                  noIndent
                  noMargin
                >
                  <DateTimeInput
                    control={control}
                    name={{ date: "publishEndsDate", time: "publishEndsTime" }}
                    translateError={(err) => getTranslatedError(t, err)}
                  />
                </ActivationGroup>
              </Flex>
            </ActivationGroup>
          </FieldGroup>
        )}
        {isDirect && (
          <FieldGroup
            heading={t("ReservationUnitEditor.reservationSettings")}
            tooltip={t("ReservationUnitEditor.tooltip.reservationSettings")}
            style={{ gridColumn: "1 / span 1" }}
          >
            <ActivationGroup
              label={t("ReservationUnitEditor.scheduledReservation")}
              control={control}
              name="hasScheduledReservation"
            >
              {/* TODO the Two DateInputs need to touch each other to rerun common validation code */}
              <ActivationGroup
                label={t("ReservationUnitEditor.reservationBegins")}
                control={control}
                name="hasReservationBegins"
                noIndent
              >
                <DateTimeInput
                  control={control}
                  name={{
                    date: "reservationBeginsDate",
                    time: "reservationBeginsTime",
                  }}
                  minDate={new Date()}
                  translateError={(err) => getTranslatedError(t, err)}
                />
              </ActivationGroup>
              <ActivationGroup
                label={t("ReservationUnitEditor.reservationEnds")}
                control={control}
                name="hasReservationEnds"
                noIndent
              >
                <DateTimeInput
                  control={control}
                  name={{
                    date: "reservationEndsDate",
                    time: "reservationEndsTime",
                  }}
                  minDate={new Date()}
                  translateError={(err) => getTranslatedError(t, err)}
                />
              </ActivationGroup>
            </ActivationGroup>
          </FieldGroup>
        )}
        {isDirect && (
          <>
            <ControlledSelect
              control={control}
              name="minReservationDuration"
              options={durationOptions}
              style={{ gridColumnStart: "1" }}
              required
              label={t("ReservationUnitEditor.label.minReservationDuration")}
              error={getTranslatedError(
                t,
                errors.minReservationDuration?.message
              )}
              tooltip={t(
                "ReservationUnitEditor.tooltip.minReservationDuration"
              )}
            />
            <ControlledSelect
              control={control}
              name="maxReservationDuration"
              required
              options={durationOptions}
              label={t("ReservationUnitEditor.label.maxReservationDuration")}
              error={getTranslatedError(
                t,
                errors.maxReservationDuration?.message
              )}
              tooltip={t(
                "ReservationUnitEditor.tooltip.maxReservationDuration"
              )}
            />
            <ControlledSelect
              control={control}
              name="reservationsMaxDaysBefore"
              options={reservationsMaxDaysBeforeOptions}
              required
              label={t("ReservationUnitEditor.label.reservationsMaxDaysBefore")}
              error={getTranslatedError(
                t,
                errors.reservationsMaxDaysBefore?.message
              )}
              tooltip={t(
                "ReservationUnitEditor.tooltip.reservationsMaxDaysBefore"
              )}
            />
            <CustomNumberInput
              name="reservationsMinDaysBefore"
              max={watch("reservationsMaxDaysBefore")}
              min={0}
              form={form}
              required
            />
          </>
        )}
        <ControlledSelect
          control={control}
          name="reservationStartInterval"
          options={reservationStartIntervalOptions}
          required
          error={getTranslatedError(
            t,
            errors.reservationStartInterval?.message
          )}
          label={t("ReservationUnitEditor.label.reservationStartInterval")}
          tooltip={t("ReservationUnitEditor.tooltip.reservationStartInterval")}
        />
        <FieldGroup
          heading={t("ReservationUnitEditor.bufferSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.bufferSettings")}
          style={{ gridColumn: "1 / -1" }}
        >
          <AutoGrid>
            <SpecializedRadioGroup
              name="bufferType"
              options={BUFFER_TIME_OPTIONS}
              control={control}
              noLabel
              noTooltip
              // TODO do we need this? or do we just initialize the value in the form?
              // defaultValue="no-buffer"
            />
            {watch("bufferType") === "bufferTimesSet" && (
              <>
                <ActivationGroup
                  label={t("ReservationUnitEditor.bufferTimeBefore")}
                  control={control}
                  name="hasBufferTimeBefore"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeBefore"
                    options={bufferTimeOptions}
                    label={t("ReservationUnitEditor.bufferTimeBeforeDuration")}
                  />
                </ActivationGroup>
                <ActivationGroup
                  label={t("ReservationUnitEditor.bufferTimeAfter")}
                  control={control}
                  name="hasBufferTimeAfter"
                >
                  <ControlledSelect
                    control={control}
                    name="bufferTimeAfter"
                    label={t("ReservationUnitEditor.bufferTimeAfterDuration")}
                    options={bufferTimeOptions}
                  />
                </ActivationGroup>
              </>
            )}
          </AutoGrid>
        </FieldGroup>
        <FieldGroup
          heading={t("ReservationUnitEditor.cancellationSettings")}
          tooltip={t("ReservationUnitEditor.tooltip.cancellationSettings")}
          style={{ gridColumn: "1 / -1", alignItems: "start" }}
        >
          <ActivationGroup
            label={t("ReservationUnitEditor.cancellationIsPossible")}
            control={control}
            name="hasCancellationRule"
          >
            <SpecializedRadioGroup
              name="cancellationRule"
              options={cancellationRuleOptions}
              control={control}
              noLabel
              noTooltip
            />
          </ActivationGroup>
        </FieldGroup>
        {isDirect && (
          <>
            <ControlledSelect
              control={control}
              name="metadataSet"
              required
              options={metadataOptions}
              label={t("ReservationUnitEditor.label.metadataSet")}
              error={getTranslatedError(t, errors.metadataSet?.message)}
              tooltip={t("ReservationUnitEditor.tooltip.metadataSet")}
            />
            <ControlledSelect
              control={control}
              name="authentication"
              required
              options={authenticationOptions}
              label={t("ReservationUnitEditor.authenticationLabel")}
              tooltip={t("ReservationUnitEditor.tooltip.authentication")}
            />
            <CustomNumberInput
              name="maxReservationsPerUser"
              min={1}
              form={form}
            />
            <FieldGroup
              // FIXME replace the text fields
              heading={t("ReservationUnitEditor.requireAdultReserveeSettings")}
              tooltip={t("ReservationUnitEditor.tooltip.requireAdultReservee")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireAdultReservee"
                label={t("ReservationUnitEditor.requireAdultReserveeLabel")}
              />
            </FieldGroup>
            <FieldGroup
              heading={t("ReservationUnitEditor.handlingSettings")}
              tooltip={t("ReservationUnitEditor.tooltip.handlingSettings")}
              style={{ gridColumn: "1 / -1" }}
            >
              <ControlledCheckbox
                control={control}
                name="requireReservationHandling"
                label={t("ReservationUnitEditor.requireReservationHandling")}
              />
            </FieldGroup>
          </>
        )}
      </AutoGrid>
    </Accordion>
  );
}

function PricingControl({
  pricing,
  form,
  taxPercentageOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  pricing: ReservationUnitEditFormValues["pricings"][0];
  taxPercentageOptions: TaxOption[];
}) {
  const { t } = useTranslation();
  return (
    <FieldGroup
      key={`pricing-${pricing.pk}`}
      heading={t("ReservationUnitEditor.label.pricingType")}
      required
      tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
      style={{ gridColumn: "1 / -1" }}
    >
      <PricingTypeView
        pk={pricing.pk}
        form={form}
        taxPercentageOptions={taxPercentageOptions}
      />
    </FieldGroup>
  );
}

function PricingSection({
  form,
  taxPercentageOptions,
  pricingTermsOptions,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  taxPercentageOptions: TaxOption[];
  pricingTermsOptions: { value: string; label: string }[];
}) {
  const { t } = useTranslation();
  const { control, watch, formState } = form;
  const { errors } = formState;

  const pricings = watch("pricings");
  const isPaid = pricings.filter((p) => p.isPaid).length > 0;
  const hasErrors = errors.pricings != null || errors.paymentTypes != null;

  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.label.pricings")}
    >
      <AutoGrid>
        {watch("pricings")
          .filter((p) => !p.isFuture)
          .map((pricing) => (
            <PricingControl
              key={pricing.pk}
              form={form}
              pricing={pricing}
              taxPercentageOptions={taxPercentageOptions}
            />
          ))}
        <ControlledCheckbox
          control={control}
          name="hasFuturePricing"
          label={t("ReservationUnitEditor.label.hasFuturePrice")}
          style={{ gridColumn: "1 / -1" }}
        />
        {watch("hasFuturePricing") &&
          watch("pricings")
            .filter((p) => p.isFuture)
            .map((pricing) => (
              <PricingControl
                key={pricing.pk}
                form={form}
                pricing={pricing}
                taxPercentageOptions={taxPercentageOptions}
              />
            ))}
        {isPaid && (
          <ControlledCheckbox
            control={control}
            name="canApplyFreeOfCharge"
            label={t("ReservationUnitEditor.label.canApplyFreeOfCharge")}
            tooltip={t("ReservationUnitEditor.tooltip.canApplyFreeOfCharge")}
          />
        )}
        {watch("canApplyFreeOfCharge") && isPaid && (
          <ControlledSelect
            control={control}
            name="pricingTerms"
            label={t("ReservationUnitEditor.label.pricingTerms")}
            required
            clearable
            options={pricingTermsOptions}
            error={getTranslatedError(t, errors.pricingTerms?.message)}
            tooltip={t("ReservationUnitEditor.tooltip.pricingTerms")}
          />
        )}
      </AutoGrid>
    </Accordion>
  );
}

type OptionType = { value: string; label: string };
function TermsSection({
  form,
  options,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  options: {
    service: OptionType[];
    payment: OptionType[];
    cancellation: OptionType[];
  };
}) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const hasErrors =
    errors.termsOfUseFi != null ||
    errors.termsOfUseEn != null ||
    errors.termsOfUseSv != null;

  const termsOptions = [
    {
      key: "serviceSpecificTerms",
      options: options.service,
    },
    {
      key: "paymentTerms",
      options: options.payment,
    },
    {
      key: "cancellationTerms",
      options: options.cancellation,
    },
  ] as const;

  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.termsInstructions")}
    >
      <AutoGrid $minWidth="20rem">
        {(
          ["serviceSpecificTerms", "paymentTerms", "cancellationTerms"] as const
        ).map((name) => {
          const opts = termsOptions.find((o) => o.key === name)?.options ?? [];
          return (
            <ControlledSelect
              control={control}
              name={name}
              key={name}
              clearable
              label={t(`ReservationUnitEditor.label.${name}`)}
              placeholder={t(`ReservationUnitEditor.termsPlaceholder`)}
              options={opts}
              tooltip={t(`ReservationUnitEditor.tooltip.${name}`)}
            />
          );
        })}
      </AutoGrid>
      {(["termsOfUseFi", "termsOfUseEn", "termsOfUseSv"] as const).map((n) => (
        <ControlledRichTextInput control={control} fieldName={n} key={n} />
      ))}
    </Accordion>
  );
}

function CommunicationSection({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}) {
  const { t } = useTranslation();
  const { control, register } = form;

  // NOTE no required fields
  return (
    <Accordion heading={t("ReservationUnitEditor.communication")}>
      <Flex>
        <H4 $noMargin>{t("ReservationUnitEditor.pendingInstructions")}</H4>
        {(
          [
            "reservationPendingInstructionsFi",
            "reservationPendingInstructionsEn",
            "reservationPendingInstructionsSv",
          ] as const
        ).map((n) => (
          <ControlledRichTextInput control={control} fieldName={n} key={n} />
        ))}
        <H4 $noMargin>{t("ReservationUnitEditor.confirmedInstructions")}</H4>
        {(
          [
            "reservationConfirmedInstructionsFi",
            "reservationConfirmedInstructionsEn",
            "reservationConfirmedInstructionsSv",
          ] as const
        ).map((n) => (
          <ControlledRichTextInput control={control} fieldName={n} key={n} />
        ))}
        <SubAccordion
          // don't open there is no errors under this
          heading={t("ReservationUnitEditor.cancelledSubAccordion")}
          headingLevel="h3"
        >
          <H4 $noMargin>{t("ReservationUnitEditor.cancelledInstructions")}</H4>
          {(
            [
              "reservationCancelledInstructionsFi",
              "reservationCancelledInstructionsEn",
              "reservationCancelledInstructionsSv",
            ] as const
          ).map((n) => (
            <ControlledRichTextInput control={control} fieldName={n} key={n} />
          ))}
        </SubAccordion>
        <TextInput
          {...register("contactInformation")}
          id="contactInformation"
          label={t("ReservationUnitEditor.contactInformationLabel")}
          helperText={t("ReservationUnitEditor.contactInformationHelperText")}
          tooltipText={getTranslatedTooltipTex(t, "contactInformation")}
        />
      </Flex>
    </Accordion>
  );
}

function ControlledRichTextInput({
  control,
  fieldName,
}: {
  control: Control<ReservationUnitEditFormValues>;
  fieldName:
    | "reservationCancelledInstructionsFi"
    | "reservationCancelledInstructionsEn"
    | "reservationCancelledInstructionsSv"
    | "reservationConfirmedInstructionsFi"
    | "reservationConfirmedInstructionsEn"
    | "reservationConfirmedInstructionsSv"
    | "reservationPendingInstructionsFi"
    | "reservationPendingInstructionsEn"
    | "reservationPendingInstructionsSv"
    | "termsOfUseFi"
    | "termsOfUseEn"
    | "termsOfUseSv";
}) {
  const { t } = useTranslation();
  const { field, fieldState } = useController({
    control,
    name: fieldName,
  });

  return (
    <RichTextInput
      {...field}
      id={fieldName}
      label={t(`ReservationUnitEditor.label.${fieldName}`)}
      errorText={getTranslatedError(t, fieldState.error?.message)}
      tooltipText={getTranslatedTooltipTex(t, fieldName)}
    />
  );
}

function OpeningHoursSection({
  reservationUnit,
  previewUrlPrefix,
}: {
  // TODO can we simplify this by passing the hauki url only?
  reservationUnit: Node | undefined;
  previewUrlPrefix: string;
}) {
  const { t } = useTranslation(undefined, {
    keyPrefix: "ReservationUnitEditor",
  });

  const previewUrl = `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}#calendar`;
  const previewDisabled =
    previewUrlPrefix === "" || !reservationUnit?.pk || !reservationUnit?.uuid;

  return (
    <Accordion heading={t("openingHours")}>
      {reservationUnit?.haukiUrl ? (
        <AutoGrid $alignCenter>
          <p style={{ gridColumn: "1 / -1" }}>
            {t("openingHoursHelperTextHasLink")}
          </p>
          <ButtonLikeLink
            disabled={!reservationUnit?.haukiUrl}
            to={reservationUnit?.haukiUrl ?? ""}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("openingTimesExternalLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
          <ButtonLikeLink
            disabled={previewDisabled}
            to={previewUrl}
            target="_blank"
            fontSize="small"
            rel="noopener noreferrer"
          >
            {t("previewCalendarLink")}
            <IconLinkExternal style={{ marginLeft: "var(--spacing-xs)" }} />
          </ButtonLikeLink>
        </AutoGrid>
      ) : (
        <p>{t("openingHoursHelperTextNoLink")}</p>
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
}: Readonly<{
  form: UseFormReturn<ReservationUnitEditFormValues>;
  equipments: ReservationUnitEditorParametersQuery["equipmentsAll"] | undefined;
  purposes: ReservationUnitEditorParametersQuery["purposes"] | undefined;
  qualifiers: ReservationUnitEditorParametersQuery["qualifiers"] | undefined;
  reservationUnitTypes:
    | ReservationUnitEditorParametersQuery["reservationUnitTypes"]
    | undefined;
}>) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const equipmentOptions = filterNonNullable(equipments).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));

  const purposeOptions = filterNonNullable(
    purposes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));
  const qualifierOptions = filterNonNullable(
    qualifiers?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = filterNonNullable(
    reservationUnitTypes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n.pk ?? -1,
    label: n.nameFi ?? "no-name",
  }));

  const hasErrors =
    errors.reservationUnitType != null ||
    errors.descriptionFi != null ||
    errors.descriptionEn != null ||
    errors.descriptionSv != null;

  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.typesProperties")}
    >
      <AutoGrid $minWidth="20rem">
        <ControlledSelect
          control={control}
          name="reservationUnitType"
          required
          label={t(`ReservationUnitEditor.label.reservationUnitType`)}
          placeholder={t(
            `ReservationUnitEditor.reservationUnitTypePlaceholder`
          )}
          options={reservationUnitTypeOptions}
          helper={t("ReservationUnitEditor.reservationUnitTypeHelperText")}
          error={getTranslatedError(t, errors.reservationUnitType?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.reservationUnitType")}
        />
        <ControlledSelect
          control={control}
          name="purposes"
          multiselect
          label={t("ReservationUnitEditor.purposesLabel")}
          placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
          options={purposeOptions}
          tooltip={t("ReservationUnitEditor.tooltip.purposes")}
        />
        <ControlledSelect
          control={control}
          name="equipments"
          multiselect
          label={t("ReservationUnitEditor.equipmentsLabel")}
          placeholder={t("ReservationUnitEditor.equipmentsPlaceholder")}
          options={equipmentOptions}
          tooltip={t("ReservationUnitEditor.tooltip.equipments")}
        />
        <ControlledSelect
          control={control}
          name="qualifiers"
          multiselect
          label={t("ReservationUnitEditor.qualifiersLabel")}
          placeholder={t("ReservationUnitEditor.qualifiersPlaceholder")}
          options={qualifierOptions}
          tooltip={t("ReservationUnitEditor.tooltip.qualifiers")}
        />
        {(["descriptionFi", "descriptionEn", "descriptionSv"] as const).map(
          (fieldName) => (
            <Controller
              control={control}
              name={fieldName}
              key={fieldName}
              render={({ field: { ...field } }) => (
                <RichTextInput
                  {...field}
                  required
                  style={{ gridColumn: "1 / -1" }}
                  id={fieldName}
                  label={t(`ReservationUnitEditor.label.${fieldName}`)}
                  errorText={getTranslatedError(t, errors[fieldName]?.message)}
                  tooltipText={getTranslatedTooltipTex(t, fieldName)}
                />
              )}
            />
          )
        )}
        <Controller
          control={control}
          name="images"
          render={({ field: { value, onChange } }) => (
            <ImageEditor
              images={value}
              setImages={onChange}
              style={{ gridColumn: "1 / -1" }}
            />
          )}
        />
      </AutoGrid>
    </Accordion>
  );
}

function ErrorInfo({
  form,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
}): JSX.Element | null {
  const { t } = useTranslation();

  const {
    formState: { errors },
  } = form;
  const hasErrors = Object.keys(errors).length > 0;
  const { pricings, ...otherErrors } = errors;

  if (!hasErrors) {
    return null;
  }

  // NOTE the type information for pricings errors is too complex to handle (hence runtime checks)
  const nonNullPricings =
    pricings != null && Array.isArray(pricings) ? pricings : [];
  const pricingErrors = nonNullPricings.flatMap((pricing) =>
    Object.entries(pricing ?? {})
      .map(([key, value]) => {
        if (value != null && typeof value === "object" && "message" in value) {
          if (value?.message == null || typeof value.message !== "string") {
            return null;
          }
          const label = t(`ReservationUnitEditor.label.${key}`);
          const errMsg = getTranslatedError(t, value.message);
          return `${label} : ${errMsg}`;
        }
        return null;
      })
      .filter((x): x is string => x != null)
  );

  // TODO errors should be sorted based on the order of the form fields
  return (
    <Notification label={t("FormErrorSummary.label")} type="error">
      <ol>
        {Object.entries(otherErrors).map(([key, value]) => (
          <li key={key}>
            {t(`ReservationUnitEditor.label.${key}`)}:{" "}
            {getTranslatedError(t, value?.message)}
          </li>
        ))}
        {pricingErrors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ol>
    </Notification>
  );
}

function ReservationUnitEditor({
  reservationUnit,
  unitPk,
  form,
  refetch,
  previewUrlPrefix,
}: {
  reservationUnit?: Node;
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

  const id = base64encode(`UnitNode:${unitPk}`);
  // TODO combine these two queries into a single params query with minimal data
  const { data: unitResourcesData } = useUnitWithSpacesAndResourcesQuery({
    skip: !unitPk,
    variables: { id },
    onError: (_) => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { data: parametersData } = useReservationUnitEditorParametersQuery({
    onError: (_) => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
    variables: {
      equipmentsOrderBy: EquipmentOrderingChoices.CategoryRankAsc,
    },
  });

  // ----------------------------- Constants ---------------------------------
  const { getValues, setValue, watch, formState, handleSubmit } = form;
  const { isDirty: hasChanges, isSubmitting: isSaving } = formState;

  const paymentTermsOptions = makeTermsOptions(
    parametersData,
    TermsType.PaymentTerms
  );
  const pricingTermsOptions = makeTermsOptions(
    parametersData,
    TermsType.PricingTerms
  );
  const taxPercentageOptions = filterNonNullable(
    parametersData?.taxPercentages?.edges.map((e) => e?.node)
  ).map((n) => ({
    value: Number(n.value),
    pk: n.pk ?? -1,
    label: n.value,
  }));
  const serviceSpecificTermsOptions = makeTermsOptions(
    parametersData,
    TermsType.ServiceTerms
  );
  const cancellationTermsOptions = makeTermsOptions(
    parametersData,
    TermsType.CancellationTerms
  );

  const { unit } = unitResourcesData ?? {};
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

  // ----------------------------- Callbacks ----------------------------------
  // unsafe because the handleSubmit doesn't pass return value (so throw is the only way to manipulate control flow)
  const onSubmit = async (formValues: ReservationUnitEditFormValues) => {
    const { pk, ...input } = transformReservationUnit(formValues);
    const promise =
      pk != null
        ? updateMutation({ variables: { input: { ...input, pk } } })
        : createMutation({
            variables: { input: { ...input, unit: unitPk } },
          });

    const { data, errors: mutationErrors } = await promise;
    if (mutationErrors != null) {
      const msg = t("ReservationUnitEditor.saveFailed", {
        error: mutationErrors,
      });
      throw new Error(msg);
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

  const handleError = (e: unknown) => {
    const validationErrors = getValidationErrors(e);
    const validationError = validationErrors[0];
    if (validationError != null) {
      errorToast({
        text: t(`errors.backendValidation.${validationError.code}`),
      });
    } else if (e instanceof Error) {
      const msg = e.message;
      errorToast({ text: msg });
    } else {
      errorToast({ text: t("ReservationDialog.saveFailed") });
    }
  };

  // Have to define these like this because otherwise the state changes don't work
  const handlePublish = async () => {
    setValue("isDraft", false);
    setValue("isArchived", false);
    try {
      await handleSubmit(onSubmit)();
    } catch (error) {
      handleError(error);
    }
  };

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    setValue("isArchived", false);
    try {
      await handleSubmit(onSubmit)();
    } catch (error) {
      handleError(error);
    }
  };

  const handleAcceptArchive = async () => {
    setValue("isArchived", true);
    setValue("isDraft", false);
    setModalContent(null);
    try {
      await handleSubmit(onSubmit)();
      successToast({ text: t("ArchiveReservationUnitDialog.success") });
      history(getUnitUrl(unit?.pk));
    } catch (e) {
      handleError(e);
    }
  };

  const handleArchiveButtonClick = () => {
    if (reservationUnit != null) {
      setModalContent(
        <ArchiveDialog
          reservationUnit={reservationUnit}
          onAccept={handleAcceptArchive}
          onClose={() => setModalContent(null)}
        />
      );
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setModalContent(
        <DiscardChangesDialog
          onAccept={() => {
            setModalContent(null);
            history(-1);
          }}
          onClose={() => setModalContent(null)}
        />
      );
    } else {
      history(-1);
    }
  };

  const kind = watch("reservationKind");
  const isDirect =
    kind === ReservationKind.Direct || kind === ReservationKind.DirectAndSeason;
  const isSeasonal =
    kind === ReservationKind.Season || kind === ReservationKind.DirectAndSeason;

  const previewDisabled =
    isSaving ||
    !reservationUnit?.pk ||
    !reservationUnit.uuid ||
    previewUrlPrefix === "";

  const draftEnabled = hasChanges || !watch("isDraft");
  const publishEnabled = hasChanges || watch("isDraft");
  const archiveEnabled = watch("pk") !== 0 && !watch("isArchived");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <StyledContainerMedium>
        <DisplayUnit
          heading={
            reservationUnit?.nameFi ?? t("ReservationUnitEditor.defaultHeading")
          }
          unit={unit ?? undefined}
          reservationState={reservationUnit?.reservationState ?? undefined}
          unitState={reservationUnit?.publishingState ?? undefined}
        />
        <ErrorInfo form={form} />
        <BasicSection form={form} unit={unit} />
        <DescriptionSection
          form={form}
          equipments={parametersData?.equipmentsAll}
          purposes={parametersData?.purposes}
          qualifiers={parametersData?.qualifiers}
          reservationUnitTypes={parametersData?.reservationUnitTypes}
        />
        <ReservationUnitSettings
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
        <OpeningHoursSection
          reservationUnit={reservationUnit}
          previewUrlPrefix={previewUrlPrefix}
        />
        {isSeasonal && <SeasonalSection form={form} />}
        <div>
          <Button
            onClick={handleArchiveButtonClick}
            variant={ButtonVariant.Secondary}
            disabled={isSaving || !archiveEnabled}
          >
            {t("ReservationUnitEditor.archive")}
          </Button>
        </div>
      </StyledContainerMedium>
      <ButtonsStripe>
        <WhiteButton
          size={ButtonSize.Small}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconArrowLeft />}
          disabled={isSaving}
          onClick={handleBack}
        >
          {t("common.prev")}
        </WhiteButton>
        <PreviewLink
          target="_blank"
          rel="noopener noreferrer"
          href={
            !previewDisabled
              ? `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}`
              : undefined
          }
          onClick={(e) => previewDisabled && e.preventDefault()}
          title={t(
            hasChanges
              ? "ReservationUnitEditor.noPreviewUnsavedChangesTooltip"
              : "ReservationUnitEditor.previewTooltip"
          )}
        >
          <span>{t("ReservationUnitEditor.preview")}</span>
        </PreviewLink>
        <WhiteButton
          size={ButtonSize.Small}
          variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Secondary}
          iconStart={isSaving ? <LoadingSpinner small /> : undefined}
          disabled={isSaving || !draftEnabled}
          type="button"
          onClick={handleSaveAsDraft}
        >
          {t("ReservationUnitEditor.saveAsDraft")}
        </WhiteButton>
        <WhiteButton
          variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Primary}
          size={ButtonSize.Small}
          iconStart={isSaving ? <LoadingSpinner small /> : undefined}
          disabled={isSaving || !publishEnabled}
          type="button"
          onClick={handlePublish}
        >
          {t("ReservationUnitEditor.saveAndPublish")}
        </WhiteButton>
      </ButtonsStripe>
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
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  const {
    data,
    loading: isLoading,
    refetch,
  } = useReservationUnitEditQuery({
    variables: { id },
    skip:
      !reservationUnitPk ||
      Number(reservationUnitPk) === 0 ||
      Number.isNaN(Number(reservationUnitPk)),
  });

  const reservationUnit = data?.reservationUnit ?? undefined;

  const form = useForm<ReservationUnitEditFormValues>({
    mode: "onBlur",
    // NOTE disabling because it throws an error when submitting because it can't focus the field
    // this happens for field errors in the zod schema where the field is created using an array
    // for example termsOfUseEn, termsOfUseFi, termsOfUseSv
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
      paymentTypes {
        id
        code
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
      uuid
      requireAdultReservee
      termsOfUseFi
      termsOfUseSv
      termsOfUseEn
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
      qualifiers {
        id
        pk
        nameFi
      }
      unit {
        id
        pk
        nameFi
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
      reservationBegins
      contactInformation
      reservationEnds
      publishBegins
      publishEnds
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
  mutation CreateImage(
    $image: Upload!
    $reservationUnit: Int!
    $imageType: ImageType!
  ) {
    createReservationUnitImage(
      input: {
        image: $image
        reservationUnit: $reservationUnit
        imageType: $imageType
      }
    ) {
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
  query ReservationUnitEditorParameters(
    $equipmentsOrderBy: EquipmentOrderingChoices
  ) {
    equipmentsAll(orderBy: [$equipmentsOrderBy]) {
      id
      name
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
    qualifiers {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
    }
  }
`;
