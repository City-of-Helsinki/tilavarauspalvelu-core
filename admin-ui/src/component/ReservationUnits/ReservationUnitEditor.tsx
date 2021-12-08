import { useMutation, useQuery } from "@apollo/client";
import {
  Accordion,
  Button as HDSButton,
  Checkbox,
  Combobox,
  Link,
  Notification,
  NumberInput,
  RadioButton,
  Select,
  SelectionGroup,
  TextInput,
  TimeInput,
} from "hds-react";
import i18next from "i18next";
import { get, isNull, omitBy, pick, sumBy, upperFirst } from "lodash";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { languages, previewUrlPrefix } from "../../common/const";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitByPkArgs,
  ReservationUnitByPkType,
  ReservationUnitCreateMutationInput,
  ReservationUnitUpdateMutationInput,
  ResourceType,
  SpaceType,
  UnitByPkType,
  Mutation,
  ErrorType,
  Maybe,
  TermsOfUseTermsOfUseTermsTypeChoices,
  ReservationUnitsReservationUnitPriceUnitChoices,
} from "../../common/gql-types";
import {
  CREATE_RESERVATION_UNIT,
  RESERVATION_UNIT_EDITOR_PARAMETERS,
  RESERVATIONUNIT_QUERY,
  UNIT_WITH_SPACES_AND_RESOURCES,
  UPDATE_RESERVATION_UNIT,
} from "../../common/queries";
import { OptionType } from "../../common/types";
import { ContentContainer, IngressContainer } from "../../styles/layout";

import { breakpoints } from "../../styles/util";
import Loader from "../Loader";
import SubPageHead from "../Unit/SubPageHead";
import { MainMenuWrapper } from "../withMainMenu";
import RichTextInput from "../RichTextInput";
import { useNotification } from "../../context/NotificationContext";
import ActivationGroup from "./ActivationGroup";
import { assertApiAccessTokenIsAvailable } from "../../common/auth/util";
import EnumSelect from "./EnumSelect";

interface IProps {
  reservationUnitPk?: string;
  unitPk: string;
}

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
  | { type: "clearError" }
  | { type: "dataLoaded"; reservationUnit: ReservationUnitByPkType }
  | { type: "unitLoaded"; unit: UnitByPkType }
  | { type: "editNew"; unitPk: number }
  | { type: "dataInitializationError"; message: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: "set"; value: any }
  | { type: "setSpaces"; spaces: OptionType[] }
  | { type: "setResources"; resources: OptionType[] }
  | { type: "setEquipments"; equipments: OptionType[] }
  | { type: "setPurposes"; purposes: OptionType[] }
  | { type: "parametersLoaded"; parameters: Query };

type ReservationUnitEditorType =
  | ReservationUnitUpdateMutationInput
  | ReservationUnitCreateMutationInput;

type State = {
  reservationUnitPk?: number;
  loading: boolean;
  reservationUnit: ReservationUnitByPkType | null;
  reservationUnitEdit: Partial<ReservationUnitEditorType>;
  hasChanges: boolean;
  error?: {
    message: string;
  };
  spaces: SpaceType[];
  resources: ResourceType[];
  spaceOptions: OptionType[];
  resourceOptions: OptionType[];
  equipmentOptions: OptionType[];
  purposeOptions: OptionType[];
  reservationUnitTypeOptions: OptionType[];
  paymentTermsOptions: OptionType[];
  cancellationTermsOptions: OptionType[];
  serviceSpecificTermsOptions: OptionType[];
  cancellationRuleOptions: OptionType[];
  unit?: UnitByPkType;
};

const makeOption = (e: { pk: number; nameFi: string }) => ({
  label: String(e.nameFi),
  value: e.pk,
});

const makeTermsOptions = (
  action: {
    type: "parametersLoaded";
    parameters: Query;
  },
  termsType: TermsOfUseTermsOfUseTermsTypeChoices
): OptionType[] => {
  return (action.parameters.termsOfUse?.edges || [])
    .filter((tou) => {
      return termsType === tou?.node?.termsType;
    })
    .map((e) =>
      makeOption({
        pk: get(e, "node.pk", -1),
        nameFi: get(e, "node.nameFi", "no-name"),
      })
    );
};

const getInitialState = (reservationUnitPk: number): State => ({
  reservationUnitPk,
  loading: true,
  reservationUnit: null,
  reservationUnitEdit: {},
  hasChanges: false,
  resources: [],
  spaces: [],
  spaceOptions: [],
  equipmentOptions: [],
  resourceOptions: [],
  purposeOptions: [],
  reservationUnitTypeOptions: [],
  paymentTermsOptions: [],
  cancellationTermsOptions: [],
  serviceSpecificTermsOptions: [],
  cancellationRuleOptions: [],
});

const withLoadingStatus = (state: State): State => {
  const hasError = state.error;

  const newLoadingStatus =
    !hasError &&
    (state.spaceOptions.length === 0 ||
      (state.reservationUnitPk && !get(state, "reservationUnitEdit.pk")) ||
      state.equipmentOptions.length === 0 ||
      state.paymentTermsOptions.length === 0 ||
      state.purposeOptions.length === 0);

  return {
    ...state,
    loading: newLoadingStatus,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modifyEditorState = (state: State, edit: any) => ({
  ...state,
  reservationUnitEdit: { ...state.reservationUnitEdit, ...edit },
  hasChanges: true,
});

const i18nFields = (baseName: string): string[] =>
  languages.map((l) => baseName + upperFirst(l));

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "dataLoaded": {
      const { reservationUnit } = action;
      return withLoadingStatus({
        ...state,
        reservationUnit: {
          ...reservationUnit,
        },
        reservationUnitEdit: {
          ...(pick(reservationUnit, [
            "pk",
            "unitPk",
            "requireIntroduction",
            "surfaceArea",
            "maxPersons",
            "maxReservationDuration",
            "minReservationDuration",
            "requireIntroduction",
            "priceUnit",
            ...i18nFields("name"),
            ...i18nFields("description"),
            ...i18nFields("termsOfUse"),
            ...i18nFields("additionalInstructions"),
          ]) as ReservationUnitEditorType),
          spacePks: reservationUnit?.spaces?.map((s) =>
            Number(s?.pk)
          ) as number[],
          resourcePks: reservationUnit?.resources?.map((s) =>
            Number(s?.pk)
          ) as number[],
          equipmentPks: reservationUnit?.equipment?.map((s) =>
            Number(s?.pk)
          ) as number[],
          purposePks: reservationUnit?.purposes?.map((s) =>
            Number(s?.pk)
          ) as number[],
          paymentTermsPk: get(reservationUnit, "paymentTerms.pk"),
          reservationUnitTypePk: get(reservationUnit, "reservationUnitType.pk"),
          cancellationTermsPk: get(reservationUnit, "cancellationTerms.pk"),
          cancellationRulePk: get(reservationUnit, "cancellationRule.pk"),
          lowestPrice: Number(reservationUnit.lowestPrice || 0),
          highestPrice: Number(reservationUnit.highestPrice || 0),
          serviceSpecificTermsPk: get(
            reservationUnit,
            "serviceSpecificTerms.pk"
          ),
        },
        hasChanges: false,
      });
    }
    case "unitLoaded": {
      const { unit } = action;

      let errorKey: string | undefined;

      const spaceOptions =
        unit?.spaces?.map((s) => ({
          label: String(s?.nameFi),
          value: Number(s?.pk),
        })) || [];

      if (spaceOptions.length === 0) {
        errorKey = "ReservationUnitEditor.errorNoSpaces";
      }

      const resourceOptions =
        unit?.spaces
          ?.flatMap((s) => s?.resources)
          .map((r) => ({ label: String(r?.nameFi), value: Number(r?.pk) })) ||
        [];

      return withLoadingStatus({
        ...state,
        spaces: unit.spaces as SpaceType[],
        reservationUnitEdit: {
          ...state.reservationUnitEdit,
          unitPk: unit.pk as number,
        },
        resources:
          ((unit?.spaces &&
            unit.spaces.flatMap((s) => s?.resources)) as ResourceType[]) || [],
        spaceOptions,
        unit,
        resourceOptions,
        error: errorKey ? { message: i18next.t(errorKey) } : state.error,
      });
    }

    case "parametersLoaded": {
      return withLoadingStatus({
        ...state,
        equipmentOptions: (action.parameters.equipments?.edges || []).map((e) =>
          makeOption({
            pk: get(e, "node.pk", -1),
            nameFi: get(e, "node.nameFi", "no-name"),
          })
        ),
        purposeOptions: (action.parameters.purposes?.edges || []).map((e) =>
          makeOption({
            pk: get(e, "node.pk", -1),
            nameFi: get(e, "node.nameFi", "no-name"),
          })
        ),
        reservationUnitTypeOptions: (
          action.parameters.reservationUnitTypes?.edges || []
        ).map((e) =>
          makeOption({
            pk: get(e, "node.pk", -1),
            nameFi: get(e, "node.nameFi", "no-name"),
          })
        ),
        paymentTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms
        ),
        serviceSpecificTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.ServiceTerms
        ),
        cancellationTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.CancellationTerms
        ),
        cancellationRuleOptions: (
          action.parameters.reservationUnitCancellationRules?.edges || []
        ).map((e) =>
          makeOption({
            pk: get(e, "node.pk", -1),
            nameFi: get(e, "node.nameFi", "no-name"),
          })
        ),
      });
    }

    case "editNew": {
      return withLoadingStatus({
        ...state,
        reservationUnitEdit: {
          unitPk: action.unitPk,
        },
        hasChanges: false,
      });
    }
    case "dataInitializationError": {
      return withLoadingStatus({
        ...state,
        loading: false,
        hasChanges: false,
        error: { message: action.message },
      });
    }
    case "clearError": {
      return {
        ...state,
        error: undefined,
      };
    }
    case "set": {
      return modifyEditorState(state, { ...action.value });
    }
    case "setSpaces": {
      const selectedSpacePks = action.spaces.map((ot) => ot.value as number);
      const selectedSpaces = state.spaces.filter(
        (s) => selectedSpacePks.indexOf(Number(s.pk)) !== -1
      );

      return modifyEditorState(state, {
        surfaceArea: sumBy(selectedSpaces, "surfaceArea"),
        maxPersons: sumBy(selectedSpaces, "maxPersons"),
        spacePks: selectedSpacePks,
      });
    }
    case "setResources": {
      return modifyEditorState(state, {
        resourcePks: action.resources.map((ot) => ot.value as number),
      });
    }
    case "setEquipments": {
      return modifyEditorState(state, {
        equipmentPks: action.equipments.map((ot) => ot.value as number),
      });
    }
    case "setPurposes": {
      return modifyEditorState(state, {
        purposePks: action.purposes.map((ot) => ot.value as number),
      });
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
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const EditorColumns = styled.div`
  display: block;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    display: grid;
  }
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const DenseEditorColumns = styled.div`
  display: block;
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
    display: grid;
  }
  @media (min-width: ${breakpoints.xl}) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    display: grid;
  }
  align-items: baseline;
  gap: 1em;
  margin-top: var(--spacing-s);
  padding-bottom: var(--spacing-m);
`;

const Editor = styled.div`
  @media (min-width: ${breakpoints.m}) {
    margin: 0 var(--spacing-layout-m);
  }
  max-width: 52rem;
`;

const Section = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const Buttons = styled.div`
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  padding: var(--spacing-xl);
  background-color: var(--color-bus-dark);
  z-index: 1000;
`;

const StyledButton = styled(HDSButton)<{
  disabled: boolean;
  variant: "secondary" | "primary";
}>`
   {
    --bg: var(--color-white);
    --fg: var(--color-black);
    --hbg: var(--fg);
    --hfg: var(--bg);
    --border-color: var(--color-white);
  }

  ${({ variant }) =>
    variant === "secondary"
      ? `{
    --fg: var(--color-white);
    --bg: var(--color-bus-dark);

  }`
      : null}

  ${({ disabled }) =>
    disabled
      ? `{
        --hbg: var(--bg);
        --hfg: var(--fg);
      }`
      : null}


  border: 2px var(--border-color) solid !important;

  color: var(--fg) !important;
  background-color: var(--bg) !important;

  &:hover {
    color: var(--hfg) !important;
    background-color: var(--hbg) !important;
  }
  margin-left: auto;
  margin-right: var(--spacing-l);
`;

const PublisingTime = styled.div`
  flex-grow: 1;
  color: var(--color-white);
  display: flex;
  justify-content: right;
  align-items: center;
  flex-direction: row;
  padding-right: var(--spacing-m);
  text-align: end;
  line-height: 1.3;
`;

const Preview = styled.a<{ $disabled: boolean }>`
  margin-left: auto;
  padding: var(--spacing-m);
  border-color: var(--color-white) !important;
  border: 2px solid;
  background-color: var(--color-bus-dark);
  text-decoration: none;
  &:hover {
    background-color: var(--color-bus-dark);
  }
  ${({ $disabled }) =>
    $disabled
      ? `
    cursor: not-allowed;
    color: var(--color-white);
    &:hover {
      background-color: var(--color-bus-dark);
      }  `
      : `
      color: var(--color-white);
    cursor: pointer;
    &:hover {
      background-color: var(--color-white);
      color: var(--color-black);
      }

  `}
`;

const TextInputWithPadding = styled(TextInput)`
  padding-bottom: var(--spacing-m);
`;

const SelectWithPadding = styled(Select)`
  padding-bottom: var(--spacing-m);
`;

const getSelectedOptions = (
  state: State,
  optionsPropertyName: string,
  valuePropName: string
): OptionType[] => {
  const fullPropName = `reservationUnitEdit.${valuePropName}`;
  const options = get(state, optionsPropertyName);

  if (!options || !get(state, fullPropName)) {
    return [];
  }
  return (
    get(state, fullPropName)
      // eslint-disable-next-line
      .map((optionPk: any) => options.find((so: any) => so.value === optionPk))
      .filter(Boolean) as OptionType[]
  );
};

const getSelectedOption = (
  state: State,
  optionsPropertyName: string,
  valuePropName: string
): OptionType => {
  const fullPropName = `reservationUnitEdit.${valuePropName}`;
  const propValue = get(state, fullPropName);
  const options = get(state, optionsPropertyName);
  return options.find((o: OptionType) => o.value === propValue);
};

const getDuration = (duration: Maybe<string> | undefined): string => {
  if (!duration) {
    return "00:00";
  }

  const parts = duration.split(":");
  if (parts.length === 3) {
    return duration.substring(0, 5);
  }

  return duration;
};

const hasTranslations = (prefixes: string[], state: State): boolean =>
  prefixes.every((p) =>
    ["fi", "sv", "en"].every((l) =>
      get(state, `reservationUnitEdit.${p}${upperFirst(l)}`)
    )
  );

const ReservationUnitEditor = (): JSX.Element | null => {
  const { reservationUnitPk, unitPk } = useParams<IProps>();
  const { t } = useTranslation();
  const history = useHistory();
  const { notification, setNotification } = useNotification();

  const [state, dispatch] = useReducer(
    reducer,
    getInitialState(Number(reservationUnitPk))
  );

  const onDataError = (text: string) => {
    dispatch({
      type: "dataInitializationError",
      message: text || t("ReservationUnitEditor.dataLoadFailedMessage"),
    });
  };

  const onSave = (text?: string) =>
    setNotification({
      type: "success",
      title: text || t("ReservationUnitEditor.reservationUnitUpdated"),
      message: t("ReservationUnitEditor.reservationUnitUpdatedNotification"),
    });

  const [updateReservationUnitMutation] = useMutation<Mutation>(
    UPDATE_RESERVATION_UNIT
  );

  const updateReservationUnit = (input: ReservationUnitUpdateMutationInput) =>
    updateReservationUnitMutation({ variables: { input } });

  const [createReservationUnitMutation] = useMutation<Mutation>(
    CREATE_RESERVATION_UNIT
  );

  const createReservationUnit = (input: ReservationUnitCreateMutationInput) =>
    createReservationUnitMutation({ variables: { input } });

  const createOrUpdateReservationUnit = async (publish: boolean) => {
    const input = pick(
      {
        ...omitBy(state.reservationUnitEdit, isNull),
        surfaceArea: Number(state.reservationUnitEdit?.surfaceArea),
        isDraft: !publish,
        cancellationRulePk: state.reservationUnitEdit?.cancellationRulePk,
      },
      [
        "isDraft",
        "pk",
        "unitPk",
        "spacePks",
        "purposePks",
        "resourcePks",
        "equipmentPks",
        "surfaceArea",
        "maxPersons",
        "maxReservationDuration",
        "minReservationDuration",
        "requireIntroduction",
        "purposePks",
        "reservationUnitTypePk",
        "paymentTermsPk",
        "cancellationTermsPk",
        "serviceSpecificTermsPk",
        "cancellationRulePk",
        "lowestPrice",
        "highestPrice",
        "priceUnit",
        ...i18nFields("name"),
        ...i18nFields("description"),
        ...i18nFields("termsOfUse"),
        ...i18nFields("additionalInstructions"),
      ]
    );

    let errors: Maybe<Maybe<ErrorType>[]> | undefined;

    try {
      if (state.reservationUnitPk) {
        const res = await updateReservationUnit(
          input as ReservationUnitUpdateMutationInput
        );
        errors = res.data?.updateReservationUnit?.errors;
      } else {
        const res = await createReservationUnit(
          input as ReservationUnitCreateMutationInput
        );

        errors = res.data?.createReservationUnit?.errors;

        if (res.data?.createReservationUnit?.errors === null) {
          onSave(t("ReservationUnitEditor.saved"));
          // todo notification
          history.replace(
            `/unit/${unitPk}/reservationUnit/edit/${res.data.createReservationUnit.pk}`
          );
        }
      }
      if (errors === null) {
        onSave(t("ReservationUnitEditor.saved"));
      } else {
        const firstError = errors ? errors.find(() => true) : undefined;
        const errorMessage = firstError
          ? `${firstError.field} -${firstError.messages.find(() => true)}`
          : "";

        const errorTxt = t("ReservationUnitEditor.saveFailed", {
          error: errorMessage,
        });

        onDataError(errorTxt);
      }
    } catch (error) {
      onDataError(t("ReservationUnitEditor.saveFailed", { error }));
    }
  };

  useEffect(() => {
    assertApiAccessTokenIsAvailable().then((keyUpdated) => {
      if (keyUpdated) {
        history.go(0);
      }
    });
    // eslint-disable-next-line
  }, []);

  useQuery<Query, QueryReservationUnitByPkArgs>(RESERVATIONUNIT_QUERY, {
    variables: { pk: Number(reservationUnitPk) },
    skip: !reservationUnitPk,
    onCompleted: ({ reservationUnitByPk }) => {
      if (reservationUnitByPk) {
        dispatch({ type: "dataLoaded", reservationUnit: reservationUnitByPk });
      } else {
        onDataError(t("ReservationUnitEditor.reservationUnitNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery<Query, QueryUnitByPkArgs>(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { pk: Number(unitPk) },
    onCompleted: ({ unitByPk }) => {
      if (unitByPk) {
        dispatch({ type: "unitLoaded", unit: unitByPk });
      } else {
        onDataError(t("ReservationUnitEditor.unitNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useQuery<Query>(RESERVATION_UNIT_EDITOR_PARAMETERS, {
    onCompleted: (query) => {
      dispatch({ type: "parametersLoaded", parameters: query });
      if (
        !(
          query.equipments &&
          query.purposes &&
          query.termsOfUse &&
          query.reservationUnitCancellationRules?.edges.length
        )
      ) {
        setNotification({
          type: "error",
          title: t("ReservationUnitEditor.errorParamsNotAvailable"),
          message: t("ReservationUnitEditor.errorParamsNotAvailable"),
        });
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  useEffect(() => {
    if (!reservationUnitPk) {
      dispatch({ type: "editNew", unitPk: Number(unitPk) });
    }
  }, [reservationUnitPk, unitPk]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setValue = (value: any) => {
    dispatch({ type: "set", value });
  };

  if (state.loading) {
    return <Loader />;
  }

  if (state.error && !state.reservationUnit) {
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

  const isReadyToPublish = hasTranslations(
    ["description", "name", "additionalInstructions"],
    state
  );

  if (state.error) {
    return (
      <Wrapper>
        <Notification
          type="error"
          label={t("ReservationUnitEditor.errorDataHeading")}
          position="top-center"
        >
          {t(state.error?.message)}
        </Notification>
      </Wrapper>
    );
  }

  if (state.reservationUnitEdit === null) {
    return null;
  }

  return (
    <Wrapper>
      <MainMenuWrapper>
        <IngressContainer>
          {notification ? (
            <StyledNotification
              type={notification.type}
              label={notification.title}
              position="top-center"
              dismissible
              closeButtonLabelText={`${t("common.close")}`}
              onClose={() => dispatch({ type: "clearNotification" })}
            >
              {notification.message}
            </StyledNotification>
          ) : null}
        </IngressContainer>
        <ContentContainer>
          {state.unit ? (
            <SubPageHead
              unit={state.unit}
              title={
                state.reservationUnitEdit.nameFi ||
                t("ReservationUnitEditor.defaultHeading")
              }
            />
          ) : null}
          <EditorContainer>
            <Editor>
              <Accordion
                initiallyOpen
                heading={t("ReservationUnitEditor.basicInformation")}
              >
                <Section>
                  {languages.map((lang) => (
                    <TextInputWithPadding
                      key={lang}
                      required
                      id={`name${lang}`}
                      label={t("ReservationUnitEditor.nameLabel", {
                        lang,
                      })}
                      value={get(
                        state,
                        `reservationUnitEdit.name${upperFirst(lang)}`,
                        ""
                      )}
                      onChange={(e) =>
                        setValue({
                          [`name${upperFirst(lang)}`]: e.target.value,
                        })
                      }
                    />
                  ))}
                  <EditorColumns>
                    <Combobox
                      multiselect
                      required
                      label={t("ReservationUnitEditor.spacesLabel")}
                      placeholder={t("ReservationUnitEditor.spacesPlaceholder")}
                      options={state.spaceOptions}
                      clearButtonAriaLabel={t("common.clearAllSelections")}
                      selectedItemRemoveButtonAriaLabel={t(
                        "common.removeValue"
                      )}
                      toggleButtonAriaLabel={t("common.toggleMenu")}
                      onChange={(spaces) =>
                        dispatch({ type: "setSpaces", spaces })
                      }
                      disabled={state.spaceOptions.length === 0}
                      value={[
                        ...getSelectedOptions(
                          state,
                          "spaceOptions",
                          "spacePks"
                        ),
                      ]}
                    />
                    <Combobox
                      multiselect
                      label={t("ReservationUnitEditor.resourcesLabel")}
                      placeholder={t(
                        "ReservationUnitEditor.resourcesPlaceholder"
                      )}
                      options={state.resourceOptions}
                      clearButtonAriaLabel={t("common.clearAllSelections")}
                      selectedItemRemoveButtonAriaLabel={t(
                        "common.removeValue"
                      )}
                      toggleButtonAriaLabel={t("common.toggleMenu")}
                      onChange={(resources) =>
                        dispatch({ type: "setResources", resources })
                      }
                      disabled={state.resourceOptions.length === 0}
                      value={[
                        ...getSelectedOptions(
                          state,
                          "resourceOptions",
                          "resourcePks"
                        ),
                      ]}
                    />
                  </EditorColumns>
                  <Checkbox
                    id="requireIntroduction"
                    label={t("ReservationUnitEditor.requireIntroductionLabel")}
                    checked={
                      state.reservationUnitEdit.requireIntroduction === true
                    }
                    onClick={() =>
                      setValue({
                        requireIntroduction:
                          !state.reservationUnitEdit?.requireIntroduction,
                      })
                    }
                  />
                  <EditorColumns>
                    <NumberInput
                      value={state.reservationUnitEdit.surfaceArea || 0}
                      id="surfaceArea"
                      label={t("ReservationUnitEditor.surfaceAreaLabel")}
                      helperText={t(
                        "ReservationUnitEditor.surfaceAreaHelperText"
                      )}
                      minusStepButtonAriaLabel={t(
                        "common.decreaseByOneAriaLabel"
                      )}
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
                      onChange={(e) => {
                        setValue({
                          surfaceArea: Number(e.target.value),
                        });
                      }}
                      step={1}
                      type="number"
                      min={1}
                      required
                    />
                    <NumberInput
                      value={state.reservationUnitEdit.maxPersons || 0}
                      id="maxPersons"
                      label={t("ReservationUnitEditor.maxPersonsLabel")}
                      minusStepButtonAriaLabel={t(
                        "common.decreaseByOneAriaLabel"
                      )}
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
                      onChange={(e) => {
                        setValue({
                          maxPersons: Number(e.target.value),
                        });
                      }}
                      step={1}
                      type="number"
                      min={1}
                      helperText={t(
                        "ReservationUnitEditor.maxPersonsHelperText"
                      )}
                      required
                    />
                  </EditorColumns>
                </Section>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.typesProperties")}>
                <EditorColumns>
                  <SelectWithPadding
                    label={t(`ReservationUnitEditor.reservationUnitTypeLabel`)}
                    placeholder={t(
                      `ReservationUnitEditor.reservationUnitTypePlaceholder`
                    )}
                    options={state.reservationUnitTypeOptions}
                    onChange={(selectedTerms: unknown) => {
                      const o = selectedTerms as OptionType;
                      setValue({
                        [`reservationUnitTypePk`]: o.value,
                      });
                    }}
                    disabled={state.reservationUnitTypeOptions.length === 0}
                    helper={t(
                      `ReservationUnitEditor.reservationUnitTypeHelperText`
                    )}
                    value={
                      getSelectedOption(
                        state,
                        `reservationUnitTypeOptions`,
                        `reservationUnitTypePk`
                      ) || {}
                    }
                  />
                  <Combobox
                    multiselect
                    label={t("ReservationUnitEditor.purposesLabel")}
                    placeholder={t("ReservationUnitEditor.purposesPlaceholder")}
                    options={state.purposeOptions}
                    clearButtonAriaLabel={t("common.clearAllSelections")}
                    selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                    toggleButtonAriaLabel={t("common.toggleMenu")}
                    onChange={(purposes) =>
                      dispatch({ type: "setPurposes", purposes })
                    }
                    disabled={state.resourceOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "purposeOptions",
                        "purposePks"
                      ),
                    ]}
                  />

                  <Combobox
                    multiselect
                    label={t("ReservationUnitEditor.equipmentsLabel")}
                    placeholder={t(
                      "ReservationUnitEditor.equipmentsPlaceholder"
                    )}
                    options={state.equipmentOptions}
                    clearButtonAriaLabel={t("common.clearAllSelections")}
                    selectedItemRemoveButtonAriaLabel={t("common.removeValue")}
                    toggleButtonAriaLabel={t("common.toggleMenu")}
                    onChange={(equipments) =>
                      dispatch({ type: "setEquipments", equipments })
                    }
                    disabled={state.equipmentOptions.length === 0}
                    value={[
                      ...getSelectedOptions(
                        state,
                        "equipmentOptions",
                        "equipmentPks"
                      ),
                    ]}
                  />
                </EditorColumns>
                <EditorColumns>
                  <TimeInput
                    id="minReservationDuration"
                    label={t(
                      "ReservationUnitEditor.minReservationDurationLabel"
                    )}
                    hoursLabel={t("common.hoursLabel")}
                    minutesLabel={t("common.minutesLabel")}
                    value={getDuration(
                      state.reservationUnitEdit.minReservationDuration
                    )}
                    onChange={(v) => {
                      if (
                        typeof v.target.value === "string" &&
                        v.target.value.length === 5
                      ) {
                        setValue({
                          minReservationDuration: `${v.target.value}:00`,
                        });
                      }
                    }}
                  />
                  <TimeInput
                    id="maxReservationDuration"
                    label={t(
                      "ReservationUnitEditor.maxReservationDurationLabel"
                    )}
                    hoursLabel={t("common.hoursLabel")}
                    minutesLabel={t("common.minutesLabel")}
                    value={getDuration(
                      state.reservationUnitEdit.maxReservationDuration
                    )}
                    onChange={(v) => {
                      if (
                        typeof v.target.value === "string" &&
                        v.target.value.length === 5
                      ) {
                        setValue({
                          maxReservationDuration: `${v.target.value}:00`,
                        });
                      }
                    }}
                  />
                </EditorColumns>
                {languages.map((lang) => (
                  <RichTextInput
                    key={lang}
                    required
                    id={`description.${lang}`}
                    label={t("ReservationUnitEditor.descriptionLabel", {
                      lang,
                    })}
                    value={
                      get(
                        state,
                        `reservationUnitEdit.description${upperFirst(lang)}`,
                        ""
                      ) || ""
                    }
                    onChange={(value) =>
                      setValue({
                        [`description${upperFirst(lang)}`]: value,
                      })
                    }
                  />
                ))}
              </Accordion>

              <Accordion heading={t("ReservationUnitEditor.settings")}>
                <ActivationGroup
                  id="cancellationIsPossible"
                  label={t("ReservationUnitEditor.cancellationIsPossible")}
                  initiallyOpen={Boolean(
                    state.reservationUnitEdit.cancellationRulePk
                  )}
                  onClose={() => setValue({ cancellationRulePk: null })}
                >
                  <SelectionGroup
                    required
                    label={t("ReservationUnitEditor.cancellationGroupLabel")}
                  >
                    {state.cancellationRuleOptions.map((o) => (
                      <RadioButton
                        key={o.value}
                        id={`cr-${o.value}`}
                        value={o.value as string}
                        label={o.label}
                        onChange={(e) =>
                          setValue({
                            cancellationRulePk: Number(e.target.value),
                          })
                        }
                        checked={
                          state.reservationUnitEdit.cancellationRulePk ===
                          o.value
                        }
                      />
                    ))}
                  </SelectionGroup>
                </ActivationGroup>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.pricing")}>
                <DenseEditorColumns>
                  <NumberInput
                    value={state.reservationUnitEdit.lowestPrice || 0}
                    id="lowestPrice"
                    label={t("ReservationUnitEditor.lowestPriceLabel")}
                    helperText={t(
                      "ReservationUnitEditor.lowestPriceHelperText"
                    )}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) => {
                      setValue({
                        lowestPrice: Number(e.target.value),
                        highestPrice: Math.max(
                          Number(e.target.value),
                          state.reservationUnitEdit.highestPrice || 0
                        ),
                      });
                    }}
                    step={1}
                    type="number"
                    min={0}
                  />
                  <NumberInput
                    value={state.reservationUnitEdit.highestPrice || 0}
                    id="highestPrice"
                    label={t("ReservationUnitEditor.highestPriceLabel")}
                    helperText={t(
                      "ReservationUnitEditor.highestPriceHelperText"
                    )}
                    minusStepButtonAriaLabel={t(
                      "common.decreaseByOneAriaLabel"
                    )}
                    plusStepButtonAriaLabel={t("common.increaseByOneAriaLabel")}
                    onChange={(e) => {
                      setValue({
                        highestPrice: Number(e.target.value),
                        lowestPrice: Math.min(
                          Number(e.target.value),
                          state.reservationUnitEdit.lowestPrice || 0
                        ),
                      });
                    }}
                    step={1}
                    type="number"
                    min={0}
                  />
                  <EnumSelect
                    id="priceUnit"
                    value={state.reservationUnitEdit.priceUnit as string}
                    label={t("ReservationUnitEditor.priceUnitLabel")}
                    type={ReservationUnitsReservationUnitPriceUnitChoices}
                    onChange={(priceUnit) => setValue({ priceUnit })}
                  />
                </DenseEditorColumns>
              </Accordion>

              <Accordion heading={t("ReservationUnitEditor.termsInstructions")}>
                {languages.map((lang) => (
                  <RichTextInput
                    key={lang}
                    required
                    id={`tos.${lang}`}
                    label={t("ReservationUnitEditor.tosLabel", {
                      lang,
                    })}
                    value={get(
                      state,
                      `reservationUnitEdit.termsOfUse${upperFirst(lang)}`,
                      ""
                    )}
                    onChange={(value) =>
                      setValue({
                        [`termsOfUse${upperFirst(lang)}`]: value,
                      })
                    }
                  />
                ))}
                {["payment", "cancellation", "serviceSpecific"].map((name) => {
                  const options = get(state, `${name}TermsOptions`);
                  return (
                    <SelectWithPadding
                      key={name}
                      label={t(`ReservationUnitEditor.${name}TermsLabel`)}
                      placeholder={t(
                        `ReservationUnitEditor.${name}TermsPlaceholder`
                      )}
                      options={options}
                      onChange={(selectedTerms: unknown) => {
                        const o = selectedTerms as OptionType;
                        setValue({
                          [`${name}TermsPk`]: o.value,
                        });
                      }}
                      disabled={options.length === 0}
                      helper={t(`ReservationUnitEditor.${name}TermsHelperText`)}
                      value={
                        getSelectedOption(
                          state,
                          `${name}TermsOptions`,
                          `${name}TermsPk`
                        ) || {}
                      }
                    />
                  );
                })}
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.communication")}>
                {languages.map((lang) => (
                  <TextInputWithPadding
                    key={lang}
                    required
                    id={`additionalInstructions.${lang}`}
                    label={t(
                      "ReservationUnitEditor.additionalInstructionsLabel",
                      {
                        lang,
                      }
                    )}
                    placeholder={t(
                      "ReservationUnitEditor.additionalInstructionsPlaceholder",
                      {
                        language: t(`language.${lang}`),
                      }
                    )}
                    value={get(
                      state,
                      `reservationUnitEdit.additionalInstructions${upperFirst(
                        lang
                      )}`,
                      ""
                    )}
                    onChange={(e) =>
                      setValue({
                        [`additionalInstructions${upperFirst(lang)}`]:
                          e.target.value,
                      })
                    }
                  />
                ))}
              </Accordion>

              <Accordion heading={t("ReservationUnitEditor.openingHours")}>
                {state.reservationUnit?.haukiUrl?.url ? (
                  <>
                    <p>
                      {t("ReservationUnitEditor.openingHoursHelperTextHasLink")}
                    </p>
                    <Link
                      href={state.reservationUnit?.haukiUrl?.url}
                      external
                      openInNewTab
                      size="M"
                      style={{ display: "block", width: "fit-content" }}
                    >
                      {t("ReservationUnitEditor.openingTimesExternalLink")}
                    </Link>
                  </>
                ) : (
                  <p>
                    {t("ReservationUnitEditor.openingHoursHelperTextNoLink")}
                  </p>
                )}
              </Accordion>
            </Editor>
          </EditorContainer>
        </ContentContainer>
      </MainMenuWrapper>
      <Buttons>
        <StyledButton
          disabled={false}
          variant="secondary"
          onClick={() => history.go(-1)}
        >
          {t("ReservationUnitEditor.cancel")}
        </StyledButton>
        <PublisingTime>
          Varausyksikkö julkaistaan
          <br /> TODO
        </PublisingTime>
        <StyledButton
          disabled={!state.hasChanges}
          variant="secondary"
          onClick={() => createOrUpdateReservationUnit(false)}
        >
          {t("ReservationUnitEditor.saveAsDraft")}
        </StyledButton>
        <StyledButton
          variant="primary"
          disabled={!isReadyToPublish}
          onClick={() => createOrUpdateReservationUnit(true)}
        >
          {t("ReservationUnitEditor.saveAndPublish")}
        </StyledButton>
        <Preview
          target="_blank"
          rel="noopener noreferrer"
          $disabled={state.hasChanges}
          href={`${previewUrlPrefix}/${state.reservationUnit?.pk}?ru=${state.reservationUnit?.uuid}`}
          onClick={(e) => state.hasChanges && e.preventDefault()}
          title={t(
            state.hasChanges
              ? "ReservationUnitEditor.noPreviewUnsavedChangesTooltip"
              : "ReservationUnitEditor.previewTooltip"
          )}
        >
          {t("ReservationUnitEditor.preview")}
        </Preview>
      </Buttons>
    </Wrapper>
  );
};

export default ReservationUnitEditor;
