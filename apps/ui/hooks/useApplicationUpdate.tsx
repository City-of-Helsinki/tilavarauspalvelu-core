import { useMutation } from "@apollo/client";
import type {
  Mutation,
  MutationUpdateApplicationArgs,
  ApplicationUpdateMutationInput,
} from "common/types/gql-types";
import { UPDATE_APPLICATION_MUTATION } from "@/modules/queries/application";

export function useApplicationUpdate() {
  const [mutate, { error, loading: isLoading }] = useMutation<
    Mutation,
    MutationUpdateApplicationArgs
  >(UPDATE_APPLICATION_MUTATION);

  const update = async (
    input: ApplicationUpdateMutationInput
  ): Promise<number> => {
    try {
      const response = await mutate({
        variables: {
          input,
        },
      });
      const { data, errors } = response;
      const { pk } = data?.updateApplication ?? {};
      if (errors != null) {
        // eslint-disable-next-line no-console
        console.error("Error saving application: ", errors);
        return 0;
      }
      // TODO do a refetch here instead of cache modification (after moving to fetch hook)
      return pk ?? 0;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Error thrown while saving application: ", e);
      return 0;
    }
  };

  return [update, { error, isLoading }] as const;
}
