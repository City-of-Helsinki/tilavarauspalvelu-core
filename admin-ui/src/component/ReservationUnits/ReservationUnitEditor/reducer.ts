import i18next from "i18next";
import { get, pick, sortBy, sumBy, uniq, upperFirst } from "lodash";
import { addDays, format } from "date-fns";
import { paymentTypes } from "common/types/common";
import { languages } from "../../../common/const";
import {
  Query,
  ReservationUnitImageType,
  ReservationUnitPricingCreateSerializerInput,
  ReservationUnitPricingUpdateSerializerInput,
  ReservationUnitsReservationUnitImageImageTypeChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ResourceType,
  SpaceType,
  TermsOfUseTermsOfUseTermsTypeChoices,
} from "../../../common/gql-types";
import { OptionType } from "../../../common/types";
import {
  Action,
  Image,
  LoadingCompleted,
  ReservationUnitEditorType,
  State,
} from "./types";

export const getInitialState = (reservationUnitPk: number): State => ({
  cancellationRuleOptions: [],
  cancellationTermsOptions: [],
  dataLoaded: [],
  equipmentOptions: [],
  hasChanges: false,
  loading: true,
  paymentTermsOptions: [],
  paymentTypeOptions: [],
  pricingTermsOptions: [],
  purposeOptions: [],
  qualifierOptions: [],
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
  images: [],
  validationErrors: null,
});

const sortImages = (imagesToSort: Image[]): Image[] => {
  imagesToSort.sort((a, b) => {
    if (
      a.imageType === ReservationUnitsReservationUnitImageImageTypeChoices.Main
    ) {
      return -1;
    }
    if (
      b.imageType === ReservationUnitsReservationUnitImageImageTypeChoices.Main
    ) {
      return 1;
    }
    return 0;
  });

  return imagesToSort;
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

export const i18nFields = (baseName: string): string[] =>
  languages.map((l) => baseName + upperFirst(l));

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

export const reducer = (state: State, action: Action): State => {
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
            "authentication",
            "bufferTimeAfter",
            "bufferTimeBefore",
            "maxReservationsPerUser",
            "maxPersons",
            "minPersons",
            "maxReservationDuration",
            "minReservationDuration",
            "pk",
            "priceUnit",
            "publishBegins",
            "publishEnds",
            "requireIntroduction",
            "requireReservationHandling",
            "reservationBegins",
            "reservationEnds",
            "reservationStartInterval",
            "unitPk",
            "canApplyFreeOfCharge",
            "reservationsMinDaysBefore",
            "reservationsMaxDaysBefore",
            "reservationKind",
            "contactInformation",
            ...i18nFields("reservationPendingInstructions"),
            ...i18nFields("reservationConfirmedInstructions"),
            ...i18nFields("reservationCancelledInstructions"),
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
          qualifierPks: reservationUnit?.qualifiers?.map((s) =>
            Number(s?.pk)
          ) as number[],
          paymentTermsPk: get(reservationUnit, "paymentTerms.pk"),
          paymentTypes: (reservationUnit.paymentTypes || []).map(
            (p) => p?.code as string
          ),
          pricings: sortBy(
            (reservationUnit.pricings || []).map(
              (pricing): ReservationUnitPricingUpdateSerializerInput => ({
                ...(pick(pricing, [
                  "begins",
                  "priceUnit",
                  "pricingType",
                  "status",
                  "pk",
                ]) as ReservationUnitPricingUpdateSerializerInput),
                taxPercentagePk: pricing?.taxPercentage.pk as number,
                highestPrice: Number(pricing?.highestPrice),
                lowestPrice: Number(pricing?.lowestPrice),
              })
            ),
            (i) =>
              i?.status ===
              ReservationUnitsReservationUnitPricingStatusChoices.Active
                ? -1
                : +1
          ),
          pricingTermsPk: get(reservationUnit, "pricingTerms.pk"),
          reservationUnitTypePk: get(reservationUnit, "reservationUnitType.pk"),
          cancellationTermsPk: get(reservationUnit, "cancellationTerms.pk"),
          cancellationRulePk: get(reservationUnit, "cancellationRule.pk"),
          serviceSpecificTermsPk: get(
            reservationUnit,
            "serviceSpecificTerms.pk"
          ),
          metadataSetPk: get(reservationUnit, "metadataSet.pk", null),
          pricingType: get(reservationUnit, "pricingType") || undefined, // update api does not allow null
          surfaceArea: Number(get(reservationUnit, "surfaceArea", 0)),
        },
        hasChanges: false,
        images: sortImages(
          (reservationUnit.images || []).map(
            (i): Image =>
              ({
                ...i,
                originalImageType: (i as ReservationUnitImageType).imageType,
              } as Image)
          )
        ),
      });
    }
    case "created": {
      return {
        ...state,
        reservationUnitPk: action.pk,
        reservationUnitEdit: { ...state.reservationUnitEdit, pk: action.pk },
      };
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
        qualifierOptions: (action.parameters.qualifiers?.edges || []).map(
          optionMaker
        ),
        reservationUnitTypeOptions: (
          action.parameters.reservationUnitTypes?.edges || []
        ).map(optionMaker),
        paymentTypeOptions: paymentTypes.map((value: string) => ({
          label: i18next.t(`paymentType.${value}`),
          value,
        })),
        paymentTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.PaymentTerms
        ),
        pricingTermsOptions: makeTermsOptions(
          action,
          TermsOfUseTermsOfUseTermsTypeChoices.PricingTerms
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
        metadataOptions: (action.parameters.metadataSets?.edges || []).map(
          (e) =>
            makeOption({
              pk: get(e, "node.pk", -1),
              nameFi: get(e, "node.name", "no-name"),
            })
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
    case "setImages": {
      return {
        ...state,
        images: sortImages(action.images),
        hasChanges: true,
      };
    }

    case "set": {
      return modifyEditorState(state, { ...action.value });
    }

    case "setMaxPersons": {
      return modifyEditorState(state, {
        maxPersons: action.maxPersons,
        minPersons: state.reservationUnitEdit.minPersons
          ? Math.min(action.maxPersons, state.reservationUnitEdit.minPersons)
          : undefined,
      });
    }
    case "setReservationsMaxDaysBefore": {
      return modifyEditorState(state, {
        reservationsMaxDaysBefore: action.reservationsMaxDaysBefore,
        reservationsMinDaysBefore: state.reservationUnitEdit
          .reservationsMinDaysBefore
          ? Math.min(
              action.reservationsMaxDaysBefore,
              state.reservationUnitEdit.reservationsMinDaysBefore
            )
          : 0,
      });
    }
    case "setSpaces": {
      const selectedSpacePks = action.spaces.map((ot) => ot.value as number);
      const selectedSpaces = state.spaces.filter(
        (s) => selectedSpacePks.indexOf(Number(s.pk)) !== -1
      );

      const surfaceArea = sumBy(
        selectedSpaces,
        (s) => Number(s.surfaceArea) || 1
      );
      const maxPersons = sumBy(
        selectedSpaces,
        (s) => Number(s.maxPersons) || 1
      );

      return modifyEditorState(state, {
        surfaceArea,
        maxPersons,
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
    case "setPaymentTypes": {
      return modifyEditorState(state, {
        paymentTypes: action.paymentTypes.map((ot) => ot.value as string),
      });
    }
    case "updatePricingType": {
      if (state.reservationUnitEdit.pricings?.length === 0) {
        return modifyEditorState(state, {
          pricings: [action.pricingType],
        });
      }

      return modifyEditorState(state, {
        pricings: (state.reservationUnitEdit.pricings || [])
          .map((pricingType) => {
            if (pricingType?.status === action.pricingType.status) {
              return action.pricingType;
            }
            return pricingType;
          })
          .concat(),
      });
    }

    case "setPurposes": {
      return modifyEditorState(state, {
        purposePks: action.purposes.map((ot) => ot.value as number),
      });
    }
    case "toggleFuturePrice": {
      const currentPricings = state.reservationUnitEdit.pricings || [];
      const hasFuturePrice = !!currentPricings.find(
        (p) => p?.status === "FUTURE"
      );
      return modifyEditorState(state, {
        pricings: hasFuturePrice
          ? (currentPricings || []).filter((p) => get(p, "status") !== "FUTURE")
          : currentPricings.concat({
              status: "FUTURE",
              begins: format(addDays(new Date(), 30), "yyyy-MM-dd"),
            } as ReservationUnitPricingCreateSerializerInput),
      });
    }
    case "setQualifiers": {
      return modifyEditorState(state, {
        qualifierPks: action.qualifiers.map((ot) => ot.value as number),
      });
    }
    case "setValidatioErrors": {
      return {
        ...state,
        validationErrors: action.validationErrors,
      };
    }

    default:
      return state;
  }
};
