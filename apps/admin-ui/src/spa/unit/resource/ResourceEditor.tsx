import React, { useEffect } from "react";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ResourceUpdateMutationInput,
  LocationType,
  useUpdateResourceMutation,
  useResourceQuery,
  useUnitWithSpacesAndResourcesQuery,
} from "@gql/gql-types";
import { base64encode } from "common/src/helpers";
import Loader from "@/component/Loader";
import { ButtonContainer } from "common/styles/util";
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

type Props = {
  resourcePk?: number;
  unitPk: number;
};

export function ResourceEditor({ resourcePk, unitPk }: Props) {
  const history = useNavigate();
  const { t } = useTranslation();

  const { data: unitData, loading: isUnitLoading } =
    useUnitWithSpacesAndResourcesQuery({
      variables: { id: base64encode(`UnitNode:${unitPk}`) },
      skip: !unitPk || Number.isNaN(unitPk),
      onError: (e) => {
        errorToast({ text: t("errors.errorFetchingData", { error: e }) });
      },
    });

  const {
    data,
    loading: isSpaceLoading,
    refetch,
  } = useResourceQuery({
    variables: { id: base64encode(`ResourceNode:${resourcePk}`) },
    skip: !resourcePk || Number.isNaN(resourcePk),
    onError: (e) => {
      errorToast({ text: t("errors.errorFetchingData", { error: e }) });
    },
  });

  const isLoading = isUnitLoading || isSpaceLoading;

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

      successToast({
        text: t("ResourceEditor.resourceUpdatedNotification"),
      });
      refetch();
      history(-1);
    } catch (error) {
      errorToast({ text: t("ResourceModal.saveError") });
    }
  };

  const unit = unitData.unit;
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
    </>
  );
}
