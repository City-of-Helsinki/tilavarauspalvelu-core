import React from "react";
import { useTranslation } from "react-i18next";
import { omit } from "lodash";
import {
  Button,
  Dialog,
  IconArrowLeft,
  IconCheck,
  IconPlusCircleFill,
} from "hds-react";
import { FetchResult } from "@apollo/client";
import {
  SpaceCreateMutationInput,
  SpaceCreateMutationPayload,
  UnitByPkType,
} from "common/types/gql-types";
import { CustomDialogHeader } from "../../../CustomDialogHeader";
import {
  Action,
  ActionButtons,
  Address,
  ButtonContainer,
  IconDelete,
  Name,
  NewRowButton,
  NextButton,
  Parent,
  RoundTag,
  State,
  UnitInfo,
} from "./modules/newSpaceModal";
import { parseAddress } from "../../../../common/util";

import SpaceForm from "../SpaceForm";
import { schema } from "../util";
import FormErrorSummary from "../../../../common/FormErrorSummary";

const SpaceEditor = ({
  space,
  index,
  dispatch,
  getValidationError,
}: {
  space: SpaceCreateMutationInput;
  index: number;
  dispatch: React.Dispatch<Action>;
  getValidationError: (name: string) => string | undefined;
}) => {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr var(--spacing-2-xl" }}
    >
      <SpaceForm
        data={space}
        setValue={(value) => dispatch({ type: "set", index, value })}
        getValidationError={getValidationError}
      />
      {index > 0 ? (
        <IconDelete
          tabIndex={0}
          onKeyPress={() => dispatch({ type: "delete", index })}
          onClick={() => dispatch({ type: "delete", index })}
        />
      ) : null}
    </div>
  );
};

type Props = {
  editorState: State;
  unit: UnitByPkType;
  dispatch: React.Dispatch<Action>;
  closeModal: () => void;
  createSpace: (
    variables: SpaceCreateMutationInput
  ) => Promise<FetchResult<{ createSpace: SpaceCreateMutationPayload }>>;
  onSave: () => void;
  onDataError: (message: string) => void;
  hasFixedParent: boolean;
};

const Page2 = ({
  editorState,
  unit,
  dispatch,
  closeModal,
  createSpace,
  onSave,
  onDataError,
  hasFixedParent,
}: Props): JSX.Element => {
  const { t } = useTranslation();

  const nextEnabled =
    editorState.numSpaces > 0 && editorState.parentPk !== undefined;

  function createSpaces() {
    const promises = Promise.allSettled(
      editorState.spaces.map((s) =>
        createSpace({
          ...(omit(s, ["key", "parentId"]) as SpaceCreateMutationInput),
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
  }

  const getValidationError =
    (index: number) =>
    (name: string): string | undefined => {
      const error = editorState.validationErrors[index]?.error?.details.find(
        (errorDetail) => errorDetail.path.find((path) => path === name)
      );

      if (!error) {
        return undefined;
      }

      return t(`validation.${error.type}`, { ...error.context });
    };

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
              {editorState.parentPk
                ? editorState.parentName
                : t("SpaceModal.page2.newRootSpace")}
            </Parent>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        {editorState.spaces.map((space, i) => (
          <div key={space.key}>
            <FormErrorSummary
              fieldNamePrefix="SpaceEditor.label."
              validationErrors={editorState.validationErrors[i] || null}
              linkToError={false}
            />
            <SpaceEditor
              index={i}
              key={space.key}
              space={space as SpaceCreateMutationInput}
              dispatch={dispatch}
              getValidationError={getValidationError(i)}
            />
          </div>
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
          onClick={(e) => {
            e.preventDefault();
            const validationResults = editorState.spaces.map((space) =>
              schema.validate(omit(space, ["key"]))
            );

            if (
              validationResults.filter(
                (result) => result !== null && result.error !== undefined
              ).length > 0
            ) {
              dispatch({
                type: "setValidationErrors",
                validationErrors: validationResults,
              });
            } else {
              createSpaces();
            }
          }}
        >
          {t("SpaceModal.page2.createButton")}
        </NextButton>
      </ActionButtons>
    </>
  );
};

export default Page2;
