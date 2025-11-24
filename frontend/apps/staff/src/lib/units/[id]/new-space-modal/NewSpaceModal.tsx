import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { gql } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDisplayError } from "ui/src/hooks";
import { useCreateSpaceMutation } from "@gql/gql-types";
import type { NewResourceUnitFieldsFragment, SpaceCreateMutationInput } from "@gql/gql-types";
import type { SpaceUpdateForm } from "../SpaceForm";
import { SpaceUpdateSchema } from "../SpaceForm";
import { UnitInfo } from "../UnitInfo";
import { Page1 } from "./Page1";
import { Page2 } from "./Page2";

type Props = {
  unit: NewResourceUnitFieldsFragment;
  parentSpacePk?: number | null;
  closeModal: () => void;
  refetch: () => Promise<unknown>;
};

export function NewSpaceModal({ unit, closeModal, refetch, parentSpacePk }: Props): JSX.Element | null {
  const [mutation] = useCreateSpaceMutation();

  const createSpace = (input: SpaceCreateMutationInput) => mutation({ variables: { input } });

  const form = useForm<SpaceUpdateForm>({
    resolver: zodResolver(SpaceUpdateSchema),
    values: {
      unit: unit?.pk ?? 0,
      nameFi: "",
      nameSv: "",
      nameEn: "",
      parent: parentSpacePk ?? null,
      pk: undefined,
    },
  });
  const displayError = useDisplayError();

  async function createSpaces({ parent, ...values }: SpaceUpdateForm) {
    try {
      await createSpace({
        ...values,
        parent: parent != null && parent > 0 ? parent : null,
        name: values.nameFi,
      });
      closeModal();
      refetch();
    } catch (err) {
      displayError(err);
    }
  }

  const [page, setPage] = useState(0);

  // TODO this is weird, what's the difference between fixed parent and a normal parent?
  // i.e. this is set on creation but is it an important distinction to watch("parent")?
  const hasFixedParent = parentSpacePk != null;
  const { watch } = form;

  const parentPk = watch("parent");
  const parentName = unit?.spaces.find((space) => space.pk === parentPk)?.nameFi ?? null;

  return (
    <form noValidate onSubmit={form.handleSubmit(createSpaces)}>
      {page === 0 ? (
        <Page1
          unit={unit}
          closeModal={closeModal}
          hasFixedParent={hasFixedParent}
          form={form}
          onNextPage={() => setPage(1)}
        >
          <UnitInfo parentName={parentName} unit={unit} />
        </Page1>
      ) : (
        <Page2 form={form} onPrevPage={() => setPage(0)} hasFixedParent={hasFixedParent}>
          <UnitInfo parentName={parentName} unit={unit} />
        </Page2>
      )}
    </form>
  );
}

// Common with resources (the modals are almost identical)
export const NEW_RESOURCE_UNIT_FRAGMENT = gql`
  fragment NewResourceUnitFields on UnitNode {
    ...UnitResourceInfoFields
    spaces {
      id
      pk
      nameFi
    }
  }
`;

export const CREATE_SPACE_MUTATION = gql`
  mutation CreateSpace($input: SpaceCreateMutationInput!) {
    createSpace(input: $input) {
      pk
    }
  }
`;
