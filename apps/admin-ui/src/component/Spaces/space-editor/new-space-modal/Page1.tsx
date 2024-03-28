import React from "react";
import { Button, Dialog, IconArrowRight, IconCheck } from "hds-react";
import { useTranslation } from "react-i18next";
import { type UnitNode } from "common/types/gql-types";
import { parseAddress } from "@/common/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { ParentSelector } from "../ParentSelector";
import {
  ActionButtons,
  Address,
  Name,
  NextButton,
  Parent,
  RoundTag,
  Title,
  UnitInfo,
} from "./modules/newSpaceModal";
import { Controller, UseFormReturn } from "react-hook-form";
import { SpaceUpdateForm } from "../SpaceForm";

export function Page1({
  unit,
  closeModal,
  hasFixedParent,
  form,
  onNextPage,
}: {
  unit: UnitNode;
  closeModal: () => void;
  hasFixedParent: boolean;
  form: UseFormReturn<SpaceUpdateForm>;
  onNextPage: () => void;
}): JSX.Element {
  const { t } = useTranslation();
  const { control, watch } = form;

  // FIXME needs to do a lookup if parent pk is set to find the name
  const parentName = watch("parent") ?? null;
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
            <Parent>{parentName}</Parent>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        {!hasFixedParent ? <Title>{t("SpaceModal.page1.title")}</Title> : null}
        {/*
        <NumberInput
          style={{ maxWidth: "15em" }}
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
        */}
        {/* TODO should be inside a Controller */}
        {!hasFixedParent ? (
          <Controller
            control={control}
            name="parent"
            render={({ field: { onChange, value } }) => (
              <ParentSelector
                label={t("SpaceModal.page1.parentLabel")}
                unitPk={unit.pk ?? 0}
                value={value}
                onChange={(parentPk) => onChange(parentPk)}
              />
            )}
          />
        ) : null}
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={closeModal} variant="secondary">
          {t("SpaceModal.page1.buttonCancel")}
        </Button>
        <NextButton
          iconRight={<IconArrowRight />}
          variant="supplementary"
          onClick={onNextPage}
        >
          {t("SpaceModal.page1.buttonNext")}
        </NextButton>
      </ActionButtons>
    </>
  );
}
