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
} from "hds-react";
import i18next from "i18next";
import { omit, pick, sumBy } from "lodash";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { languages } from "../../common/const";
import {
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
import DurationInput from "./DurationInput";

interface IProps {
  reservationUnitId?: string;
  unitId: string;
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
  | { type: "setResources"; resources: OptionType[] };

type ReservationUnitEditorType = {
  pk: number;
  name: string;
  description: string;
  spaces: number[];
  resources: number[];
  maxPersons: number;
  surfaceArea: number;
  requireIntroduction: boolean;
  maxReservationDuration: string;
  minReservationDuration: string;
  termsOfUse: string;
};

type State = {
  reservationUnitId?: number;
  unitId: number;
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
  unit?: UnitByPkType;
};

const getInitialState = (reservationUnitId: number, unitId: number): State => ({
  reservationUnitId,
  unitId,
  loading: true,
  notification: null,
  reservationUnit: null,
  reservationUnitEdit: null,
  hasChanges: false,
  resources: [],
  spaces: [],
  spaceOptions: [],
  resourceOptions: [],
});

const newReservationUnit = {} as ReservationUnitEditorType;

const withLoadingStatus = (state: State): State => {
  const hasError = typeof state.error?.message !== undefined;

  const newLoadingStatus =
    !hasError &&
    (state.spaceOptions.length === 0 || state.reservationUnitEdit === null);

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
            "name",
            "termsOfUse",
            "minReservationDuration",
            "maxReservationDuration",
            "requireIntroduction",
            "description",
          ]) as ReservationUnitEditorType),
        },
        hasChanges: false,
      });
    }
    case "unitLoaded": {
      const { unit } = action;

      let errorKey: string | undefined;

      const spaceOptions =
        unit?.spaces?.map((s) => ({
          label: String(s?.name),
          value: Number(s?.pk),
        })) || [];

      if (spaceOptions.length === 0) {
        errorKey = "ReservationUnitEditor.errorNoSpaces";
      }

      const resourceOptions =
        unit?.spaces
          ?.flatMap((s) => s?.resources)
          .map((r) => ({ label: String(r?.name), value: Number(r?.pk) })) || [];

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
      const selectedSpaceIds = action.spaces.map((ot) => ot.value as number);
      const selectedSpaces = state.spaces.filter(
        (s) => selectedSpaceIds.indexOf(Number(s.pk)) !== -1
      );

      return modifyEditorState(state, {
        surfaceArea: sumBy(selectedSpaces, "surfaceArea"),
        maxPersons: sumBy(selectedSpaces, "maxPersons"),
        spaces: selectedSpaceIds,
      });
    }
    case "setResources": {
      return modifyEditorState(state, {
        resources: action.resources.map((ot) => ot.value as number),
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

const getSelectedSpaces = (state: State): OptionType[] => {
  if (!state.spaceOptions || !state.reservationUnitEdit?.spaces) {
    return [];
  }

  return state.reservationUnitEdit?.spaces
    .map((space) => state.spaceOptions.find((so) => so.value === space))
    .filter(Boolean) as OptionType[];
};

const getSelectedResources = (state: State): OptionType[] => {
  if (!state.resourceOptions || !state.reservationUnitEdit?.resources) {
    return [];
  }

  return state.reservationUnitEdit?.resources
    .map((resource) =>
      state.resourceOptions.find((so) => so.value === resource)
    )
    .filter(Boolean) as OptionType[];
};

const ReservationUnitEditor = (): JSX.Element | null => {
  const { reservationUnitId, unitId } = useParams<IProps>();
  const { t } = useTranslation();
  const history = useHistory();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(reservationUnitId), Number(unitId))
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
        title: text || t("SpaceEditor.spaceUpdated"),
        text: "SpaceEditor.spaceUpdatedNotification",
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

  const createOrUpdateReservationUnit = async () => {
    const input = omit(
      {
        ...state.reservationUnitEdit,
        unitId: String(state.unitId),
      },
      // wip missing from api:
      "surfaceArea",
      "maxPersons"
    );

    try {
      if (state.reservationUnitId) {
        const res = await updateReservationUnit(
          input as ReservationUnitUpdateMutationInput
        );

        if (res.data?.updateReservationUnit.errors === null) {
          onSave(t("ReservationUnitEditor.saved"));
        }
      } else {
        const res = await createReservationUnit(input);

        if (res.data?.createReservationUnit.errors === null) {
          onSave(t("ReservationUnitEditor.saved"));
          // todo notification
          history.replace(
            `/unit/${unitId}/reservationUnit/edit/${res.data.createReservationUnit.id}`
          );
        }
      }
    } catch (error) {
      onDataError(t("SpaceEditor.saveFailed", { error }));
    }
  };

  useQuery<Query, QueryReservationUnitByPkArgs>(RESERVATIONUNIT_QUERY, {
    variables: { pk: Number(reservationUnitId) },
    skip: !reservationUnitId,
    onCompleted: ({ reservationUnitByPk }) => {
      if (reservationUnitByPk) {
        dispatch({ type: "dataLoaded", reservationUnit: reservationUnitByPk });
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery<Query, QueryUnitByPkArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { pk: Number(unitId) },
    onCompleted: ({ unitByPk }) => {
      if (unitByPk === null || unitByPk === undefined) {
        onDataError(t("ReservationUnitEditor.unitNotAvailable"));
      } else {
        dispatch({ type: "unitLoaded", unit: unitByPk });
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useEffect(() => {
    if (!reservationUnitId) {
      dispatch({ type: "editNew" });
    }
  }, [reservationUnitId]);

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
              state.reservationUnitEdit.name ||
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
                  value={state.reservationUnitEdit.name}
                  required
                  id="name"
                  label={t("ReservationUnitEditor.nameLabel")}
                  helperText={t("ReservationUnitEditor.nameHelper")}
                  onChange={(e) => {
                    setValue({ name: e.target.value });
                  }}
                />
                <TextInputWithPadding
                  disabled
                  value={
                    "" // state.reservationUnitEdit.name_sv */
                  }
                  required
                  id="nameSv"
                  label={t("ReservationUnitEditor.nameSvLabel")}
                  onChange={(e) => {
                    setValue({ name_sv: e.target.value });
                  }}
                />
                <TextInputWithPadding
                  disabled
                  value={
                    "" // state.reservationUnitEdit.name_en */
                  }
                  required
                  id="nameEn"
                  label={t("ReservationUnitEditor.nameEnLabel")}
                  onChange={(e) => {
                    setValue({ name_en: e.target.value });
                  }}
                />
                <EditorColumns>
                  <Combobox
                    multiselect
                    required
                    label={t("ReservationUnitEditor.spacesLabel")}
                    placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
                    options={state.spaceOptions}
                    clearButtonAriaLabel="Clear all selections"
                    selectedItemRemoveButtonAriaLabel="Remove value"
                    toggleButtonAriaLabel="Toggle menu"
                    onChange={(spaces) =>
                      dispatch({ type: "setSpaces", spaces })
                    }
                    disabled={state.spaceOptions.length === 0}
                    value={[...getSelectedSpaces(state)]}
                  />
                  <Combobox
                    multiselect
                    label={t("ReservationUnitEditor.resourcesLabel")}
                    placeholder={t(
                      "ReservationUnitEditor.resourcesPlaceholder"
                    )}
                    options={state.resourceOptions}
                    clearButtonAriaLabel="Clear all selections"
                    selectedItemRemoveButtonAriaLabel="Remove value"
                    toggleButtonAriaLabel="Toggle menu"
                    onChange={(resources) =>
                      dispatch({ type: "setResources", resources })
                    }
                    disabled={state.resourceOptions.length === 0}
                    value={[...getSelectedResources(state)]}
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
                    disabled
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
                    disabled
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
                <EditorColumns>
                  <DurationInput
                    onChange={(v) => setValue({ minReservationDuration: v })}
                    label={t(
                      "ReservationUnitEditor.minReservationDurationLabel"
                    )}
                    id="minReservationDuration"
                    duration={
                      state.reservationUnitEdit.minReservationDuration ||
                      "00:00:00"
                    }
                  />
                  <DurationInput
                    required
                    onChange={(v) => setValue({ maxReservationDuration: v })}
                    label={t(
                      "ReservationUnitEditor.maxReservationDurationLabel"
                    )}
                    id="maxReservationDuration"
                    duration={
                      state.reservationUnitEdit.maxReservationDuration ||
                      "00:00:00"
                    }
                  />
                </EditorColumns>
                {languages.map((lang) => (
                  <TextArea
                    key={lang}
                    required
                    disabled={lang !== "fi"}
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
                    value={state.reservationUnitEdit?.description}
                    onChange={(e) => setValue({ description: e.target.value })}
                  />
                ))}
                <TextArea
                  required
                  id="termsOfUse"
                  label={t("SpaceEditor.termsOfUse")}
                  defaultValue={state.reservationUnitEdit.termsOfUse}
                  helperText={t("SpaceEditor.termsOfUseHelperText")}
                  onChange={(e) => {
                    setValue({
                      termsOfUse: e.target.value,
                    });
                  }}
                />
              </Section>
            </Accordion>
            <Buttons>
              <Button
                disabled={!state.hasChanges}
                variant="secondary"
                onClick={() => history.go(0)}
              >
                {t("SpaceEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!state.hasChanges}
                onClick={createOrUpdateReservationUnit}
              >
                {t("SpaceEditor.save")}
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
