import React from "react";
import { Button, ButtonVariant, Dialog, IconArrowRight } from "hds-react";
import { useTranslation } from "react-i18next";
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
export function Page1({
  unit,
  closeModal,
  hasFixedParent,
  form,
  onNextPage,
  children,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const { control } = form;

  return (
    <>
      <Dialog.Header
        title={t(
          hasFixedParent
            ? "SpaceModal.page1.subSpaceModalTitle"
            : "SpaceModal.page1.modalTitle"
        )}
        id="modal-header"
      />
      <Dialog.Content>
        <StyledTag>{`${t("SpaceModal.phase")} 1/2`}</StyledTag>
        <p className="text-body" id="custom-dialog-content">
          {t("SpaceModal.page1.info")}
        </p>
        {children}
        {!hasFixedParent ? <H4>{t("SpaceModal.page1.title")}</H4> : null}
        {!hasFixedParent ? (
          <Controller
            control={control}
            name="parent"
            render={({ field: { onChange, value } }) => (
              <ParentSelector
                label={t("SpaceModal.page1.parentLabel")}
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
          {t("SpaceModal.page1.buttonCancel")}
        </Button>
        <Button
          variant={ButtonVariant.Supplementary}
          iconEnd={<IconArrowRight />}
          onClick={onNextPage}
        >
          {t("SpaceModal.page1.buttonNext")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
