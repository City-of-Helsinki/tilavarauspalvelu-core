import React, { useReducer } from "react";
import {
  Button,
  Dialog,
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconPlusCircleFill,
  IconTrash,
  NumberInput,
  Select,
  Tag,
  TextInput,
} from "hds-react";
import styled from "styled-components";

import { FetchResult, useMutation } from "@apollo/client";
import { useTranslation, TFunction } from "react-i18next";
import { omit, set } from "lodash";
import {
  Space,
  UnitWIP,
  SpaceCreateMutationInput,
  SpaceCreateMutationPayload,
  OptionType,
} from "../../common/types";
import { parseAddress } from "../../common/util";
import { CREATE_SPACE } from "../../common/queries";
import { CustomDialogHeader } from "./CustomDialogHeader";

const defaultParentSpaceId = "1";
interface IProps {
  unit: UnitWIP;
  closeModal: () => void;
  onSave: () => void;
}

type State = {
  numSpaces: number;
  parentSpace?: Space | null;
  spaces: SpaceCreateMutationInput[];
  page: number;
};

type Action =
  | { type: "setNumSpaces"; numSpaces: number }
  | { type: "setSpaceName"; name: string; index: number }
  | { type: "setSpaceSurfaceArea"; surfaceArea: number; index: number }
  | { type: "setSpaceMaxPersonCount"; maxPersonCount: number; index: number }
  | { type: "setSpaceCode"; code: string; index: number }
  | { type: "setParentSpace"; parentSpace?: string | null }
  | { type: "nextPage" }
  | { type: "prevPage" }
  | { type: "addRow" }
  | { type: "delete"; index: number };

const initialState = {
  numSpaces: 0,
  parentSpace: undefined,
  spaces: [],
  page: 0,
};

let id = -1;

const getId = (): string => {
  id -= 1;
  return String(id);
};

const initialSpace = (parentSpaceId: string | null) =>
  ({
    key: getId(),
    name: "",
    surfaceArea: 0,
    maxPersons: 0,
    locationType: "fixed",
    buildingId: "1", // WIP to be removed from api
    districtId: "1", // WIP to be removed from api
    parentId: parentSpaceId, // WIP to be made optional in api
  } as SpaceCreateMutationInput);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setNumSpaces": {
      return set({ ...state }, "numSpaces", action.numSpaces);
    }
    case "setSpaceName": {
      return set({ ...state }, `spaces[${action.index}].name`, action.name);
    }
    case "setSpaceCode": {
      return set({ ...state }, `spaces[${action.index}].code`, action.code);
    }
    case "setSpaceMaxPersonCount": {
      return set(
        { ...state },
        `spaces[${action.index}].maxPersons`,
        action.maxPersonCount
      );
    }
    case "setSpaceSurfaceArea": {
      return set(
        { ...state },
        `spaces[${action.index}].surfaceArea`,
        action.surfaceArea
      );
    }
    case "setParentSpace": {
      return set({ ...state }, "parentSpace", action.parentSpace);
    }
    case "addRow": {
      return {
        ...state,
        spaces: state.spaces.concat([
          initialSpace(String(state.parentSpace?.id || defaultParentSpaceId)),
        ]),
      };
    }
    case "delete": {
      return {
        ...state,
        spaces: state.spaces.filter((s, i) => action.index !== i),
      };
    }

    case "nextPage": {
      const nextState = {
        ...state,
        page: 1,
      };

      // populate initial data for spaces
      if (nextState.spaces.length === 0) {
        nextState.spaces = Array.from(Array(state.numSpaces).keys()).map(() =>
          initialSpace(String(state.parentSpace?.id || defaultParentSpaceId))
        );
      }
      return nextState;
    }
    case "prevPage": {
      return set({ ...state }, "page", 0);
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

const Parent = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  margin-bottom: var(--spacing-m);
`;

const Title = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-m);
`;

const ActionButtons = styled.div`
  display: flex;
  padding: var(--spacing-m);
`;

const NextButton = styled(Button)`
  margin-left: auto;
`;

const ButtonContainer = styled.div`
  display: flex;
`;
const NewRowButton = styled(Button)`
  color: var(--color-black);
  position: relative;
  margin-left: auto;
`;

const EditorContainer = styled.div`
  margin: 2em 0;
  display: grid;
  grid-template-columns: 1fr 2em;
  gap: 1em;
  border-bottom: 1px solid var(--color-black);
`;

const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const NarrowNumberInput = styled(NumberInput)`
  max-width: 15em;
`;

const RoundTag = styled(Tag)`
  border-radius: 10px;
  background-color: var(--color-bus-light);
  color: var(--color-bus);
  font-weight: 600;
  margin-top: var(--spacing-s);
  margin-left: auto;
`;

const IconDelete = styled(IconTrash)`
  padding-top: 2em;
`;

const parentOptions = [
  {
    label: "Itsenäinen tila",
    value: null,
  } as OptionType,
];

function FirstPage({
  editorState,
  unit,
  dispatch,
  closeModal,
  t,
}: {
  editorState: State;
  unit: UnitWIP;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  t: TFunction;
}): JSX.Element {
  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentSpace !== undefined;

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        extras={<RoundTag>{t("SpaceModal.phase")} 1/2</RoundTag>}
        title={t("SpaceModal.page1.modalTitle")}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("SpaceModal.page1.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <Name>{unit.name}</Name>
          <Address>{parseAddress(unit.location)}</Address>
        </UnitInfo>
        <Title>{t("SpaceModal.page1.title")}</Title>
        <NarrowNumberInput
          value={editorState.numSpaces}
          helperText={t("SpaceModal.page1.numSpacesHelperText")}
          id="WithDefaultValue"
          label={t("SpaceModal.page1.numSpacesLabel")}
          minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
          plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
          onChange={(e) => {
            dispatch({
              type: "setNumSpaces",
              numSpaces: Number(e.target.value),
            });
          }}
          step={1}
          type="number"
          min={0}
          max={10}
          required
        />
        <br />
        <Select
          id="parent"
          label={t("SpaceModal.page1.parentLabel")}
          placeholder={t("SpaceModal.page1.parentPlaceholder")}
          required
          helper={t("SpaceModal.page1.parentHelperText")}
          options={parentOptions}
          onChange={(selected: OptionType) =>
            dispatch({
              type: "setParentSpace",
              parentSpace: selected.value as string,
            })
          }
        />
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={closeModal} variant="secondary">
          {t("SpaceModal.page1.buttonCancel")}
        </Button>
        <NextButton
          disabled={!nextEnabled}
          iconRight={<IconArrowRight />}
          variant="supplementary"
          onClick={() => dispatch({ type: "nextPage" })}
        >
          {t("SpaceModal.page1.buttonNext")}
        </NextButton>
      </ActionButtons>
    </>
  );
}

const SpaceEditor = ({
  space,
  index,
  t,
  dispatch,
}: {
  space: SpaceCreateMutationInput;
  index: number;
  t: TFunction;
  dispatch: React.Dispatch<Action>;
}) => (
  <>
    <EditorContainer>
      <div>
        <TextInput
          required
          id={`name[${index}]`}
          label={t("SpaceModal.page2.nameLabel")}
          onBlur={(e) => {
            dispatch({ type: "setSpaceName", index, name: e.target.value });
          }}
          defaultValue={space.name}
        />

        <EditorColumns>
          <NumberInput
            defaultValue={space.surfaceArea}
            id={`surfaceArea[${index}]`}
            label={t("SpaceModal.page2.surfaceAreaLabel")}
            helperText={t("SpaceModal.page2.surfaceAreaHelperText")}
            minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
            plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
            onChange={(e) => {
              dispatch({
                type: "setSpaceSurfaceArea",
                index,
                surfaceArea: Number(e.target.value),
              });
            }}
            step={1}
            type="number"
            min={0}
            max={10}
            required
          />
          <NumberInput
            defaultValue={space.surfaceArea}
            id={`maxPersons[${index}]`}
            label={t("SpaceModal.page2.maxPersonsLabel")}
            minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
            plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
            onChange={(e) => {
              dispatch({
                type: "setSpaceMaxPersonCount",
                index,
                maxPersonCount: Number(e.target.value),
              });
            }}
            step={1}
            type="number"
            min={0}
            helperText={t("SpaceModal.page2.maxPersonsHelperText")}
            max={10}
            required
          />
          <TextInput
            id={`code[${index}]`}
            label={t("SpaceModal.page2.codeLabel")}
            placeholder={t("SpaceModal.page2.codePlaceholder")}
            defaultValue=""
            onChange={(e) => {
              dispatch({
                type: "setSpaceCode",
                index,
                code: e.target.value,
              });
            }}
          />
        </EditorColumns>
      </div>
      <IconDelete
        tabIndex={0}
        onKeyPress={() => dispatch({ type: "delete", index })}
        onClick={() => dispatch({ type: "delete", index })}
      />
    </EditorContainer>
  </>
);

const SecondPage = ({
  editorState,
  unit,
  dispatch,
  closeModal,
  createSpace,
  t,
  onSave,
}: {
  editorState: State;
  unit: UnitWIP;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  createSpace: (
    variables: SpaceCreateMutationInput
  ) => Promise<FetchResult<{ createSpace: SpaceCreateMutationPayload }>>;
  t: TFunction;
  onSave: () => void;
}): JSX.Element => {
  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentSpace !== undefined;

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        title={t("SpaceModal.page2.modalTitle")}
        extras={<RoundTag>{t("SpaceModal.phase")} 2/2</RoundTag>}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("SpaceModal.page2.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <Name>{unit.name}</Name>
            <Parent>
              {editorState.parentSpace
                ? editorState.parentSpace.name
                : t("SpaceModal.page2.newRootSpace")}
            </Parent>
          </div>
          <Address>{parseAddress(unit.location)}</Address>
        </UnitInfo>
        {editorState.spaces.map((space, i) => (
          <SpaceEditor
            index={i}
            key={space.key}
            space={space}
            t={t}
            dispatch={dispatch}
          />
        ))}
        <ButtonContainer>
          <NewRowButton
            variant="supplementary"
            iconLeft={<IconPlusCircleFill />}
            onClick={() => dispatch({ type: "addRow" })}
          >
            {t("SpaceModal.page2.addRowButton")}
          </NewRowButton>
        </ButtonContainer>
      </Dialog.Content>
      <ActionButtons>
        <Button
          onClick={() => dispatch({ type: "prevPage" })}
          variant="supplementary"
          iconLeft={<IconArrowLeft />}
        >
          {t("SpaceModal.page2.prevButton")}
        </Button>
        <NextButton
          disabled={!nextEnabled}
          loadingText={t("SpaceModal.page2.saving")}
          onClick={() => {
            const promises = Promise.allSettled(
              editorState.spaces.map((s) =>
                createSpace(
                  omit(s, [
                    "key",
                    "maxPersons", // WIP not in api
                    "locationType",
                    "code", // WIP not in api
                  ]) as SpaceCreateMutationInput
                )
              )
            );

            promises
              .then((res) => {
                const succesful = res.filter(
                  (r) => r.status === "fulfilled" && !r.value.errors
                ) as PromiseFulfilledResult<
                  FetchResult<{ createSpace: SpaceCreateMutationPayload }>
                >[];

                if (succesful.length === editorState.spaces.length) {
                  onSave();
                  closeModal();
                } else {
                  // WIP
                }
              })
              .catch(() => {
                // WIP
              });
          }}
        >
          {t("SpaceModal.page2.createButton")}
        </NextButton>
      </ActionButtons>
    </>
  );
};

const NewSpaceModal = ({
  unit,
  closeModal,
  onSave,
}: IProps): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();

  const createSpaceMutation = useMutation<
    { createSpace: SpaceCreateMutationPayload },
    { input: SpaceCreateMutationInput }
  >(CREATE_SPACE);

  const createSpace = (
    input: SpaceCreateMutationInput
  ): Promise<FetchResult<{ createSpace: SpaceCreateMutationPayload }>> =>
    createSpaceMutation[0]({ variables: { input } });

  return editorState.page === 0 ? (
    <FirstPage
      editorState={editorState}
      unit={unit}
      dispatch={dispatch}
      closeModal={closeModal}
      t={t}
    />
  ) : (
    <SecondPage
      editorState={editorState}
      unit={unit}
      dispatch={dispatch}
      closeModal={closeModal}
      createSpace={createSpace}
      t={t}
      onSave={onSave}
    />
  );
};

export default NewSpaceModal;
