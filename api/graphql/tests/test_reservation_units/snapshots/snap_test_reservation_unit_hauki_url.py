# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['ReservationUnitHaukiUrlTestCase::test_admin_can_get_the_url 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=amin.general%40foo.com&hsa_organization=tprek%3Adepid&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=46f03c933a0f7e32bce2a79dc7e38df10c513fe439c8fd80cad73a273f476f28&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711'
        }
    }
}

snapshots['ReservationUnitHaukiUrlTestCase::test_getting_url_raises_error_if_one_of_target_reservation_unit_not_exist 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': None
        }
    },
    'errors': [
        {
            'locations': [
                {
                    'column': 21,
                    'line': 4
                }
            ],
            'message': 'Wrong identifier for reservation unit in url generation.',
            'path': [
                'reservationUnitHaukiUrl',
                'url'
            ]
        }
    ]
}

snapshots['ReservationUnitHaukiUrlTestCase::test_getting_url_raises_error_if_reservation_unit_not_exist 1'] = {
    'data': {
        'reservationUnitHaukiUrl': None
    },
    'errors': [
        {
            'locations': [
                {
                    'column': 17,
                    'line': 3
                }
            ],
            'message': 'No ReservationUnit matches the given query.',
            'path': [
                'reservationUnitHaukiUrl'
            ]
        }
    ]
}

snapshots['ReservationUnitHaukiUrlTestCase::test_regular_user_gets_none_url 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': None
        }
    }
}

snapshots['ReservationUnitHaukiUrlTestCase::test_service_sector_admin_can_get_the_url 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=amin.dee%40foo.com&hsa_organization=tprek%3Adepid&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=13936b91c1ff3334534b386a807459d6696343c32fe9872ea46e687693378cb2&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711'
        }
    }
}

snapshots['ReservationUnitHaukiUrlTestCase::test_unit_admin_can_get_url 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=amin.dee%40foo.com&hsa_organization=tprek%3Adepid&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=13936b91c1ff3334534b386a807459d6696343c32fe9872ea46e687693378cb2&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711'
        }
    }
}

snapshots['ReservationUnitHaukiUrlTestCase::test_url_does_not_contain_reservation_unit_not_in_same_unit 1'] = {
    'data': {
        'reservationUnitHaukiUrl': {
            'url': 'https://test.com/resource/origin%3A3774af34-9916-40f2-acc7-68db5a627710/?hsa_source=origin&hsa_username=amin.general%40foo.com&hsa_organization=tprek%3Adepid&hsa_created_at=2021-05-03T03%3A00%3A00%2B03%3A00&hsa_valid_until=2021-05-03T03%3A30%3A00%2B03%3A00&hsa_resource=origin%3A3774af34-9916-40f2-acc7-68db5a627710&hsa_has_organization_rights=true&hsa_signature=46f03c933a0f7e32bce2a79dc7e38df10c513fe439c8fd80cad73a273f476f28&target_resources=origin%3A3774af34-9916-40f2-acc7-68db5a627711'
        }
    }
}
