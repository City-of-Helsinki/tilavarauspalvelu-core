import React, { useReducer } from "react";
import {
  Button,
  Dialog,
  IconCheck,
  Notification,
  TextArea,
  TextInput,
} from "hds-react";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { omit, set } from "lodash";
import {
  ResourceCreateMutationInput,
  ResourceCreateMutationPayload,
  UnitType,
} from "../../common/types";
import { parseAddress } from "../../common/util";
import { CREATE_RESOURCE } from "../../common/queries";
import { CustomDialogHeader } from "./CustomDialogHeader";
import { breakpoints } from "../../styles/util";

interface IProps {
  unit: UnitType;
  closeModal: () => void;
  onSave: () => void;
}

type State = {
  resource: ResourceCreateMutationInput;
  error?: string;
};

type Action =
  | { type: "setResourceName"; lang: string; name: string }
  | { type: "setError"; error: string }
  | { type: "clearError" }
  | {
      type: "setResourceDescription";
      lang: string;
      description: string;
    };

const initialState = { resource: { name: {}, description: {} } } as State;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setResourceName": {
      return set({ ...state }, `resource.name.[${action.lang}]`, action.name);
    }
    case "setResourceDescription": {
      return set(
        { ...state },
        `resource.description.[${action.lang}]`,
        action.description
      );
    }
    case "setError": {
      return set({ ...state }, "error", action.error);
    }
    case "clearError": {
      return omit(state, ["error"]);
    }
    default:
      return state;
  }
};

const UnitInfo = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  padding-bottom: var(--spacing-m);
  gap: var(--spacing-m);
  border-bottom: 1px solid var(--color-black);
`;
const Name = styled.div`
  margin: 0 0 var(--spacing-m) 0;
`;

const Address = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
`;

const ActionButtons = styled.div`
  display: flex;
  padding: var(--spacing-m);
`;

const SaveButton = styled(Button)`
  margin-left: auto;
`;

const EditorContainer = styled.div`
  margin: 2em 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2em;
`;

const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const languages = ["fi", "sv", "en"];

const NewResourceModal = ({
  unit,
  closeModal,
  onSave,
}: IProps): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();

  const [createResourceMutation] = useMutation<
    { createResource: ResourceCreateMutationPayload },
    { input: ResourceCreateMutationInput }
  >(CREATE_RESOURCE);

  const createResource = (
    input: ResourceCreateMutationInput
  ): Promise<FetchResult<{ createResource: ResourceCreateMutationPayload }>> =>
    createResourceMutation({ variables: { input } });

  const saveEnabled =
    editorState.resource.name.fi &&
    editorState.resource.name.sv &&
    editorState.resource.name.en &&
    editorState.resource.description.fi &&
    editorState.resource.description.sv &&
    editorState.resource.description.en;

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
            <Name>{unit.name}</Name>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        <EditorContainer>
          {languages.map((lang) => (
            <TextInput
              key={lang}
              required
              id={`name.${lang}`}
              label={t("ResourceModal.nameLabel", { lang })}
              placeholder={t("ResourceModal.namePlaceholder", {
                language: t(`language.${lang}`),
              })}
              onBlur={(e) => {
                dispatch({
                  type: "setResourceName",
                  name: e.target.value,
                  lang,
                });
              }}
              defaultValue=""
            />
          ))}
          <EditorColumns>
            {languages.map((lang) => (
              <TextArea
                key={lang}
                required
                id={`description.${lang}`}
                label={t("ResourceModal.descriptionLabel", { lang })}
                placeholder={t("ResourceModal.descriptionPlaceholder", {
                  language: t(`language.${lang}`),
                })}
                defaultValue=""
                onChange={(e) => {
                  dispatch({
                    type: "setResourceDescription",
                    description: e.target.value,
                    lang,
                  });
                }}
              />
            ))}
          </EditorColumns>
        </EditorContainer>
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={closeModal} variant="secondary">
          {t("ResourceModal.cancel")}
        </Button>
        <SaveButton
          disabled={!saveEnabled}
          loadingText={t("ResourceModal.saving")}
          onClick={async () => {
            try {
              await createResource(editorState.resource);
              onSave();
              closeModal();
            } catch (error) {
              dispatch({
                type: "setError",
                error: t("ResourceModal.saveError"),
              });
            }
          }}
        >
          {t("ResourceModal.save")}
        </SaveButton>
      </ActionButtons>
      {editorState.error ? (
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
          {editorState.error}
        </Notification>
      ) : null}
    </>
  );
};

export default NewResourceModal;
