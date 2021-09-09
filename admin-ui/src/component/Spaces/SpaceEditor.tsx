import {
  Notification,
  NumberInput,
  TextInput,
  Select,
  Button,
  TextArea,
} from "hds-react";
import { pick, set } from "lodash";
import React, { useReducer } from "react";
import { FetchResult, useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import {
  SpaceType,
  SpaceUpdateMutationInput,
  SpaceUpdateMutationPayload,
} from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import Loader from "../Loader";
import withMainMenu from "../withMainMenu";
import {
  SPACE_HIERARCHY_QUERY,
  SPACE_QUERY,
  UPDATE_SPACE,
} from "../../common/queries";
import SpaceHead from "./SpaceHead";
import { H1 } from "../../styles/typography";
import SpaceHierarchy from "./SpaceHierarchy";

interface IProps {
  unitId: string;
  spaceId: string;
}

type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

type ParentType = { label: string; value: SpaceType | null };

const independentSpaceOption = {
  label: i18next.t("SpaceEditor.noParent"),
  value: null,
};

type Action =
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | { type: "clearError" }
  | { type: "dataLoaded"; space: SpaceType }
  | { type: "hierarchyLoaded"; spaces: { node: SpaceType }[] }
  | { type: "dataLoadError"; message: string }
  | { type: "setName"; name: string }
  | { type: "setMaxPersons"; maxPersons: number }
  | { type: "setSurfaceArea"; surfaceArea: number }
  | { type: "setCode"; code: string }
  | { type: "setTermsOfUse"; termsOfUse: string }
  | { type: "setParent"; parentId?: number };

type State = {
  spaceId?: number;
  unitId?: number;
  notification: null | NotificationType;
  loading: boolean;
  space: SpaceType | null;
  spaceEdit: SpaceUpdateMutationInput | null;
  parent?: SpaceType;
  unitSpaces?: SpaceType[];
  hasChanges: boolean;
  error: null | {
    message: string;
  };
  parentOptions: ParentType[];
};

const getInitialState = (spaceId: number, unitId: number): State => ({
  spaceId,
  unitId,
  loading: true,
  notification: null,
  space: null,
  spaceEdit: null,
  error: null,
  hasChanges: false,
  parentOptions: [independentSpaceOption],
});

const modified = (d: State) => ({ ...d, hasChanges: true });

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "clearNotification": {
      return { ...state, notification: null };
    }
    case "setNotification": {
      return { ...state, notification: { ...action.notification } };
    }
    case "dataLoaded": {
      const { space } = action;
      return {
        ...state,
        space: {
          ...space,
        },
        spaceEdit: {
          ...pick(space, [
            "pk",
            "name",
            "surfaceArea",
            "maxPersons",
            "code",
            "termsOfUse",
          ]),
          parentId: space.parent ? String(space.parent.pk) : undefined,
          unitId: space.unit ? String(space.unit.pk) : undefined,
        },
        loading: false,
        hasChanges: false,
      };
    }
    case "hierarchyLoaded": {
      const unitSpaces = action.spaces
        .map(({ node }: { node: SpaceType }) => node)
        .filter((space) => {
          return space.unit?.pk === state.unitId;
        });

      const additionalOptions = unitSpaces
        .filter((space) => space.pk !== state.spaceId)
        .map((space) => ({
          label: space.name,
          value: space,
        }));

      return {
        ...state,
        unitSpaces,
        parentOptions: [independentSpaceOption, ...additionalOptions],
      };
    }
    case "dataLoadError": {
      return {
        ...state,
        loading: false,
        hasChanges: false,
        error: { message: action.message },
      };
    }
    case "clearError": {
      return {
        ...state,
        error: null,
      };
    }
    case "setCode": {
      return modified(set({ ...state }, `spaceEdit.code`, action.code));
    }
    case "setParent": {
      return modified(
        set({ ...state }, `spaceEdit.parentId`, action.parentId || null)
      );
    }
    case "setTermsOfUse": {
      return modified(
        set({ ...state }, `spaceEdit.termsOfUse`, action.termsOfUse)
      );
    }
    case "setName": {
      return modified(set({ ...state }, `spaceEdit.name`, action.name));
    }
    case "setMaxPersons": {
      return modified(
        set({ ...state }, `spaceEdit.maxPersons`, action.maxPersons)
      );
    }
    case "setSurfaceArea": {
      return modified(
        set({ ...state }, `spaceEdit.surfaceArea`, action.surfaceArea)
      );
    }
    default:
      return state;
  }
};

const Wrapper = styled.div``;

const StyledNotification = styled(Notification)`
  margin: var(--spacing-xs) var(--spacing-layout-2-xs);
  width: auto;
  @media (min-width: ${breakpoints.xl}) {
    margin: var(--spacing-s) var(--spacing-layout-xl);
  }
`;

const EditorContainer = styled.div`
  margin: 0 var(--spacing-layout-m);
`;

const EditorColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const Editor = styled.div`
  margin: 0 var(--spacing-layout-m);
  max-width: 52rem;
`;

const Section = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const SubHeading = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-m);
`;

const Buttons = styled.div`
  display: flex;
  margin: var(--spacing-layout-m) 0;
`;

const SaveButton = styled(Button)`
  margin-left: auto;
`;

const getParent = (v: string | undefined, options: ParentType[]) => {
  const p = options.find((po) => String(po.value?.pk) === v) || options[0];
  return p;
};

const SpaceEditor = (): JSX.Element | null => {
  const { spaceId, unitId } = useParams<IProps>();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(spaceId), Number(unitId))
  );

  const onDataError = (text: string) => {
    dispatch({
      type: "dataLoadError",
      message: text,
    });
  };

  const [updateSpaceMutation] = useMutation<
    { updateSpace: SpaceUpdateMutationPayload },
    { input: SpaceUpdateMutationInput }
  >(UPDATE_SPACE);

  const updateSpace = (
    input: SpaceUpdateMutationInput
  ): Promise<FetchResult<{ updateSpace: SpaceUpdateMutationPayload }>> =>
    updateSpaceMutation({ variables: { input } });

  const { t } = useTranslation();

  useQuery(SPACE_QUERY, {
    variables: { pk: spaceId },
    onCompleted: ({ spaceByPk }: { spaceByPk: SpaceType }) => {
      dispatch({ type: "dataLoaded", space: spaceByPk });
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery(SPACE_HIERARCHY_QUERY, {
    onCompleted: (data) => {
      dispatch({
        type: "hierarchyLoaded",
        spaces: data.spaces.edges,
      });
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  if (state.loading) {
    return <Loader />;
  }

  if (state.error && !state.space) {
    return (
      <Wrapper>
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
      </Wrapper>
    );
  }

  const onSave = (text?: string) =>
    dispatch({
      type: "setNotification",
      notification: {
        type: "success",
        title: text || t("SpaceEditor.spaceUpdated"),
        text: "SpaceEditor.spaceUpdatedNotification",
      },
    });

  if (state.space === null) {
    return null;
  }

  return (
    <Wrapper>
      <SpaceHead
        title={state.space.parent?.name || t("SpaceEditor.noParent")}
        unit={state.space.unit}
        maxPersons={state.spaceEdit?.maxPersons}
        surfaceArea={state.spaceEdit?.surfaceArea}
      />
      <IngressContainer>
        {state.notification ? (
          <StyledNotification
            type={state.notification.type}
            label={t(state.notification.title)}
            dismissible
            closeButtonLabelText={`${t("common.close")}`}
            onClose={() => dispatch({ type: "clearNotification" })}
          >
            {t(state.notification.text)}
          </StyledNotification>
        ) : null}
      </IngressContainer>
      <ContentContainer>
        <EditorContainer>
          <H1>{t("SpaceEditor.details")}</H1>
          <Editor>
            <Section>
              <SubHeading>{t("SpaceEditor.hierarchy")}</SubHeading>
              <SpaceHierarchy
                space={state.space}
                unitSpaces={state.unitSpaces}
              />
              <Select
                id="parent"
                label={t("SpaceModal.page1.parentLabel")}
                placeholder={t("SpaceModal.page1.parentPlaceholder")}
                required
                helper={t("SpaceModal.page1.parentHelperText")}
                options={state.parentOptions}
                value={getParent(
                  state.spaceEdit?.parentId,
                  state.parentOptions
                )}
                onChange={(selected: ParentType) =>
                  dispatch({
                    type: "setParent",
                    parentId: selected.value?.pk as number,
                  })
                }
              />
            </Section>
            <Section>
              <SubHeading>{t("SpaceEditor.other")}</SubHeading>
              <TextInput
                defaultValue={state.spaceEdit?.name}
                required
                id="name"
                label={t("SpaceModal.page2.nameLabel")}
                onChange={(e) => {
                  dispatch({ type: "setName", name: e.target.value });
                }}
              />
              <EditorColumns>
                <NumberInput
                  defaultValue={state.spaceEdit?.surfaceArea}
                  id="surfaceArea"
                  label={t("SpaceModal.page2.surfaceAreaLabel")}
                  helperText={t("SpaceModal.page2.surfaceAreaHelperText")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    dispatch({
                      type: "setSurfaceArea",
                      surfaceArea: Number(e.target.value),
                    });
                  }}
                  step={1}
                  type="number"
                  min={1}
                  required
                />
                <NumberInput
                  defaultValue={state.spaceEdit?.maxPersons}
                  id="maxPersons"
                  label={t("SpaceModal.page2.maxPersonsLabel")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) => {
                    dispatch({
                      type: "setMaxPersons",
                      maxPersons: Number(e.target.value),
                    });
                  }}
                  step={1}
                  type="number"
                  min={1}
                  helperText={t("SpaceModal.page2.maxPersonsHelperText")}
                  required
                />
                <TextInput
                  id="code"
                  label={t("SpaceModal.page2.codeLabel")}
                  placeholder={t("SpaceModal.page2.codePlaceholder")}
                  defaultValue={state.spaceEdit?.code}
                  onChange={(e) => {
                    dispatch({
                      type: "setCode",
                      code: e.target.value,
                    });
                  }}
                />
              </EditorColumns>
              <TextArea
                required
                id="termsOfUse"
                label={t("SpaceEditor.termsOfUse")}
                defaultValue={state.spaceEdit?.termsOfUse}
                helperText={t("SpaceEditor.termsOfUseHelperText")}
                onChange={(e) => {
                  dispatch({
                    type: "setTermsOfUse",
                    termsOfUse: e.target.value,
                  });
                }}
              />
            </Section>
            <Buttons>
              <Button disabled={!state.hasChanges} variant="secondary">
                {t("SpaceEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!state.hasChanges}
                onClick={async () => {
                  try {
                    const data = await updateSpace(
                      state.spaceEdit as SpaceUpdateMutationInput
                    );
                    if (data?.data?.updateSpace.errors === null) {
                      onSave();
                    } else {
                      onDataError("Tietojen tallennus ei onnistunut!");
                    }
                  } catch {
                    onDataError(t("SpaceEditor.saveFailed"));
                  }
                }}
              >
                {t("SpaceEditor.save")}
              </SaveButton>
            </Buttons>
          </Editor>
        </EditorContainer>
      </ContentContainer>
      {state.error ? (
        <Wrapper>
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
            {t(state.error?.message)}
          </Notification>
        </Wrapper>
      ) : null}
    </Wrapper>
  );
};

export default withMainMenu(SpaceEditor);
