import pytest

from applications.choices import ApplicationSectionStatusChoice
from tests.factories import ApplicationSectionFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_section.helpers import DELETE_MUTATION, get_application_section_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "status",
    [
        ApplicationSectionStatusChoice.IN_ALLOCATION,
        ApplicationSectionStatusChoice.HANDLED,
        # TODO: Later when the feature is implemented:
        #  ApplicationSectionStatusChoice.RESERVED,
        #  ApplicationSectionStatusChoice.FAILED,
    ],
)
def test_cannot_delete_application_event_not_unallocated(graphql, status):
    # given:
    # - There is an application event with the given status
    # - A superuser is using the system
    section = ApplicationSectionFactory.create_in_status(status)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to delete an application event
    data = get_application_section_delete_data(section)
    response = graphql(DELETE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about modifying the event
    assert response.field_error_messages() == ["Application section has been allocated and cannot be deleted anymore."]
