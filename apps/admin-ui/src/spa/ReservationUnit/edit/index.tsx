import React, { useEffect } from "react";
import {
  Button,
  Checkbox,
  IconAlertCircleFill,
  IconArrowLeft,
  IconLinkExternal,
  Notification,
  RadioButton,
  SelectionGroup,
  TextArea,
  TextInput,
  Tooltip,
} from "hds-react";
import i18next from "i18next";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import dynamic from "next/dynamic";
import { Controller, UseFormReturn, useForm } from "react-hook-form";
import { type TFunction, useTranslation } from "next-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ReservationStartInterval,
  Authentication,
  type ReservationUnitPublishingState,
  type ReservationUnitReservationState,
  TermsType,
  Status,
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
} from "@gql/gql-types";
import { ControlledSelect } from "common/src/components/form/ControlledSelect";
import { DateTimeInput } from "common/src/components/form/DateTimeInput";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { H1, H4, fontBold } from "common/src/common/typography";
import { breakpoints } from "common";
import {
  ContainerMedium,
  DenseVerticalFlex,
  HorisontalFlex,
  AutoGrid,
  FullRow,
  VerticalFlex,
} from "@/styles/layout";
import Loader from "@/component/Loader";
import { errorToast, successToast } from "common/src/common/toast";
import { useModal } from "@/context/ModalContext";
import { parseAddress, getTranslatedError } from "@/common/util";
import Error404 from "@/common/Error404";
import { Accordion } from "@/component/Accordion";
import { ControlledNumberInput } from "common/src/components/form/ControlledNumberInput";
import { ArchiveDialog } from "./ArchiveDialog";
import { ReservationStateTag, ReservationUnitStateTag } from "./tags";
import { ActivationGroup } from "./ActivationGroup";
import { ImageEditor } from "./ImageEditor";
import { PricingTypeView } from "./PricingType";
import { GenericDialog } from "./GenericDialog";
import {
  type ReservationUnitEditFormValues,
  ReservationUnitEditSchema,
  convertReservationUnit,
  transformReservationUnit,
  type ImageFormType,
} from "./form";
import { ButtonLikeLink } from "@/component/ButtonLikeLink";
import { SeasonalSection } from "./SeasonalSection";

const RichTextInput = dynamic(
  () => import("../../../component/RichTextInput"),
  {
    ssr: false,
  }
);

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

// Override the Accordion style: force border even if the accordion is open
// because the last section is not an accordion but a button and it looks funny otherwise
const StyledContainerMedium = styled(ContainerMedium)`
  & > div:nth-last-of-type(2) > div {
    /* stylelint-disable-next-line csstools/value-no-unknown-custom-properties */
    border-bottom: 1px solid var(--border-color);
  }
`;

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

const Preview = styled.a<{ $disabled: boolean }>`
  display: flex;
  place-items: center;
  border: 2px solid;
  border-color: var(--color-white) !important;
  background-color: var(--color-bus-dark);
  text-decoration: none;
  &:hover {
    background-color: var(--color-bus-dark);
  }
  ${({ $disabled }) =>
    $disabled
      ? `
    opacity: 0.5;
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
  /* stylelint-disable csstools/value-no-unknown-custom-properties */
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
      ? `
        opacity: 0.5;
        --hbg: var(--bg);
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
  /* stylelint-enable csstools/value-no-unknown-custom-properties */
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

const durationOptions = bufferTimeOptions.concat(
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
}): JSX.Element {
  return (
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
}

// Why?
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
  unit?: UnitWithSpacesAndResourcesQuery["unit"];
  unitState?: ReservationUnitPublishingState;
  reservationState?: ReservationUnitReservationState;
}): JSX.Element {
  const location = unit?.location;
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
        <div>{location != null ? parseAddress(location) : "-"}</div>
      </UnitInformationWrapper>
    </DisplayUnitWrapper>
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
              reservationUnit: resUnitPk,
              imageType: image.imageType ?? ImageType.Other,
            },
          })
        );

      await Promise.all(addPromises);
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
              pk: image.pk ?? 0,
              imageType: image.imageType ?? ImageType.Other,
            },
          });
        });

      await Promise.all(changeTypePromises);
    } catch (e) {
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

function BasicSection({
  form,
  unit,
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  unit: UnitWithSpacesAndResourcesQuery["unit"];
}) {
  const { t } = useTranslation();
  const { control, formState, register, watch, setValue } = form;
  const { errors } = formState;
  const { spaces } = unit ?? {};

  const spaceOptions =
    spaces?.map((s) => ({
      label: String(s?.nameFi),
      value: Number(s?.pk),
    })) ?? [];
  const resourceOptions = filterNonNullable(
    spaces?.flatMap((s) => s?.resourceSet)
  ).map((r) => ({ label: String(r?.nameFi), value: Number(r?.pk) }));

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
        <RadioFieldGroup
          id="reservationKind"
          heading={t("ReservationUnitEditor.label.reservationKind")}
          tooltip={t("ReservationUnitEditor.tooltip.reservationKind")}
        >
          {errors.reservationKind?.message != null && (
            <FullRow>
              <IconAlertCircleFill />
              <span>
                {getTranslatedError(t, errors.reservationKind.message)}
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

  return (
    <Accordion open={hasErrors} heading={t("ReservationUnitEditor.settings")}>
      <AutoGrid $minWidth="20rem">
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
            <DenseVerticalFlex>
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
            </DenseVerticalFlex>
          </ActivationGroup>
        </FieldGroup>
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
        <ControlledSelect
          control={control}
          name="minReservationDuration"
          options={durationOptions}
          placeholder={t("common.select")}
          style={{ gridColumnStart: "1" }}
          required
          label={t("ReservationUnitEditor.label.minReservationDuration")}
          error={getTranslatedError(t, errors.minReservationDuration?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.minReservationDuration")}
        />
        <ControlledSelect
          control={control}
          name="maxReservationDuration"
          placeholder={t("common.select")}
          required
          options={durationOptions}
          label={t("ReservationUnitEditor.label.maxReservationDuration")}
          error={getTranslatedError(t, errors.maxReservationDuration?.message)}
          tooltip={t("ReservationUnitEditor.tooltip.maxReservationDuration")}
        />
        <ControlledSelect
          control={control}
          name="reservationsMaxDaysBefore"
          options={reservationsMaxDaysBeforeOptions}
          placeholder={t("common.select")}
          required
          label={t("ReservationUnitEditor.label.reservationsMaxDaysBefore")}
          error={getTranslatedError(
            t,
            errors.reservationsMaxDaysBefore?.message
          )}
          tooltip={t("ReservationUnitEditor.tooltip.reservationsMaxDaysBefore")}
        />
        <CustomNumberInput
          name="reservationsMinDaysBefore"
          max={watch("reservationsMaxDaysBefore")}
          min={0}
          form={form}
          required
        />
        <ControlledSelect
          control={control}
          name="reservationStartInterval"
          placeholder={t("common.select")}
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
            <Controller
              control={control}
              name="reservationBlockWholeDay"
              render={({ field: { value, onChange } }) => (
                <SelectionGroup
                  errorText={getTranslatedError(
                    t,
                    errors.reservationBlockWholeDay?.message
                  )}
                  defaultValue="no-buffer"
                >
                  <RadioButton
                    id="no-buffer"
                    value="no-buffer"
                    label={t("ReservationUnitEditor.noBuffer")}
                    onChange={(e) => onChange(e.target.value)}
                    checked={value != null && value === "no-buffer"}
                  />
                  {/*
                  <RadioButton
                    id="blocks-whole-day"
                    value="blocks-whole-day"
                    label={t("ReservationUnitEditor.blocksWholeDay")}
                    onChange={(e) => onChange(e.target.value)}
                    checked={value != null && value === "blocks-whole-day"}
                  />
                  */}
                  <RadioButton
                    id="buffer-times-set"
                    value="buffer-times-set"
                    label={t("ReservationUnitEditor.setBufferTime")}
                    onChange={(e) => onChange(e.target.value)}
                    checked={value != null && value === "buffer-times-set"}
                  />
                </SelectionGroup>
              )}
            />
            {watch("reservationBlockWholeDay") === "buffer-times-set" && (
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
          style={{ gridColumn: "1 / -1" }}
        >
          <ActivationGroup
            label={t("ReservationUnitEditor.cancellationIsPossible")}
            control={control}
            name="hasCancellationRule"
          >
            <Controller
              control={control}
              name="cancellationRule"
              render={({ field: { value, onChange } }) => (
                <SelectionGroup
                  required
                  label={t("ReservationUnitEditor.cancellationGroupLabel")}
                  errorText={getTranslatedError(
                    t,
                    errors.cancellationRule?.message
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
        <CustomNumberInput name="maxReservationsPerUser" min={1} form={form} />
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
      .filter((p) => p.status === Status.Active || isFuturePriceVisible)
      .length > 0;

  const hasErrors = errors.pricings != null || errors.paymentTypes != null;
  return (
    <Accordion
      open={hasErrors}
      heading={t("ReservationUnitEditor.label.pricings")}
    >
      <VerticalFlex>
        {watch("pricings").map(
          (pricing, index) =>
            pricing?.status === Status.Active && (
              <FieldGroup
                // eslint-disable-next-line react/no-array-index-key -- TODO refactor to use pk / fake pks
                key={index}
                id="pricings"
                heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
              >
                <PricingTypeView
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
              pricing.status === Status.Future && (
                <FieldGroup
                  // eslint-disable-next-line react/no-array-index-key -- TODO refactor to use pk / fake pks
                  key={index}
                  id="pricings"
                  heading={`${t("ReservationUnitEditor.label.pricingType")} *`}
                  tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
                >
                  <PricingTypeView
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
          <ControlledSelect
            control={control}
            name="pricingTerms"
            label={t("ReservationUnitEditor.label.pricingTerms")}
            placeholder={t("common.select")}
            required
            clearable
            options={pricingTermsOptions}
            error={getTranslatedError(t, errors.pricingTerms?.message)}
            tooltip={t("ReservationUnitEditor.tooltip.pricingTerms")}
          />
        )}
      </VerticalFlex>
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
                  errorText={getTranslatedError(t, errors[fieldName]?.message)}
                  style={{ gridColumn: "1 / -1" }}
                  tooltipText={getTranslatedTooltipTex(t, fieldName)}
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
                errorText={getTranslatedError(t, errors[fieldName]?.message)}
                invalid={errors[fieldName]?.message != null}
                tooltipText={getTranslatedTooltipTex(t, fieldName)}
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
                errorText={getTranslatedError(t, errors[fieldName]?.message)}
                invalid={errors[fieldName]?.message != null}
                tooltipText={getTranslatedTooltipTex(t, fieldName)}
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
                  errorText={getTranslatedError(t, errors[fieldName]?.message)}
                  invalid={errors[fieldName]?.message != null}
                  tooltipText={getTranslatedTooltipTex(t, fieldName)}
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
          tooltipText={getTranslatedTooltipTex(t, "contactInformation")}
        />
      </VerticalFlex>
    </Accordion>
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
  const { t } = useTranslation();

  const previewUrl = `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}#calendar`;
  const previewDisabled =
    previewUrlPrefix === "" || !reservationUnit?.pk || !reservationUnit?.uuid;

  // TODO refactor this to inner wrapper (so we don't have a ternary in the middle)
  return (
    <Accordion heading={t("ReservationUnitEditor.openingHours")}>
      {reservationUnit?.haukiUrl ? (
        <AutoGrid>
          <p style={{ gridColumn: "1 / -1" }}>
            {t("ReservationUnitEditor.openingHoursHelperTextHasLink")}
          </p>
          <ButtonLikeLink
            disabled={!reservationUnit?.haukiUrl}
            to={reservationUnit?.haukiUrl ?? ""}
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
}: {
  form: UseFormReturn<ReservationUnitEditFormValues>;
  equipments: ReservationUnitEditorParametersQuery["equipments"];
  purposes: ReservationUnitEditorParametersQuery["purposes"];
  qualifiers: ReservationUnitEditorParametersQuery["qualifiers"];
  reservationUnitTypes: ReservationUnitEditorParametersQuery["reservationUnitTypes"];
}) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const { errors } = formState;

  const equipmentOptions = filterNonNullable(
    equipments?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));

  const purposeOptions = filterNonNullable(
    purposes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const qualifierOptions = filterNonNullable(
    qualifiers?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
  }));
  const reservationUnitTypeOptions = filterNonNullable(
    reservationUnitTypes?.edges.map((n) => n?.node)
  ).map((n) => ({
    value: n?.pk ?? -1,
    label: n?.nameFi ?? "no-name",
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
  const { data: unitResourcesData } = useUnitWithSpacesAndResourcesQuery({
    skip: !unitPk,
    variables: { id },
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { data: parametersData } = useReservationUnitEditorParametersQuery({
    onError: (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
      errorToast({ text: t("errors.errorFetchingData") });
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
    value: n?.pk ?? -1,
    label: n?.value.toString(),
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
  const onSubmit = async (formValues: ReservationUnitEditFormValues) => {
    const input = transformReservationUnit(formValues);
    const { pk } = input ?? {};
    try {
      const promise =
        pk != null
          ? updateMutation({ variables: { input: { ...input, pk } } })
          : createMutation({
              variables: { input: { ...input, unit: unitPk } },
            });

      const { data, errors: mutationErrors } = await promise;
      if (mutationErrors != null) {
        errorToast({
          text: t("ReservationUnitEditor.saveFailed", {
            error: mutationErrors,
          }),
        });
        return undefined;
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

      if (upPk) {
        const { images } = formValues;
        // res unit is saved, we can save changes to images
        const success = await reconcileImageChanges(upPk, images);
        if (success) {
          // redirect if new one was created
          if (formValues.pk === 0 && upPk > 0) {
            history(`/unit/${unitPk}/reservationUnit/edit/${upPk}`);
          }
          const tkey =
            formValues.pk === 0
              ? "ReservationUnitEditor.reservationUnitCreatedNotification"
              : "ReservationUnitEditor.reservationUnitUpdatedNotification";
          successToast({ text: t(tkey, { name: getValues("nameFi") }) });
        } else {
          errorToast({ text: "ReservationUnitEditor.imageSaveFailed" });
          return undefined;
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          "saved but, pk was not defined in mutation response: so images are not saved"
        );
        errorToast({ text: "ReservationUnitEditor.imageSaveFailed" });
        return undefined;
      }
      refetch();
      return upPk;
    } catch (error) {
      if (
        error != null &&
        typeof error === "object" &&
        "graphQLErrors" in error
      ) {
        const { graphQLErrors } = error;
        if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
          if ("extensions" in graphQLErrors[0]) {
            const { extensions } = graphQLErrors[0];
            if ("errors" in extensions) {
              const { errors } = extensions;
              if (Array.isArray(errors) && errors.length > 0) {
                let str = "";
                for (const e of errors) {
                  if ("message" in e) {
                    str += `${e.message}\n`;
                  }
                }
                errorToast({
                  text: t("ReservationUnitEditor.saveFailed", { error: str }),
                });
                return undefined;
              }
            }
          }
        }
      }
      errorToast({
        text: t("ReservationUnitEditor.saveFailed", { error: "" }),
      });
    }
    return undefined;
  };

  // Have to define these like this because otherwise the state changes don't work
  const handlePublish = async () => {
    setValue("isDraft", false);
    setValue("isArchived", false);
    await handleSubmit(onSubmit)();
  };

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    setValue("isArchived", false);
    await handleSubmit(onSubmit)();
  };

  const handleAcceptArchive = async () => {
    setValue("isArchived", true);
    setValue("isDraft", false);
    try {
      await handleSubmit(onSubmit)();
      setModalContent(null);
      successToast({ text: t("ArchiveReservationUnitDialog.success") });
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

  const handleBack = () => {
    if (hasChanges) {
      setModalContent(
        <DiscardChangesDialog
          onAccept={() => {
            setModalContent(null);
            history(-1);
          }}
          onClose={() => setModalContent(null)}
        />,
        true
      );
    } else {
      history(-1);
    }
  };

  const isDirect =
    watch("reservationKind") === "DIRECT" ||
    watch("reservationKind") === "DIRECT_AND_SEASON";
  const isSeasonal =
    watch("reservationKind") === "SEASON" ||
    watch("reservationKind") === "DIRECT_AND_SEASON";

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
          equipments={parametersData?.equipments}
          purposes={parametersData?.purposes}
          qualifiers={parametersData?.qualifiers}
          reservationUnitTypes={parametersData?.reservationUnitTypes}
        />
        {isDirect && (
          <ReservationUnitSettings
            form={form}
            metadataOptions={metadataOptions}
            cancellationRuleOptions={cancellationRuleOptions}
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
          <ArchiveButton
            onClick={handleArchiveButtonClick}
            variant="secondary"
            disabled={isSaving || !archiveEnabled}
            theme="black"
          >
            {t("ReservationUnitEditor.archive")}
          </ArchiveButton>
        </div>
      </StyledContainerMedium>
      <ButtonsStripe>
        <WhiteButton
          size="small"
          disabled={isSaving}
          variant="supplementary"
          iconLeft={<IconArrowLeft />}
          onClick={handleBack}
        >
          {t("common.prev")}
        </WhiteButton>
        <Preview
          target="_blank"
          rel="noopener noreferrer"
          $disabled={previewDisabled}
          href={`${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}`}
          onClick={(e) => previewDisabled && e.preventDefault()}
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
          disabled={isSaving || !draftEnabled}
          isLoading={isSaving && watch("isDraft")}
          type="button"
          loadingText={t("ReservationUnitEditor.saving")}
          onClick={handleSaveAsDraft}
        >
          {t("ReservationUnitEditor.saveAsDraft")}
        </WhiteButton>
        <WhiteButton
          variant="primary"
          disabled={isSaving || !publishEnabled}
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
}

type IRouterProps = {
  reservationUnitPk?: string;
  unitPk: string;
};

/// Wrap the editor so we never reset the form after async loading (because of HDS TimeInput bug)
function EditorWrapper({ previewUrlPrefix }: { previewUrlPrefix: string }) {
  const { reservationUnitPk, unitPk: unitPkString } = useParams<IRouterProps>();
  const { t } = useTranslation();

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
    return <Loader />;
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
    return <Error404 message={t("errors.router.unitPkMismatch")} />;
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
    <Wrapper>
      <ReservationUnitEditor
        reservationUnit={reservationUnit}
        form={form}
        unitPk={unitPk}
        refetch={refetch}
        previewUrlPrefix={cleanPreviewUrlPrefix}
      />
    </Wrapper>
  );
}

export default EditorWrapper;
