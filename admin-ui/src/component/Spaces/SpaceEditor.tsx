import {
  Notification,
  NumberInput,
  TextInput,
  Select,
  Button,
} from "hds-react";
import { get, omitBy, pick, upperFirst } from "lodash";
import React, { useReducer } from "react";
import { FetchResult, useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
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
import {
  Maybe,
  Query,
  QuerySpaceByPkArgs,
  SpaceType,
  SpaceUpdateMutationInput,
  SpaceUpdateMutationPayload,
  UnitType,
} from "../../common/gql-types";
import { languages } from "../../common/const";
import { spacesAsHierarchy } from "./util";

interface IProps {
  unitPk: string;
  spacePk: string;
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
  | { type: "hierarchyLoaded"; spaces: SpaceType[] }
  | { type: "dataLoadError"; message: string }
  // eslint-disable-next-line
  | { type: "set"; value: any };

type State = {
  spacePk?: number;
  unitPk?: number;
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

const getInitialState = (spacePk: number, unitPk: number): State => ({
  spacePk,
  unitPk,
  loading: true,
  notification: null,
  space: null,
  spaceEdit: null,
  error: null,
  hasChanges: false,
  parentOptions: [independentSpaceOption],
});

const modified = (d: State) => ({ ...d, hasChanges: true });

const getChildrenFor = (space: SpaceType, hierarchy: SpaceType[]) => {
  return hierarchy.filter((s) => s.parent?.pk === space.pk);
};

const getChildrenRecursive = (space: SpaceType, hierarchy: SpaceType[]) => {
  const newChildren = getChildrenFor(space, hierarchy);
  return newChildren.concat(
    newChildren.flatMap((s) => getChildrenFor(s, hierarchy))
  );
};

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
          ...pick({ ...space, pk: space.pk as number }, [
            "pk",
            "nameFi",
            "nameSv",
            "nameEn",
            "surfaceArea",
            "maxPersons",
            "code",
            "termsOfUseFi",
            "termsOfUseSv",
            "termsOfUseEn",
          ]),
          parentPk: space.parent ? space.parent?.pk : null,
          unitPk: space.unit ? space.unit.pk : undefined,
        } as SpaceUpdateMutationInput,
        loading: false,
        hasChanges: false,
      };
    }
    case "hierarchyLoaded": {
      const unitSpaces = spacesAsHierarchy(
        action.spaces.filter((space) => {
          return space.unit?.pk === state.unitPk;
        }),
        "\u2007"
      );

      const children = getChildrenRecursive(
        state.space as SpaceType,
        unitSpaces
      ).map((s) => s.pk);

      const additionalOptions = unitSpaces
        .filter((space) => space.pk !== state.spacePk)
        .filter((space) => children.indexOf(space.pk) === -1)
        .map((space) => ({
          label: space.nameFi as string,
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

    case "set": {
      return modified({
        ...state,
        spaceEdit: { ...state.spaceEdit, ...action.value },
      });
    }

    default:
      return state;
  }
};

const Wrapper = styled.div``;

const TextInputWithPadding = styled(TextInput)`
  padding-bottom: var(--spacing-m);
`;
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

const getParent = (v: Maybe<number> | undefined, options: ParentType[]) =>
  options.find((po) => po.value?.pk === v) || options[0];

const SpaceEditor = (): JSX.Element | null => {
  const { spacePk, unitPk } = useParams<IProps>();
  const history = useHistory();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(spacePk), Number(unitPk))
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

  useQuery<Query, QuerySpaceByPkArgs>(SPACE_QUERY, {
    variables: { pk: Number(spacePk) },
    onCompleted: ({ spaceByPk }) => {
      if (spaceByPk) {
        dispatch({ type: "dataLoaded", space: spaceByPk });
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setValue = (value: any) => {
    dispatch({ type: "set", value });
  };

  return (
    <Wrapper>
      <SpaceHead
        title={state.space.parent?.nameFi || t("SpaceEditor.noParent")}
        unit={state.space.unit as UnitType}
        maxPersons={state.spaceEdit?.maxPersons || undefined}
        surfaceArea={state.spaceEdit?.surfaceArea || undefined}
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
                  state.spaceEdit?.parentPk,
                  state.parentOptions
                )}
                onChange={(selected: ParentType) =>
                  setValue({ parentPk: selected.value?.pk })
                }
              />
            </Section>
            <Section>
              <SubHeading>{t("SpaceEditor.other")}</SubHeading>
              {languages.map((lang) => (
                <TextInputWithPadding
                  key={lang}
                  required
                  id={`name${lang}`}
                  label={t("SpaceEditor.nameLabel", {
                    lang,
                  })}
                  value={get(state, `spaceEdit.name${upperFirst(lang)}`, "")}
                  placeholder={t("SpaceEditor.namePlaceholder", {
                    language: t(`language.${lang}`),
                  })}
                  onChange={(e) =>
                    setValue({
                      [`name${upperFirst(lang)}`]: e.target.value,
                    })
                  }
                />
              ))}

              <EditorColumns>
                <NumberInput
                  value={state.spaceEdit?.surfaceArea || 0}
                  id="surfaceArea"
                  label={t("SpaceModal.page2.surfaceAreaLabel")}
                  helperText={t("SpaceModal.page2.surfaceAreaHelperText")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) =>
                    setValue({ surfaceArea: Number(e.target.value) })
                  }
                  step={1}
                  type="number"
                  min={1}
                  required
                />
                <NumberInput
                  value={state.spaceEdit?.maxPersons || ""}
                  id="maxPersons"
                  label={t("SpaceModal.page2.maxPersonsLabel")}
                  minusStepButtonAriaLabel={t("common.decreaseByOneAriaLabel")}
                  plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                  onChange={(e) =>
                    setValue({ maxPersons: Number(e.target.value) })
                  }
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
                  value={state.spaceEdit?.code || ""}
                  onChange={(e) => setValue({ code: e.target.value })}
                />
              </EditorColumns>
            </Section>
            <Buttons>
              <Button
                disabled={!state.hasChanges}
                variant="secondary"
                onClick={() => history.go(-1)}
              >
                {t("SpaceEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!state.hasChanges}
                onClick={async () => {
                  try {
                    const data = await updateSpace({
                      ...(omitBy(
                        state.spaceEdit,
                        (v) => v === ""
                      ) as SpaceUpdateMutationInput),
                      surfaceArea: Number(state.spaceEdit?.surfaceArea),
                    });
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
