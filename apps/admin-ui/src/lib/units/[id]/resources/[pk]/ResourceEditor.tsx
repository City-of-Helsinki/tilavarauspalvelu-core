import React, { useEffect } from "react";
import { Button, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ResourceUpdateMutation,
  ResourceLocationType,
  useUpdateResourceMutation,
  useResourceQuery,
} from "@gql/gql-types";
import { createNodeId } from "common/src/helpers";
import { ButtonContainer, CenterSpinner } from "common/styled";
import { errorToast, successToast } from "common/src/components/toast";
import { FormErrorSummary } from "@/component/FormErrorSummary";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { Error404 } from "@/component/Error404";
import { useDisplayError } from "common/src/hooks";
import { useRouter } from "next/router";
import {
  SubPageHead,
  ResourceEditorFields,
  Editor,
  ResourceUpdateSchema,
  type ResourceUpdateForm,
} from "@lib/units/[id]";
import { getUnitUrl } from "@/common/urls";

type Props = {
  resourcePk?: number;
  unitPk: number;
};

export function ResourceEditor({ resourcePk, unitPk }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const { data, loading, previousData, refetch } = useResourceQuery({
    variables: {
      id: createNodeId("ResourceNode", resourcePk ?? 0),
      unitId: createNodeId("UnitNode", unitPk),
    },
    skip: !resourcePk || Number.isNaN(resourcePk),
    onError: (e) => {
      errorToast({ text: t("errors:errorFetchingData", { error: e }) });
    },
  });

  const [mutation, { loading: isMutationLoading }] = useUpdateResourceMutation();

  const updateResource = async (input: ResourceUpdateMutation) => {
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
    const resource = data?.resource != null && "pk" in data.resource ? data.resource : null;
    if (resource) {
      reset({
        nameFi: resource.nameFi ?? "",
        nameEn: resource.nameEn,
        nameSv: resource.nameSv,
        space: resource.space?.pk ?? undefined,
        pk: resource.pk ?? undefined,
      });
    }
  }, [data, reset]);

  const possibleData = data ?? previousData;
  const unit = possibleData?.unit != null && "pk" in possibleData.unit ? possibleData.unit : null;
  const resource = possibleData?.resource != null && "pk" in possibleData.resource ? possibleData.resource : null;

  if ((resource == null || unit == null) && loading) {
    return <CenterSpinner />;
  }
  if (resource == null || unit == null) {
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
        locationType: ResourceLocationType.Fixed,
      });

      successToast({
        text: t("spaces:resourceUpdatedNotification"),
      });
      refetch();
      router.replace(getUnitUrl(unit.pk, "spaces-resources"));
    } catch (err) {
      displayError(err);
    }
  };

  return (
    <>
      <LinkPrev route={getUnitUrl(unit.pk, "spaces-resources")} />
      <SubPageHead unit={unit} title={resource.nameFi || t("spaces:ResourceEditor.defaultHeading")} />
      <FormErrorSummary errors={errors} />
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Editor>
          <ResourceEditorFields form={form} unitPk={unitPk} />
          <ButtonContainer>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={() => router.replace(getUnitUrl(unit.pk, "spaces-resources"))}
              disabled={isMutationLoading}
            >
              {t("common:cancel")}
            </Button>
            <Button type="submit" disabled={!isDirty}>
              {t("common:save")}
            </Button>
          </ButtonContainer>
        </Editor>
      </form>
    </>
  );
}

export const RESOURCE_QUERY = gql`
  query Resource($id: ID!, $unitId: ID!) {
    resource: node(id: $id) {
      ... on ResourceNode {
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
    }
    unit: node(id: $unitId) {
      ... on UnitNode {
        id
        pk
        nameFi
        ...LocationFields
      }
    }
  }
`;

export const UPDATE_RESOURCE = gql`
  mutation UpdateResource($input: ResourceUpdateMutation!) {
    updateResource(input: $input) {
      pk
    }
  }
`;
