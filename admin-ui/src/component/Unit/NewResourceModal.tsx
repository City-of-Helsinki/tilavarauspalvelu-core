import React, { useEffect, useReducer } from "react";
import {
  Button,
  Dialog,
  IconCheck,
  Notification,
  Select,
  TextArea,
  TextInput,
} from "hds-react";
import styled from "styled-components";
import { FetchResult, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { omit, set, startCase } from "lodash";
import {
  ResourceCreateMutationInput,
  ResourceCreateMutationPayload,
  SpaceType,
  UnitType,
} from "../../common/types";
import { parseAddress } from "../../common/util";
import { CREATE_RESOURCE } from "../../common/queries";
import { CustomDialogHeader } from "./CustomDialogHeader";
import { breakpoints } from "../../styles/util";

interface IProps {
  unit: UnitType;
  spaceId: number;
  closeModal: () => void;
  onSave: () => void;
  spaces: SpaceType[];
}

type State = {
  resource: ResourceCreateMutationInput;
  spaceId: number;
  error?: string;
};

type Action =
  | { type: "setResourceName"; lang: string; name: string }
  | { type: "setSpaceId"; spaceId: number }
  | { type: "setError"; error: string }
  | { type: "clearError" }
  | {
      type: "setResourceDescription";
      lang: string;
      description: string;
    };

const initialState = { resource: {} } as State;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setSpaceId": {
      return set({ ...state }, "resource.spaceId", action.spaceId);
    }
    case "setResourceName": {
      return set(
        { ...state },
        `resource.name${startCase(action.lang)}`,
        action.name
      );
    }
    case "setResourceDescription": {
      return set(
        { ...state },
        `resource.description${startCase(action.lang)}`,
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

const languages = ["fi", "sv", "en"];

const NewResourceModal = ({
  unit,
  closeModal,
  onSave,
  spaceId,
  spaces,
}: IProps): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();

  useEffect(() => {
    if (spaceId) {
      dispatch({ type: "setSpaceId", spaceId });
    }
  }, [spaceId]);

  const [createResourceMutation] = useMutation<
    { createResource: ResourceCreateMutationPayload },
    { input: ResourceCreateMutationInput }
  >(CREATE_RESOURCE);

  const createResource = (
    input: ResourceCreateMutationInput
  ): Promise<FetchResult<{ createResource: ResourceCreateMutationPayload }>> =>
    createResourceMutation({ variables: { input } });

  const saveAsReadyEnabled =
    editorState.resource.nameFi &&
    editorState.resource.nameSv &&
    editorState.resource.nameEn &&
    editorState.resource.descriptionFi &&
    editorState.resource.descriptionSv &&
    editorState.resource.descriptionEn;

  const editDisabled = !editorState.resource.spaceId;

  const create = async (resource: ResourceCreateMutationInput) => {
    try {
      const { data } = await createResource({
        ...resource,
        locationType: "fixed",
      });

      if (data?.createResource.errors === null) {
        onSave();
        closeModal();
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
            <Name>{unit.name}</Name>
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
            ...spaces.map((s) => ({ label: s.name, value: s.pk as number })),
          ]}
          onChange={(v: { label: string; value: number }) =>
            dispatch({ type: "setSpaceId", spaceId: v.value })
          }
        />
        <EditorContainer>
          {languages.map((lang) => (
            <TextInput
              disabled={editDisabled}
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
                disabled={editDisabled}
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
