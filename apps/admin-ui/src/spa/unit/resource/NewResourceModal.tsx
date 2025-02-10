import React from "react";
import { Button, ButtonVariant, Dialog, IconCheck } from "hds-react";
import styled from "styled-components";
import { type ApolloQueryResult } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  LocationType,
  type ResourceCreateMutationInput,
  useCreateResourceMutation,
  type UnitQuery,
} from "@gql/gql-types";
import { parseAddress } from "@/common/util";
import { CustomDialogHeader } from "@/component/CustomDialogHeader";
import { errorToast } from "common/src/common/toast";
import {
  Editor,
  ResourceUpdateForm,
  ResourceUpdateSchema,
} from "./modules/resourceEditor";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResourceEditorFields } from "./EditForm";
import { DialogActionsButtons } from "@/styles/util";
import { fontMedium } from "common";
import { Flex } from "common/styles/util";

interface IProps {
  unit: UnitQuery["unit"];
  spacePk: number;
  closeModal: () => void;
  refetch: () => Promise<ApolloQueryResult<UnitQuery>>;
}

const UnitInfo = styled(Flex).attrs({
  $direction: "row",
})`
  margin: var(--spacing-m) 0;
`;

const Address = styled.span`
  ${fontMedium}
`;

export function NewResourceModal({
  unit,
  closeModal,
  refetch,
  spacePk,
}: IProps): JSX.Element | null {
  const { t } = useTranslation();

  const [createResourceMutation, { loading: isMutationLoading }] =
    useCreateResourceMutation();

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
      errorToast({ text: t("ResourceModal.saveError") });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <CustomDialogHeader
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
            <span>{unit?.nameFi}</span>
          </div>
          {unit?.location ? (
            <Address>{parseAddress(unit.location)}</Address>
          ) : null}
        </UnitInfo>
        <FormErrorSummary errors={errors} />
        <Editor>
          <ResourceEditorFields form={form} unitPk={unit?.pk ?? 0} />
        </Editor>
      </Dialog.Content>
      <DialogActionsButtons>
        <Button
          onClick={closeModal}
          variant={ButtonVariant.Secondary}
          disabled={isMutationLoading}
        >
          {t("ResourceModal.cancel")}
        </Button>
        <Button type="submit" disabled={!isDirty}>
          {t("ResourceModal.save")}
        </Button>
      </DialogActionsButtons>
    </form>
  );
}
