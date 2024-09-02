import React, { useState } from "react";
import { type ApolloQueryResult } from "@apollo/client";
import {
  useCreateSpaceMutation,
  type SpaceCreateMutationInput,
  type SpaceNode,
  type UnitQuery,
} from "@gql/gql-types";
import { Page1 } from "./Page1";
import { Page2 } from "./Page2";
import { useForm } from "react-hook-form";
import { SpaceUpdateSchema, SpaceUpdateForm } from "../SpaceForm";
import { zodResolver } from "@hookform/resolvers/zod";
import { errorToast } from "common/src/common/toast";
import { useTranslation } from "react-i18next";

type Props = {
  unit: UnitQuery["unit"];
  parentSpace?: SpaceNode;
  closeModal: () => void;
  refetch: () => Promise<ApolloQueryResult<UnitQuery>>;
};

export function NewSpaceModal({
  unit,
  closeModal,
  refetch,
  parentSpace,
}: Props): JSX.Element | null {
  const { t } = useTranslation();
  const [mutation] = useCreateSpaceMutation();

  const createSpace = (input: SpaceCreateMutationInput) =>
    mutation({ variables: { input } });

  const form = useForm<SpaceUpdateForm>({
    resolver: zodResolver(SpaceUpdateSchema),
    values: {
      unit: unit?.pk ?? 0,
      nameFi: "",
      nameSv: "",
      nameEn: "",
      parent: parentSpace?.pk ?? null,
      pk: undefined,
    },
  });

  async function createSpaces(values: SpaceUpdateForm) {
    try {
      await createSpace({
        ...values,
        name: values.nameFi,
      });
      closeModal();
      refetch();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      errorToast({ text: t("SpaceModal.page2.saveFailed") });
    }
  }

  const [page, setPage] = useState(0);

  const hasFixedParent = Boolean(parentSpace);
  return (
    <form noValidate onSubmit={form.handleSubmit(createSpaces)}>
      {page === 0 ? (
        <Page1
          unit={unit}
          closeModal={closeModal}
          hasFixedParent={hasFixedParent}
          form={form}
          onNextPage={() => setPage(1)}
        />
      ) : (
        <Page2
          unit={unit}
          form={form}
          onPrevPage={() => setPage(0)}
          closeModal={closeModal}
          hasFixedParent={hasFixedParent}
        />
      )}
    </form>
  );
}
