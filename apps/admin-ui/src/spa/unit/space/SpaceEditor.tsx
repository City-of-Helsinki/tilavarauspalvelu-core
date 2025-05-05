import React, { useEffect } from "react";
import { Button, ButtonVariant, LoadingSpinner, Notification } from "hds-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  useUpdateSpaceMutation,
  type SpaceUpdateMutationInput,
  useSpaceQuery,
} from "@gql/gql-types";
import { errorToast, successToast } from "common/src/common/toast";
import { ButtonContainer, CenterSpinner, H2, H3 } from "common/styled";
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
import { LinkPrev } from "@/component/LinkPrev";
import { gql } from "@apollo/client";
import { useDisplayError } from "common/src/hooks";

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

function SpaceEditor({ space, unit }: Props): JSX.Element {
  const history = useNavigate();

  const { t } = useTranslation();

  const [mutation, { loading: isMutationLoading }] = useUpdateSpaceMutation();

  const updateSpace = (input: SpaceUpdateMutationInput) =>
    mutation({ variables: { input } });

  const displayError = useDisplayError();
  const {
    data,
    refetch,
    loading: isQueryLoading,
    error,
  } = useSpaceQuery({
    variables: { id: base64encode(`SpaceNode:${space}`) },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
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
        nameFi: s.nameTranslations.fi ?? "",
        nameSv: s.nameTranslations.sv ?? "",
        nameEn: s.nameTranslations.en ?? "",
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
    return <CenterSpinner />;
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
      const { parent, surfaceArea, pk, ...rest } = values;
      if (pk == null || pk === 0) {
        throw new Error("Space pk is not defined");
      }
      await updateSpace({
        ...rest,
        pk,
        parent: parent != null && parent > 0 ? parent : null,
        surfaceArea: Math.ceil(surfaceArea ?? 0),
      });
      successToast({
        text: t("SpaceEditor.spaceUpdatedNotification"),
      });
      refetch();
      history(-1);
    } catch (err) {
      displayError(err);
    }
  };

  return (
    <>
      <LinkPrev route="../.." />
      <Head
        title={
          data?.space?.parent?.nameTranslations.fi || t("SpaceEditor.noParent")
        }
        space={data?.space}
        maxPersons={watch("maxPersons") || undefined}
        surfaceArea={watch("surfaceArea") || undefined}
      />
      <H2 $noMargin>{t("SpaceEditor.details")}</H2>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <FormErrorSummary errors={errors} />
        <section>
          <H3>{t("SpaceEditor.hierarchy")}</H3>
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
        </section>
        <section>
          <H3>{t("SpaceEditor.other")}</H3>
          <SpaceForm form={form} />
        </section>
        <ButtonContainer>
          <Button
            variant={ButtonVariant.Secondary}
            type="button"
            onClick={() => history(-1)}
            disabled={isMutationLoading}
          >
            {t("SpaceEditor.cancel")}
          </Button>
          <Button
            variant={
              isMutationLoading ? ButtonVariant.Clear : ButtonVariant.Primary
            }
            iconStart={isMutationLoading ? <LoadingSpinner small /> : undefined}
            disabled={!isDirty || isMutationLoading}
            type="submit"
          >
            {t("SpaceEditor.save")}
          </Button>
        </ButtonContainer>
      </Form>
    </>
  );
}

export default SpaceEditor;

export const UPDATE_SPACE = gql`
  mutation UpdateSpace($input: SpaceUpdateMutationInput!) {
    updateSpace(input: $input) {
      pk
    }
  }
`;

// TODO why does this query parents up the tree?
export const SPACE_QUERY = gql`
  query Space($id: ID!) {
    space(id: $id) {
      id
      pk
      nameTranslations {
        fi
        en
        sv
      }
      code
      surfaceArea
      maxPersons
      unit {
        id
        ...UnitSubpageHead
        descriptionTranslations {
          fi
        }
        spaces {
          id
          pk
          nameTranslations {
            fi
          }
        }
      }
      parent {
        id
        pk
        nameTranslations {
          fi
        }
        parent {
          id
          nameTranslations {
            fi
          }
          parent {
            id
            nameTranslations {
              fi
            }
          }
        }
      }
    }
  }
`;
