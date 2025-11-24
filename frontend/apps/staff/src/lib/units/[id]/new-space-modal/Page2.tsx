import React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Button, ButtonVariant, Dialog, IconArrowLeft, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import { FormErrorSummary } from "@/components/FormErrorSummary";
import { DialogActionsButtons } from "@/styled";
import { SpaceForm } from "../SpaceForm";
import type { SpaceUpdateForm } from "../SpaceForm";
import { StyledTag } from "./modules/newSpaceModal";

type Props = {
  hasFixedParent: boolean;
  onPrevPage: () => void;
  form: UseFormReturn<SpaceUpdateForm>;
  children: React.ReactNode;
};

export function Page2({ onPrevPage, hasFixedParent, form, children }: Props): JSX.Element {
  const { t } = useTranslation();
  const { formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  const modalTitle = t(
    hasFixedParent ? "spaces:SpaceModal.page2.subSpaceModalTitle" : "spaces:SpaceModal.page2.modalTitle"
  );
  const modalContent = t(hasFixedParent ? "spaces:SpaceModal.page2.subSpaceInfo" : "spaces:SpaceModal.page2.info");
  return (
    <>
      <Dialog.Header title={modalTitle} id="modal-header" />
      <Dialog.Content>
        <StyledTag>{`${t("spaces:SpaceModal.phase")} 2/2`}</StyledTag>
        <p className="text-body" id="custom-dialog-content">
          {modalContent}
        </p>
        {children}
        <div>
          <FormErrorSummary errors={errors} />
          <SpaceForm form={form} />
        </div>
      </Dialog.Content>
      <DialogActionsButtons>
        <Button
          onClick={onPrevPage}
          variant={ButtonVariant.Supplementary}
          iconStart={<IconArrowLeft />}
          disabled={isSubmitting}
        >
          {t("spaces:SpaceModal.page2.prevButton")}
        </Button>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
          disabled={!isDirty || isSubmitting}
        >
          {t("spaces:SpaceModal.page2.createButton")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
