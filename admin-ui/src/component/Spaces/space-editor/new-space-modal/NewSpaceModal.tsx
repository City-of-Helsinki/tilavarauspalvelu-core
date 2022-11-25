import React, { useReducer, useEffect } from "react";
import { set } from "lodash";
import { FetchResult, useMutation } from "@apollo/client";
import {
  SpaceCreateMutationInput,
  SpaceCreateMutationPayload,
  SpaceType,
  UnitByPkType,
} from "common/types/gql-types";
import { CREATE_SPACE } from "../queries";
import {
  Action,
  SpaceMutationInputWithKey,
  State,
} from "./modules/newSpaceModal";
import Page1 from "./Page1";
import Page2 from "./Page2";

type Props = {
  unit: UnitByPkType;
  parentSpace?: SpaceType;
  closeModal: () => void;
  onSave: () => void;
  onDataError: (message: string) => void;
};

const initialState = {
  numSpaces: 1,
  parentPk: null,
  parentName: null,
  spaces: [],
  page: 0,
  unitPk: 0,
  unitSpaces: [],
  validationErrors: [],
} as State;

let id = -1;

const getId = (): string => {
  id -= 1;
  return String(id);
};

const initialSpace = (parentPk: number | null, unitPk: number) =>
  ({
    unitPk,
    key: getId(),
    nameFi: "",
    surfaceArea: 1,
    maxPersons: 1,
    parentPk,
  } as SpaceMutationInputWithKey<SpaceCreateMutationInput>);

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "setNumSpaces": {
      return set({ ...state }, "numSpaces", action.numSpaces);
    }
    case "set": {
      return {
        ...state,
        spaces: state.spaces.map((space, index) =>
          index === action.index
            ? { ...state.spaces[index], ...action.value }
            : space
        ),
      };
    }
    case "setUnit": {
      return set({ ...state }, "unitPk", action.unit.pk);
    }
    case "setParent": {
      return {
        ...state,
        parentPk: action.parentPk,
        parentName: action.parentName,
      };
    }
    case "addRow": {
      return {
        ...state,
        spaces: state.spaces.concat([
          initialSpace(state.parentPk, state.unitPk),
        ]),
      };
    }
    case "delete": {
      return {
        ...state,
        spaces: state.spaces.filter((s, i) => action.index !== i),
      };
    }
    case "setValidatioErrors": {
      return {
        ...state,
        validationErrors: action.validationErrors,
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
          initialSpace(state.parentPk, state.unitPk)
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

const NewSpaceModal = ({
  unit,
  closeModal,
  onSave,
  onDataError,
  parentSpace,
}: Props): JSX.Element | null => {
  const [editorState, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (parentSpace) {
      dispatch({
        type: "setParent",
        parentPk: parentSpace.pk as number,
        parentName: parentSpace.nameFi as string,
      });
    }
  }, [parentSpace]);

  useEffect(() => {
    if (unit) {
      dispatch({ type: "setUnit", unit });
    }
  }, [unit]);

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
    <Page1
      editorState={editorState}
      unit={unit}
      dispatch={dispatch}
      closeModal={closeModal}
      hasFixedParent={hasFixedParent}
    />
  ) : (
    <Page2
      editorState={editorState}
      unit={unit}
      dispatch={dispatch}
      closeModal={closeModal}
      createSpace={createSpace}
      onSave={onSave}
      onDataError={onDataError}
      hasFixedParent={hasFixedParent}
    />
  );
};

export default NewSpaceModal;
