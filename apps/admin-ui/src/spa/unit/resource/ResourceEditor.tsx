import React, { useEffect } from "react";
import { Button, ButtonVariant } from "hds-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ResourceUpdateMutationInput,
  LocationType,
  useUpdateResourceMutation,
  useResourceQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import { ButtonContainer, CenterSpinner } from "common/styled";
import { SubPageHead } from "../SubPageHead";
import { errorToast, successToast } from "common/src/common/toast";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import {
  Editor,
  ResourceUpdateSchema,
  type ResourceUpdateForm,
} from "./modules/resourceEditor";
import { ResourceEditorFields } from "./EditForm";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import Error404 from "@/common/Error404";
import { useDisplayError } from "common/src/hooks";

type Props = {
  resourcePk?: number;
  unitPk: number;
};

export function ResourceEditor({ resourcePk, unitPk }: Props) {
  const history = useNavigate();
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const { data, loading, refetch } = useResourceQuery({
    variables: {
      id: base64encode(`ResourceNode:${resourcePk}`),
      unitId: base64encode(`UnitNode:${unitPk}`),
    },
    skip: !resourcePk || Number.isNaN(resourcePk),
    onError: (e) => {
      errorToast({ text: t("errors.errorFetchingData", { error: e }) });
    },
  });

  const [mutation] = useUpdateResourceMutation();

  const updateResource = async (input: ResourceUpdateMutationInput) => {
    const res = await mutation({ variables: { input } });
    await refetch();
    return res;
  };

  const form = useForm<ResourceUpdateForm>({
    resolver: zodResolver(ResourceUpdateSchema),
    mode: "onChange",
  });
  const { handleSubmit, reset, formState } = form;
  const { errors, isDirty } = formState;

  useEffect(() => {
    if (data?.resource) {
      const { resource } = data;
      reset({
        nameFi: resource.nameFi ?? "",
        nameEn: resource.nameEn,
        nameSv: resource.nameSv,
        space: resource.space?.pk ?? undefined,
        pk: resource.pk ?? undefined,
      });
    }
  }, [data, reset]);

  if (loading) {
    return <CenterSpinner />;
  }

  if (data?.resource == null || data?.unit == null) {
    return <Error404 />;
  }

  const onSubmit = async (values: ResourceUpdateForm) => {
    if (values.pk == null) {
      return;
    }
    try {
      await updateResource({
        ...values,
        pk: values.pk,
        locationType: LocationType.Fixed,
      });

      successToast({
        text: t("ResourceEditor.resourceUpdatedNotification"),
      });
      refetch();
      history(-1);
    } catch (err) {
      displayError(err);
    }
  };

  const unit = data.unit;
  const resource = data.resource;

  return (
    <>
      <LinkPrev route="../.." />
      <SubPageHead
        unit={unit}
        title={resource.nameFi || t("ResourceEditor.defaultHeading")}
      />
      <FormErrorSummary errors={errors} />
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Editor>
          <ResourceEditorFields form={form} unitPk={unitPk} />
          <ButtonContainer>
            <Button
              onClick={() => history(-1)}
              variant={ButtonVariant.Secondary}
            >
              {t("ResourceModal.cancel")}
            </Button>
            <Button type="submit" disabled={!isDirty}>
              {t("ResourceModal.save")}
            </Button>
          </ButtonContainer>
        </Editor>
      </form>
    </>
  );
}

export const RESOURCE_QUERY = gql`
  query Resource($id: ID!, $unitId: ID!) {
    resource(id: $id) {
      id
      pk
      nameFi
      nameSv
      nameEn
      space {
        id
        pk
      }
    }
    unit(id: $unitId) {
      id
      pk
      nameFi
      location {
        ...LocationFields
      }
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResource($input: ResourceUpdateMutationInput!) {
    updateResource(input: $input) {
      pk
    }
  }
`;
