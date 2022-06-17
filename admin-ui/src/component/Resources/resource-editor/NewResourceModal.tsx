import React, { useEffect, useReducer } from "react";
import Joi from "joi";
import { Button, Dialog, IconCheck, TextInput } from "hds-react";
import styled from "styled-components";
import { useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { upperFirst } from "lodash";
import { parseAddress } from "../../../common/util";
import { CustomDialogHeader } from "../../CustomDialogHeader";
import { languages } from "../../../common/const";
import {
  Mutation,
  ResourceCreateMutationInput,
  UnitType,
} from "../../../common/gql-types";
import { CREATE_RESOURCE } from "./queries";
import ParentSelector from "../../Spaces/space-editor/ParentSelector";
import { useNotification } from "../../../context/NotificationContext";
import {
  Buttons,
  Editor,
  EditorColumns,
  EditorContainer,
  SaveButton,
  schema,
} from "./modules/resourceEditor";
import FormErrorSummary from "../../../common/FormErrorSummary";

// eslint-disable-next-line
type EditorProp = any;

interface IProps {
  unit: UnitType;
  spacePk: number;
  closeModal: () => void;
  onSave: () => void;
}

type State = {
  resource: ResourceCreateMutationInput;
  spacePk: number;
  validationErrors: Joi.ValidationResult | null;
  error?: string;
};

type Action =
  | { type: "set"; value: EditorProp }
  | {
      type: "setValidatioErrors";
      validationErrors: Joi.ValidationResult | null;
    };

const initialState = { resource: {} } as State;

const modifyEditorState = (state: State, edit: EditorProp) => ({
  ...state,
  resource: { ...state.resource, ...edit },
  hasChanges: true,
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "set": {
      return modifyEditorState(state, { ...action.value });
    }
    case "setValidatioErrors": {
      return {
        ...state,
        validationErrors: action.validationErrors,
      };
    }
    default:
      return state;
  }
};

const UnitInfo = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  gap: var(--spacing-m);
`;
const Name = styled.div``;

const Address = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
`;

const getInitialState = (): State => initialState;

const NewResourceModal = ({
  unit,
  closeModal,
  onSave,
  spacePk,
}: IProps): JSX.Element | null => {
  const [state, dispatch] = useReducer(reducer, getInitialState());
  const { t } = useTranslation();

  const { notifyError } = useNotification();

  const setValue = (name: string, value: EditorProp) =>
    dispatch({ type: "set", value: { [name]: value } });

  useEffect(() => {
    if (spacePk) {
      setValue("spacePk", spacePk);
    }
  }, [spacePk]);

  const [createResourceMutation] = useMutation<Mutation>(CREATE_RESOURCE);

  const createResource = (input: ResourceCreateMutationInput) =>
    createResourceMutation({ variables: { input } });

  const create = async (res: ResourceCreateMutationInput) => {
    try {
      const { data } = await createResource({
        ...res,
        locationType: "fixed",
      });

      if (data?.createResource?.errors === null) {
        onSave();
        closeModal();
      } else {
        notifyError(t("ResourceModal.saveError"));
      }
    } catch (error) {
      notifyError(t("ResourceModal.saveError"));
    }
  };

  const getValidationError = (name: string): string | undefined => {
    const error = state.validationErrors?.error?.details.find((errorDetail) =>
      errorDetail.path.find((path) => path === name)
    );

    if (!error) {
      return undefined;
    }

    return t(`validation.${error.type}`, { ...error.context });
  };

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        title={t("ResourceModal.modalTitle")}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("ResourceModal.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <Name>{unit.nameFi}</Name>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        <FormErrorSummary
          fieldNamePrefix="ResourceEditor.label."
          validationErrors={state.validationErrors}
          linkToError={false}
        />
        <EditorContainer>
          <Editor>
            <EditorColumns>
              <ParentSelector
                label={t("ResourceModal.selectSpace")}
                onChange={(parent) => setValue("spacePk", parent)}
                unitPk={unit.pk as number}
                parentPk={null}
                placeholder={t("ResourceModal.selectSpace")}
                disableNull
                errorText={getValidationError("spacePk")}
              />

              {languages.map((lang) => {
                const fieldName = `name${upperFirst(lang)}`;
                return (
                  <TextInput
                    key={fieldName}
                    required={lang === "fi"}
                    id={fieldName}
                    label={t(`ResourceEditor.label.${fieldName}`)}
                    placeholder={t("ResourceModal.namePlaceholder", {
                      language: t(`language.${lang}`),
                    })}
                    onBlur={(e) => {
                      setValue(fieldName, e.target.value);
                    }}
                    defaultValue=""
                    errorText={getValidationError(fieldName)}
                    invalid={!!getValidationError(fieldName)}
                  />
                );
              })}
            </EditorColumns>
          </Editor>
        </EditorContainer>
      </Dialog.Content>
      <Buttons>
        <Button onClick={closeModal} variant="secondary">
          {t("ResourceModal.cancel")}
        </Button>
        <SaveButton
          onClick={(e) => {
            e.preventDefault();
            const validationErrors = schema.validate(state.resource);

            if (validationErrors.error) {
              dispatch({ type: "setValidatioErrors", validationErrors });
            } else {
              create({ ...state.resource });
            }
          }}
          variant="secondary"
        >
          {t("ResourceModal.save")}
        </SaveButton>
      </Buttons>
    </>
  );
};

export default NewResourceModal;
