import React, { useEffect } from "react";
import { Button } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type Mutation,
  type Query,
  type ResourceUpdateMutationInput,
  type QueryUnitArgs,
  type QueryResourceArgs,
  LocationType,
} from "common/types/gql-types";
import { base64encode } from "common/src/helpers";
import { UNIT_WITH_SPACES_AND_RESOURCES } from "@/common/queries";
import Loader from "@/component/Loader";
import { ButtonContainer, Container, IngressContainer } from "@/styles/layout";
import { SubPageHead } from "@/component/Unit/SubPageHead";
import { useNotification } from "@/context/NotificationContext";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { RESOURCE_QUERY, UPDATE_RESOURCE } from "./queries";
import {
  Editor,
  ResourceUpdateSchema,
  type ResourceUpdateForm,
} from "./modules/resourceEditor";
import { ResourceEditorFields } from "./EditForm";
import BreadcrumbWrapper from "app/component/BreadcrumbWrapper";

type Props = {
  resourcePk?: number;
  unitPk: number;
};

export function ResourceEditor({ resourcePk, unitPk }: Props) {
  const history = useNavigate();
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useNotification();

  const { data: unitData, loading: isUnitLoading } = useQuery<
    Query,
    QueryUnitArgs
  >(UNIT_WITH_SPACES_AND_RESOURCES, {
    variables: { id: base64encode(`UnitNode:${unitPk}`) },
    skip: !unitPk || Number.isNaN(unitPk),
    onError: (e) => {
      notifyError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const {
    data,
    loading: isSpaceLoading,
    refetch,
  } = useQuery<Query, QueryResourceArgs>(RESOURCE_QUERY, {
    variables: { id: base64encode(`ResourceNode:${resourcePk}`) },
    skip: !resourcePk || Number.isNaN(resourcePk),
    onError: (e) => {
      notifyError(t("errors.errorFetchingData", { error: e }));
    },
  });

  const isLoading = isUnitLoading || isSpaceLoading;

  const [mutation] = useMutation<Mutation>(UPDATE_RESOURCE);

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

  if (isLoading) {
    return <Loader />;
  }

  // TODO errors (pk error, query error etc.)
  if (data?.resource == null || unitData?.unit == null) {
    return null;
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

      notifySuccess(
        t("ResourceEditor.resourceUpdatedNotification"),
        t("ResourceEditor.resourceUpdated")
      );
      history(-1);
    } catch (error) {
      notifyError(t("ResourceModal.saveError"));
    }
  };

  const unit = unitData.unit;
  const resource = data.resource;

  // TODO use url builder
  const previousPage = `/unit/${unitPk}/spacesResources`;
  return (
    <>
      <BreadcrumbWrapper backLink={previousPage} />
      <Container>
        <SubPageHead
          unit={unit}
          title={resource.nameFi || t("ResourceEditor.defaultHeading")}
        />
        <IngressContainer>
          <FormErrorSummary errors={errors} />
        </IngressContainer>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Editor>
            <ResourceEditorFields form={form} unitPk={unitPk} />
            <ButtonContainer>
              <Button
                onClick={() => history(-1)}
                variant="secondary"
                theme="black"
              >
                {t("ResourceModal.cancel")}
              </Button>
              <Button type="submit" disabled={!isDirty}>
                {t("ResourceModal.save")}
              </Button>
            </ButtonContainer>
          </Editor>
        </form>
      </Container>
    </>
  );
}
