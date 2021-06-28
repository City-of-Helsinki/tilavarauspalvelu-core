import { Selector } from "testcafe";

class DataTable {
  body: Selector;
  applicationCount: Selector;
  rows: Selector;

  constructor() {
    this.body = Selector('[data-testid="data-table"').child("tbody");
    this.applicationCount = Selector('[data-testid="application-count"]');
    this.rows = Selector('[data-testid="data-table"')
      .child("tbody")
      .child("tr");
  }
}

export default new DataTable();
