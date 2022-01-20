import { useMutation, useQuery } from "@apollo/client";
import {
  Accordion as HDSAccordion,
  Checkbox,
  Combobox,
  Fieldset,
  Link,
  Notification,
  NumberInput,
  RadioButton,
  SelectionGroup,
  TextInput,
} from "hds-react";
import i18next from "i18next";
import { get, omitBy, pick, sumBy, uniq, upperFirst } from "lodash";
import React, { useEffect, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";
import styled from "styled-components";
import { languages, previewUrlPrefix } from "../../common/const";
import Select from "./Select";
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
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
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

import {
  breakpoints,
  ButtonsStripe,
  StyledNotification,
  WhiteButton,
} from "../../styles/util";
import Loader from "../Loader";
import SubPageHead from "../Unit/SubPageHead";
import { MainMenuWrapper } from "../withMainMenu";
import RichTextInput from "../RichTextInput";
import { useNotification } from "../../context/NotificationContext";
import ActivationGroup from "./ActivationGroup";
import EnumSelect from "./EnumSelect";
import ImageEditor from "./ImageEditor";
import DateTimeInput from "./DateTimeInput";
import { EditorColumns } from "./editorComponents";

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
  taxPercentageOptions: OptionType[];
  metadataOptions: OptionType[];
  unit?: UnitByPkType;
  dataLoaded: LoadingCompleted[];
};

const makeOption = (e: { pk: number; nameFi: string }) => ({
  label: String(e.nameFi),
  value: e.pk,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const optionMaker = (e: any) =>
  makeOption({
    pk: get(e, "node.pk", -1),
    nameFi: get(e, "node.nameFi", "no-name"),
  });

const makeTermsOptions = (
  action: {
    type: "parametersLoaded";
    parameters: Query;
  },
  termsType: TermsOfUseTermsOfUseTermsTypeChoices
): OptionType[] => {
  const options = (action.parameters.termsOfUse?.edges || [])
    .filter((tou) => {
      return termsType === tou?.node?.termsType;
    })
    .map(optionMaker);

  return [...options];
};

enum LoadingCompleted {
  "UNIT",
  "RESERVATION_UNIT",
  "PARAMS",
}

const bufferTimeOptions = [
  { value: "00:15:00", label: "15 minuuttia" },
  { value: "00:30:00", label: "30 minuuttia" },
  { value: "01:00:00", label: "60 minuuttia" },
  { value: "01:30:00", label: "90 minuuttia" },
];

const durationOptions = [
  { value: "00:15:00", label: "15 minuuttia" },
  { value: "00:30:00", label: "30 minuuttia" },
  { value: "01:00:00", label: "60 minuuttia" },
  { value: "01:30:00", label: "90 minuuttia" },
];

const nullOption: OptionType = {
  value: null,
  label: i18next.t("common.select"),
};

const getInitialState = (reservationUnitPk: number): State => ({
  cancellationRuleOptions: [],
  cancellationTermsOptions: [],
  dataLoaded: [],
  equipmentOptions: [],
  hasChanges: false,
  loading: true,
  paymentTermsOptions: [],
  purposeOptions: [],
  reservationUnit: null,
  reservationUnitEdit: {},
  reservationUnitPk,
  reservationUnitTypeOptions: [],
  resourceOptions: [],
  resources: [],
  serviceSpecificTermsOptions: [],
  spaceOptions: [],
  spaces: [],
  taxPercentageOptions: [],
  metadataOptions: [],
});

const withLoadingStatus = (
  type: LoadingCompleted | null,
  state: State
): State => {
  const newDataLoaded =
    type !== null ? uniq(state.dataLoaded.concat(type)) : state.dataLoaded;
  const hasError = Boolean(state.error);
  const isNew =
    state.reservationUnitPk === undefined ||
    Number.isNaN(state.reservationUnitPk);

  let newLoadingStatus = state.loading;

  if (hasError) {
    newLoadingStatus = false;
  }

  if (newDataLoaded.length === 3) {
    newLoadingStatus = false;
  }

  if (isNew && newDataLoaded.length === 2) {
    newLoadingStatus = false;
  }

  return {
    ...state,
    dataLoaded: newDataLoaded,
    loading: newLoadingStatus,
  };
};

const modifyEditorState = (
  state: State,
  edit: Partial<ReservationUnitEditorType>
) => ({
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
      return withLoadingStatus(LoadingCompleted.RESERVATION_UNIT, {
        ...state,
        reservationUnit: {
          ...reservationUnit,
        },
        reservationUnitEdit: {
          ...(pick(reservationUnit, [
            "bufferTimeAfter",
            "bufferTimeBefore",
            "maxReservationsPerUser",
            "maxPersons",
            "maxReservationDuration",
            "minReservationDuration",
            "pk",
            "priceUnit",
            "publishBegins",
            "publishEnds",
            "requireIntroduction",
            "reservationBegins",
            "reservationEnds",
            "reservationStartInterval",
            "surfaceArea",
            "unitPk",
            ...i18nFields("additionalInstructions"),
            ...i18nFields("description"),
            ...i18nFields("name"),
            ...i18nFields("termsOfUse"),
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
          taxPercentagePk: get(reservationUnit, "taxPercentage.pk"),
          lowestPrice: Number(reservationUnit.lowestPrice || 0),
          highestPrice: Number(reservationUnit.highestPrice || 0),
          serviceSpecificTermsPk: get(
            reservationUnit,
            "serviceSpecificTerms.pk"
          ),
          metadataSetPk: get(reservationUnit, "metadataSet.pk", null),
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

      return withLoadingStatus(LoadingCompleted.UNIT, {
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
      return withLoadingStatus(LoadingCompleted.PARAMS, {
        ...state,
        equipmentOptions: (action.parameters.equipments?.edges || []).map(
          optionMaker
        ),
        purposeOptions: (action.parameters.purposes?.edges || []).map(
          optionMaker
        ),
        reservationUnitTypeOptions: (
          action.parameters.reservationUnitTypes?.edges || []
        ).map(optionMaker),
        paymentTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms
        ),
        taxPercentageOptions: (
          action.parameters.taxPercentages?.edges || []
        ).map(
          (v) => ({ value: v?.node?.pk, label: v?.node?.value } as OptionType)
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
        ).map((e) => optionMaker(e)),
        metadataOptions: [nullOption].concat(
          (action.parameters.metadataSets?.edges || []).map((e) =>
            makeOption({
              pk: get(e, "node.pk", -1),
              nameFi: get(e, "node.name", "no-name"),
            })
          )
        ),
      });
    }

    case "editNew": {
      return withLoadingStatus(null, {
        ...state,
        reservationUnitEdit: {
          unitPk: action.unitPk,
        },
        hasChanges: false,
      });
    }
    case "dataInitializationError": {
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

const Accordion = styled(HDSAccordion)`
  > div:first-child {
    position: sticky;
    background: white;
    top: 0;
    z-index: 10;
  }
`;

const EditorContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
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

const PublishingTime = styled.div`
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
        ...omitBy(state.reservationUnitEdit, (v) => v === ""),
        surfaceArea: Number(state.reservationUnitEdit?.surfaceArea),
        isDraft: !publish,
        priceUnit: state.reservationUnitEdit?.priceUnit?.toLocaleLowerCase(), /// due to api inconsistency
        reservationStartInterval:
          state.reservationUnitEdit?.reservationStartInterval?.toLocaleLowerCase(), /// due to api inconsistency
        maxReservationsPerUser: state.reservationUnitEdit
          ?.maxReservationsPerUser
          ? Number(state.reservationUnitEdit?.maxReservationsPerUser)
          : undefined,
      },
      [
        "bufferTimeAfter",
        "bufferTimeBefore",
        "cancellationRulePk",
        "cancellationTermsPk",
        "equipmentPks",
        "highestPrice",
        "isDraft",
        "lowestPrice",
        "maxPersons",
        "maxReservationsPerUser",
        "metadataSetPk",
        "maxReservationDuration",
        "minReservationDuration",
        "paymentTermsPk",
        "pk",
        "priceUnit",
        "publishBegins",
        "publishEnds",
        "purposePks",
        "requireIntroduction",
        "reservationBegins",
        "reservationEnds",
        "reservationStartInterval",
        "reservationUnitTypePk",
        "resourcePks",
        "serviceSpecificTermsPk",
        "spacePks",
        "surfaceArea",
        "taxPercentagePk",
        "unitPk",
        ...i18nFields("additionalInstructions"),
        ...i18nFields("description"),
        ...i18nFields("name"),
        ...i18nFields("termsOfUse"),
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
                  <Select
                    id="reservationUnitType"
                    label={t(`ReservationUnitEditor.reservationUnitTypeLabel`)}
                    placeholder={t(
                      `ReservationUnitEditor.reservationUnitTypePlaceholder`
                    )}
                    options={state.reservationUnitTypeOptions}
                    onChange={(e) => {
                      setValue({
                        reservationUnitTypePk: e,
                      });
                    }}
                    helper={t(
                      `ReservationUnitEditor.reservationUnitTypeHelperText`
                    )}
                    value={Number(
                      get(state.reservationUnitEdit, "reservationUnitTypePk")
                    )}
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
                <ImageEditor
                  reservationUnitPk={Number(state.reservationUnitPk)}
                />
              </Accordion>

              <Accordion heading={t("ReservationUnitEditor.settings")}>
                <Fieldset
                  heading={t("ReservationUnitEditor.publishingSettings")}
                >
                  <ActivationGroup
                    id="useScheduledPublishing"
                    label={t("ReservationUnitEditor.scheduledPublishing")}
                    initiallyOpen={
                      Boolean(state.reservationUnitEdit.publishBegins) ||
                      Boolean(state.reservationUnitEdit.publishEnds)
                    }
                    onClose={() =>
                      setValue({ publishBegins: null, publishEnds: null })
                    }
                  >
                    <EditorColumns>
                      <ActivationGroup
                        id="publishBegins"
                        label={t("ReservationUnitEditor.publishBegins")}
                        initiallyOpen={Boolean(
                          state.reservationUnitEdit.publishBegins
                        )}
                        onClose={() => setValue({ publishBegins: null })}
                        noIndent
                      >
                        <DateTimeInput
                          value={state.reservationUnitEdit.publishBegins}
                          setValue={(v) =>
                            setValue({
                              publishBegins: v,
                            })
                          }
                        />
                      </ActivationGroup>
                      <ActivationGroup
                        id="publishEnds"
                        label={t("ReservationUnitEditor.publishEnds")}
                        initiallyOpen={Boolean(
                          state.reservationUnitEdit.publishEnds
                        )}
                        onClose={() => setValue({ publishEnds: null })}
                        noIndent
                      >
                        <DateTimeInput
                          value={state.reservationUnitEdit.publishEnds}
                          setValue={(v) =>
                            setValue({
                              publishEnds: v,
                            })
                          }
                        />
                      </ActivationGroup>
                    </EditorColumns>
                  </ActivationGroup>
                </Fieldset>
                <Fieldset
                  heading={t("ReservationUnitEditor.reservationSettings")}
                >
                  <ActivationGroup
                    id="useScheduledReservation"
                    label={t("ReservationUnitEditor.scheduledReservation")}
                    initiallyOpen={
                      Boolean(state.reservationUnitEdit.reservationBegins) ||
                      Boolean(state.reservationUnitEdit.reservationEnds)
                    }
                    onClose={() =>
                      setValue({
                        reservationBegins: null,
                        reservationEnds: null,
                      })
                    }
                  >
                    <EditorColumns>
                      <ActivationGroup
                        id="reservationBegins"
                        label={t("ReservationUnitEditor.reservationBegins")}
                        initiallyOpen={Boolean(
                          state.reservationUnitEdit.reservationBegins
                        )}
                        onClose={() => setValue({ reservationBegins: null })}
                        noIndent
                      >
                        <DateTimeInput
                          value={state.reservationUnitEdit.reservationBegins}
                          setValue={(v) =>
                            setValue({
                              reservationBegins: v,
                            })
                          }
                        />
                      </ActivationGroup>
                      <ActivationGroup
                        id="reservationEnds"
                        label={t("ReservationUnitEditor.publishEnds")}
                        initiallyOpen={Boolean(
                          state.reservationUnitEdit.reservationEnds
                        )}
                        onClose={() => setValue({ reservationEnds: null })}
                        noIndent
                      >
                        <DateTimeInput
                          value={state.reservationUnitEdit.reservationEnds}
                          setValue={(v) =>
                            setValue({
                              reservationEnds: v,
                            })
                          }
                        />
                      </ActivationGroup>
                    </EditorColumns>
                  </ActivationGroup>
                </Fieldset>
                <DenseEditorColumns>
                  <Select
                    id="minReservationDuration"
                    options={durationOptions}
                    placeholder={t("common.select")}
                    label={t(
                      "ReservationUnitEditor.minReservationDurationLabel"
                    )}
                    onChange={(v) => setValue({ minReservationDuration: v })}
                    value={
                      state.reservationUnitEdit.minReservationDuration || ""
                    }
                  />
                  <Select
                    id="maxReservationDuration"
                    placeholder={t("common.select")}
                    options={durationOptions}
                    label={t(
                      "ReservationUnitEditor.maxReservationDurationLabel"
                    )}
                    onChange={(v) => setValue({ maxReservationDuration: v })}
                    value={
                      state.reservationUnitEdit.maxReservationDuration || ""
                    }
                  />
                  <EnumSelect
                    id="reservationStartInterval"
                    placeholder={t("common.select")}
                    value={
                      state.reservationUnitEdit
                        .reservationStartInterval as string
                    }
                    label={t(
                      "ReservationUnitEditor.reservationStartIntervalLabel"
                    )}
                    type={
                      ReservationUnitsReservationUnitReservationStartIntervalChoices
                    }
                    onChange={(reservationStartInterval) =>
                      setValue({ reservationStartInterval })
                    }
                  />
                </DenseEditorColumns>
                <EditorColumns>
                  <ActivationGroup
                    id="bufferTimeBeforeGroup"
                    label={t("ReservationUnitEditor.bufferTimeBefore")}
                    initiallyOpen={Boolean(
                      state.reservationUnitEdit.bufferTimeBefore
                    )}
                    onClose={() => setValue({ bufferTimeBefore: null })}
                  >
                    <Select
                      id="bufferTimeBefore"
                      options={bufferTimeOptions}
                      label={t(
                        "ReservationUnitEditor.bufferTimeBeforeDuration"
                      )}
                      onChange={(v) => setValue({ bufferTimeBefore: v })}
                      value={state.reservationUnitEdit.bufferTimeBefore || ""}
                    />
                  </ActivationGroup>
                  <ActivationGroup
                    id="bufferTimeAfterGroup"
                    label={t("ReservationUnitEditor.bufferTimeAfter")}
                    initiallyOpen={Boolean(
                      state.reservationUnitEdit.bufferTimeAfter
                    )}
                    onClose={() => setValue({ bufferTimeAfter: null })}
                  >
                    <Select
                      id="bufferTimeAfter"
                      options={bufferTimeOptions}
                      label={t("ReservationUnitEditor.bufferTimeAfterDuration")}
                      onChange={(v) => setValue({ bufferTimeAfter: v })}
                      value={state.reservationUnitEdit.bufferTimeAfter || ""}
                    />
                  </ActivationGroup>
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
                </EditorColumns>
                <EditorColumns>
                  <Select
                    id="metadataSet"
                    options={state.metadataOptions}
                    label={t("ReservationUnitEditor.metadataSet")}
                    onChange={(v) => setValue({ metadataSetPk: v })}
                    value={state.reservationUnitEdit.metadataSetPk || null}
                  />
                  <NumberInput
                    id="maxReservationsPerUser"
                    label={t("ReservationUnitEditor.maxReservationsPerUser")}
                    min={1}
                    max={15}
                    value={
                      state.reservationUnitEdit.maxReservationsPerUser || ""
                    }
                    onChange={(e) =>
                      setValue({
                        maxReservationsPerUser: e.target.value,
                      })
                    }
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
                  <Select
                    id="taxPercentage"
                    label={t(`ReservationUnitEditor.taxPercentageLabel`)}
                    options={state.taxPercentageOptions}
                    onChange={(selectedVat) => {
                      setValue({
                        taxPercentagePk: selectedVat,
                      });
                    }}
                    value={
                      get(
                        state.reservationUnitEdit,
                        "taxPercentagePk"
                      ) as number
                    }
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
                <EditorColumns>
                  {["serviceSpecific", "payment", "cancellation"].map(
                    (name) => {
                      const options = get(state, `${name}TermsOptions`);
                      const propName = `${name}TermsPk`;
                      return (
                        <Select
                          id={name}
                          key={name}
                          label={t(`ReservationUnitEditor.${name}TermsLabel`)}
                          placeholder={t(
                            `ReservationUnitEditor.${name}TermsPlaceholder`
                          )}
                          options={options}
                          onChange={(selection) => {
                            setValue({
                              [propName]: selection,
                            });
                          }}
                          helper={t(
                            `ReservationUnitEditor.${name}TermsHelperText`
                          )}
                          value={get(state.reservationUnitEdit, propName)}
                        />
                      );
                    }
                  )}
                </EditorColumns>
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
      <ButtonsStripe>
        <WhiteButton
          disabled={false}
          variant="secondary"
          onClick={() => history.go(-1)}
        >
          {t("ReservationUnitEditor.cancel")}
        </WhiteButton>
        <PublishingTime>
          Varausyksikkö julkaistaan
          <br /> TODO
        </PublishingTime>
        <WhiteButton
          disabled={!state.hasChanges}
          variant="secondary"
          onClick={() => createOrUpdateReservationUnit(false)}
        >
          {t("ReservationUnitEditor.saveAsDraft")}
        </WhiteButton>
        <WhiteButton
          variant="primary"
          disabled={!isReadyToPublish}
          onClick={() => createOrUpdateReservationUnit(true)}
        >
          {t("ReservationUnitEditor.saveAndPublish")}
        </WhiteButton>
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
      </ButtonsStripe>
    </Wrapper>
  );
};

export default ReservationUnitEditor;
