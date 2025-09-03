import React, { useEffect } from "react";
import { Button, ButtonVariant, LoadingSpinner } from "hds-react";
import { useTranslation } from "next-i18next";
import styled from "styled-components";
import { useUpdateSpaceMutation, type SpaceUpdateMutation, useSpaceQuery } from "@gql/gql-types";
import { errorToast, successToast } from "common/src/components/toast";
import { ButtonContainer, CenterSpinner, H2, H3 } from "common/styled";
import { FormErrorSummary } from "@/component/FormErrorSummary";
import { createNodeId, getNode } from "common/src/helpers";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";
import { useRouter } from "next/router";
import { ParentSelector, type SpaceUpdateForm, SpaceForm, SpaceUpdateSchema } from "@lib/units/[id]";
import { SpaceHead } from "./SpaceHead";
import { SpaceHierarchy } from "./SpaceHierarchy";
import { getUnitUrl } from "@/common/urls";

const Form = styled.form`
  display: flex;
  gap: var(--spacing-m);
  flex-direction: column;
  max-width: var(--prose-width);
`;

type Props = {
  space: number;
  unit: number;
};

export function SpaceEditor({ space, unit }: Props): JSX.Element {
  const router = useRouter();
  const { t } = useTranslation();
  const [mutation, { loading: isMutationLoading }] = useUpdateSpaceMutation();
  const displayError = useDisplayError();

  const {
    data,
    refetch,
    loading: isQueryLoading,
  } = useSpaceQuery({
    variables: { id: createNodeId("SpaceNode", space) },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const form = useForm<SpaceUpdateForm>({
    resolver: zodResolver(SpaceUpdateSchema),
    mode: "onChange",
  });
  const { control, handleSubmit, reset, formState, watch } = form;
  const { errors, isDirty } = formState;

  useEffect(() => {
    const space = getNode(data);
    if (space) {
      reset({
        nameFi: space.nameFi ?? "",
        nameSv: space.nameSv ?? "",
        nameEn: space.nameEn ?? "",
        surfaceArea: space.surfaceArea ?? undefined,
        maxPersons: space.maxPersons ?? undefined,
        unit,
        pk: space.pk,
        parent: space.parent?.pk ?? null,
        code: space.code,
      });
    }
  }, [data, reset, unit]);

  const isLoading = isQueryLoading;

  if (isLoading) {
    return <CenterSpinner />;
  }

  const updateSpace = (input: SpaceUpdateMutation) => mutation({ variables: { input } });
  const onSubmit = async (values: SpaceUpdateForm) => {
    try {
      const { parent, surfaceArea, pk, unit, ...rest } = values;
      if (pk == null || pk === 0) {
        throw new Error("Space pk is not defined");
      }
      await updateSpace({
        ...rest,
        pk,
        parent: parent != null && parent > 0 ? parent : null,
        surfaceArea: Math.ceil(surfaceArea ?? 0),
      } satisfies SpaceUpdateMutation);
      successToast({
        text: t("spaces:SpaceEditor.spaceUpdatedNotification"),
      });
      refetch();
      router.replace(getUnitUrl(unit, "spaces-resources"));
    } catch (err) {
      displayError(err);
    }
  };

  const node = getNode(data);

  return (
    <>
      <LinkPrev route={getUnitUrl(unit, "spaces-resources")} />
      <SpaceHead
        title={node?.parent?.nameFi || t("spaces:noParent")}
        space={node}
        maxPersons={watch("maxPersons")}
        surfaceArea={watch("surfaceArea")}
      />
      <H2 $noMargin>{t("spaces:SpaceEditor.details")}</H2>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormErrorSummary errors={errors} />
        <section>
          <H3>{t("spaces:SpaceEditor.hierarchy")}</H3>
          <SpaceHierarchy space={node} />
          <Controller
            control={control}
            name="parent"
            render={({ field: { onChange, value } }) => (
              <ParentSelector
                helperText={t("spaces:SpaceModal.page1.parentHelperText")}
                label={t("spaces:SpaceModal.page1.parentLabel")}
                onChange={(parentPk) => onChange(parentPk)}
                value={value}
                placeholder={t("spaces:SpaceModal.page1.parentPlaceholder")}
                unitPk={unit}
                selfPk={space}
              />
            )}
          />
        </section>
        <section>
          <H3>{t("spaces:SpaceEditor.other")}</H3>
          <SpaceForm form={form} />
        </section>
        <ButtonContainer>
          <Button
            variant={ButtonVariant.Secondary}
            onClick={() => router.replace(getUnitUrl(unit, "spaces-resources"))}
            disabled={isMutationLoading}
          >
            {t("common:cancel")}
          </Button>
          <Button
            variant={isMutationLoading ? ButtonVariant.Clear : ButtonVariant.Primary}
            iconStart={isMutationLoading ? <LoadingSpinner small /> : undefined}
            disabled={!isDirty || isMutationLoading}
            type="submit"
          >
            {t("common:save")}
          </Button>
        </ButtonContainer>
      </Form>
    </>
  );
}

export const UPDATE_SPACE = gql`
  mutation UpdateSpace($input: SpaceUpdateMutation!) {
    updateSpace(input: $input) {
      pk
    }
  }
`;

export const SPACE_PAGE_FRAGMENT = gql`
  fragment SpacePage on SpaceNode {
    id
    pk
    nameFi
    nameSv
    nameEn
    code
    surfaceArea
    maxPersons
    unit {
      id
      ...UnitSubpageHead
      descriptionFi
      spaces {
        id
        pk
        nameFi
      }
    }
    parent {
      id
      pk
      nameFi
      parent {
        id
        nameFi
        parent {
          id
          nameFi
        }
      }
    }
  }
`;

// TODO why does this query parents up the tree?
export const SPACE_QUERY = gql`
  query Space($id: ID!) {
    node(id: $id) {
      ... on SpaceNode {
        ...SpacePage
      }
    }
  }
`;
