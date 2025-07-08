import React from "react";
import { Button, ButtonVariant, Dialog, IconArrowRight } from "hds-react";
import { useTranslation } from "next-i18next";
import { type UnitPageQuery } from "@gql/gql-types";
import { ParentSelector } from "../ParentSelector";
import { StyledTag } from "./modules/newSpaceModal";
import { Controller, UseFormReturn } from "react-hook-form";
import { SpaceUpdateForm } from "../SpaceForm";
import { DialogActionsButtons } from "@/styled";
import { H4 } from "common/styled";

type Props = {
  unit: Pick<NonNullable<UnitPageQuery["unit"]>, "pk">;
  closeModal: () => void;
  hasFixedParent: boolean;
  form: UseFormReturn<SpaceUpdateForm>;
  onNextPage: () => void;
  children: React.ReactNode;
};
export function Page1({ unit, closeModal, hasFixedParent, form, onNextPage, children }: Props): JSX.Element {
  const { t } = useTranslation();
  const { control } = form;

  const modalTitle = t(
    hasFixedParent ? "spaces:SpaceModal.page1.subSpaceModalTitle" : "spaces:SpaceModal.page1.modalTitle"
  );
  const modalContent = t("spaces:SpaceModal.page1.info");
  return (
    <>
      <Dialog.Header title={modalTitle} id="modal-header" />
      <Dialog.Content>
        <StyledTag>{`${t("spaces:SpaceModal.phase")} 1/2`}</StyledTag>
        <p className="text-body" id="custom-dialog-content">
          {modalContent}
        </p>
        {children}
        {!hasFixedParent ? <H4>{t("spaces:SpaceModal.page1.title")}</H4> : null}
        {!hasFixedParent ? (
          <Controller
            control={control}
            name="parent"
            render={({ field: { onChange, value } }) => (
              <ParentSelector
                label={t("spaces:SpaceModal.page1.parentLabel")}
                unitPk={unit?.pk ?? 0}
                value={value}
                onChange={(parent) => onChange(parent)}
              />
            )}
          />
        ) : null}
      </Dialog.Content>
      <DialogActionsButtons>
        <Button onClick={closeModal} variant={ButtonVariant.Secondary}>
          {t("common:cancel")}
        </Button>
        <Button variant={ButtonVariant.Supplementary} iconEnd={<IconArrowRight />} onClick={onNextPage}>
          {t("common:next")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
