import React, { useReducer, useEffect } from "react";
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
import i18next from "i18next";
import styled from "styled-components";
import { FetchResult, useMutation, useQuery } from "@apollo/client";
import { useTranslation, TFunction } from "react-i18next";
import { omit, set, startCase } from "lodash";
import { parseAddress } from "../../common/util";
import { CREATE_SPACE, SPACE_HIERARCHY_QUERY } from "../../common/queries";
import { CustomDialogHeader } from "./CustomDialogHeader";
import { languages } from "../../common/const";
import {
  Maybe,
  Query,
  SpaceCreateMutationInput,
  SpaceCreateMutationPayload,
  SpaceType,
  UnitByPkType,
} from "../../common/gql-types";

type ParentType = { label: string; value: SpaceType | null };

const defaultParentSpacePk = 1;
interface IProps {
  unit: UnitByPkType;
  parentSpace?: SpaceType;
  closeModal: () => void;
  onSave: () => void;
  onDataError: (message: string) => void;
}

type SpaceMutationInputWithKey<T> = Partial<T> & { key: string };

type State = {
  numSpaces: number;
  parentSpace?: SpaceType | null;
  spaces: SpaceMutationInputWithKey<SpaceCreateMutationInput>[];
  page: number;
  unitPk: number;
  unitSpaces?: SpaceType[];
  parentOptions: ParentType[];
};

type Action =
  | { type: "setNumSpaces"; numSpaces: number }
  | { type: "setSpaceName"; name: string; index: number; lang: string }
  | { type: "setSpaceSurfaceArea"; surfaceArea: number; index: number }
  | { type: "setSpaceMaxPersonCount"; maxPersonCount: number; index: number }
  | { type: "setSpaceCode"; code: string; index: number }
  | { type: "setParentSpace"; parentSpace?: SpaceType | null }
  | { type: "setUnit"; unit: UnitByPkType }
  | { type: "nextPage" }
  | { type: "prevPage" }
  | { type: "addRow" }
  | { type: "delete"; index: number }
  | { type: "hierarchyLoaded"; spaces: SpaceType[] };

const recurse = (
  parent: SpaceType,
  spaces: SpaceType[],
  depth: number,
  paddingChar: string
): SpaceType[] => {
  const newParent = {
    ...parent,
    nameFi: "".padStart(depth, paddingChar) + parent.nameFi,
  } as SpaceType;

  const children = spaces.filter((e) => e.parent?.pk === parent.pk);

  if (children.length === 0) {
    return [newParent];
  }
  const c = children.flatMap((space) =>
    recurse(space, spaces, depth + 1, paddingChar)
  );
  return [newParent, ...c];
};

const spacesAsHierarchy = (
  spaces: SpaceType[],
  paddingChar: string
): SpaceType[] => {
  const roots = spaces.filter((e) => e.parent === null);
  return roots.flatMap((rootSpace) =>
    recurse(rootSpace, spaces, 0, paddingChar)
  );
};

const independentSpaceOption = {
  label: i18next.t("SpaceEditor.noParent"),
  value: null,
};

const initialState = {
  numSpaces: 1,
  parentSpace: undefined,
  spaces: [],
  page: 0,
  unitPk: 0,
  unitSpaces: [],
  parentOptions: [independentSpaceOption],
} as State;

let id = -1;

const getId = (): string => {
  id -= 1;
  return String(id);
};

const initialSpace = (
  parentSpacePk: Maybe<number> | undefined,
  unitPk: number
) =>
  ({
    unitPk,
    key: getId(),
    nameFi: "",
    surfaceArea: 0,
    maxPersons: 0,
    locationType: "fixed",
    parentPk: parentSpacePk,
  } as SpaceMutationInputWithKey<SpaceCreateMutationInput>);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setNumSpaces": {
      return set({ ...state }, "numSpaces", action.numSpaces);
    }
    case "setSpaceName": {
      return set(
        { ...state },
        `spaces[${action.index}].name${startCase(action.lang)}`,
        action.name
      );
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
    case "setUnit": {
      return set({ ...state }, "unitPk", action.unit.pk);
    }
    case "setParentSpace": {
      return set({ ...state }, "parentSpace", action.parentSpace);
    }
    case "addRow": {
      return {
        ...state,
        spaces: state.spaces.concat([
          initialSpace(
            state.parentSpace?.pk || defaultParentSpacePk,
            state.unitPk
          ),
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
          initialSpace(state.parentSpace?.pk, state.unitPk)
        );
      }
      return nextState;
    }
    case "prevPage": {
      return set({ ...state }, "page", 0);
    }

    case "hierarchyLoaded": {
      const unitSpaces = spacesAsHierarchy(
        action.spaces.filter((space) => {
          return space.unit?.pk === state.unitPk;
        }),
        "\u2007"
      );

      const additionalOptions = unitSpaces.map((space) => ({
        label: space.nameFi as string,
        value: space,
      }));

      return {
        ...state,
        unitSpaces,
        parentOptions: [independentSpaceOption, ...additionalOptions],
      };
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

function FirstPage({
  editorState,
  unit,
  dispatch,
  closeModal,
  t,
  hasFixedParent,
}: {
  editorState: State;
  unit: UnitByPkType;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  t: TFunction;
  hasFixedParent: boolean;
}): JSX.Element {
  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentSpace !== undefined;

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        extras={<RoundTag>{t("SpaceModal.phase")} 1/2</RoundTag>}
        title={t(
          hasFixedParent
            ? "SpaceModal.page1.subSpaceModalTitle"
            : "SpaceModal.page1.modalTitle"
        )}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("SpaceModal.page1.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <Name>{unit.nameFi}</Name>
            <Parent>
              {editorState.parentSpace ? editorState.parentSpace.nameFi : null}
            </Parent>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        {!hasFixedParent ? <Title>{t("SpaceModal.page1.title")}</Title> : null}
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
          min={1}
          max={10}
          required
        />
        {!hasFixedParent ? (
          <>
            <br />
            <Select
              id="parent"
              label={t("SpaceModal.page1.parentLabel")}
              placeholder={t("SpaceModal.page1.parentPlaceholder")}
              required
              helper={t("SpaceModal.page1.parentHelperText")}
              options={editorState.parentOptions}
              onChange={(selected: ParentType) =>
                dispatch({
                  type: "setParentSpace",
                  parentSpace: selected.value,
                })
              }
            />
          </>
        ) : null}
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
        {languages.map((lang) => (
          <TextInput
            key={lang}
            required
            id={`name.${lang}`}
            label={t("SpaceModal.nameLabel", { lang })}
            placeholder={t("SpaceModal.namePlaceholder", {
              language: t(`language.${lang}`),
            })}
            onBlur={(e) => {
              dispatch({
                type: "setSpaceName",
                index,
                name: e.target.value,
                lang,
              });
            }}
            defaultValue=""
          />
        ))}

        <EditorColumns>
          <NumberInput
            defaultValue={space.surfaceArea || 0}
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
            defaultValue={space.surfaceArea || 0}
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
  onDataError,
  hasFixedParent,
}: {
  editorState: State;
  unit: UnitByPkType;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  createSpace: (
    variables: SpaceCreateMutationInput
  ) => Promise<FetchResult<{ createSpace: SpaceCreateMutationPayload }>>;
  t: TFunction;
  onSave: () => void;
  onDataError: (message: string) => void;
  hasFixedParent: boolean;
}): JSX.Element => {
  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentSpace !== undefined;

  return (
    <>
      <CustomDialogHeader
        id="dialog-title"
        title={t(
          hasFixedParent
            ? "SpaceModal.page2.subSpaceModalTitle"
            : "SpaceModal.page2.modalTitle"
        )}
        extras={<RoundTag>{t("SpaceModal.phase")} 2/2</RoundTag>}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t(
            hasFixedParent
              ? "SpaceModal.page2.subSpaceInfo"
              : "SpaceModal.page2.info"
          )}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <Name>{unit.nameFi}</Name>
            <Parent>
              {editorState.parentSpace
                ? editorState.parentSpace.nameFi
                : t("SpaceModal.page2.newRootSpace")}
            </Parent>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        {editorState.spaces.map((space, i) => (
          <SpaceEditor
            index={i}
            key={space.key}
            space={space as SpaceCreateMutationInput}
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
                createSpace({
                  ...(omit(s, [
                    "key",
                    "locationType",
                    "parentId",
                  ]) as SpaceCreateMutationInput),
                  unitPk: editorState.unitPk,
                })
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
                  onDataError(t("SpaceModal.page2.saveFailed"));
                }
              })
              .catch(() => {
                onDataError(t("SpaceModal.page2.saveFailed"));
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
  onDataError,
  parentSpace,
}: IProps): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, initialState);
  const { t } = useTranslation();

  useEffect(() => {
    if (parentSpace) {
      dispatch({ type: "setParentSpace", parentSpace });
    }
  }, [parentSpace]);

  useEffect(() => {
    if (unit) {
      dispatch({ type: "setUnit", unit });
    }
  }, [unit]);

  useQuery<Query>(SPACE_HIERARCHY_QUERY, {
    onCompleted: ({ spaces }) => {
      const result = spaces?.edges.map((s) => s?.node as SpaceType);
      if (result) {
        dispatch({
          type: "hierarchyLoaded",
          spaces: result,
        });
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const createSpaceMutation = useMutation<
    { createSpace: SpaceCreateMutationPayload },
    { input: SpaceCreateMutationInput }
  >(CREATE_SPACE);

  const createSpace = (
    input: SpaceCreateMutationInput
  ): Promise<FetchResult<{ createSpace: SpaceCreateMutationPayload }>> =>
    createSpaceMutation[0]({ variables: { input } });

  const hasFixedParent = Boolean(parentSpace);
  return editorState.page === 0 ? (
    <FirstPage
      editorState={editorState}
      unit={unit}
      dispatch={dispatch}
      closeModal={closeModal}
      t={t}
      hasFixedParent={hasFixedParent}
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
      onDataError={onDataError}
      hasFixedParent={hasFixedParent}
    />
  );
};

export default NewSpaceModal;
