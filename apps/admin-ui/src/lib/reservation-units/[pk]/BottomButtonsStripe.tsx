import React from "react";
import { Button, ButtonSize, ButtonVariant, Dialog, IconArrowLeft, LoadingSpinner } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import type { UseFormReturn } from "react-hook-form";
import type { ReservationUnitEditFormValues } from "./form";
import { getUnitUrl } from "@/common/urls";
import { successToast } from "common/src/components/toast";
import { useArchiveReservationUnitMutation } from "@gql/gql-types";
import type { Maybe, ReservationUnitEditPageFragment } from "@gql/gql-types";
import { breakpoints } from "common/src/const";
import { ButtonLikeExternalLink, Flex, pageSideMargins, WhiteButton } from "common/styled";
import { useDisplayError } from "common/src/hooks";
import { useModal } from "@/context/ModalContext";
import { useRouter } from "next/router";
import { gql } from "@apollo/client";

const ButtonsStripe = styled(Flex).attrs({
  $direction: "row",
  $justifyContent: "space-between",
})`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: var(--color-bus-dark);
  z-index: var(--tilavaraus-admin-stack-button-stripe);

  padding: var(--spacing-s) 0;
  ${pageSideMargins};

  gap: var(--spacing-xs);

  /* back button should be left aligned */
  & > *:first-child {
    margin-right: auto;
  }

  /* four buttons is too much on mobile */

  & > .preview-link,
  & > .archive-button {
    display: none;
  }

  @media (min-width: ${breakpoints.s}) {
    gap: var(--spacing-m);
    & > .preview-link,
    & > .archive-button {
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
          {t("common:cancel")}
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
      <DialogContent description={description} acceptLabel={acceptLabel} onAccept={onAccept} onClose={onClose} />
    </Dialog>
  );
}

function ArchiveDialog({
  reservationUnit,
  onClose,
  onAccept,
}: {
  reservationUnit: Pick<ReservationUnitEditPageFragment, "nameFi">;
  onClose: () => void;
  onAccept: () => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("reservationUnitEditor:ArchiveDialog.description")}
      title={t("reservationUnitEditor:ArchiveDialog.title", {
        name: reservationUnit.nameFi ?? "-",
      })}
      acceptLabel={t("reservationUnitEditor:ArchiveDialog.acceptBtn")}
    />
  );
}

function DiscardChangesDialog({ onClose, onAccept }: { onClose: () => void; onAccept: () => void }): JSX.Element {
  const { t } = useTranslation();

  return (
    <GenericDialog
      onAccept={onAccept}
      onClose={onClose}
      description={t("reservationUnitEditor:DiscardChangesDialog.description")}
      title={t("reservationUnitEditor:DiscardChangesDialog.title")}
      acceptLabel={t("reservationUnitEditor:DiscardChangesDialog.discard")}
    />
  );
}

export function BottomButtonsStripe({
  reservationUnit,
  previewUrlPrefix,
  setModalContent,
  onSubmit,
  form,
}: {
  reservationUnit: Maybe<ReservationUnitEditPageFragment>;
  previewUrlPrefix: string;
  setModalContent: (content: JSX.Element | null) => void;
  onSubmit: (formValues: ReservationUnitEditFormValues) => Promise<number>;
  form: UseFormReturn<ReservationUnitEditFormValues>;
}): JSX.Element {
  const { t } = useTranslation();
  const displayError = useDisplayError();
  const router = useRouter();
  const [archiveMutation] = useArchiveReservationUnitMutation();

  const { setValue, watch, formState, handleSubmit } = form;
  const { isDirty: hasChanges, isSubmitting: isSaving } = formState;

  const archiveEnabled = watch("pk") !== 0;
  const draftEnabled = hasChanges || !watch("isDraft");
  const publishEnabled = hasChanges || watch("isDraft");
  const isPreviewDisabled = isSaving || !reservationUnit?.pk || !reservationUnit?.extUuid || previewUrlPrefix === "";

  // Have to define these like this because otherwise the state changes don't work
  const handlePublish = async () => {
    setValue("isDraft", false);
    try {
      await handleSubmit(onSubmit)();
    } catch (err) {
      displayError(err);
    }
  };

  const handleSaveAsDraft = async () => {
    setValue("isDraft", true);
    try {
      await handleSubmit(onSubmit)();
    } catch (err) {
      displayError(err);
    }
  };

  const handleAcceptArchive = async () => {
    setModalContent(null);
    try {
      if (reservationUnit == null) {
        throw new Error("Can't try to archive non existing reservation unit.");
      }
      const { unit, pk } = reservationUnit;
      await archiveMutation({ variables: { input: { pk } } });
      successToast({ text: t("reservationUnitEditor:ArchiveDialog.success") });
      router.push(getUnitUrl(unit.pk));
    } catch (err) {
      displayError(err);
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
            router.back();
          }}
          onClose={() => setModalContent(null)}
        />
      );
    } else {
      router.back();
    }
  };

  const previewUrl = !isPreviewDisabled
    ? `${previewUrlPrefix}/${reservationUnit?.pk}?ru=${reservationUnit?.extUuid}`
    : undefined;
  const previewTitle = t(
    hasChanges ? "reservationUnitEditor:noPreviewUnsavedChangesTooltip" : "reservationUnitEditor:previewTooltip"
  );

  return (
    <ButtonsStripe>
      <WhiteButton
        size={ButtonSize.Small}
        variant={ButtonVariant.Supplementary}
        iconStart={<IconArrowLeft />}
        disabled={isSaving}
        onClick={handleBack}
      >
        {t("common:prev")}
      </WhiteButton>

      <WhiteButton
        size={ButtonSize.Small}
        variant={ButtonVariant.Secondary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        onClick={handleArchiveButtonClick}
        type="button"
        disabled={isSaving || !archiveEnabled}
        className="archive-button"
      >
        {t("reservationUnitEditor:archive")}
      </WhiteButton>

      <ButtonLikeExternalLink
        target="_blank"
        rel="noopener noreferrer"
        className="preview-link"
        href={previewUrl}
        disabled={previewUrl == null}
        variant="inverted"
        title={previewTitle}
      >
        <span>{t("reservationUnitEditor:preview")}</span>
      </ButtonLikeExternalLink>

      <WhiteButton
        size={ButtonSize.Small}
        variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Secondary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        disabled={isSaving || !draftEnabled}
        type="button"
        onClick={handleSaveAsDraft}
      >
        {t("reservationUnitEditor:saveAsDraft")}
      </WhiteButton>

      <WhiteButton
        size={ButtonSize.Small}
        variant={isSaving ? ButtonVariant.Clear : ButtonVariant.Primary}
        iconStart={isSaving ? <LoadingSpinner small /> : undefined}
        disabled={isSaving || !publishEnabled}
        type="button"
        onClick={handlePublish}
      >
        {t("reservationUnitEditor:saveAndPublish")}
      </WhiteButton>
    </ButtonsStripe>
  );
}

export const ARCHIVE_RESERVATION_UNIT = gql`
  mutation ArchiveReservationUnit($input: ReservationUnitArchiveMutation!) {
    archiveReservationUnit(input: $input) {
      pk
    }
  }
`;
