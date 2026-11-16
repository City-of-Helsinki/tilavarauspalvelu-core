from utils.utils import with_indices


def test_with_indices():
    test_list = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9]

    for i, item in (gen := with_indices(test_list)):
        if item % 2 == 0:
            del test_list[i]
            gen.item_deleted = True
        if item % 3 == 0:
            test_list.append(10)

    assert test_list == [1, 1, 3, 3, 5, 5, 7, 7, 9, 9]
