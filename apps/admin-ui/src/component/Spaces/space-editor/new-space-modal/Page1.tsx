import React from "react";
import { Button, Dialog, IconArrowRight, IconCheck } from "hds-react";
import { useTranslation } from "react-i18next";
import { type UnitNode } from "common/types/gql-types";
import { parseAddress } from "@/common/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { ParentSelector } from "../ParentSelector";
import {
  Address,
  Name,
  Parent,
  RoundTag,
  Title,
  UnitInfo,
} from "./modules/newSpaceModal";
import { Controller, UseFormReturn } from "react-hook-form";
import { SpaceUpdateForm } from "../SpaceForm";
import { DialogActionsButtons } from "@/styles/util";

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

  const parentPk = watch("parent") ?? null;
  const parentName = unit.spaces.find((space) => space.pk === parentPk)?.nameFi;
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
        {!hasFixedParent ? (
          <Controller
            control={control}
            name="parent"
            render={({ field: { onChange, value } }) => (
              <ParentSelector
                label={t("SpaceModal.page1.parentLabel")}
                unitPk={unit.pk ?? 0}
                value={value}
                onChange={(parent) => onChange(parent)}
              />
            )}
          />
        ) : null}
      </Dialog.Content>
      <DialogActionsButtons>
        <Button onClick={closeModal} variant="secondary" theme="black">
          {t("SpaceModal.page1.buttonCancel")}
        </Button>
        <Button
          iconRight={<IconArrowRight />}
          variant="supplementary"
          onClick={onNextPage}
        >
          {t("SpaceModal.page1.buttonNext")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
