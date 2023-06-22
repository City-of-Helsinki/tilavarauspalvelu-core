import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Checkbox,
  IconAlertCircleFill,
  IconArrowLeft,
  IconLinkExternal,
  Notification,
  NumberInput,
  RadioButton,
  SelectionGroup,
  TextArea,
  TextInput,
  Tooltip,
} from "hds-react";
import { H1, Strong } from "common/src/common/typography";
import { get, isNull, omitBy, pick, sumBy, upperFirst } from "lodash";
import i18next from "i18next";
import React, { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitByPkArgs,
  ReservationUnitCreateMutationInput,
  ReservationUnitUpdateMutationInput,
  Mutation,
  ErrorType,
  Maybe,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitImageCreateMutationInput,
  ReservationUnitsReservationUnitAuthenticationChoices,
  UnitByPkType,
  ReservationState,
  ReservationUnitState,
} from "common/types/gql-types";

import { languages, previewUrlPrefix, publicUrl } from "../../../common/const";
import Select from "./Select";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "../../../common/queries";
import { OptionType } from "../../../common/types";
import {
  Container,
  DenseVerticalFlex,
  Grid,
  HorisontalFlex,
  Span12,
  Span6,
  VerticalFlex,
} from "../../../styles/layout";

import { ButtonsStripe, WhiteButton } from "../../../styles/util";
import Loader from "../../Loader";
import { MainMenuWrapper } from "../../withMainMenu";
import RichTextInput from "../../RichTextInput";
import { useNotification } from "../../../context/NotificationContext";
import ActivationGroup from "./ActivationGroup";
import EnumSelect from "./EnumSelect";
import ImageEditor from "./ImageEditor";
import DateTimeInput from "./DateTimeInput";
import {
  ButtonsContainer,
  Preview,
  Wrapper,
  Span4,
  Error,
  ArchiveButton,
  ExpandLink,
  SlimH4,
} from "./modules/reservationUnitEditor";
import { draftSchema, IProps, schema, State } from "./types";
import { getInitialState, i18nFields, reducer } from "./reducer";
import {
  CREATE_IMAGE,
  CREATE_RESERVATION_UNIT,
  DELETE_IMAGE,
  RESERVATIONUNIT_QUERY,
  RESERVATION_UNIT_EDITOR_PARAMETERS,
  UPDATE_IMAGE_TYPE,
  UPDATE_RESERVATION_UNIT,
} from "./queries";
import FormErrorSummary, {
  validationErrorResolver,
} from "../../../common/FormErrorSummary";
import SortedSelect from "./SortedSelect";
import { useModal } from "../../../context/ModalContext";
import ArchiveDialog from "./ArchiveDialog";
import ReservationUnitStateTag from "./ReservationUnitStateTag";
import DiscardChangesDialog from "./DiscardChangesDialog";
import FieldGroup from "./FieldGroup";
import PricingType from "./PricingType";
import BreadcrumbWrapper from "../../BreadcrumbWrapper";
import { parseAddress } from "../../../common/util";
import { Accordion } from "../../../common/hds-fork/Accordion";
import ReservationStateTag from "./ReservationStateTag";

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
    .map((v, i) => 3600 * 2 + i * 1800)
    .map((v) => ({
      value: v,
      label: i18next.t("ReservationUnitEditor.durationHours", {
        hours: (v / 3600).toLocaleString("fi"),
      }),
    }))
);

const getSelectedOptions = (
  state: State,
  optionsPropertyName: string,
  valuePropName: string
): OptionType[] => {
  const fullPropName = `reservationUnitEdit.${valuePropName}`;
  const options = get(state, optionsPropertyName);

  if (!options || !get(state, fullPropName)) {
    return [];
  }

  return (
    get(state, fullPropName)
      // eslint-disable-next-line
      .map((optionPk: any) => options.find((so: any) => so.value === optionPk))
      .filter(Boolean) as OptionType[]
  );
};

const TitleSectionWithTags = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
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
    <DenseVerticalFlex>
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
        <div
          style={{
            lineHeight: "24px",
            fontSize: "var(--fontsize-heading-s)",
          }}
        >
          <div>
            <Strong>{unit.nameFi}</Strong>
          </div>
          {unit.location ? <span>{parseAddress(unit.location)}</span> : null}
        </div>
        {unit.location ? <span>{parseAddress(unit.location)}</span> : null}
      </div>
    </DenseVerticalFlex>
  );
};

const ReservationUnitEditor = (): JSX.Element | null => {
  const { reservationUnitPk, unitPk } = useParams<IProps>();
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const history = useNavigate();
  const { notifySuccess, notifyError } = useNotification();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(reservationUnitPk))
  );

  const onDataError = (text: string) => {
    dispatch({
      type: "dataInitializationError",
      message: text || t("ReservationUnitEditor.dataLoadFailedMessage"),
    });
  };

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

  const createOrUpdateReservationUnit = async (
    publish?: boolean,
    archive?: boolean
  ): Promise<number | undefined> => {
    const input = pick(
      {
        ...omitBy(state.reservationUnitEdit, (v) => v === ""),
        surfaceArea: Number(state.reservationUnitEdit?.surfaceArea),
        ...(publish != null ? { isDraft: !publish } : {}),
        reservationStartInterval:
          state.reservationUnitEdit?.reservationStartInterval?.toLocaleLowerCase(), /// due to api inconsistency
        maxReservationsPerUser: state.reservationUnitEdit
          ?.maxReservationsPerUser
          ? Number(state.reservationUnitEdit?.maxReservationsPerUser)
          : null,
        ...(archive != null ? { isArchived: archive } : {}),
        pricings: state.reservationUnitEdit.pricings?.map((pricing) =>
          omitBy(pricing, isNull)
        ),
      },
      [
        "reservationKind",
        "authentication",
        "bufferTimeAfter",
        "bufferTimeBefore",
        "isDraft",
        "maxPersons",
        "minPersons",
        "maxReservationsPerUser",
        "metadataSetPk",
        "maxReservationDuration",
        "minReservationDuration",
        "pk",
        "paymentTypes",
        "pricingType",
        "pricingTermsPk",
        "publishBegins",
        "publishEnds",
        "requireIntroduction",
        "reservationBegins",
        "reservationEnds",
        "reservationStartInterval",
        "purposePks",
        "qualifierPks",
        "cancellationRulePk",
        "cancellationTermsPk",
        "equipmentPks",
        "paymentTermsPk",
        "reservationUnitTypePk",
        "resourcePks",
        "serviceSpecificTermsPk",
        "spacePks",
        "surfaceArea",
        "unitPk",
        "requireReservationHandling",
        "contactInformation",
        "canApplyFreeOfCharge",
        "reservationsMinDaysBefore",
        "reservationsMaxDaysBefore",
        "isArchived",
        "pricings",
        ...i18nFields("reservationPendingInstructions"),
        ...i18nFields("reservationConfirmedInstructions"),
        ...i18nFields("reservationCancelledInstructions"),
        ...i18nFields("description"),
        ...i18nFields("name"),
        ...i18nFields("termsOfUse"),
      ]
    );

    let errors: Maybe<Maybe<ErrorType>[]> | undefined;

    let resUnitPk: number | undefined = state.reservationUnitPk;
    try {
      if (state.reservationUnitPk) {
        const res = await updateReservationUnit(
          input as ReservationUnitUpdateMutationInput
        );
        errors = res.data?.updateReservationUnit?.errors;
      } else {
        const res = await createReservationUnit(
          input as ReservationUnitCreateMutationInput
        );

        errors = res.data?.createReservationUnit?.errors;

        if (res.data?.createReservationUnit?.errors === null) {
          resUnitPk = res.data.createReservationUnit.pk as number;
        }
      }
      if (errors === null) {
        return resUnitPk;
      }
      const firstError = errors ? errors.find(() => true) : undefined;
      const errorMessage = firstError
        ? `${firstError.field} -${firstError.messages.find(() => true)}`
        : "";

      onDataError(
        t("ReservationUnitEditor.saveFailed", {
          error: errorMessage,
        })
      );
    } catch (error) {
      onDataError(t("ReservationUnitEditor.saveFailed", { error }));
    }
    return undefined;
  };

  const { refetch: refetchReservationUnit } = useQuery<
    Query,
    QueryReservationUnitByPkArgs
  >(RESERVATIONUNIT_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
    skip: !reservationUnitPk,
    onCompleted: ({ reservationUnitByPk }) => {
      if (reservationUnitByPk) {
        dispatch({ type: "dataLoaded", reservationUnit: reservationUnitByPk });
      } else {
        onDataError(t("ReservationUnitEditor.reservationUnitNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery<Query, QueryUnitByPkArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { pk: Number(unitPk) },
    onCompleted: ({ unitByPk }) => {
      if (unitByPk) {
        dispatch({ type: "unitLoaded", unit: unitByPk });
      } else {
        onDataError(t("ReservationUnitEditor.unitNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery<Query>(RESERVATION_UNIT_EDITOR_PARAMETERS, {
    onCompleted: (query) => {
      dispatch({ type: "parametersLoaded", parameters: query });
      if (
        !(
          query.equipments &&
          query.purposes &&
          query.termsOfUse &&
          query.reservationUnitCancellationRules?.edges.length
        )
      ) {
        notifyError(t("ReservationUnitEditor.errorParamsNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const [createImage] = useMutation<
    Mutation,
    ReservationUnitImageCreateMutationInput
  >(CREATE_IMAGE);

  const [delImage] = useMutation<Mutation>(DELETE_IMAGE);
  const [updateImagetype] = useMutation<Mutation>(UPDATE_IMAGE_TYPE);

  const reconcileImageChanges = async (resUnitPk: number): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = state.images
        .filter((image) => image.deleted)
        .map((image) =>
          delImage({
            variables: {
              pk: image.pk,
            },
          })
        );
      const res = await Promise.all(deletePromises);
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.deleteReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // create images
    try {
      const addPromises = state.images
        .filter((image) => (image.pk as number) < 0)
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
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.createReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // change imagetypes
    try {
      const changeTypePromises = state.images
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
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.updateReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  };

  const publishReservationUnit = async (publish: boolean) => {
    setSaving(true);
    try {
      const resUnitPk = await createOrUpdateReservationUnit(publish, false);
      if (resUnitPk) {
        // res unit is saved, we can save changes to images
        const success = await reconcileImageChanges(resUnitPk);
        if (success) {
          refetchReservationUnit();
          if (!state.reservationUnitPk) {
            // create, redirect to edit
            history(`/unit/${unitPk}/reservationUnit/edit/${resUnitPk}`);
            dispatch({ type: "created", pk: resUnitPk });
          }
          notifySuccess(
            t(
              state.reservationUnitPk
                ? "ReservationUnitEditor.reservationUnitUpdatedNotification"
                : "ReservationUnitEditor.reservationUnitCreatedNotification",
              { name: state.reservationUnitEdit.nameFi }
            )
          );
        } else {
          notifyError("jokin meni pieleen");
        }
      }
    } catch (e) {
      // todo
    }
    setSaving(false);
  };

  useEffect(() => {
    if (!reservationUnitPk) {
      dispatch({ type: "editNew", unitPk: Number(unitPk) });
    }
  }, [reservationUnitPk, unitPk]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setValue = (value: any) => {
    dispatch({ type: "set", value });
  };

  const { setModalContent } = useModal();

  if (state.loading) {
    return <Loader />;
  }

  const hasPrice = get(state.reservationUnitEdit, "pricings.length", 0) > 0;
  const isPaid =
    state.reservationUnitEdit.pricings?.find(
      (p) => p?.pricingType === "PAID"
    ) !== undefined;

  if (state.error && !state.reservationUnit) {
    return (
      <Wrapper>
        <Notification
          type="error"
          label={t("errors.functionFailed")}
          position="top-center"
          autoClose={false}
          dismissible
          onClose={() => dispatch({ type: "clearError" })}
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
        >
          {t(state.error.message)}
        </Notification>
      </Wrapper>
    );
  }

  if (state.error) {
    return (
      <Wrapper>
        <Notification
          type="error"
          label={t("ReservationUnitEditor.errorDataHeading")}
          position="top-center"
          dismissible
          closeButtonLabelText={t("common.close")}
          onClose={() => dispatch({ type: "clearError" })}
        >
          {t(state.error?.message)}
        </Notification>
      </Wrapper>
    );
  }

  if (state.reservationUnitEdit === null) {
    return null;
  }

  const getValidationError = validationErrorResolver(
    state.validationErrors,
    "ReservationUnitEditor.label."
  );

  const selectedSpaces = state.spaces.filter(
    (s) => state?.reservationUnitEdit?.spacePks?.indexOf(Number(s.pk)) !== -1
  );

  const minSurfaceArea = Math.ceil(
    sumBy(selectedSpaces, (s) => Number(s.surfaceArea) || 0) || 1
  ); // default is 1 if no spaces selected

  const maxPersons = Math.ceil(
    sumBy(selectedSpaces, (s) => Number(s.maxPersons) || 0) || 20
  ); // default is 20 if no spaces selected

  const onlyForDirect =
    state.reservationUnitEdit.reservationKind === "DIRECT" ||
    state.reservationUnitEdit.reservationKind === "DIRECT_AND_SEASON";

  const handleSaveAsDraft = () => {
    const validationErrors = draftSchema.validate(state.reservationUnitEdit);

    if (validationErrors.error) {
      dispatch({ type: "setValidationErrors", validationErrors });
    } else {
      publishReservationUnit(false);
      dispatch({
        type: "setValidationErrors",
        validationErrors: null,
      });
    }
  };

  const handlePublish = () => {
    const validationErrors = schema.validate(state.reservationUnitEdit);

    if (validationErrors.error) {
      dispatch({ type: "setValidationErrors", validationErrors });
    } else {
      publishReservationUnit(true);
      dispatch({
        type: "setValidationErrors",
        validationErrors: null,
      });
    }
  };

  const handleAcceptArchive = async () => {
    try {
      const r = await createOrUpdateReservationUnit(undefined, true);

      if (r) {
        setModalContent(null);
        notifySuccess(t("ArchiveReservationUnitDialog.success"));
        history(-1);
      }
    } catch (e) {
      // noop
    }
  };

  const handleArchiveButtonClick = async () => {
    if (state.reservationUnit) {
      setModalContent(
        <ArchiveDialog
          reservationUnit={state.reservationUnit}
          onAccept={handleAcceptArchive}
          onClose={() => setModalContent(null)}
        />,
        true
      );
    }
  };

  return (
    <Wrapper key={JSON.stringify(state.validationErrors)}>
      <MainMenuWrapper>
        <BreadcrumbWrapper
          route={[
            "spaces-n-settings",
            `${publicUrl}/reservation-units`,
            "reservation-unit",
          ]}
          aliases={[
            {
              slug: "reservation-unit",
              title: state.reservationUnitEdit.nameFi || "-",
            },
          ]}
        />
        <Container>
          <DisplayUnit
            heading={
              state.reservationUnitEdit.nameFi ??
              t("ReservationUnitEditor.defaultHeading")
            }
            unit={state.unit}
            reservationState={
              state?.reservationUnit?.reservationState ?? undefined
            }
            unitState={state?.reservationUnit?.state ?? undefined}
          />
          <FormErrorSummary
            fieldNamePrefix="ReservationUnitEditor.label."
            validationErrors={state.validationErrors}
            useDerivedIdsFor={[
              "reservationUnitTypePk",
              "metadataSetPk",
              "minReservationDuration",
              "maxReservationDuration",
              "spacePks",
            ]}
          />

          <div key={JSON.stringify(state.validationErrors)}>
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
                    <Grid>
                      {["DIRECT_AND_SEASON", "DIRECT", "SEASON"].map(
                        (kind, index) => (
                          <Span4 key={kind}>
                            <RadioButton
                              id={`reservationKind.${kind}`}
                              name="reservationKind"
                              label={t(
                                `ReservationUnitEditor.label.reservationKinds.${kind}`
                              )}
                              value={kind}
                              checked={
                                state.reservationUnitEdit.reservationKind ===
                                kind
                              }
                              onChange={() =>
                                setValue({ reservationKind: kind })
                              }
                            />
                            {index === 0 &&
                              getValidationError("reservationKind") && (
                                <Error>
                                  <IconAlertCircleFill />
                                  <span>
                                    {getValidationError("reservationKind")}
                                  </span>
                                </Error>
                              )}
                          </Span4>
                        )
                      )}
                    </Grid>
                  </FieldGroup>
                </Span12>
                {languages.map((lang) => {
                  const fieldName = `name${upperFirst(lang)}`;
                  return (
                    <Span12 key={lang}>
                      <TextInput
                        required
                        id={fieldName}
                        label={t(`ReservationUnitEditor.label.${fieldName}`)}
                        value={get(
                          state,
                          `reservationUnitEdit.${fieldName}`,
                          ""
                        )}
                        tooltipText={
                          lang === "fi"
                            ? t("ReservationUnitEditor.tooltip.nameFi")
                            : undefined
                        }
                        onChange={(e) =>
                          setValue({
                            [fieldName]: e.target.value,
                          })
                        }
                        errorText={getValidationError(fieldName)}
                        invalid={!!getValidationError(fieldName)}
                      />
                    </Span12>
                  );
                })}
                <Span6>
                  <SortedSelect
                    id="spacePks"
                    multiselect
                    required
                    label={t("ReservationUnitEditor.label.spacePks")}
                    placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
                    options={state.spaceOptions}
                    onChange={(spaces) =>
                      dispatch({ type: "setSpaces", spaces })
                    }
                    disabled={state.spaceOptions.length === 0}
                    value={[
                      ...getSelectedOptions(state, "spaceOptions", "spacePks"),
                    ]}
                    error={getValidationError("spacePks")}
                    invalid={!!getValidationError("spacePks")}
                    tooltipText={t("ReservationUnitEditor.tooltip.spacePks")}
                  />
                </Span6>
                <Span6>
                  <SortedSelect
                    id="resourcePks"
                    multiselect
                    label={t("ReservationUnitEditor.label.resourcePks")}
                    placeholder={t(
                      "ReservationUnitEditor.resourcesPlaceholder"
                    )}
                    options={state.resourceOptions}
                    onChange={(resources) =>
                      dispatch({ type: "setResources", resources })
                    }
                    disabled={state.resourceOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "resourceOptions",
                        "resourcePks"
                      ),
                    ]}
                    error={getValidationError("resourcePks")}
                    invalid={!!getValidationError("resourcePks")}
                    tooltipText={t("ReservationUnitEditor.tooltip.resourcePks")}
                  />
                </Span6>
                <Span4>
                  <NumberInput
                    value={Math.ceil(
                      state.reservationUnitEdit.surfaceArea || 0
                    )}
                    id="surfaceArea"
                    label={t("ReservationUnitEditor.label.surfaceArea")}
                    helperText={t(
                      "ReservationUnitEditor.surfaceAreaHelperText"
                    )}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) => {
                      setValue({
                        surfaceArea: Number(e.target.value),
                      });
                    }}
                    step={1}
                    type="number"
                    min={minSurfaceArea}
                    required
                    errorText={getValidationError("surfaceArea")}
                    invalid={!!getValidationError("surfaceArea")}
                    tooltipText={t("ReservationUnitEditor.tooltip.surfaceArea")}
                  />
                </Span4>
                <Span4>
                  <NumberInput
                    value={Math.ceil(state.reservationUnitEdit.maxPersons || 0)}
                    id="maxPersons"
                    label={t("ReservationUnitEditor.label.maxPersons")}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) =>
                      dispatch({
                        type: "setMaxPersons",
                        maxPersons: Number(e.target.value),
                      })
                    }
                    step={1}
                    type="number"
                    min={1}
                    max={maxPersons}
                    helperText={t("ReservationUnitEditor.maxPersonsHelperText")}
                    errorText={getValidationError("maxPersons")}
                    invalid={!!getValidationError("maxPersons")}
                    required
                    tooltipText={t("ReservationUnitEditor.tooltip.maxPersons")}
                  />
                </Span4>
                <Span4>
                  <NumberInput
                    value={state.reservationUnitEdit.minPersons || 0}
                    id="minPersons"
                    label={t("ReservationUnitEditor.label.minPersons")}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) => {
                      setValue({
                        minPersons: Number(e.target.value),
                      });
                    }}
                    step={1}
                    type="number"
                    min={0}
                    max={state.reservationUnitEdit.maxPersons || 1}
                    errorText={getValidationError("minPersons")}
                    invalid={!!getValidationError("minPersons")}
                    tooltipText={t("ReservationUnitEditor.tooltip.minPersons")}
                  />
                </Span4>
              </Grid>
            </Accordion>
            <Accordion
              initiallyOpen={state.validationErrors != null}
              heading={t("ReservationUnitEditor.typesProperties")}
            >
              <Grid>
                <Span6>
                  <Select
                    sort
                    required
                    id="reservationUnitTypePk"
                    label={t(
                      `ReservationUnitEditor.label.reservationUnitTypePk`
                    )}
                    placeholder={t(
                      `ReservationUnitEditor.reservationUnitTypePlaceholder`
                    )}
                    options={state.reservationUnitTypeOptions}
                    onChange={(e) => {
                      setValue({
                        reservationUnitTypePk: e,
                      });
                    }}
                    helper={t(
                      `ReservationUnitEditor.reservationUnitTypeHelperText`
                    )}
                    value={Number(
                      get(state.reservationUnitEdit, "reservationUnitTypePk")
                    )}
                    errorText={getValidationError("reservationUnitTypePk")}
                    tooltipText={t(
                      "ReservationUnitEditor.tooltip.reservationUnitTypePk"
                    )}
                  />
                </Span6>
                <Span6>
                  <SortedSelect
                    sort
                    multiselect
                    label={t("ReservationUnitEditor.purposesLabel")}
                    placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
                    options={state.purposeOptions}
                    onChange={(purposes) =>
                      dispatch({ type: "setPurposes", purposes })
                    }
                    disabled={state.purposeOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "purposeOptions",
                        "purposePks"
                      ),
                    ]}
                    tooltipText={t("ReservationUnitEditor.tooltip.purposes")}
                  />
                </Span6>
                <Span6>
                  <SortedSelect
                    sort
                    multiselect
                    label={t("ReservationUnitEditor.equipmentsLabel")}
                    placeholder={t(
                      "ReservationUnitEditor.equipmentsPlaceholder"
                    )}
                    options={state.equipmentOptions}
                    onChange={(equipments) =>
                      dispatch({ type: "setEquipments", equipments })
                    }
                    disabled={state.equipmentOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "equipmentOptions",
                        "equipmentPks"
                      ),
                    ]}
                    tooltipText={t("ReservationUnitEditor.tooltip.equipments")}
                  />
                </Span6>
                <Span6>
                  <SortedSelect
                    sort
                    multiselect
                    label={t("ReservationUnitEditor.qualifiersLabel")}
                    placeholder={t(
                      "ReservationUnitEditor.qualifiersPlaceholder"
                    )}
                    options={state.qualifierOptions}
                    onChange={(qualifiers) =>
                      dispatch({ type: "setQualifiers", qualifiers })
                    }
                    disabled={state.qualifierOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "qualifierOptions",
                        "qualifierPks"
                      ),
                    ]}
                    tooltipText={t("ReservationUnitEditor.tooltip.qualifiers")}
                  />
                </Span6>

                {languages.map((lang) => {
                  const fieldName = `description${upperFirst(lang)}`;
                  return (
                    <Span12 key={lang}>
                      <RichTextInput
                        required
                        id={fieldName}
                        label={t(`ReservationUnitEditor.label.${fieldName}`)}
                        value={
                          get(state, `reservationUnitEdit.${fieldName}`, "") ||
                          ""
                        }
                        onChange={(value) =>
                          setValue({
                            [fieldName]: value,
                          })
                        }
                        errorText={getValidationError(fieldName)}
                        tooltipText={
                          lang === "fi"
                            ? t("ReservationUnitEditor.tooltip.description")
                            : ""
                        }
                      />
                    </Span12>
                  );
                })}
                <Span12>
                  <ImageEditor
                    images={state.images}
                    setImages={(images) =>
                      dispatch({ type: "setImages", images })
                    }
                  />
                </Span12>
              </Grid>
            </Accordion>
            {onlyForDirect && (
              <Accordion
                initiallyOpen={state.validationErrors != null}
                heading={t("ReservationUnitEditor.settings")}
              >
                <Grid>
                  <Span12>
                    <FieldGroup
                      heading={t("ReservationUnitEditor.publishingSettings")}
                      tooltip={t(
                        "ReservationUnitEditor.tooltip.publishingSettings"
                      )}
                    >
                      <ActivationGroup
                        id="useScheduledPublishing"
                        label={t("ReservationUnitEditor.scheduledPublishing")}
                        initiallyOpen={
                          Boolean(state.reservationUnitEdit.publishBegins) ||
                          Boolean(state.reservationUnitEdit.publishEnds)
                        }
                        onClose={() =>
                          setValue({
                            publishBegins: null,
                            publishEnds: null,
                          })
                        }
                      >
                        <DenseVerticalFlex>
                          <ActivationGroup
                            id="publishBegins"
                            label={t("ReservationUnitEditor.publishBegins")}
                            initiallyOpen={Boolean(
                              state.reservationUnitEdit.publishBegins
                            )}
                            onClose={() => setValue({ publishBegins: null })}
                            noIndent
                            noMargin
                          >
                            <DateTimeInput
                              value={
                                state.reservationUnitEdit.publishBegins ||
                                undefined
                              }
                              setValue={(v) =>
                                setValue({
                                  publishBegins: v,
                                })
                              }
                            />
                          </ActivationGroup>

                          <ActivationGroup
                            id="publishEnds"
                            label={t("ReservationUnitEditor.publishEnds")}
                            initiallyOpen={Boolean(
                              state.reservationUnitEdit.publishEnds
                            )}
                            onClose={() => setValue({ publishEnds: null })}
                            noIndent
                            noMargin
                          >
                            <DateTimeInput
                              value={
                                state.reservationUnitEdit.publishEnds ||
                                undefined
                              }
                              setValue={(v) =>
                                setValue({
                                  publishEnds: v,
                                })
                              }
                            />
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
                        initiallyOpen={
                          Boolean(
                            state.reservationUnitEdit.reservationBegins
                          ) ||
                          Boolean(state.reservationUnitEdit.reservationEnds)
                        }
                        onClose={() =>
                          setValue({
                            reservationBegins: null,
                            reservationEnds: null,
                          })
                        }
                      >
                        <ActivationGroup
                          id="reservationBegins"
                          label={t("ReservationUnitEditor.reservationBegins")}
                          initiallyOpen={Boolean(
                            state.reservationUnitEdit.reservationBegins
                          )}
                          onClose={() => setValue({ reservationBegins: null })}
                          noIndent
                        >
                          <DateTimeInput
                            value={
                              state.reservationUnitEdit.reservationBegins ||
                              undefined
                            }
                            setValue={(v) =>
                              setValue({
                                reservationBegins: v,
                              })
                            }
                          />
                        </ActivationGroup>
                        <ActivationGroup
                          id="reservationEnds"
                          label={t("ReservationUnitEditor.reservationEnds")}
                          initiallyOpen={Boolean(
                            state.reservationUnitEdit.reservationEnds
                          )}
                          onClose={() => setValue({ reservationEnds: null })}
                          noIndent
                        >
                          <DateTimeInput
                            value={
                              state.reservationUnitEdit.reservationEnds ||
                              undefined
                            }
                            setValue={(v) =>
                              setValue({
                                reservationEnds: v,
                              })
                            }
                          />
                        </ActivationGroup>
                      </ActivationGroup>
                    </FieldGroup>
                  </Span12>
                  <Span6>
                    <Select
                      id="minReservationDuration"
                      options={durationOptions}
                      placeholder={t("common.select")}
                      required
                      label={t(
                        "ReservationUnitEditor.label.minReservationDuration"
                      )}
                      onChange={(v) => setValue({ minReservationDuration: v })}
                      value={
                        state.reservationUnitEdit.minReservationDuration || ""
                      }
                      errorText={getValidationError("minReservationDuration")}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.minReservationDuration"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <Select
                      id="maxReservationDuration"
                      placeholder={t("common.select")}
                      required
                      options={durationOptions}
                      label={t(
                        "ReservationUnitEditor.label.maxReservationDuration"
                      )}
                      onChange={(v) => setValue({ maxReservationDuration: v })}
                      value={
                        state.reservationUnitEdit.maxReservationDuration || ""
                      }
                      errorText={getValidationError("maxReservationDuration")}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.maxReservationDuration"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <Select
                      id="reservationsMaxDaysBefore"
                      options={reservationsMaxDaysBeforeOptions}
                      placeholder={t("common.select")}
                      required
                      label={t(
                        "ReservationUnitEditor.label.reservationsMaxDaysBefore"
                      )}
                      onChange={(v) =>
                        dispatch({
                          type: "setReservationsMaxDaysBefore",
                          reservationsMaxDaysBefore: v as number,
                        })
                      }
                      value={
                        state.reservationUnitEdit.reservationsMaxDaysBefore ||
                        ""
                      }
                      errorText={getValidationError(
                        "reservationsMaxDaysBefore"
                      )}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.reservationsMaxDaysBefore"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <NumberInput
                      value={
                        state.reservationUnitEdit.reservationsMinDaysBefore || 0
                      }
                      id="reservationsMinDaysBefore"
                      label={t(
                        "ReservationUnitEditor.label.reservationsMinDaysBefore"
                      )}
                      minusStepButtonAriaLabel={t(
                        "common.decreaseByOneAriaLabel"
                      )}
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
                      onChange={(e) => {
                        setValue({
                          reservationsMinDaysBefore: Number(e.target.value),
                        });
                      }}
                      step={1}
                      type="number"
                      max={
                        state.reservationUnitEdit.reservationsMaxDaysBefore || 0
                      }
                      min={0}
                      required
                      errorText={getValidationError(
                        "reservationsMinDaysBefore"
                      )}
                      invalid={
                        !!getValidationError("reservationsMinDaysBefore")
                      }
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.reservationsMinDaysBefore"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <EnumSelect
                      id="reservationStartInterval"
                      placeholder={t("common.select")}
                      required
                      value={state.reservationUnitEdit.reservationStartInterval}
                      label={t(
                        "ReservationUnitEditor.label.reservationStartInterval"
                      )}
                      type={
                        ReservationUnitsReservationUnitReservationStartIntervalChoices
                      }
                      onChange={(reservationStartInterval) =>
                        setValue({ reservationStartInterval })
                      }
                      errorText={getValidationError("reservationStartInterval")}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.reservationStartInterval"
                      )}
                    />
                  </Span6>
                  <Span6 />
                  <Span12>
                    <FieldGroup
                      heading={t("ReservationUnitEditor.bufferSettings")}
                      tooltip={t(
                        "ReservationUnitEditor.tooltip.bufferSettings"
                      )}
                    >
                      <Grid>
                        <Span6>
                          <ActivationGroup
                            id="bufferTimeBeforeGroup"
                            label={t("ReservationUnitEditor.bufferTimeBefore")}
                            initiallyOpen={Boolean(
                              state.reservationUnitEdit.bufferTimeBefore
                            )}
                            onClose={() => setValue({ bufferTimeBefore: null })}
                          >
                            <Select
                              id="bufferTimeBefore"
                              options={bufferTimeOptions}
                              label={t(
                                "ReservationUnitEditor.bufferTimeBeforeDuration"
                              )}
                              onChange={(v) =>
                                setValue({ bufferTimeBefore: v })
                              }
                              value={
                                state.reservationUnitEdit.bufferTimeBefore || ""
                              }
                            />
                          </ActivationGroup>
                        </Span6>
                        <Span6>
                          <ActivationGroup
                            id="bufferTimeAfterGroup"
                            label={t("ReservationUnitEditor.bufferTimeAfter")}
                            initiallyOpen={Boolean(
                              state.reservationUnitEdit.bufferTimeAfter
                            )}
                            onClose={() => setValue({ bufferTimeAfter: null })}
                          >
                            <Select
                              id="bufferTimeAfter"
                              options={bufferTimeOptions}
                              label={t(
                                "ReservationUnitEditor.bufferTimeAfterDuration"
                              )}
                              onChange={(v) => setValue({ bufferTimeAfter: v })}
                              value={
                                state.reservationUnitEdit.bufferTimeAfter || ""
                              }
                            />
                          </ActivationGroup>
                        </Span6>
                      </Grid>
                    </FieldGroup>
                  </Span12>
                  <Span12>
                    <FieldGroup
                      heading={t("ReservationUnitEditor.cancellationSettings")}
                      tooltip={t(
                        "ReservationUnitEditor.tooltip.cancellationSettings"
                      )}
                    >
                      <ActivationGroup
                        id="cancellationIsPossible"
                        label={t(
                          "ReservationUnitEditor.cancellationIsPossible"
                        )}
                        initiallyOpen={Boolean(
                          state.reservationUnitEdit.cancellationRulePk
                        )}
                        onClose={() => setValue({ cancellationRulePk: null })}
                      >
                        <SelectionGroup
                          required
                          label={t(
                            "ReservationUnitEditor.cancellationGroupLabel"
                          )}
                        >
                          {state.cancellationRuleOptions.map((o) => (
                            <RadioButton
                              key={o.value}
                              id={`cr-${o.value}`}
                              value={o.value as string}
                              label={o.label}
                              onChange={(e) =>
                                setValue({
                                  cancellationRulePk: Number(e.target.value),
                                })
                              }
                              checked={
                                state.reservationUnitEdit.cancellationRulePk ===
                                o.value
                              }
                            />
                          ))}
                        </SelectionGroup>
                      </ActivationGroup>
                    </FieldGroup>
                  </Span12>
                  <Span6>
                    <Select
                      id="metadataSetPk"
                      sort
                      required
                      options={state.metadataOptions}
                      label={t("ReservationUnitEditor.label.metadataSetPk")}
                      onChange={(v) => setValue({ metadataSetPk: v })}
                      value={state.reservationUnitEdit.metadataSetPk || null}
                      errorText={getValidationError("metadataSetPk")}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.metadataSetPk"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <EnumSelect
                      sort
                      id="authentication"
                      required
                      value={state.reservationUnitEdit.authentication || "WEAK"}
                      label={t("ReservationUnitEditor.authenticationLabel")}
                      type={
                        ReservationUnitsReservationUnitAuthenticationChoices
                      }
                      onChange={(authentication) =>
                        setValue({ authentication })
                      }
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.authentication"
                      )}
                    />
                  </Span6>
                  <Span6>
                    <NumberInput
                      id="maxReservationsPerUser"
                      label={t("ReservationUnitEditor.maxReservationsPerUser")}
                      minusStepButtonAriaLabel={t(
                        "common.decreaseByOneAriaLabel"
                      )}
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
                      min={1}
                      max={15}
                      step={1}
                      type="number"
                      value={
                        state.reservationUnitEdit.maxReservationsPerUser || ""
                      }
                      onChange={(e) => {
                        setValue({
                          maxReservationsPerUser: e.target.value || null,
                        });
                      }}
                      tooltipText={t(
                        "ReservationUnitEditor.tooltip.maxReservationsPerUser"
                      )}
                    />
                  </Span6>
                  <Span12>
                    <FieldGroup
                      heading={t("ReservationUnitEditor.introductionSettings")}
                      tooltip={t(
                        "ReservationUnitEditor.tooltip.introductionSettings"
                      )}
                    >
                      <Checkbox
                        id="requireIntroduction"
                        label={t(
                          "ReservationUnitEditor.requireIntroductionLabel"
                        )}
                        checked={
                          state.reservationUnitEdit.requireIntroduction === true
                        }
                        onClick={() =>
                          setValue({
                            requireIntroduction:
                              !state.reservationUnitEdit?.requireIntroduction,
                          })
                        }
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
                      <Checkbox
                        id="requireReservationHandling"
                        label={t(
                          "ReservationUnitEditor.requireReservationHandling"
                        )}
                        checked={
                          state.reservationUnitEdit
                            .requireReservationHandling === true
                        }
                        onClick={() =>
                          setValue({
                            requireReservationHandling:
                              !state.reservationUnitEdit
                                ?.requireReservationHandling,
                          })
                        }
                      />
                    </FieldGroup>
                  </Span12>
                </Grid>
              </Accordion>
            )}
            <Accordion
              initiallyOpen={state.validationErrors != null}
              heading={t("ReservationUnitEditor.label.pricings")}
            >
              <Grid>
                <Span12>
                  <FieldGroup
                    id="pricings"
                    heading={`${t(
                      "ReservationUnitEditor.label.pricingType"
                    )} *`}
                    tooltip={t("ReservationUnitEditor.tooltip.pricingType")}
                  />
                  <Span12>
                    <VerticalFlex>
                      <PricingType
                        hasPrice={hasPrice}
                        dispatch={dispatch}
                        getSelectedOptions={getSelectedOptions}
                        getValidationError={getValidationError}
                        state={state}
                        type="ACTIVE"
                      />
                      <PricingType
                        hasPrice={hasPrice}
                        dispatch={dispatch}
                        getSelectedOptions={getSelectedOptions}
                        getValidationError={getValidationError}
                        state={state}
                        type="FUTURE"
                      />
                      {isPaid && (
                        <HorisontalFlex
                          style={{
                            justifyContent: "space-between",
                            width: "100%",
                          }}
                        >
                          <Checkbox
                            label={t(
                              "ReservationUnitEditor.label.canApplyFreeOfCharge"
                            )}
                            id="canApplyFreeOfCharge"
                            checked={
                              state.reservationUnitEdit.canApplyFreeOfCharge ===
                              true
                            }
                            onClick={() =>
                              setValue({
                                canApplyFreeOfCharge:
                                  !state.reservationUnitEdit
                                    ?.canApplyFreeOfCharge,
                              })
                            }
                          />
                          <Tooltip>
                            {t(
                              "ReservationUnitEditor.tooltip.canApplyFreeOfCharge"
                            )}
                          </Tooltip>
                        </HorisontalFlex>
                      )}
                    </VerticalFlex>

                    {state.reservationUnitEdit?.canApplyFreeOfCharge &&
                      isPaid && (
                        <Span6>
                          <Select
                            required
                            sort
                            clearable={
                              !!get(state.reservationUnitEdit, "pricingTermsPk")
                            }
                            id="pricingTerms"
                            label={t(
                              "ReservationUnitEditor.label.pricingTermsPk"
                            )}
                            placeholder={t("common.select")}
                            options={get(state, "pricingTermsOptions")}
                            onChange={(pricingTermsPk) => {
                              setValue({
                                pricingTermsPk,
                              });
                            }}
                            value={
                              get(
                                state.reservationUnitEdit,
                                "pricingTermsPk"
                              ) as string
                            }
                            tooltipText={
                              t(
                                "ReservationUnitEditor.tooltip.pricingTermsPk"
                              ) as string
                            }
                          />
                        </Span6>
                      )}
                  </Span12>
                </Span12>
              </Grid>
            </Accordion>
            {onlyForDirect && (
              <Accordion
                initiallyOpen={state.validationErrors != null}
                heading={t("ReservationUnitEditor.termsInstructions")}
              >
                <Grid>
                  {["serviceSpecific", "payment", "cancellation"].map(
                    (name) => {
                      const options = get(state, `${name}TermsOptions`, []);
                      const propName = `${name}TermsPk`;
                      return (
                        <Span6 key={name}>
                          <Select
                            clearable={
                              !!get(state.reservationUnitEdit, propName)
                            }
                            sort
                            id={name}
                            label={t(`ReservationUnitEditor.label.${propName}`)}
                            placeholder={t(
                              `ReservationUnitEditor.${name}TermsPlaceholder`
                            )}
                            options={options}
                            onChange={(selection) => {
                              setValue({
                                [propName]: selection,
                              });
                            }}
                            helper={t(
                              `ReservationUnitEditor.${name}TermsHelperText`
                            )}
                            value={get(state.reservationUnitEdit, propName)}
                            tooltipText={t(
                              `ReservationUnitEditor.tooltip.${name}TermsPk`
                            )}
                          />
                        </Span6>
                      );
                    }
                  )}
                  {languages.map((lang) => {
                    const fieldName = `termsOfUse${upperFirst(lang)}`;
                    return (
                      <Span12 key={lang}>
                        <RichTextInput
                          id={fieldName}
                          label={t(`ReservationUnitEditor.label.${fieldName}`)}
                          value={get(
                            state,
                            `reservationUnitEdit.${fieldName}`,
                            ""
                          )}
                          onChange={(value) =>
                            setValue({
                              [fieldName]: value,
                            })
                          }
                          errorText={getValidationError(fieldName)}
                          tooltipText={
                            lang === "fi"
                              ? t("ReservationUnitEditor.tooltip.termsOfUseFi")
                              : ""
                          }
                        />
                      </Span12>
                    );
                  })}
                </Grid>
              </Accordion>
            )}
            <Accordion
              initiallyOpen={state.validationErrors != null}
              heading={t("ReservationUnitEditor.communication")}
            >
              <Grid>
                <Span12>
                  <ExpandLink
                    initiallyOpen={state.validationErrors != null}
                    heading={t("ReservationUnitEditor.pendingExpandLink")}
                  >
                    <SlimH4>
                      {t("ReservationUnitEditor.pendingInstructions")}
                    </SlimH4>
                    {languages.map((lang) => {
                      const fieldName = `reservationPendingInstructions${upperFirst(
                        lang
                      )}`;
                      return (
                        <TextArea
                          key={lang}
                          id={fieldName}
                          label={t(
                            `ReservationUnitEditor.label.instructions${upperFirst(
                              lang
                            )}`
                          )}
                          value={get(
                            state,
                            `reservationUnitEdit.reservationPendingInstructions${upperFirst(
                              lang
                            )}`,
                            ""
                          )}
                          onChange={(e) =>
                            setValue({
                              [fieldName]: e.target.value,
                            })
                          }
                          errorText={getValidationError(fieldName)}
                          invalid={!!getValidationError(fieldName)}
                          tooltipText={
                            lang === "fi"
                              ? t(
                                  "ReservationUnitEditor.tooltip.reservationPendingInstructionsFi"
                                )
                              : ""
                          }
                        />
                      );
                    })}
                  </ExpandLink>
                </Span12>
                <Span12>
                  <SlimH4>
                    {t("ReservationUnitEditor.confirmedInstructions")}
                  </SlimH4>
                </Span12>
                {languages.map((lang) => {
                  const fieldName = `reservationConfirmedInstructions${upperFirst(
                    lang
                  )}`;
                  return (
                    <Span12 key={lang}>
                      <TextArea
                        id={fieldName}
                        label={t(
                          `ReservationUnitEditor.label.instructions${upperFirst(
                            lang
                          )}`
                        )}
                        value={get(
                          state,
                          `reservationUnitEdit.reservationConfirmedInstructions${upperFirst(
                            lang
                          )}`,
                          ""
                        )}
                        onChange={(e) =>
                          setValue({
                            [fieldName]: e.target.value,
                          })
                        }
                        errorText={getValidationError(fieldName)}
                        invalid={!!getValidationError(fieldName)}
                        tooltipText={
                          lang === "fi"
                            ? t(
                                "ReservationUnitEditor.tooltip.reservationConfirmedInstructionsFi"
                              )
                            : ""
                        }
                      />
                    </Span12>
                  );
                })}
                <Span12>
                  <ExpandLink
                    initiallyOpen={state.validationErrors != null}
                    heading={t("ReservationUnitEditor.cancelledExpandLink")}
                  >
                    <Span12>
                      <SlimH4>
                        {t("ReservationUnitEditor.cancelledInstructions")}
                      </SlimH4>
                    </Span12>
                    {languages.map((lang) => {
                      const fieldName = `reservationCancelledInstructions${upperFirst(
                        lang
                      )}`;
                      return (
                        <Span12 key={lang}>
                          <TextArea
                            id={fieldName}
                            label={t(
                              `ReservationUnitEditor.label.instructions${upperFirst(
                                lang
                              )}`
                            )}
                            value={get(
                              state,
                              `reservationUnitEdit.reservationCancelledInstructions${upperFirst(
                                lang
                              )}`,
                              ""
                            )}
                            onChange={(e) =>
                              setValue({
                                [fieldName]: e.target.value,
                              })
                            }
                            errorText={getValidationError(fieldName)}
                            invalid={!!getValidationError(fieldName)}
                            tooltipText={
                              lang === "fi"
                                ? t(
                                    "ReservationUnitEditor.tooltip.reservationCancelledInstructionsFi"
                                  )
                                : ""
                            }
                          />
                        </Span12>
                      );
                    })}
                  </ExpandLink>
                </Span12>
                <Span12>
                  <TextInput
                    id="contactInformation"
                    label={t("ReservationUnitEditor.contactInformationLabel")}
                    value={state.reservationUnitEdit.contactInformation || ""}
                    onChange={(e) =>
                      setValue({
                        contactInformation: e.target.value,
                      })
                    }
                    helperText={t(
                      "ReservationUnitEditor.contactInformationHelperText"
                    )}
                    tooltipText={t(
                      "ReservationUnitEditor.tooltip.contactInformation"
                    )}
                  />
                </Span12>
              </Grid>
            </Accordion>
            <Accordion
              initiallyOpen={state.validationErrors != null}
              heading={t("ReservationUnitEditor.openingHours")}
            >
              {state.reservationUnit?.haukiUrl?.url ? (
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
                        if (state.reservationUnit?.haukiUrl?.url) {
                          window.open(
                            state.reservationUnit?.haukiUrl?.url,
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
                        if (state.reservationUnit?.haukiUrl?.url) {
                          window.open(
                            `${previewUrlPrefix}/${state.reservationUnit?.pk}?ru=${state.reservationUnit?.uuid}#calendar`,
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
            >
              {t("ReservationUnitEditor.archive")}
            </ArchiveButton>
          </div>
        </Container>
      </MainMenuWrapper>
      <ButtonsStripe>
        <WhiteButton
          size="small"
          disabled={saving}
          variant="supplementary"
          iconLeft={<IconArrowLeft />}
          onClick={() =>
            setModalContent(
              <DiscardChangesDialog
                onAccept={async () => {
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
            disabled={saving || !state.reservationUnitPk}
            href={`${previewUrlPrefix}/${state.reservationUnit?.pk}?ru=${state.reservationUnit?.uuid}`}
            onClick={(e) => state.hasChanges && e.preventDefault()}
            title={t(
              state.hasChanges
                ? "ReservationUnitEditor.noPreviewUnsavedChangesTooltip"
                : "ReservationUnitEditor.previewTooltip"
            )}
          >
            <span>{t("ReservationUnitEditor.preview")}</span>
          </Preview>

          <WhiteButton
            size="small"
            disabled={saving}
            variant="secondary"
            isLoading={saving}
            type="button"
            loadingText={t("ReservationUnitEditor.saving")}
            onClick={handleSaveAsDraft}
          >
            {t("ReservationUnitEditor.saveAsDraft")}
          </WhiteButton>
          <WhiteButton
            variant="primary"
            disabled={saving}
            type="button"
            onClick={handlePublish}
          >
            {t("ReservationUnitEditor.saveAndPublish")}
          </WhiteButton>
        </ButtonsContainer>
      </ButtonsStripe>
    </Wrapper>
  );
};

export default ReservationUnitEditor;
