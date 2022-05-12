import * as React from "react";
import { get as mockGet } from "lodash";
import { render, screen } from "../../../test/testUtils";
import ListWithPagination, { Props } from "../ListWithPagination";
import mockTranslations from "../../../public/locales/fi/searchResultList.json";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string, params?: Record<string, string | number>) => {
        const path = str.replace("searchResultList:", "");
        const key =
          mockGet(mockTranslations, `${path}_plural`) && params?.count > 1
            ? `${path}_plural`
            : path;
        return mockGet(mockTranslations, key)?.replace(
          /{{(.*?)}}/g,
          (val, paramKey) => (params[paramKey] ? params[paramKey] : val)
        );
      },
    };
  },
}));

const defaultProps: Props = {
  id: "foobar",
  items: [],
  totalCount: 0,
  fetchMore: jest.fn(),
  pageInfo: {
    endCursor: "endCursor",
    hasNextPage: true,
    hasPreviousPage: false,
  },
  loading: false,
  loadingMore: false,
};

const getItems = (length: number): JSX.Element[] => {
  return Array.from({ length }, (val, i) => <div key={i}>{i + 1}</div>);
};

const renderComponent = (props?: Partial<Props>) =>
  render(<ListWithPagination {...defaultProps} {...props} />);

describe("ListWithPagination", () => {
  test("should render incompletely paginated list", () => {
    const itemCount = 30;
    renderComponent({
      items: getItems(itemCount),
      totalCount: 100,
      className: "test-hooky",
    });

    expect(document.querySelector("#foobar.test-hooky")).toBeInTheDocument();
    expect(
      screen.queryByTestId("list-with-pagination__hit-count")
    ).toHaveTextContent("100 hakutulosta");
    expect(
      screen
        .queryByTestId("list-with-pagination__list--container")
        .querySelectorAll("div")
    ).toHaveLength(itemCount);
    expect(screen.queryByTestId("loading-spinner")).toBeNull();
    expect(
      screen.queryByTestId("list-with-pagination__pagination--summary")
    ).toHaveTextContent("30 tulosta 100 tuloksesta näytetty");
  });

  test("should render completely paginated list", () => {
    const itemCount = 30;
    renderComponent({
      items: getItems(itemCount),
      totalCount: itemCount,
      className: "test-hooky-2",
      id: "barfoo",
      pageInfo: { hasNextPage: false, hasPreviousPage: false },
    });

    expect(document.querySelector("#barfoo.test-hooky-2")).toBeInTheDocument();
    expect(
      screen.queryByTestId("list-with-pagination__hit-count")
    ).toHaveTextContent("30 hakutulosta");
    expect(
      screen
        .queryByTestId("list-with-pagination__list--container")
        .querySelectorAll("div")
    ).toHaveLength(itemCount);
    expect(screen.queryByTestId("loading-spinner")).toBeNull();
    expect(
      screen.queryByTestId("list-with-pagination__pagination--summary")
    ).toHaveTextContent("Kaikki 30 tulosta näytetty");
  });

  test("should list no items", () => {
    renderComponent({
      items: [],
    });

    expect(
      screen.queryByTestId("list-with-pagination__hit-count")
    ).toHaveTextContent("Ei hakutuloksia");
    expect(
      screen.queryByTestId("list-with-pagination__list--container")
    ).toBeNull();
    expect(screen.queryByTestId("loading-spinner")).toBeNull();
    expect(
      screen.queryByTestId("list-with-pagination__pagination--summary")
    ).toBeNull();
  });

  test("should render loading state", () => {
    renderComponent({
      items: getItems(10),
      totalCount: 20,
      loading: true,
    });

    expect(
      screen.queryByTestId("list-with-pagination__list--container")
    ).toBeNull();
    expect(screen.queryByTestId("list-with-pagination__hit-count")).toBeNull();
    expect(screen.queryByTestId("loading-spinner")).toBeTruthy();
    expect(
      screen.queryByTestId("list-with-pagination__pagination--summary")
    ).toBeNull();
  });

  test("should render paginating state", () => {
    renderComponent({
      items: getItems(10),
      totalCount: 20,
      loadingMore: true,
    });

    expect(
      screen
        .queryByTestId("list-with-pagination__list--container")
        .querySelectorAll("div")
    ).toHaveLength(10);
    expect(
      screen.queryByTestId("list-with-pagination__hit-count")
    ).toHaveTextContent("20 hakutulos");
    expect(screen.queryByTestId("loading-spinner__pagination")).toBeTruthy();
    expect(
      screen.queryByTestId("list-with-pagination__pagination--summary")
    ).toBeNull();
  });
});
