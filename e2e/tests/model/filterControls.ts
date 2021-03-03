import { Selector } from "testcafe";

class FilterControls {
  toggleButton: Selector;
  lastGroup: Selector;
  lastGroupCheckbox: Selector;
  resetButton: Selector;
  submitButton: Selector;

  constructor() {
    this.toggleButton = Selector(
      '[data-testid="data-table__button--filter-toggle"]'
    );
    this.lastGroup = Selector(
      '[data-testid="filter-controls__group"]:last-of-type > [data-testid="accordion__header"]'
    );
    this.lastGroupCheckbox = Selector(
      '[data-testid="filter-controls__group"]:last-of-type'
    ).find("input");
    this.resetButton = Selector(
      '[data-testid="filter-controls__button--reset"]'
    );
    this.submitButton = Selector(
      '[data-testid="filter-controls__button--submit"]'
    );
  }
}

export default new FilterControls();
