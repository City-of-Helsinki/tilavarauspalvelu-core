import React from "react";
import { Button, Dialog, IconCheck } from "hds-react";
import styled from "styled-components";
import { type ApolloQueryResult, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  LocationType,
  type Query,
  type Mutation,
  type MutationCreateResourceArgs,
  type ResourceCreateMutationInput,
  type UnitNode,
} from "common/types/gql-types";
import { parseAddress } from "@/common/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { CREATE_RESOURCE } from "./queries";
import { useNotification } from "@/context/NotificationContext";
import {
  Editor,
  EditorContainer,
  ResourceUpdateForm,
  ResourceUpdateSchema,
  SaveButton,
} from "./modules/resourceEditor";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResourceEditorFields } from "./EditForm";
import { ButtonContainer } from "@/styles/layout";

interface IProps {
  unit: UnitNode;
  spacePk: number;
  closeModal: () => void;
  refetch: () => Promise<ApolloQueryResult<Query>>;
}

const UnitInfo = styled.div`
  margin: var(--spacing-m) 0;
  display: flex;
  gap: var(--spacing-m);
`;

const Address = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
`;

export function NewResourceModal({
  unit,
  closeModal,
  refetch,
  spacePk,
}: IProps): JSX.Element | null {
  const { t } = useTranslation();

  const { notifyError } = useNotification();

  const [createResourceMutation, { loading: isMutationLoading }] = useMutation<
    Mutation,
    MutationCreateResourceArgs
  >(CREATE_RESOURCE);

  const createResource = (input: ResourceCreateMutationInput) =>
    createResourceMutation({ variables: { input } });

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

  // TODO this is duplicate code in ResourceEditor
  const onSubmit = async (values: ResourceUpdateForm) => {
    try {
      const { pk, ...rest } = values;
      await createResource({
        ...rest,
        name: values.nameFi,
        locationType: LocationType.Fixed,
      });
      closeModal();
      refetch();
    } catch (error) {
      notifyError(t("ResourceModal.saveError"));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <CustomDialogHeader
        id="dialog-title"
        title={t("ResourceModal.modalTitle")}
        close={closeModal}
      />
      <Dialog.Content>
        <p className="text-body" id="custom-dialog-content">
          {t("ResourceModal.info")}
        </p>
        <UnitInfo>
          <IconCheck />
          <div>
            <span>{unit.nameFi}</span>
          </div>
          {unit.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        <FormErrorSummary errors={errors} />
        <EditorContainer>
          <Editor>
            <ResourceEditorFields form={form} unitPk={unit.pk ?? 0} />
          </Editor>
        </EditorContainer>
      </Dialog.Content>
      <ButtonContainer>
        <Button
          onClick={closeModal}
          variant="secondary"
          theme="black"
          disabled={isMutationLoading}
        >
          {t("ResourceModal.cancel")}
        </Button>
        <SaveButton type="submit" variant="secondary" disabled={!isDirty}>
          {t("ResourceModal.save")}
        </SaveButton>
      </ButtonContainer>
    </form>
  );
}
