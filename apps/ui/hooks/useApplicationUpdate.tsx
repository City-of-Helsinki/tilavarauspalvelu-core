import { useMutation } from "@apollo/client";
import type {
  Mutation,
  MutationUpdateApplicationArgs,
  ApplicationUpdateMutationInput,
} from "common/types/gql-types";
import { UPDATE_APPLICATION_MUTATION } from "@/modules/queries/application";

export const useApplicationUpdate = () => {
  const [mutate, { error, loading: isLoading }] = useMutation<
    Mutation,
    MutationUpdateApplicationArgs
  >(UPDATE_APPLICATION_MUTATION);

  const update = async (input: ApplicationUpdateMutationInput) => {
    try {
      const response = await mutate({
        variables: {
          input,
        },
      });
      const { data, errors } = response;
      const { errors: mutErrors, pk } = data?.updateApplication ?? {};
      if (errors != null) {
        // eslint-disable-next-line no-console
        console.error("Error saving application: ", errors);
        return 0;
      }
      if (mutErrors != null) {
        // eslint-disable-next-line no-console
        console.error("Mutation error saving application: ", errors);
        return 0;
      }
      // TODO do a refetch here instead of cache modification (after moving to fetch hook)
      return pk;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error thrown while saving application: ", e);
      return 0;
    }
  };

  return [update, { error, isLoading }] as const;
};
