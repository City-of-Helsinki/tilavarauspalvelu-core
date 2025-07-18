import React from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonVariant, Dialog, IconArrowLeft, LoadingSpinner } from "hds-react";
import { StyledTag } from "./modules/newSpaceModal";
import { SpaceForm, type SpaceUpdateForm } from "../SpaceForm";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { UseFormReturn } from "react-hook-form";
import { DialogActionsButtons } from "@/styled";

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

  return (
    <>
      <Dialog.Header
        title={t(hasFixedParent ? "SpaceModal.page2.subSpaceModalTitle" : "SpaceModal.page2.modalTitle")}
        id="modal-header"
      />
      <Dialog.Content>
        <StyledTag>{`${t("SpaceModal.phase")} 2/2`}</StyledTag>
        <p className="text-body" id="custom-dialog-content">
          {t(hasFixedParent ? "SpaceModal.page2.subSpaceInfo" : "SpaceModal.page2.info")}
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
          iconStart={<IconArrowLeft aria-hidden="true" />}
          disabled={isSubmitting}
        >
          {t("SpaceModal.page2.prevButton")}
        </Button>
        <Button
          type="submit"
          variant={isSubmitting ? ButtonVariant.Clear : ButtonVariant.Primary}
          iconStart={isSubmitting ? <LoadingSpinner small /> : undefined}
          disabled={!isDirty || isSubmitting}
        >
          {t("SpaceModal.page2.createButton")}
        </Button>
      </DialogActionsButtons>
    </>
  );
}
