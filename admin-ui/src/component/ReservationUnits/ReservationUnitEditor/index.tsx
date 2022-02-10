import { useMutation, useQuery } from "@apollo/client";
import {
  Accordion,
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
import { get, omitBy, pick, sumBy, upperFirst } from "lodash";
import React, { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useHistory } from "react-router-dom";

import { languages, previewUrlPrefix } from "../../../common/const";
import Select from "./Select";
import {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitByPkArgs,
  ReservationUnitCreateMutationInput,
  ReservationUnitUpdateMutationInput,
  Mutation,
  ErrorType,
  Maybe,
  ReservationUnitsReservationUnitPriceUnitChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
  ReservationUnitImageCreateMutationInput,
  ReservationUnitsReservationUnitAuthenticationChoices,
} from "../../../common/gql-types";
import {
  RESERVATION_UNIT_EDITOR_PARAMETERS,
  UNIT_WITH_SPACES_AND_RESOURCES,
} from "../../../common/queries";
import { OptionType } from "../../../common/types";
import { ContentContainer } from "../../../styles/layout";

import { ButtonsStripe, WhiteButton } from "../../../styles/util";
import Loader from "../../Loader";
import SubPageHead from "../../Unit/SubPageHead";
import { MainMenuWrapper } from "../../withMainMenu";
import RichTextInput from "../../RichTextInput";
import { useNotification } from "../../../context/NotificationContext";
import ActivationGroup from "./ActivationGroup";
import EnumSelect from "./EnumSelect";
import ImageEditor from "./ImageEditor";
import DateTimeInput from "./DateTimeInput";
import {
  ButtonsContainer,
  Dense,
  Editor,
  EditorContainer,
  EditorGrid,
  Normal,
  Preview,
  PublishingTime,
  Wide,
  Wrapper,
} from "./reservationUnitEditor";
import { IProps, ReservationUnitEditorType, State } from "./types";
import { getInitialState, i18nFields, reducer } from "./reducer";
import {
  CREATE_IMAGE,
  CREATE_RESERVATION_UNIT,
  DELETE_IMAGE,
  RESERVATIONUNIT_QUERY,
  UPDATE_IMAGE_TYPE,
  UPDATE_RESERVATION_UNIT,
} from "./queries";

const bufferTimeOptions = [
  { value: 900, label: "15 minuuttia" },
  { value: 1800, label: "30 minuuttia" },
  { value: 3600, label: "60 minuuttia" },
  { value: 5400, label: "90 minuuttia" },
];

const durationOptions = [
  { value: 900, label: "15 minuuttia" },
  { value: 1800, label: "30 minuuttia" },
  { value: 3600, label: "60 minuuttia" },
  { value: 5400, label: "90 minuuttia" },
];

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
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
  const history = useHistory();
  const { notifySuccess, notifyError } = useNotification();

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

  const createOrUpdateReservationUnit = async (
    reservationUnit: Partial<ReservationUnitEditorType>,
    publish: boolean
  ): Promise<number | undefined> => {
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
        "authentication",
        "bufferTimeAfter",
        "bufferTimeBefore",
        "highestPrice",
        "isDraft",
        "lowestPrice",
        "maxPersons",
        "maxReservationsPerUser",
        "metadataSetPk",
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
        "purposePks",
        "cancellationRulePk",
        "cancellationTermsPk",
        "equipmentPks",
        "paymentTermsPk",
        "reservationUnitTypePk",
        "resourcePks",
        "serviceSpecificTermsPk",
        "spacePks",
        "surfaceArea",
        "taxPercentagePk",
        "unitPk",
        "requireReservationHandling",
        ...i18nFields("additionalInstructions"),
        ...i18nFields("description"),
        ...i18nFields("name"),
        ...i18nFields("contactInformation"),
        ...i18nFields("termsOfUse"),
      ]
    );

    let errors: Maybe<Maybe<ErrorType>[]> | undefined;

    let resUnitPk: number | undefined = state.reservationUnitPk;
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
          resUnitPk = res.data.createReservationUnit.pk as number;
        }
      }
      if (errors === null) {
        return resUnitPk;
      }
      const firstError = errors ? errors.find(() => true) : undefined;
      const errorMessage = firstError
        ? `${firstError.field} -${firstError.messages.find(() => true)}`
        : "";

      onDataError(
        t("ReservationUnitEditor.saveFailed", {
          error: errorMessage,
        })
      );
    } catch (error) {
      onDataError(t("ReservationUnitEditor.saveFailed", { error }));
    }
    return undefined;
  };

  const { refetch: refetchReservationUnit } = useQuery<
    Query,
    QueryReservationUnitByPkArgs
  >(RESERVATIONUNIT_QUERY, {
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
        notifyError(t("ReservationUnitEditor.errorParamsNotAvailable"));
      }
    },
    onError: (e) => {
      onDataError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const [createImage] = useMutation<
    Mutation,
    ReservationUnitImageCreateMutationInput
  >(CREATE_IMAGE);

  const [delImage] = useMutation<Mutation>(DELETE_IMAGE);
  const [updateImagetype] = useMutation<Mutation>(UPDATE_IMAGE_TYPE);

  const reconcileImageChanges = async (resUnitPk: number): Promise<boolean> => {
    // delete deleted images
    try {
      const deletePromises = state.images
        .filter((image) => image.deleted)
        .map((image) =>
          delImage({
            variables: {
              pk: image.pk,
            },
          })
        );
      const res = await Promise.all(deletePromises);
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.deleteReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // create images
    try {
      const addPromises = state.images
        .filter((image) => (image.pk as number) < 0)
        .map((image) =>
          createImage({
            variables: {
              image: image.bytes,
              reservationUnitPk: resUnitPk,
              imageType: image.imageType as string,
            },
          })
        );

      const res = await Promise.all(addPromises);
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.createReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    // change imagetypes
    try {
      const changeTypePromises = state.images
        .filter((image) => !image.deleted)
        .filter((image) => image.pk && image.pk > 0)
        .filter((image) => image.imageType !== image.originalImageType)
        .map((image) => {
          return updateImagetype({
            variables: {
              pk: image.pk,
              imageType: image.imageType,
            },
          });
        });

      const res = await Promise.all(changeTypePromises);
      const hasErrors = Boolean(
        res
          .map(
            (singleRes) =>
              singleRes?.data?.updateReservationUnitImage?.errors?.length
          )
          .find((r) => r && r > 0)
      );
      if (hasErrors) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  };

  const saveReservationUnit = async (publish: boolean) => {
    setSaving(true);
    try {
      const resUnitPk = await createOrUpdateReservationUnit(
        state.reservationUnitEdit,
        publish
      );
      if (resUnitPk) {
        // res unit is saved, we can save changes to images
        const success = await reconcileImageChanges(resUnitPk);
        if (success) {
          refetchReservationUnit();
          if (!state.reservationUnitPk) {
            // create, redirect to edit
            history.replace(
              `/unit/${unitPk}/reservationUnit/edit/${resUnitPk}`
            );
          }
          notifySuccess(
            t("ReservationUnitEditor.saved"),
            t("ReservationUnitEditor.reservationUnitUpdatedNotification")
          );
        } else {
          notifyError("jokin meni pieleen");
        }
      }
    } catch (e) {
      // todo
    }
    setSaving(false);
  };

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
    [
      "description",
      "name",
      "additionalInstructions",
      "contactInformation",
      "termsOfUse",
    ],
    state
  );

  const { hasChanges } = state;

  console.log("rendering with", state);

  if (state.error) {
    return (
      <Wrapper>
        <Notification
          type="error"
          label={t("ReservationUnitEditor.errorDataHeading")}
          position="top-center"
          dismissible
          closeButtonLabelText={t("common.close")}
          onClose={() => dispatch({ type: "clearError" })}
        >
          {t(state.error?.message)}
        </Notification>
      </Wrapper>
    );
  }

  if (state.reservationUnitEdit === null) {
    return null;
  }

  const selectedSpaces = state.spaces.filter(
    (s) => state?.reservationUnitEdit?.spacePks?.indexOf(Number(s.pk)) !== -1
  );

  const minSurfaceArea =
    sumBy(selectedSpaces, (s) => Number(s.surfaceArea) || 0) || 1; // default is 1 if no spaces selected

  const maxPersons =
    sumBy(selectedSpaces, (s) => Number(s.maxPersons) || 0) || 20; // default is 20 is no spaces selected

  return (
    <Wrapper>
      <MainMenuWrapper>
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
                <EditorGrid>
                  {languages.map((lang) => (
                    <Wide>
                      <TextInput
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
                    </Wide>
                  ))}
                  <Normal>
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
                  </Normal>
                  <Normal>
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
                  </Normal>
                  <Dense>
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
                      min={minSurfaceArea}
                      required
                    />
                  </Dense>
                  <Dense>
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
                      max={maxPersons}
                      helperText={t(
                        "ReservationUnitEditor.maxPersonsHelperText"
                      )}
                      required
                    />
                  </Dense>
                </EditorGrid>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.typesProperties")}>
                <EditorGrid>
                  <Normal>
                    <Select
                      id="reservationUnitType"
                      label={t(
                        `ReservationUnitEditor.reservationUnitTypeLabel`
                      )}
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
                  </Normal>
                  <Normal>
                    <Combobox
                      multiselect
                      label={t("ReservationUnitEditor.purposesLabel")}
                      placeholder={t(
                        "ReservationUnitEditor.purposesPlaceholder"
                      )}
                      options={state.purposeOptions}
                      clearButtonAriaLabel={t("common.clearAllSelections")}
                      selectedItemRemoveButtonAriaLabel={t(
                        "common.removeValue"
                      )}
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
                  </Normal>
                  <Normal>
                    <Combobox
                      multiselect
                      label={t("ReservationUnitEditor.equipmentsLabel")}
                      placeholder={t(
                        "ReservationUnitEditor.equipmentsPlaceholder"
                      )}
                      options={state.equipmentOptions}
                      clearButtonAriaLabel={t("common.clearAllSelections")}
                      selectedItemRemoveButtonAriaLabel={t(
                        "common.removeValue"
                      )}
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
                  </Normal>
                  {languages.map((lang) => (
                    <Wide>
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
                            `reservationUnitEdit.description${upperFirst(
                              lang
                            )}`,
                            ""
                          ) || ""
                        }
                        onChange={(value) =>
                          setValue({
                            [`description${upperFirst(lang)}`]: value,
                          })
                        }
                      />
                    </Wide>
                  ))}
                  <Wide>
                    <ImageEditor
                      images={state.images}
                      setImages={(images) =>
                        dispatch({ type: "setImages", images })
                      }
                    />
                  </Wide>
                </EditorGrid>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.settings")}>
                <EditorGrid>
                  <Wide>
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
                          setValue({
                            publishBegins: null,
                            publishEnds: null,
                          })
                        }
                      >
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
                      </ActivationGroup>
                    </Fieldset>
                  </Wide>
                  <Wide>
                    <Fieldset
                      heading={t("ReservationUnitEditor.reservationSettings")}
                    >
                      <ActivationGroup
                        id="useScheduledReservation"
                        label={t("ReservationUnitEditor.scheduledReservation")}
                        initiallyOpen={
                          Boolean(
                            state.reservationUnitEdit.reservationBegins
                          ) ||
                          Boolean(state.reservationUnitEdit.reservationEnds)
                        }
                        onClose={() =>
                          setValue({
                            reservationBegins: null,
                            reservationEnds: null,
                          })
                        }
                      >
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
                      </ActivationGroup>
                    </Fieldset>
                  </Wide>
                  <Dense>
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
                  </Dense>
                  <Dense>
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
                  </Dense>
                  <Dense>
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
                  </Dense>
                  <Normal>
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
                  </Normal>
                  <Normal>
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
                        label={t(
                          "ReservationUnitEditor.bufferTimeAfterDuration"
                        )}
                        onChange={(v) => setValue({ bufferTimeAfter: v })}
                        value={state.reservationUnitEdit.bufferTimeAfter || ""}
                      />
                    </ActivationGroup>
                  </Normal>
                  <Wide>
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
                        label={t(
                          "ReservationUnitEditor.cancellationGroupLabel"
                        )}
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
                  </Wide>
                  <Normal>
                    <Select
                      id="metadataSet"
                      options={state.metadataOptions}
                      label={t("ReservationUnitEditor.metadataSet")}
                      onChange={(v) => setValue({ metadataSetPk: v })}
                      value={state.reservationUnitEdit.metadataSetPk || null}
                    />
                  </Normal>
                  <Normal>
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
                  </Normal>
                  <Wide>
                    <Checkbox
                      id="requireReservationHandling"
                      label={t(
                        "ReservationUnitEditor.requireReservationHandling"
                      )}
                      checked={
                        state.reservationUnitEdit.requireReservationHandling ===
                        true
                      }
                      onClick={() =>
                        setValue({
                          requireReservationHandling:
                            !state.reservationUnitEdit
                              ?.requireReservationHandling,
                        })
                      }
                    />
                  </Wide>
                  <Wide>
                    <EnumSelect
                      id="authentication"
                      value={state.reservationUnitEdit.authentication || "WEAK"}
                      label={t("ReservationUnitEditor.authenticationLabel")}
                      type={
                        ReservationUnitsReservationUnitAuthenticationChoices
                      }
                      onChange={(authentication) =>
                        setValue({ authentication })
                      }
                    />
                  </Wide>{" "}
                  <Wide>
                    <Checkbox
                      id="requireIntroduction"
                      label={t(
                        "ReservationUnitEditor.requireIntroductionLabel"
                      )}
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
                  </Wide>
                </EditorGrid>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.pricing")}>
                <EditorGrid>
                  <Dense>
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
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
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
                  </Dense>
                  <Dense>
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
                      plusStepButtonAriaLabel={t(
                        "common.increaseByOneAriaLabel"
                      )}
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
                  </Dense>
                  <Dense>
                    <EnumSelect
                      id="priceUnit"
                      value={state.reservationUnitEdit.priceUnit as string}
                      label={t("ReservationUnitEditor.priceUnitLabel")}
                      type={ReservationUnitsReservationUnitPriceUnitChoices}
                      onChange={(priceUnit) => setValue({ priceUnit })}
                    />
                  </Dense>
                  <Dense>
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
                  </Dense>
                </EditorGrid>
              </Accordion>

              <Accordion heading={t("ReservationUnitEditor.termsInstructions")}>
                <EditorGrid>
                  {languages.map((lang) => (
                    <Wide>
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
                    </Wide>
                  ))}
                  {["serviceSpecific", "payment", "cancellation"].map(
                    (name) => {
                      const options = get(state, `${name}TermsOptions`);
                      const propName = `${name}TermsPk`;
                      return (
                        <Normal>
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
                        </Normal>
                      );
                    }
                  )}
                </EditorGrid>
              </Accordion>
              <Accordion heading={t("ReservationUnitEditor.communication")}>
                <EditorGrid>
                  {languages.map((lang) => (
                    <Wide>
                      <TextInput
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
                    </Wide>
                  ))}
                  {languages.map((lang) => (
                    <Wide>
                      <TextInput
                        key={lang}
                        required
                        id={`contactInformation${lang}`}
                        label={t(
                          "ReservationUnitEditor.contactInformationLabel",
                          {
                            lang,
                          }
                        )}
                        value={get(
                          state,
                          `reservationUnitEdit.contactInformation${upperFirst(
                            lang
                          )}`,
                          ""
                        )}
                        onChange={(e) =>
                          setValue({
                            [`contactInformation${upperFirst(lang)}`]:
                              e.target.value,
                          })
                        }
                      />
                    </Wide>
                  ))}
                </EditorGrid>
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
          disabled={saving}
          variant="secondary"
          onClick={() => history.go(-1)}
        >
          {t("ReservationUnitEditor.cancel")}
        </WhiteButton>
        <ButtonsContainer>
          <PublishingTime />
          <WhiteButton
            disabled={!hasChanges}
            variant="secondary"
            isLoading={saving}
            loadingText={t("ReservationUnitEditor.saving")}
            onClick={() => saveReservationUnit(false)}
          >
            {t("ReservationUnitEditor.saveAsDraft")}
          </WhiteButton>
          <WhiteButton
            variant="primary"
            disabled={!isReadyToPublish || saving}
            onClick={() => saveReservationUnit(true)}
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
        </ButtonsContainer>
      </ButtonsStripe>
    </Wrapper>
  );
};

export default ReservationUnitEditor;
