import React from "react";
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Dialog,
  IconArrowLeft,
  LoadingSpinner,
} from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "@/spa/ReservationUnit/edit/form";
import { useNavigate } from "react-router-dom";
import { getUnitUrl } from "@/common/urls";
import { successToast } from "common/src/common/toast";
import type {
  ReservationUnitEditQuery,
  UnitSubpageHeadFragment,
} from "@gql/gql-types";
import { breakpoints } from "common/src/const";
import { pageSideMargins, WhiteButton } from "common/styled";
import { useDisplayError } from "common/src/hooks";
import { useModal } from "@/context/ModalContext";

type QueryData = ReservationUnitEditQuery["reservationUnit"];
type Node = NonNullable<QueryData>;

const PreviewLink = styled.a`
  display: flex;
  place-items: center;
  border: 2px solid var(--color-white);
  background-color: transparent;
  text-decoration: none;

  opacity: 0.5;
  cursor: not-allowed;
  color: var(--color-white);

  :link,
  :visited {
    opacity: 1;
    color: var(--color-white);
    cursor: pointer;

    &:hover {
      background-color: var(--color-white);
      color: var(--color-black);
    }
  }

  > span {
    margin: 0 var(--spacing-m);
  }
`;

const ButtonsStripe = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);

  padding: var(--spacing-s) 0;
  ${pageSideMargins};

  /* back button should be left aligned */
  gap: var(--spacing-m);

  & > *:first-child {
    margin-right: auto;
  }

  /* four buttons is too much on mobile */

  & > *:nth-child(2) {
    display: none;
  }

  @media (min-width: ${breakpoints.s}) {
    & > *:nth-child(2) {
      display: flex;
    }
  }
`;

const ActionButtons = styled(Dialog.ActionButtons)`
  justify-content: end;
`;

function DialogContent({
  onClose,
  onAccept,
  description,
  acceptLabel,
}: {
  onClose: () => void;
  onAccept: () => void;
  description: string;
  acceptLabel: string;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <>
      <Dialog.Content>
        <p id="modal-description" className="text-body">
          {description}
        </p>
      </Dialog.Content>
      <ActionButtons>
        <Button onClick={onAccept}>{acceptLabel}</Button>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </ActionButtons>
    </>
  );
}

function GenericDialog({
  onClose,
  onAccept,
  title,
  description,
  acceptLabel,
}: {
  onClose: () => void;
  onAccept: () => void;
  title: string;
  description: string;
  acceptLabel: string;
}): JSX.Element {
  const { isOpen } = useModal();

  return (
    <Dialog
      variant="primary"
      id="info-dialog"
      aria-labelledby="modal-header"
      aria-describedby="modal-description"
      isOpen={isOpen}
    >
      <Dialog.Header id="modal-header" title={title} />
      <DialogContent
        description={description}
        acceptLabel={acceptLabel}
        onAccept={onAccept}
        onClose={onClose}
      />
    </Dialog>
  );
}

function ArchiveDialog({
  reservationUnit,
  onClose,
  onAccept,
}: {
  reservationUnit: Pick<Node, "nameTranslations">;
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("ArchiveReservationUnitDialog.description")}
      title={t("ArchiveReservationUnitDialog.title", {
        name: reservationUnit.nameTranslations.fi || "-",
      })}
      acceptLabel={t("ArchiveReservationUnitDialog.archive")}
    />
  );
}

function DiscardChangesDialog({
  onClose,
  onAccept,
}: {
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("DiscardReservationUnitChangesDialog.description")}
      title={t("DiscardReservationUnitChangesDialog.title")}
      acceptLabel={t("DiscardReservationUnitChangesDialog.discard")}
    />
  );
}

export function BottomButtonsStripe({
  reservationUnit,
  unit,
  previewUrlPrefix,
  setModalContent,
  onSubmit,
  form,
}: {
  reservationUnit: Node | undefined;
  unit?: UnitSubpageHeadFragment | null;
  previewUrlPrefix: string;
  setModalContent: (content: JSX.Element | null) => void;
  onSubmit: (formValues: ReservationUnitEditFormValues) => Promise<number>;
  form: UseFormReturn<ReservationUnitEditFormValues>;
}): JSX.Element {
  const { t } = useTranslation();
  const displayError = useDisplayError();
  const history = useNavigate();

  const { setValue, watch, formState, handleSubmit } = form;
  const { isDirty: hasChanges, isSubmitting: isSaving } = formState;

  const archiveEnabled = watch("pk") !== 0 && !watch("isArchived");
  const draftEnabled = hasChanges || !watch("isDraft");
  const publishEnabled = hasChanges || watch("isDraft");

  const isPreviewDisabled =
    isSaving ||
    !reservationUnit?.pk ||
    !reservationUnit?.uuid ||
    previewUrlPrefix === "";

  // Have to define these like this because otherwise the state changes don't work
  const handlePublish = async () => {
    setValue("isDraft", false);
    setValue("isArchived", false);
    try {
      await handleSubmit(onSubmit)();
    } catch (error) {
      displayError(error);
    }
  };

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    setValue("isArchived", false);
    try {
      await handleSubmit(onSubmit)();
    } catch (error) {
      displayError(error);
    }
  };

  const handleAcceptArchive = async () => {
    setValue("isArchived", true);
    setValue("isDraft", false);
    setModalContent(null);
    try {
      await handleSubmit(onSubmit)();
      successToast({ text: t("ArchiveReservationUnitDialog.success") });
      history(getUnitUrl(unit?.pk));
    } catch (e) {
      displayError(e);
    }
  };

  const handleArchiveButtonClick = () => {
    if (reservationUnit != null) {
      setModalContent(
        <ArchiveDialog
          reservationUnit={reservationUnit}
          onAccept={handleAcceptArchive}
          onClose={() => setModalContent(null)}
        />
      );
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setModalContent(
        <DiscardChangesDialog
          onAccept={() => {
            setModalContent(null);
            history(-1);
          }}
          onClose={() => setModalContent(null)}
        />
      );
    } else {
      history(-1);
    }
  };

  return (
    <ButtonsStripe>
      <WhiteButton
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        iconStart={<IconArrowLeft />}
        disabled={isSaving}
        onClick={handleBack}
      >
        {t("common.prev")}
      </WhiteButton>

      <WhiteButton
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        onClick={handleArchiveButtonClick}
        type="button"
        disabled={isSaving || !archiveEnabled}
      >
        {t("ReservationUnitEditor.archive")}
      </WhiteButton>

      <PreviewLink
        target="_blank"
        rel="noopener noreferrer"
        href={
          !isPreviewDisabled
            ? `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.uuid}`
            : undefined
        }
        onClick={(e) => isPreviewDisabled && e.preventDefault()}
        title={t(
          hasChanges
            ? "ReservationUnitEditor.noPreviewUnsavedChangesTooltip"
            : "ReservationUnitEditor.previewTooltip"
        )}
      >
        <span>{t("ReservationUnitEditor.preview")}</span>
      </PreviewLink>

      <WhiteButton
        size={ButtonSize.Small}
        variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Secondary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        disabled={isSaving || !draftEnabled}
        type="button"
        onClick={handleSaveAsDraft}
      >
        {t("ReservationUnitEditor.saveAsDraft")}
      </WhiteButton>

      <WhiteButton
        size={ButtonSize.Small}
        variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Primary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        disabled={isSaving || !publishEnabled}
        type="button"
        onClick={handlePublish}
      >
        {t("ReservationUnitEditor.saveAndPublish")}
      </WhiteButton>
    </ButtonsStripe>
  );
}
