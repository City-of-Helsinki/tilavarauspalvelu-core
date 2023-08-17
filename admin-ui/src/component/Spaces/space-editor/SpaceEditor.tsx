import React, { memo, useReducer, useState } from "react";
import { Button, Notification } from "hds-react";
import { isEqual, omitBy, pick } from "lodash";

import { FetchResult, useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import Joi from "joi";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  Query,
  QuerySpaceByPkArgs,
  SpaceType,
  SpaceUpdateMutationInput,
  SpaceUpdateMutationPayload,
  UnitType,
} from "common/types/gql-types";
import { schema } from "./util";
import { useNotification } from "../../../context/NotificationContext";
import { SPACE_QUERY, UPDATE_SPACE } from "./queries";
import Loader from "../../Loader";
import Head from "./Head";
import { ContentContainer, IngressContainer } from "../../../styles/layout";
import FormErrorSummary from "../../../common/FormErrorSummary";
import SpaceHierarchy from "./SpaceHierarchy";
import ParentSelector from "./ParentSelector";
import SpaceForm from "./SpaceForm";

type NotificationType = {
  title: string;
  text: string;
  type: "success" | "error";
};

type Action =
  | {
      type: "setNotification";
      notification: NotificationType;
    }
  | { type: "clearNotification" }
  | {
      type: "setValidationErrors";
      validationErrors: Joi.ValidationResult | null;
    }
  | { type: "clearError" }
  | { type: "dataLoaded"; space: SpaceType }
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
  validationErrors: Joi.ValidationResult | null;
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
  validationErrors: null,
});

const modified = (d: State) => ({ ...d, hasChanges: true });

const withLoadingState = (state: State): State => {
  return {
    ...state,
    loading: state.space === null,
  };
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
      return withLoadingState({
        ...state,
        space: {
          ...space,
        },
        spaceEdit: {
          ...pick(
            {
              ...space,
              pk: space.pk,
              maxPersons: Math.ceil(space.maxPersons || 0),
              surfaceArea: Math.ceil(space.surfaceArea || 0),
            },
            [
              "pk",
              "nameFi",
              "nameSv",
              "nameEn",
              "surfaceArea",
              "maxPersons",
              "code",
            ]
          ),
          parentPk: space.parent ? space.parent?.pk : null,
          unitPk: space.unit ? space.unit.pk : undefined,
        } as SpaceUpdateMutationInput,
        hasChanges: false,
        validationErrors: null,
      });
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

    case "setValidationErrors": {
      return {
        ...state,
        validationErrors: action.validationErrors,
      };
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
  margin: 0;
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const Editor = styled.div`
  margin: 0;
  max-width: 52rem;

  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
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

type Props = {
  space: number;
  unit: number;
};

const SpaceEditor = ({ space, unit }: Props): JSX.Element | null => {
  const [saving, setSaving] = useState(false);
  const history = useNavigate();

  const { notifyError, notifySuccess } = useNotification();

  const [state, dispatch] = useReducer(reducer, getInitialState(space, unit));
  const { t } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setValue = (value: any) => {
    dispatch({ type: "set", value });
  };

  const displayError = (text: string) => {
    dispatch({ type: "dataLoadError", message: text });
  };

  const [updateSpaceMutation] = useMutation<
    { updateSpace: SpaceUpdateMutationPayload },
    { input: SpaceUpdateMutationInput }
  >(UPDATE_SPACE);

  const updateSpace = (
    input: SpaceUpdateMutationInput
  ): Promise<FetchResult<{ updateSpace: SpaceUpdateMutationPayload }>> =>
    updateSpaceMutation({ variables: { input } });

  const { refetch } = useQuery<Query, QuerySpaceByPkArgs>(SPACE_QUERY, {
    variables: { pk: space },
    onCompleted: ({ spaceByPk }) => {
      if (spaceByPk) {
        dispatch({ type: "dataLoaded", space: spaceByPk });
      }
    },
    onError: (e) => {
      displayError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const onSave = async () => {
    setSaving(true);
    try {
      const data = await updateSpace({
        ...(omitBy(
          state.spaceEdit,
          (v) => v === ""
        ) as SpaceUpdateMutationInput),
        surfaceArea: Math.ceil(state.spaceEdit?.surfaceArea ?? 0),
      });
      if (data?.data?.updateSpace.errors === null) {
        notifySuccess(
          t("SpaceEditor.spaceUpdatedNotification"),
          undefined,
          t("SpaceEditor.spaceUpdated")
        );
        refetch();
      } else {
        notifyError(t("SpaceEditor.saveFailed"));
      }
    } catch {
      notifyError(t("SpaceEditor.saveFailed"));
    }
    setSaving(false);
  };

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

  if (state.space === null) {
    return null;
  }

  const getValidationError = (name: string): string | undefined => {
    const error = state.validationErrors?.error?.details.find((errorDetail) =>
      errorDetail.path.find((path) => path === name)
    );

    if (!error) {
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error: TODO: Joi should be deprecated so ignore this for now
    return t(`validation.${error.type}`, { ...error.context });
  };

  return (
    <Wrapper>
      <Head
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
          <H1 $legacy>{t("SpaceEditor.details")}</H1>
          <Editor>
            <FormErrorSummary
              fieldNamePrefix="SpaceEditor.label."
              validationErrors={state.validationErrors}
            />

            <Section>
              <SubHeading>{t("SpaceEditor.hierarchy")}</SubHeading>
              <SpaceHierarchy
                space={state.space}
                unitSpaces={state.unitSpaces}
              />
              <ParentSelector
                helperText={t("SpaceModal.page1.parentHelperText")}
                label={t("SpaceModal.page1.parentLabel")}
                onChange={(parentPk) => setValue({ parentPk })}
                parentPk={state.spaceEdit?.parentPk as number}
                spacePk={space}
                placeholder={t("SpaceModal.page1.parentPlaceholder")}
                unitPk={unit}
              />
            </Section>
            <Section>
              <SubHeading>{t("SpaceEditor.other")}</SubHeading>
              <SpaceForm
                data={state.spaceEdit}
                setValue={setValue}
                getValidationError={getValidationError}
              />
            </Section>
            <Buttons>
              <Button
                disabled={!state.hasChanges}
                variant="secondary"
                onClick={() => history(-1)}
              >
                {t("SpaceEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!state.hasChanges}
                onClick={(e) => {
                  e.preventDefault();
                  const validationErrors = schema.validate(state.spaceEdit);
                  if (validationErrors.error) {
                    dispatch({ type: "setValidationErrors", validationErrors });
                  } else {
                    onSave();
                  }
                }}
                isLoading={saving}
                loadingText={t("saving")}
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

export default memo(SpaceEditor, (prevProps, nextProps) => {
  return isEqual(prevProps, nextProps);
});
