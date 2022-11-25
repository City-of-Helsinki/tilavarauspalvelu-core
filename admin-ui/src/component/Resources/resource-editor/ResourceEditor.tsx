import React, { useReducer } from "react";
import Joi from "joi";
import { Button, TextInput } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { get, pick, upperFirst } from "lodash";
import { useHistory } from "react-router-dom";
import {
  Mutation,
  Query,
  QueryUnitByPkArgs,
  ResourceUpdateMutationInput,
  SpaceType,
  UnitByPkType,
  ResourceType,
} from "common/types/gql-types";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "../../../common/queries";
import { languages } from "../../../common/const";
import Loader from "../../Loader";
import { ContentContainer, IngressContainer } from "../../../styles/layout";
import SubPageHead from "../../Unit/SubPageHead";
import { RESOURCE_QUERY, UPDATE_RESOURCE } from "./queries";
import { useNotification } from "../../../context/NotificationContext";
import ParentSelector from "../../Spaces/space-editor/ParentSelector";
import {
  Buttons,
  Editor,
  EditorColumns,
  EditorContainer,
  SaveButton,
  schema,
} from "./modules/resourceEditor";

import FormErrorSummary from "../../../common/FormErrorSummary";

type State = {
  resourceEdit: ResourceUpdateMutationInput;
  resource: ResourceType | null;
  spaces: SpaceType[];
  unit: UnitByPkType;
  loading: boolean;
  validationErrors: Joi.ValidationResult | null;
  hasChanges: boolean;
};

// eslint-disable-next-line
type EditorProp = any;

type Action =
  | {
      type: "setValidatioErrors";
      validationErrors: Joi.ValidationResult | null;
    }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "resourceLoaded"; resource: ResourceType }
  | { type: "set"; value: EditorProp };

const initialState = {
  resourceEdit: {},
  resource: null,
  loading: true,
} as State;

const modifyEditorState = (state: State, edit: EditorProp) => ({
  ...state,
  resourceEdit: { ...state.resourceEdit, ...edit },
  hasChanges: true,
});

const withLoadingStatus = (state: State): State => {
  const loaded = state.resourceEdit?.pk && state.unit?.pk;

  return {
    ...state,
    loading: !loaded,
  };
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setValidatioErrors": {
      return {
        ...state,
        validationErrors: action.validationErrors,
      };
    }
    case "set": {
      return modifyEditorState(state, { ...action.value });
    }
    case "unitLoaded": {
      const { unit } = action;

      return withLoadingStatus({
        ...state,
        unit,
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
            "spacePk",
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

const getInitialState = (): State => initialState;

type Props = {
  resourcePk?: number;
  unitPk: number;
};

const ResourceEditor = ({ resourcePk, unitPk }: Props): JSX.Element => {
  const history = useHistory();
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useNotification();

  const [state, dispatch] = useReducer(reducer, getInitialState());

  const setValue = (name: string, value: EditorProp) =>
    dispatch({ type: "set", value: { [name]: value } });

  useQuery<Query, QueryUnitByPkArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { pk: Number(unitPk) },
    onCompleted: ({ unitByPk }) => {
      if (unitByPk) {
        dispatch({ type: "unitLoaded", unit: unitByPk });
      } else {
        notifyError(t("ResourceEditor.saveFailed"));
      }
    },
    onError: () => {
      notifyError(t("ResourceEditor.saveFailed"));
    },
  });

  useQuery<Query, QueryUnitByPkArgs>(RESOURCE_QUERY, {
    variables: { pk: Number(resourcePk) },
    onCompleted: ({ resourceByPk }) => {
      if (resourceByPk) {
        dispatch({ type: "resourceLoaded", resource: resourceByPk });
      } else {
        t("errors.errorFetchingData");
      }
    },
    onError: (e) => {
      notifyError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const [updateResourceMutation] = useMutation<Mutation>(UPDATE_RESOURCE);

  const updateResource = (input: ResourceUpdateMutationInput) =>
    updateResourceMutation({ variables: { input } });

  const update = async (res: ResourceUpdateMutationInput) => {
    try {
      const { data } = await updateResource({
        ...res,
        locationType: "fixed",
      });

      if (data?.updateResource?.errors === null) {
        notifySuccess(
          t("ResourceEditor.resourceUpdated"),
          t("ResourceEditor.resourceUpdatedNotification")
        );
      } else {
        notifyError(t("ResourceModal.saveError"));
      }
    } catch (error) {
      notifyError(t("ResourceModal.saveError"));
    }
  };

  if (state.loading) {
    return <Loader />;
  }

  return (
    <>
      {state.resourceEdit?.pk && state.unit?.pk ? (
        <ContentContainer>
          <SubPageHead
            link={`/unit/${unitPk}/spacesResources`}
            unit={state.unit}
            title={
              state.resourceEdit.nameFi || t("ResourceEditor.defaultHeading")
            }
          />
          <IngressContainer>
            <FormErrorSummary
              fieldNamePrefix="ResourceEditor.label."
              validationErrors={state.validationErrors}
              linkToError={false}
            />
          </IngressContainer>
          <EditorContainer>
            <Editor>
              <EditorColumns>
                <ParentSelector
                  label={t("ResourceModal.selectSpace")}
                  onChange={(parent) => setValue("spacePk", parent)}
                  unitPk={unitPk}
                  parentPk={state.resourceEdit.spacePk as number}
                  disableNull
                />
                {languages.map((lang) => {
                  const fieldName = `name${upperFirst(lang)}`;
                  return (
                    <TextInput
                      key={fieldName}
                      required={lang === "fi"}
                      id={fieldName}
                      maxLength={80}
                      label={t(`ResourceEditor.label.${fieldName}`)}
                      placeholder={t("ResourceModal.namePlaceholder", {
                        language: t(`language.${lang}`),
                      })}
                      onChange={(e) => {
                        setValue(fieldName, e.target.value);
                      }}
                      value={get(state.resourceEdit, fieldName, "")}
                    />
                  );
                })}
              </EditorColumns>
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
                  onClick={(e) => {
                    e.preventDefault();
                    const validationErrors = schema.validate(
                      state.resourceEdit
                    );

                    if (validationErrors.error) {
                      dispatch({
                        type: "setValidatioErrors",
                        validationErrors,
                      });
                    } else {
                      dispatch({
                        type: "setValidatioErrors",
                        validationErrors: null,
                      });
                      update({ ...state.resourceEdit });
                    }
                  }}
                  variant="secondary"
                >
                  {t("ResourceModal.save")}
                </SaveButton>
              </Buttons>
            </Editor>
          </EditorContainer>
        </ContentContainer>
      ) : null}
    </>
  );
};

export default ResourceEditor;
