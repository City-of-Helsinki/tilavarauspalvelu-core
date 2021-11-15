import React, { useReducer } from "react";
import { Button, Notification, Select, TextInput } from "hds-react";
import styled from "styled-components";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { get, omit, pick, set, startCase, upperFirst } from "lodash";
import { useParams, useHistory } from "react-router-dom";
import {
  RESOURCE_QUERY,
  UNIT_WITH_SPACES_AND_RESOURCES,
  UPDATE_RESOURCE,
} from "../../common/queries";
import { breakpoints } from "../../styles/util";
import { languages } from "../../common/const";
import {
  Mutation,
  Query,
  QueryUnitByPkArgs,
  ResourceUpdateMutationInput,
  SpaceType,
  UnitByPkType,
  ResourceType,
} from "../../common/gql-types";
import RichTextInput from "../RichTextInput";
import withMainMenu from "../withMainMenu";

import Loader from "../Loader";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import SubPageHead from "../Unit/SubPageHead";

type OptionType = {
  label: string;
  value: number;
};

interface IProps {
  resourcePk?: string;
  unitPk: string;
}

type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

type State = {
  resourceEdit: ResourceUpdateMutationInput;
  resource: ResourceType | null;
  spaces: SpaceType[];
  spaceOptions: OptionType[];
  unit: UnitByPkType;
  error?: {
    message: string;
  };
  loading: boolean;
  hasChanges: boolean;
  notification: null | NotificationType;
};

// eslint-disable-next-line
type EditorProp = any;

type Action =
  | { type: "setError"; error: string }
  | { type: "clearError" }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "dataInitializationError"; message: string }
  | { type: "resourceLoaded"; resource: ResourceType }
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | { type: "set"; value: EditorProp };

const initialState = {
  resourceEdit: {},
  resource: null,
  loading: true,
  spaceOptions: [] as OptionType[],
} as State;

const modifyEditorState = (state: State, edit: EditorProp) => ({
  ...state,
  resourceEdit: { ...state.resourceEdit, ...edit },
  hasChanges: true,
});

const withLoadingStatus = (state: State): State => {
  const hasError = typeof state.error?.message !== undefined;
  const newLoadingStatus =
    (!hasError && state.resourceEdit === null) ||
    state.spaceOptions.length === 0;

  return {
    ...state,
    loading: newLoadingStatus,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "clearNotification": {
      return { ...state, notification: null };
    }
    case "setNotification": {
      return { ...state, notification: { ...action.notification } };
    }
    case "setError": {
      return set({ ...state }, "error", action.error);
    }
    case "clearError": {
      return omit(state, ["error"]);
    }
    case "set": {
      return modifyEditorState(state, { ...action.value });
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

      return withLoadingStatus({
        ...state,
        spaces: unit.spaces as SpaceType[],
        spaceOptions,
        resourceEdit: {
          ...state.resourceEdit,
        },
        unit,
        error: errorKey ? { message: i18next.t(errorKey) } : state.error,
      });
    }

    case "resourceLoaded": {
      const { resource } = action;

      return withLoadingStatus({
        ...state,
        resourceEdit: {
          ...(pick(resource, [
            "pk",
            "nameFi",
            "nameSv",
            "nameEn",
            "unitPk",
            "descriptionFi",
            "descriptionEn",
            "descriptionSv",
          ]) as ResourceUpdateMutationInput),
          spacePk: resource.space?.pk,
        },
        resource,
        hasChanges: false,
      });
    }

    default:
      return state;
  }
};

const Buttons = styled.div`
  display: flex;
  padding: var(--spacing-m);
`;

const SaveButton = styled(Button)`
  margin-left: auto;
`;

const EditorContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const Editor = styled.div`
  @media (min-width: ${breakpoints.m}) {
    margin: 0 var(--spacing-layout-m);
  }
  max-width: 52rem;
`;

const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const TextInputWithPadding = styled(TextInput)`
  padding-bottom: var(--spacing-m);
`;

const StyledNotification = styled(Notification)`
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;

const getSelectedOption = (
  options: OptionType[],
  value: number
): OptionType | undefined => options.find((op) => op.value === value);

const getInitialState = (): State => initialState;

const ResourceEditor = (): JSX.Element => {
  const history = useHistory();
  const { t } = useTranslation();

  const { resourcePk, unitPk } = useParams<IProps>();

  const [state, dispatch] = useReducer(reducer, getInitialState());

  const onDataError = (text: string) => {
    dispatch({
      type: "dataInitializationError",
      message: text || t("ReservationUnitEditor.dataLoadFailedMessage"),
    });
  };

  const setValue = (name: string, value: EditorProp) =>
    dispatch({ type: "set", value: { [name]: value } });

  const showNotification = (text?: string) =>
    dispatch({
      type: "setNotification",
      notification: {
        type: "success",
        title: text || t("ResourceEditor.resourceUpdated"),
        text: "ResourceEditor.resourceUpdatedNotification",
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

  useQuery<Query, QueryUnitByPkArgs>(RESOURCE_QUERY, {
    variables: { pk: Number(resourcePk) },
    onCompleted: ({ resourceByPk }) => {
      if (resourceByPk) {
        dispatch({ type: "resourceLoaded", resource: resourceByPk });
      } else {
        onDataError(t("ReservationUnitEditor.resourceNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const [updateResourceMutation] = useMutation<Mutation>(UPDATE_RESOURCE);

  const updateResource = (input: ResourceUpdateMutationInput) =>
    updateResourceMutation({ variables: { input } });

  const saveAsReadyEnabled =
    state.resourceEdit.nameFi &&
    state.resourceEdit.nameSv &&
    state.resourceEdit.nameEn &&
    state.resourceEdit.descriptionFi &&
    state.resourceEdit.descriptionSv &&
    state.resourceEdit.descriptionEn;

  const update = async (res: ResourceUpdateMutationInput) => {
    try {
      const { data } = await updateResource({
        ...res,
        locationType: "fixed",
      });

      if (data?.updateResource?.errors === null) {
        showNotification();
      } else {
        dispatch({
          type: "setError",
          error: t("ResourceModal.saveError"),
        });
      }
    } catch (error) {
      dispatch({
        type: "setError",
        error: t("ResourceModal.saveError"),
      });
    }
  };

  if (state.loading) {
    return <Loader />;
  }

  if (state.error && !state.resourceEdit) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <IngressContainer>
        {state.notification ? (
          <StyledNotification
            type={state.notification.type}
            label={t(state.notification.title)}
            position="top-center"
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
            link={`/unit/${state.unit.pk}/spacesResources`}
            unit={state.unit}
            title={
              state.resourceEdit.nameFi ||
              t("ReservationUnitEditor.defaultHeading")
            }
          />
        ) : null}

        <EditorContainer>
          <Editor>
            <EditorColumns>
              <Select
                id="space"
                required
                label={t("ResourceModal.selectSpace")}
                placeholder={t("common.select")}
                options={state.spaceOptions}
                onChange={(v: { label: string; value: number }) =>
                  setValue("spacePk", v.value)
                }
                value={getSelectedOption(
                  state.spaceOptions,
                  state.resourceEdit.spacePk as number
                )}
              />
            </EditorColumns>
            {languages.map((lang) => (
              <TextInputWithPadding
                key={`name.${lang}`}
                required
                id={`name.${lang}`}
                label={t("ResourceModal.nameLabel", { lang })}
                placeholder={t("ResourceModal.namePlaceholder", {
                  language: t(`language.${lang}`),
                })}
                onChange={(e) => {
                  setValue(`name${startCase(lang)}`, e.target.value);
                }}
                value={get(state, `resourceEdit.name${upperFirst(lang)}`, "")}
              />
            ))}
            {languages.map((lang) => (
              <>
                <RichTextInput
                  id={`description.${lang}`}
                  key={`description.${lang}`}
                  label={t("ResourceModal.descriptionLabel", { lang })}
                  required
                  value={get(
                    state.resourceEdit,
                    `description${upperFirst(lang)}`,
                    ""
                  )}
                  onChange={(description) => {
                    setValue(`description${startCase(lang)}`, description);
                  }}
                />
              </>
            ))}
            <EditorColumns> </EditorColumns>
            <Buttons>
              <Button
                onClick={() => {
                  history.go(-1);
                }}
                variant="secondary"
              >
                {t("ResourceModal.cancel")}
              </Button>
              <SaveButton
                onClick={() => {
                  update({ ...state.resourceEdit, isDraft: true });
                }}
                variant="secondary"
              >
                {t("ResourceModal.saveAsDraft")}
              </SaveButton>
              <SaveButton
                disabled={!saveAsReadyEnabled}
                loadingText={t("ResourceModal.saving")}
                onClick={async () => {
                  update({ ...state.resourceEdit, isDraft: false });
                }}
              >
                {t("ResourceModal.save")}
              </SaveButton>
            </Buttons>
          </Editor>
        </EditorContainer>

        {state.error ? (
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
            {state.error}
          </Notification>
        ) : null}
      </ContentContainer>
    </>
  );
};

export default withMainMenu(ResourceEditor);
