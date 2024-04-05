import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, IconArrowLeft, IconCheck } from "hds-react";
import type { UnitNode } from "common/types/gql-types";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import {
  Address,
  Name,
  Parent,
  RoundTag,
  UnitInfo,
} from "./modules/newSpaceModal";
import { parseAddress } from "@/common/util";
import { SpaceForm, type SpaceUpdateForm } from "../SpaceForm";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { UseFormReturn } from "react-hook-form";
import { DialogActionsButtons } from "app/styles/util";

type Props = {
  unit: UnitNode;
  closeModal: () => void;
  hasFixedParent: boolean;
  onPrevPage: () => void;
  form: UseFormReturn<SpaceUpdateForm>;
};

export function Page2({
  unit,
  onPrevPage,
  closeModal,
  hasFixedParent,
  form,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { watch, formState } = form;
  const { errors, isDirty } = formState;

  // TODO get the parent name (form doesn't have it)
  const parentName = watch("parent")
    ? watch("parent")
    : t("SpaceModal.page2.newRootSpace");

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
            <Parent>{parentName}</Parent>
          </div>
          {unit.location != null && (
            <Address>{parseAddress(unit.location)}</Address>
          )}
        </UnitInfo>
        <div>
          <FormErrorSummary errors={errors} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr var(--spacing-2-xl",
            }}
          >
            <SpaceForm form={form} />
          </div>
        </div>
      </Dialog.Content>
      <DialogActionsButtons>
        <Button
          onClick={onPrevPage}
          variant="supplementary"
          iconLeft={<IconArrowLeft />}
        >
          {t("SpaceModal.page2.prevButton")}
        </Button>
        <Button
          disabled={!isDirty}
          type="submit"
          loadingText={t("SpaceModal.page2.saving")}
        >
          {t("SpaceModal.page2.createButton")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
