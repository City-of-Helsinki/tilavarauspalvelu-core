import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubPageHead, ResourceEditorFields, Editor, ResourceUpdateSchema } from "@lib/units/[id]";
import type { ResourceUpdateForm } from "@lib/units/[id]";
import { Button, ButtonVariant } from "hds-react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { errorToast, successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { createNodeId } from "ui/src/modules/helpers";
import { ButtonContainer, CenterSpinner } from "ui/src/styled";
import { Error404 } from "@/components/Error404";
import { FormErrorSummary } from "@/components/FormErrorSummary";
import { LinkPrev } from "@/components/LinkPrev";
import { getUnitUrl } from "@/modules/urls";
import { ResourceLocationType, useUpdateResourceMutation, useResourceQuery } from "@gql/gql-types";
import type { ResourceUpdateMutationInput } from "@gql/gql-types";

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

  const { unit, resource } = data ?? previousData ?? {};

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
      ...LocationFields
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
