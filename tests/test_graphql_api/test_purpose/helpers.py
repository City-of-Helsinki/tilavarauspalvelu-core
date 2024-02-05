from functools import partial

from tests.gql_builders import build_mutation, build_query

purposes_query = partial(build_query, "purposes", connection=True)

CREATE_MUTATION = build_mutation(
    "createPurpose",
    "PurposeCreateMutationInput",
    selections="""
        purpose {
            pk
        }
        errors {
            messages
            field
        }
    """,
)
UPDATE_MUTATION = build_mutation(
    "updatePurpose",
    "PurposeUpdateMutationInput",
    selections="""
        purpose {
            pk
        }
        errors {
            messages
            field
        }
    """,
)
