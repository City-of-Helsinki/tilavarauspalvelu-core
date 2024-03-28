import React, { useEffect } from "react";
import { Button, Notification } from "hds-react";
import { useMutation, useQuery } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { H1 } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import type {
  Mutation,
  MutationUpdateSpaceArgs,
  Query,
  QuerySpaceArgs,
  SpaceUpdateMutationInput,
} from "common/types/gql-types";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { ContentContainer } from "@/styles/layout";
import { FormErrorSummary } from "@/common/FormErrorSummary";
import { SPACE_QUERY, UPDATE_SPACE } from "./queries";
import Head from "./Head";
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

const EditorContainer = styled.div`
  margin: 0;
  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const Editor = styled.div`
  margin: 0;
  max-width: 52rem;

  @media (min-width: ${breakpoints.l}) {
    margin: 0 var(--spacing-layout-m);
  }
`;

const Section = styled.div`
  margin: var(--spacing-layout-l) 0;
`;

const SubHeading = styled.div`
  font-family: var(--tilavaraus-admin-font-bold);
  font-size: var(--fontsize-heading-xs);
  margin-bottom: var(--spacing-m);
`;

const Buttons = styled.div`
  display: flex;
  margin: var(--spacing-layout-m) 0;
`;

const SaveButton = styled(Button)`
  margin-left: auto;
`;

type Props = {
  space: number;
  unit: number;
};

function SpaceEditor({ space, unit }: Props): JSX.Element {
  const history = useNavigate();

  const { notifyError, notifySuccess } = useNotification();

  const { t } = useTranslation();

  const [updateSpaceMutation, { loading: isMutationLoading }] = useMutation<
    Mutation,
    MutationUpdateSpaceArgs
  >(UPDATE_SPACE);

  const updateSpace = (input: SpaceUpdateMutationInput) =>
    updateSpaceMutation({ variables: { input } });

  const {
    data,
    refetch,
    loading: isQueryLoading,
    error,
  } = useQuery<Query, QuerySpaceArgs>(SPACE_QUERY, {
    variables: { id: base64encode(`SpaceNode:${space}`) },
    onError: (e) => {
      notifyError(t("errors.errorFetchingData", { error: e }));
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

  const isLoading = isMutationLoading || isQueryLoading;

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
        notifyError(t("SpaceEditor.saveFailed"));
        return;
      }
      await updateSpace({
        ...rest,
        pk,
        surfaceArea: Math.ceil(surfaceArea ?? 0),
      });
      notifySuccess(
        t("SpaceEditor.spaceUpdatedNotification"),
        t("SpaceEditor.spaceUpdated")
      );
      refetch();
    } catch (e) {
      notifyError(t("SpaceEditor.saveFailed"));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Head
        title={data?.space?.parent?.nameFi || t("SpaceEditor.noParent")}
        unit={data?.space?.unit}
        maxPersons={watch("maxPersons") || undefined}
        surfaceArea={watch("surfaceArea") || undefined}
      />
      <ContentContainer>
        <EditorContainer>
          <H1 $legacy>{t("SpaceEditor.details")}</H1>
          <Editor>
            <FormErrorSummary errors={errors} />
            <Section>
              <SubHeading>{t("SpaceEditor.hierarchy")}</SubHeading>
              {data?.space && (
                <SpaceHierarchy
                  space={data?.space}
                  unitSpaces={data?.unit?.spaces}
                />
              )}
              <Controller
                control={control}
                name="parent"
                render={({ field: { onChange, value } }) => (
                  <ParentSelector
                    helperText={t("SpaceModal.page1.parentHelperText")}
                    label={t("SpaceModal.page1.parentLabel")}
                    // FIXME this should remove this space from the list
                    onChange={(parentPk) => onChange(parentPk)}
                    value={value}
                    placeholder={t("SpaceModal.page1.parentPlaceholder")}
                    unitPk={unit}
                  />
                )}
              />
            </Section>
            <Section>
              <SubHeading>{t("SpaceEditor.other")}</SubHeading>
              <SpaceForm form={form} />
            </Section>
            <Buttons>
              <Button
                variant="secondary"
                type="button"
                onClick={() => history(-1)}
                // TODO check loading state on mutations
              >
                {t("SpaceEditor.cancel")}
              </Button>
              <SaveButton
                disabled={!isDirty}
                type="submit"
                isLoading={isLoading}
                // loadingText={t("saving")}
              >
                {t("SpaceEditor.save")}
              </SaveButton>
            </Buttons>
          </Editor>
        </EditorContainer>
      </ContentContainer>
    </form>
  );
}

export default SpaceEditor;
