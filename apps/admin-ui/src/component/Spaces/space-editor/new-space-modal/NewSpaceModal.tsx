import React, { useState } from "react";
import { type ApolloQueryResult, useMutation } from "@apollo/client";
import type {
  Query,
  SpaceCreateMutationInput,
  SpaceCreateMutationPayload,
  SpaceNode,
  UnitNode,
} from "@gql/gql-types";
import { CREATE_SPACE } from "../queries";
import { Page1 } from "./Page1";
import { Page2 } from "./Page2";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { SpaceUpdateSchema, SpaceUpdateForm } from "../SpaceForm";
import { useNotification } from "app/context/NotificationContext";
import { zodResolver } from "@hookform/resolvers/zod";

type Props = {
  unit: UnitNode;
  parentSpace?: SpaceNode;
  closeModal: () => void;
  refetch: () => Promise<ApolloQueryResult<Query>>;
};

export function NewSpaceModal({
  unit,
  closeModal,
  refetch,
  parentSpace,
}: Props): JSX.Element | null {
  const [mutation] = useMutation<
    { createSpace: SpaceCreateMutationPayload },
    { input: SpaceCreateMutationInput }
  >(CREATE_SPACE);

  const createSpace = (input: SpaceCreateMutationInput) =>
    mutation({ variables: { input } });

  const { notifyError } = useNotification();

  const { t } = useTranslation();

  const form = useForm<SpaceUpdateForm>({
    resolver: zodResolver(SpaceUpdateSchema),
    values: {
      unit: unit.pk ?? 0,
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
      notifyError(t("SpaceModal.page2.saveFailed"));
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
