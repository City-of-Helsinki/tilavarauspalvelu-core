import React, { useReducer } from "react";
import Joi from "joi";
import { Button, TextInput } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { get, pick, upperFirst } from "lodash";
import { useNavigate } from "react-router-dom";
import {
  type Mutation,
  type Query,
  type ResourceUpdateMutationInput,
  type SpaceNode,
  type ResourceNode,
  type UnitNode,
  type QueryUnitArgs,
  type QueryResourceArgs,
  LocationType,
} from "common/types/gql-types";
import { base64encode } from "common/src/helpers";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "@/common/queries";
import { languages } from "@/common/const";
import Loader from "@/component/Loader";
import { ContentContainer, IngressContainer } from "@/styles/layout";
import SubPageHead from "@/component/Unit/SubPageHead";
import { useNotification } from "@/context/NotificationContext";
import ParentSelector from "@/component/Spaces/space-editor/ParentSelector";
import FormErrorSummary from "@/common/FormErrorSummary";
import { RESOURCE_QUERY, UPDATE_RESOURCE } from "./queries";
import {
  Buttons,
  Editor,
  EditorColumns,
  EditorContainer,
  SaveButton,
  schema,
} from "./modules/resourceEditor";

type State = {
  resourceEdit: ResourceUpdateMutationInput;
  resource: ResourceNode | null;
  spaces: SpaceNode[];
  unit: UnitNode;
  loading: boolean;
  validationErrors: Joi.ValidationResult | null;
  hasChanges: boolean;
};

// eslint-disable-next-line
type EditorProp = any;

type Action =
  | {
      type: "setValidationErrors";
      validationErrors: Joi.ValidationResult | null;
    }
  | { type: "unitLoaded"; unit: UnitNode }
  | { type: "resourceLoaded"; resource: ResourceNode }
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
    case "setValidationErrors": {
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
          space: resource.space?.pk,
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

const ResourceEditor = ({ resourcePk, unitPk }: Props) => {
  const history = useNavigate();
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useNotification();

  const [state, dispatch] = useReducer(reducer, getInitialState());

  const setValue = (name: string, value: EditorProp) =>
    dispatch({ type: "set", value: { [name]: value } });

  useQuery<Query, QueryUnitArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { id: base64encode(`UnitNode:${unitPk}`) },
    skip: !unitPk || Number.isNaN(unitPk),
    onCompleted: ({ unit }) => {
      if (unit) {
        dispatch({ type: "unitLoaded", unit });
      } else {
        notifyError(t("ResourceEditor.saveFailed"));
      }
    },
    onError: () => {
      notifyError(t("ResourceEditor.saveFailed"));
    },
  });

  useQuery<Query, QueryResourceArgs>(RESOURCE_QUERY, {
    variables: { id: base64encode(`ResourceNode:${resourcePk}`) },
    skip: !resourcePk || Number.isNaN(resourcePk),
    onCompleted: ({ resource }) => {
      if (resource) {
        dispatch({ type: "resourceLoaded", resource });
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
      await updateResource({
        ...res,
        locationType: LocationType.Fixed,
      });

      notifySuccess(
        t("ResourceEditor.resourceUpdatedNotification"),
        t("ResourceEditor.resourceUpdated")
      );
    } catch (error) {
      notifyError(t("ResourceModal.saveError"));
    }
  };

  if (state.loading) {
    return <Loader />;
  }

  if (!state.resourceEdit?.pk || !state.unit?.pk) return null;

  return (
    <ContentContainer>
      <SubPageHead
        link={`/unit/${unitPk}/spacesResources`}
        unit={state.unit}
        title={state.resourceEdit.nameFi || t("ResourceEditor.defaultHeading")}
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
              value={state.resourceEdit.space ?? null}
              noParentless
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
                history(-1);
              }}
              variant="secondary"
            >
              {t("ResourceModal.cancel")}
            </Button>
            <SaveButton
              onClick={(e) => {
                e.preventDefault();
                const validationErrors = schema.validate(state.resourceEdit);

                if (validationErrors.error) {
                  dispatch({
                    type: "setValidationErrors",
                    validationErrors,
                  });
                } else {
                  dispatch({
                    type: "setValidationErrors",
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
  );
};

export default ResourceEditor;
