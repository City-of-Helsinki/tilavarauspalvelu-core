import React from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, ButtonVariant, Dialog } from "hds-react";
import { useTranslation } from "next-i18next";
import { useDisplayError } from "ui/src/hooks";
import { FormErrorSummary } from "@/components/FormErrorSummary";
import { DialogActionsButtons } from "@/styled";
import { ResourceLocationType, useCreateResourceMutation } from "@gql/gql-types";
import type { ResourceCreateMutationInput, NewResourceUnitFieldsFragment } from "@gql/gql-types";
import { ResourceEditorFields } from "./ResourceEditForm";
import { UnitInfo } from "./UnitInfo";
import type { ResourceUpdateForm } from "./modules/resourceEditor";
import { Editor, ResourceUpdateSchema } from "./modules/resourceEditor";

interface ModalProps {
  unit: NewResourceUnitFieldsFragment;
  spacePk: number;
  closeModal: () => void;
  refetch: () => Promise<unknown>;
}

export function NewResourceModal({ unit, closeModal, refetch, spacePk }: ModalProps): JSX.Element | null {
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const [createResourceMutation, { loading: isMutationLoading }] = useCreateResourceMutation();

  const createResource = (input: ResourceCreateMutationInput) => createResourceMutation({ variables: { input } });

  const form = useForm<ResourceUpdateForm>({
    resolver: zodResolver(ResourceUpdateSchema),
    mode: "onChange",
    values: {
      space: spacePk,
      nameFi: "",
      pk: undefined,
    },
  });
  const { handleSubmit, formState } = form;
  const { errors, isDirty } = formState;

  const onSubmit = async (values: ResourceUpdateForm) => {
    try {
      const { pk, ...rest } = values;
      await createResource({
        ...rest,
        name: values.nameFi,
        locationType: ResourceLocationType.Fixed,
      });
      closeModal();
      refetch();
    } catch (err) {
      displayError(err);
    }
  };

  const parentName = unit?.spaces.find((space) => space.pk === spacePk)?.nameFi ?? null;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Dialog.Header title={t("spaces:ResourceModal.modalTitle")} id="modal-header" />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("spaces:ResourceModal.info")}
        </p>
        <UnitInfo unit={unit} parentName={parentName} />
        <FormErrorSummary errors={errors} />
        <Editor>
          <ResourceEditorFields form={form} unitPk={unit?.pk ?? 0} />
        </Editor>
      </Dialog.Content>
      <DialogActionsButtons>
        <Button onClick={closeModal} variant={ButtonVariant.Secondary} disabled={isMutationLoading}>
          {t("common:cancel")}
        </Button>
        <Button type="submit" disabled={!isDirty}>
          {t("common:save")}
        </Button>
      </DialogActionsButtons>
    </form>
  );
}

export const CREATE_RESOURCE = gql`
  mutation CreateResource($input: ResourceCreateMutationInput!) {
    createResource(input: $input) {
      pk
    }
  }
`;
