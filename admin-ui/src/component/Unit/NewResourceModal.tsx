import React, { useEffect, useReducer } from "react";
import {
  Button,
  Dialog,
  IconCheck,
  Notification,
  Select,
  TextInput,
} from "hds-react";
import styled from "styled-components";
import { useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { get, omit, set, startCase, upperFirst } from "lodash";
import { parseAddress } from "../../common/util";
import { CREATE_RESOURCE } from "../../common/queries";
import { CustomDialogHeader } from "../CustomDialogHeader";
import { breakpoints } from "../../styles/util";
import { languages } from "../../common/const";
import {
  Mutation,
  ResourceCreateMutationInput,
  SpaceType,
  UnitType,
} from "../../common/gql-types";
import RichTextInput from "../RichTextInput";

// eslint-disable-next-line
type EditorProp = any;

interface IProps {
  unit: UnitType;
  spacePk: number;
  closeModal: () => void;
  onSave: () => void;
  spaces: SpaceType[];
}

type State = {
  resource: ResourceCreateMutationInput;
  spacePk: number;
  error?: string;
};

type Action =
  | { type: "setError"; error: string }
  | { type: "clearError" }
  | { type: "set"; value: EditorProp };

const initialState = { resource: {} } as State;

const modifyEditorState = (state: State, edit: EditorProp) => ({
  ...state,
  resource: { ...state.resource, ...edit },
  hasChanges: true,
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setError": {
      return set({ ...state }, "error", action.error);
    }
    case "clearError": {
      return omit(state, ["error"]);
    }
    case "set": {
      return modifyEditorState(state, { ...action.value });
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

const getInitialState = (): State => initialState;

const NewResourceModal = ({
  unit,
  closeModal,
  onSave,
  spacePk,
  spaces,
}: IProps): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, getInitialState());
  const { t } = useTranslation();

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

  const saveAsReadyEnabled =
    editorState.resource.nameFi &&
    editorState.resource.nameSv &&
    editorState.resource.nameEn &&
    editorState.resource.descriptionFi &&
    editorState.resource.descriptionSv &&
    editorState.resource.descriptionEn;

  const editDisabled = !editorState.resource.spacePk;

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
        <Select
          id="space"
          required
          label={t("ResourceModal.selectSpace")}
          placeholder={t("common.select")}
          options={[
            ...spaces.map((s) => ({
              label: s.nameFi as string,
              value: s.pk as number,
            })),
          ]}
          onChange={(v: { label: string; value: number }) =>
            setValue("spacePk", v.value)
          }
        />
        <EditorContainer>
          {languages.map((lang) => (
            <TextInput
              disabled={editDisabled}
              key={`name.${lang}`}
              required
              id={`name.${lang}`}
              label={t("ResourceModal.nameLabel", { lang })}
              placeholder={t("ResourceModal.namePlaceholder", {
                language: t(`language.${lang}`),
              })}
              onBlur={(e) => {
                setValue(`name${startCase(lang)}`, e.target.value);
              }}
              defaultValue=""
            />
          ))}
          {languages.map((lang) => (
            <RichTextInput
              key={`description.${lang}`}
              disabled={editDisabled}
              id={`description.${lang}`}
              label={t("ResourceModal.descriptionLabel", { lang })}
              required
              value={get(
                editorState.resource,
                `description${upperFirst(lang)}`,
                ""
              )}
              onChange={(description) => {
                setValue(`description${startCase(lang)}`, description);
              }}
            />
          ))}
          <EditorColumns> </EditorColumns>
        </EditorContainer>
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={closeModal} variant="secondary">
          {t("ResourceModal.cancel")}
        </Button>
        <SaveButton
          disabled={editDisabled}
          onClick={() => {
            create({ ...editorState.resource, isDraft: true });
          }}
          variant="secondary"
        >
          {t("ResourceModal.saveAsDraft")}
        </SaveButton>
        <SaveButton
          disabled={!saveAsReadyEnabled}
          loadingText={t("ResourceModal.saving")}
          onClick={async () => {
            create({ ...editorState.resource, isDraft: false });
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
