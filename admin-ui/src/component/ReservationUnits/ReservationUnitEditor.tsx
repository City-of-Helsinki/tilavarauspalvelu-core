import { FetchResult, useMutation, useQuery } from "@apollo/client";
import {
  Accordion,
  Button,
  Checkbox,
  Combobox,
  Notification,
  NumberInput,
  TextArea,
  TextInput,
  TimeInput,
} from "hds-react";
import i18next from "i18next";
import { get, pick, sumBy, upperFirst } from "lodash";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { languages } from "../../common/const";
import {
  EquipmentType,
  PurposeType,
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitByPkArgs,
  ReservationUnitByPkType,
  ReservationUnitCreateMutationInput,
  ReservationUnitCreateMutationPayload,
  ReservationUnitUpdateMutationInput,
  ReservationUnitUpdateMutationPayload,
  ResourceType,
  SpaceType,
  UnitByPkType,
} from "../../common/gql-types";
import {
  CREATE_RESERVATION_UNIT,
  RESERVATION_UNIT_EDITOR_PARAMETERS,
  RESERVATIONUNIT_QUERY,
  UNIT_WITH_SPACES_AND_RESOURCES,
  UPDATE_RESERVATION_UNIT,
} from "../../common/queries";
import { OptionType } from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";

import { breakpoints } from "../../styles/util";
import Loader from "../Loader";
import SubPageHead from "../Unit/SubPageHead";
import withMainMenu from "../withMainMenu";

interface IProps {
  reservationUnitPk?: string;
  unitPk: string;
}

type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

type Action =
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | { type: "clearError" }
  | { type: "dataLoaded"; reservationUnit: ReservationUnitByPkType }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "editNew" }
  | { type: "dataInitializationError"; message: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "set"; value: any }
  | { type: "setSpaces"; spaces: OptionType[] }
  | { type: "setResources"; resources: OptionType[] }
  | { type: "setEquipments"; equipments: OptionType[] }
  | { type: "setPurposes"; purposes: OptionType[] }
  | { type: "equipmentsLoaded"; equipments: EquipmentType[] }
  | { type: "purposesLoaded"; purposes: PurposeType[] };

type ReservationUnitEditorType = {
  pk: number;
  nameFi: string;
  nameSv: string;
  nameEn: string;
  descriptionFi: string;
  descriptionSv: string;
  descriptionEn: string;
  spacePks: number[];
  resourcePks: number[];
  equipmentPks: number[];
  purposePks: number[];
  maxPersons: number;
  surfaceArea: number;
  requireIntroduction: boolean;
  maxReservationDuration: string;
  minReservationDuration: string;
  termsOfUseFi: string;
  termsOfUseSv: string;
  termsOfUseEn: string;
};

type State = {
  reservationUnitPk?: number;
  unitPk: number;
  notification: null | NotificationType;
  loading: boolean;
  reservationUnit: ReservationUnitByPkType | null;
  reservationUnitEdit: ReservationUnitEditorType | null;
  hasChanges: boolean;
  error?: {
    message: string;
  };
  spaces: SpaceType[];
  resources: ResourceType[];
  spaceOptions: OptionType[];
  resourceOptions: OptionType[];
  equipmentOptions: OptionType[];
  purposeOptions: OptionType[];
  unit?: UnitByPkType;
};

const getInitialState = (reservationUnitPk: number, unitPk: number): State => ({
  reservationUnitPk,
  unitPk,
  loading: true,
  notification: null,
  reservationUnit: null,
  reservationUnitEdit: null,
  hasChanges: false,
  resources: [],
  spaces: [],
  spaceOptions: [],
  equipmentOptions: [],
  resourceOptions: [],
  purposeOptions: [],
});

const newReservationUnit = {} as ReservationUnitEditorType;

const withLoadingStatus = (state: State): State => {
  const hasError = typeof state.error?.message !== undefined;

  const newLoadingStatus =
    !hasError &&
    (state.spaceOptions.length === 0 ||
      state.reservationUnitEdit === null ||
      state.equipmentOptions.length === 0 ||
      state.purposeOptions.length === 0);

  return {
    ...state,
    loading: newLoadingStatus,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modifyEditorState = (state: State, edit: any) => ({
  ...state,
  reservationUnitEdit: { ...state.reservationUnitEdit, ...edit },
  hasChanges: true,
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "clearNotification": {
      return { ...state, notification: null };
    }
    case "setNotification": {
      return { ...state, notification: { ...action.notification } };
    }
    case "dataLoaded": {
      const { reservationUnit } = action;
      return withLoadingStatus({
        ...state,
        reservationUnit: {
          ...reservationUnit,
        },
        reservationUnitEdit: {
          ...(pick(reservationUnit, [
            "pk",
            "nameFi",
            "nameSv",
            "nameEn",
            "descriptionFi",
            "descriptionEn",
            "descriptionSv",
            "termsOfUseFi",
            "termsOfUseSv",
            "termsOfUseEn",
            "minReservationDuration",
            "maxReservationDuration",
            "requireIntroduction",
            "descriptionFi",
            "descriptionSv",
            "descriptionEn",
            "surfaceArea",
            "maxPersons",
            "maxReservationDuration",
            "minReservationDuration",
            "requireIntroduction",
          ]) as ReservationUnitEditorType),
          spacePks: reservationUnit?.spaces?.map((s) =>
            Number(s?.pk)
          ) as number[],
          resourcePks: reservationUnit?.resources?.map((s) =>
            Number(s?.pk)
          ) as number[],
          equipmentPks: reservationUnit?.equipment?.map((s) =>
            Number(s?.pk)
          ) as number[],
          purposePks: reservationUnit?.purposes?.map((s) =>
            Number(s?.pk)
          ) as number[],
        },
        hasChanges: false,
      });
    }
    case "unitLoaded": {
      const { unit } = action;

      let errorKey: string | undefined;

      const spaceOptions =
        unit?.spaces?.map((s) => ({
          label: String(s?.nameFi),
          value: Number(s?.pk),
        })) || [];

      if (spaceOptions.length === 0) {
        errorKey = "ReservationUnitEditor.errorNoSpaces";
      }

      const resourceOptions =
        unit?.spaces
          ?.flatMap((s) => s?.resources)
          .map((r) => ({ label: String(r?.nameFi), value: Number(r?.pk) })) ||
        [];

      return withLoadingStatus({
        ...state,
        spaces: unit.spaces as SpaceType[],
        resources:
          ((unit?.spaces &&
            unit.spaces.flatMap((s) => s?.resources)) as ResourceType[]) || [],
        spaceOptions,
        unit,
        resourceOptions,
        error: errorKey ? { message: i18next.t(errorKey) } : state.error,
      });
    }

    case "equipmentsLoaded": {
      return withLoadingStatus({
        ...state,
        equipmentOptions: action.equipments.map((e) => ({
          label: e.nameFi as string,
          value: e.pk as number,
        })),
      });
    }

    case "purposesLoaded": {
      return withLoadingStatus({
        ...state,
        purposeOptions: action.purposes.map((e) => ({
          label: e.nameFi as string,
          value: e.pk as number,
        })),
      });
    }

    case "editNew": {
      return withLoadingStatus({
        ...state,
        reservationUnitEdit: {
          ...newReservationUnit,
        },
        hasChanges: false,
      });
    }
    case "dataInitializationError": {
      return {
        ...state,
        loading: false,
        hasChanges: false,
        error: { message: action.message },
      };
    }
    case "clearError": {
      return {
        ...state,
        error: undefined,
      };
    }
    case "set": {
      return modifyEditorState(state, { ...action.value });
    }
    case "setSpaces": {
      const selectedSpacePks = action.spaces.map((ot) => ot.value as number);
      const selectedSpaces = state.spaces.filter(
        (s) => selectedSpacePks.indexOf(Number(s.pk)) !== -1
      );

      return modifyEditorState(state, {
        surfaceArea: sumBy(selectedSpaces, "surfaceArea"),
        maxPersons: sumBy(selectedSpaces, "maxPersons"),
        spacePks: selectedSpacePks,
      });
    }
    case "setResources": {
      return modifyEditorState(state, {
        resourcePks: action.resources.map((ot) => ot.value as number),
      });
    }
    case "setEquipments": {
      return modifyEditorState(state, {
        equipmentPks: action.equipments.map((ot) => ot.value as number),
      });
    }
    case "setPurposes": {
      return modifyEditorState(state, {
        purposePks: action.purposes.map((ot) => ot.value as number),
      });
    }
    default:
      return state;
  }
};

const Wrapper = styled.div``;

const StyledNotification = styled(Notification)`
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;

const EditorContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const EditorColumns = styled.div`
  display: block;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    display: grid;
  }
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const Editor = styled.div`
  @media (min-width: ${breakpoints.m}) {
    margin: 0 var(--spacing-layout-m);
  }
  max-width: 52rem;
`;

const Section = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const Buttons = styled.div`
  display: flex;
  margin: var(--spacing-layout-m) 0;
`;

const SaveButton = styled(Button)`
  margin-left: auto;
`;

const TextInputWithPadding = styled(TextInput)`
  padding-bottom: var(--spacing-m);
`;

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

const getDuration = (duration: string | undefined): string => {
  if (!duration) {
    return "00:00";
  }

  const parts = duration.split(":");
  if (parts.length === 3) {
    return duration.substring(0, 5);
  }

  return duration;
};

const ReservationUnitEditor = (): JSX.Element | null => {
  const { reservationUnitPk, unitPk } = useParams<IProps>();
  const { t } = useTranslation();
  const history = useHistory();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(reservationUnitPk), Number(unitPk))
  );

  const onDataError = (text: string) => {
    dispatch({
      type: "dataInitializationError",
      message: text || t("ReservationUnitEditor.dataLoadFailedMessage"),
    });
  };

  const onSave = (text?: string) =>
    dispatch({
      type: "setNotification",
      notification: {
        type: "success",
        title: text || t("ReservationUnitEditor.reservationUnitUpdated"),
        text: "ReservationUnitEditor.reservationUnitUpdatedNotification",
      },
    });

  const [updateReservationUnitMutation] = useMutation<
    { updateReservationUnit: ReservationUnitUpdateMutationPayload },
    { input: ReservationUnitUpdateMutationInput }
  >(UPDATE_RESERVATION_UNIT);

  const updateReservationUnit = (
    input: ReservationUnitUpdateMutationInput
  ): Promise<
    FetchResult<{ updateReservationUnit: ReservationUnitUpdateMutationPayload }>
  > => updateReservationUnitMutation({ variables: { input } });

  const [createReservationUnitMutation] = useMutation<
    { createReservationUnit: ReservationUnitCreateMutationPayload },
    { input: ReservationUnitCreateMutationInput }
  >(CREATE_RESERVATION_UNIT);

  const createReservationUnit = (
    input: ReservationUnitCreateMutationInput
  ): Promise<
    FetchResult<{
      createReservationUnit: ReservationUnitCreateMutationPayload;
    }>
  > => createReservationUnitMutation({ variables: { input } });

  const createOrUpdateReservationUnit = async (publish: boolean) => {
    const input = pick(
      {
        ...state.reservationUnitEdit,
        spacePks: state.reservationUnitEdit?.spacePks?.map(String),
        resourcePks: state.reservationUnitEdit?.resourcePks?.map(String),
        equipmentPks: state.reservationUnitEdit?.equipmentPks?.map(String),
        purposePks: state.reservationUnitEdit?.purposePks?.map(String),
        isDraft: !publish,
      },
      [
        "isDraft",
        "pk",
        "unitPk",
        "nameFi",
        "nameSv",
        "nameEn",
        "descriptionFi",
        "descriptionSv",
        "descriptionEn",
        "spacePks",
        "resourcePks",
        "equipmentPks",
        "surfaceArea",
        "maxPersons",
        "termsOfUseFi",
        "termsOfUseSv",
        "termsOfUseEn",
        "maxReservationDuration",
        "minReservationDuration",
        "requireIntroduction",
        "purposePks",
      ]
    );

    try {
      if (state.reservationUnitPk) {
        const res = await updateReservationUnit(
          input as ReservationUnitUpdateMutationInput
        );

        if (res.data?.updateReservationUnit.errors === null) {
          onSave(t("ReservationUnitEditor.saved"));
        }
      } else {
        const res = await createReservationUnit(
          input as ReservationUnitCreateMutationInput
        );

        if (res.data?.createReservationUnit.errors === null) {
          onSave(t("ReservationUnitEditor.saved"));
          // todo notification
          history.replace(
            `/unit/${unitPk}/reservationUnit/edit/${res.data.createReservationUnit.pk}`
          );
        }
      }
    } catch (error) {
      onDataError(t("ReservationUnitEditor.saveFailed", { error }));
    }
  };

  useQuery<Query, QueryReservationUnitByPkArgs>(RESERVATIONUNIT_QUERY, {
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
    onCompleted: ({ equipments, purposes }) => {
      if (equipments) {
        dispatch({
          type: "equipmentsLoaded",
          equipments: equipments?.edges.map((e) => e?.node as EquipmentType),
        });
      }

      if (purposes) {
        dispatch({
          type: "purposesLoaded",
          purposes: purposes?.edges.map((e) => e?.node as PurposeType),
        });
      }

      if (!equipments || !purposes) {
        onDataError(t("ReservationUnitEditor.errorEquipmentsNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useEffect(() => {
    if (!reservationUnitPk) {
      dispatch({ type: "editNew" });
    }
  }, [reservationUnitPk]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setValue = (value: any) => {
    dispatch({ type: "set", value });
  };

  if (state.loading) {
    return <Loader />;
  }

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

  if (state.reservationUnitEdit === null) {
    return null;
  }

  return (
    <Wrapper>
      <IngressContainer>
        {state.notification ? (
          <StyledNotification
            type={state.notification.type}
            label={t(state.notification.title)}
            dismissible
            closeButtonLabelText={`${t("common.close")}`}
            onClose={() => dispatch({ type: "clearNotification" })}
          >
            {t(state.notification.text)}
          </StyledNotification>
        ) : null}
      </IngressContainer>
      <ContentContainer>
        {state.unit ? (
          <SubPageHead
            unit={state.unit}
            title={
              state.reservationUnitEdit.nameFi ||
              t("ReservationUnitEditor.defaultHeading")
            }
          />
        ) : null}
        <EditorContainer>
          <Editor>
            <Accordion
              initiallyOpen
              heading={t("ReservationUnitEditor.basicInformation")}
            >
              <Section>
                <TextInputWithPadding
                  value={state.reservationUnitEdit.nameFi || ""}
                  required
                  id="nameFi"
                  label={t("ReservationUnitEditor.nameLabel")}
                  helperText={t("ReservationUnitEditor.nameHelper")}
                  onChange={(e) => {
                    setValue({ nameFi: e.target.value });
                  }}
                />
                <TextInputWithPadding
                  value={state.reservationUnitEdit.nameSv || ""}
                  required
                  id="nameSv"
                  label={t("ReservationUnitEditor.nameSvLabel")}
                  onChange={(e) => {
                    setValue({ nameSv: e.target.value });
                  }}
                />
                <TextInputWithPadding
                  value={state.reservationUnitEdit.nameEn || ""}
                  required
                  id="nameEn"
                  label={t("ReservationUnitEditor.nameEnLabel")}
                  onChange={(e) => {
                    setValue({ nameEn: e.target.value });
                  }}
                />
                <EditorColumns>
                  <Combobox
                    multiselect
                    required
                    label={t("ReservationUnitEditor.spacesLabel")}
                    placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
                    options={state.spaceOptions}
                    clearButtonAriaLabel={t("common.clearAllSelections")}
                    selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                    toggleButtonAriaLabel={t("common.toggleMenu")}
                    onChange={(spaces) =>
                      dispatch({ type: "setSpaces", spaces })
                    }
                    disabled={state.spaceOptions.length === 0}
                    value={[
                      ...getSelectedOptions(state, "spaceOptions", "spacePks"),
                    ]}
                  />
                  <Combobox
                    multiselect
                    label={t("ReservationUnitEditor.resourcesLabel")}
                    placeholder={t(
                      "ReservationUnitEditor.resourcesPlaceholder"
                    )}
                    options={state.resourceOptions}
                    clearButtonAriaLabel={t("common.clearAllSelections")}
                    selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                    toggleButtonAriaLabel={t("common.toggleMenu")}
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
                  />
                </EditorColumns>
                <Checkbox
                  id="requireIntroduction"
                  label={t("ReservationUnitEditor.requireIntroductionLabel")}
                  checked={state.reservationUnitEdit.requireIntroduction}
                  onClick={() =>
                    setValue({
                      requireIntroduction:
                        !state.reservationUnitEdit?.requireIntroduction,
                    })
                  }
                />
                <EditorColumns>
                  <NumberInput
                    value={state.reservationUnitEdit.surfaceArea || 0}
                    id="surfaceArea"
                    label={t("ReservationUnitEditor.surfaceAreaLabel")}
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
                    min={1}
                    required
                  />
                  <NumberInput
                    value={state.reservationUnitEdit.maxPersons || 0}
                    id="maxPersons"
                    label={t("ReservationUnitEditor.maxPersonsLabel")}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) => {
                      setValue({
                        maxPersons: Number(e.target.value),
                      });
                    }}
                    step={1}
                    type="number"
                    min={1}
                    helperText={t("ReservationUnitEditor.maxPersonsHelperText")}
                    required
                  />
                </EditorColumns>
              </Section>
            </Accordion>
            <Accordion heading={t("ReservationUnitEditor.typesProperties")}>
              <EditorColumns>
                <Combobox
                  multiselect
                  label={t("ReservationUnitEditor.purposesLabel")}
                  placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
                  options={state.purposeOptions}
                  clearButtonAriaLabel={t("common.clearAllSelections")}
                  selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                  toggleButtonAriaLabel={t("common.toggleMenu")}
                  onChange={(purposes) =>
                    dispatch({ type: "setPurposes", purposes })
                  }
                  disabled={state.resourceOptions.length === 0}
                  value={[
                    ...getSelectedOptions(
                      state,
                      "purposeOptions",
                      "purposePks"
                    ),
                  ]}
                />

                <Combobox
                  multiselect
                  label={t("ReservationUnitEditor.equipmentsLabel")}
                  placeholder={t("ReservationUnitEditor.equipmentsPlaceholder")}
                  options={state.equipmentOptions}
                  clearButtonAriaLabel={t("common.clearAllSelections")}
                  selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                  toggleButtonAriaLabel={t("common.toggleMenu")}
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
                />
              </EditorColumns>
              <EditorColumns>
                <TimeInput
                  id="minReservationDuration"
                  label={t("ReservationUnitEditor.minReservationDurationLabel")}
                  hoursLabel={t("common.hoursLabel")}
                  minutesLabel={t("common.minutesLabel")}
                  defaultValue={getDuration(
                    state.reservationUnitEdit.minReservationDuration
                  )}
                  onChange={(v) => {
                    if (
                      typeof v.target.value === "string" &&
                      v.target.value.length === 5
                    ) {
                      setValue({
                        minReservationDuration: `${v.target.value}:00`,
                      });
                    }
                  }}
                />
                <TimeInput
                  id="maxReservationDuration"
                  label={t("ReservationUnitEditor.maxReservationDurationLabel")}
                  hoursLabel={t("common.hoursLabel")}
                  minutesLabel={t("common.minutesLabel")}
                  defaultValue={getDuration(
                    state.reservationUnitEdit.maxReservationDuration
                  )}
                  onChange={(v) => {
                    if (
                      typeof v.target.value === "string" &&
                      v.target.value.length === 5
                    ) {
                      setValue({
                        maxReservationDuration: `${v.target.value}:00`,
                      });
                    }
                  }}
                />
              </EditorColumns>
              {languages.map((lang) => (
                <TextArea
                  key={lang}
                  required
                  id={`description.${lang}`}
                  label={t("ReservationUnitEditor.descriptionLabel", {
                    lang,
                  })}
                  placeholder={t(
                    "ReservationUnitEditor.descriptionPlaceholder",
                    {
                      language: t(`language.${lang}`),
                    }
                  )}
                  value={get(
                    state,
                    `reservationUnitEdit.description${upperFirst(lang)}`,
                    ""
                  )}
                  onChange={(e) =>
                    setValue({
                      [`description${upperFirst(lang)}`]: e.target.value,
                    })
                  }
                />
              ))}
            </Accordion>

            <Accordion heading={t("ReservationUnitEditor.termsInstructions")}>
              {languages.map((lang) => (
                <TextArea
                  key={lang}
                  required
                  id={`tos.${lang}`}
                  label={t("ReservationUnitEditor.tosLabel", {
                    lang,
                  })}
                  placeholder={t("ReservationUnitEditor.tosPlaceholder", {
                    language: t(`language.${lang}`),
                  })}
                  value={get(
                    state,
                    `reservationUnitEdit.termsOfUse${upperFirst(lang)}`,
                    ""
                  )}
                  onChange={(e) =>
                    setValue({
                      [`termsOfUse${upperFirst(lang)}`]: e.target.value,
                    })
                  }
                />
              ))}
            </Accordion>
            <Buttons>
              <Button
                disabled={!state.hasChanges}
                variant="secondary"
                onClick={() => history.go(0)}
              >
                {t("ReservationUnitEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!state.hasChanges}
                variant="secondary"
                onClick={() => createOrUpdateReservationUnit(false)}
              >
                {t("ReservationUnitEditor.saveAsDraft")}
              </SaveButton>

              <SaveButton
                disabled={!state.hasChanges}
                onClick={() => createOrUpdateReservationUnit(true)}
              >
                {t("ReservationUnitEditor.saveAndPublish")}
              </SaveButton>
            </Buttons>
          </Editor>
        </EditorContainer>
      </ContentContainer>
      {state.error ? (
        <Wrapper>
          <Notification
            type="error"
            label={t("ReservationUnitEditor.errorDataHeading")}
            position="top-center"
            autoClose={false}
            dismissible
            onClose={() => dispatch({ type: "clearError" })}
            closeButtonLabelText={t("common.close")}
            displayAutoCloseProgress={false}
          >
            {t(state.error?.message)}
          </Notification>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
};

export default withMainMenu(ReservationUnitEditor);
