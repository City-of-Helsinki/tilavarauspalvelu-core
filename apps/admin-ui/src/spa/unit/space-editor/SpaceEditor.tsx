import React, { useEffect } from "react";
import { Button, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { H2 } from "common/src/common/typography";
import {
  useUpdateSpaceMutation,
  type SpaceUpdateMutationInput,
  useSpaceQuery,
} from "@gql/gql-types";
import { errorToast, successToast } from "common/src/common/toast";
import Loader from "@/component/Loader";
import { ButtonContainer, Container } from "@/styles/layout";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { Head } from "./Head";
import { SpaceHierarchy } from "./SpaceHierarchy";
import { ParentSelector } from "./ParentSelector";
import {
  type SpaceUpdateForm,
  SpaceForm,
  SpaceUpdateSchema,
} from "./SpaceForm";
import { base64encode } from "common/src/helpers";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const Editor = styled.div`
  margin: 0;
  max-width: var(--prose-width);
`;

const Section = styled.section`
  margin: var(--spacing-m) 0;
`;

const SubHeading = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-m);
`;

type Props = {
  space: number;
  unit: number;
};

function SpaceEditor({ space, unit }: Props): JSX.Element {
  const history = useNavigate();

  const { t } = useTranslation();

  const [updateSpaceMutation, { loading: isMutationLoading }] =
    useUpdateSpaceMutation();

  const updateSpace = (input: SpaceUpdateMutationInput) =>
    updateSpaceMutation({ variables: { input } });

  const {
    data,
    refetch,
    loading: isQueryLoading,
    error,
  } = useSpaceQuery({
    variables: { id: base64encode(`SpaceNode:${space}`) },
    onError: (e) => {
      errorToast({ text: t("errors.errorFetchingData", { error: e }) });
    },
  });

  const form = useForm<SpaceUpdateForm>({
    resolver: zodResolver(SpaceUpdateSchema),
    mode: "onChange",
  });
  const { control, handleSubmit, reset, formState, watch } = form;
  const { errors, isDirty } = formState;

  useEffect(() => {
    if (data?.space != null) {
      const { space: s } = data;
      reset({
        nameFi: s.nameFi ?? "",
        nameSv: s.nameSv ?? "",
        nameEn: s.nameEn ?? "",
        surfaceArea: s.surfaceArea ?? undefined,
        maxPersons: s.maxPersons ?? undefined,
        unit,
        pk: s.pk ?? 0,
        parent: s.parent?.pk ?? null,
        code: s.code,
      });
    }
  }, [data, reset, unit]);

  const isLoading = isQueryLoading;

  if (isLoading) {
    return <Loader />;
  }

  if (error != null) {
    return (
      <div>
        <Notification
          type="error"
          label={t("errors.functionFailedTitle")}
          position="top-center"
          autoClose={false}
          dismissible
          closeButtonLabelText={t("common.close")}
          displayAutoCloseProgress={false}
        >
          {t(error.message)}
        </Notification>
      </div>
    );
  }

  const onSubmit = async (values: SpaceUpdateForm) => {
    try {
      const { surfaceArea, pk, ...rest } = values;
      if (pk == null || pk === 0) {
        errorToast({ text: t("SpaceEditor.saveFailed") });
        return;
      }
      await updateSpace({
        ...rest,
        pk,
        surfaceArea: Math.ceil(surfaceArea ?? 0),
      });
      successToast({
        text: t("SpaceEditor.spaceUpdatedNotification"),
        label: t("SpaceEditor.spaceUpdated"),
      });
      refetch();
    } catch (e) {
      errorToast({ text: t("SpaceEditor.saveFailed") });
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Container>
        <Head
          title={data?.space?.parent?.nameFi || t("SpaceEditor.noParent")}
          space={data?.space}
          maxPersons={watch("maxPersons") || undefined}
          surfaceArea={watch("surfaceArea") || undefined}
        />
        <H2 $legacy style={{ margin: 0 }}>
          {t("SpaceEditor.details")}
        </H2>
        <Editor>
          <FormErrorSummary errors={errors} />
          <Section>
            <SubHeading>{t("SpaceEditor.hierarchy")}</SubHeading>
            <SpaceHierarchy space={data?.space} />
            <Controller
              control={control}
              name="parent"
              render={({ field: { onChange, value } }) => (
                <ParentSelector
                  helperText={t("SpaceModal.page1.parentHelperText")}
                  label={t("SpaceModal.page1.parentLabel")}
                  onChange={(parentPk) => onChange(parentPk)}
                  value={value}
                  placeholder={t("SpaceModal.page1.parentPlaceholder")}
                  unitPk={unit}
                  selfPk={space}
                />
              )}
            />
          </Section>
          <Section>
            <SubHeading>{t("SpaceEditor.other")}</SubHeading>
            <SpaceForm form={form} />
          </Section>
          <ButtonContainer>
            <Button
              variant="secondary"
              theme="black"
              type="button"
              onClick={() => history(-1)}
              disabled={isMutationLoading}
            >
              {t("SpaceEditor.cancel")}
            </Button>
            <Button
              disabled={!isDirty}
              variant="primary"
              type="submit"
              isLoading={isMutationLoading}
            >
              {t("SpaceEditor.save")}
            </Button>
          </ButtonContainer>
        </Editor>
      </Container>
    </form>
  );
}

export default SpaceEditor;
