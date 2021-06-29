import { Selector } from "testcafe";

class Navigation {
  linkPrev: Selector;

  constructor() {
    this.linkPrev = Selector('[data-testid="link__previous"]');
  }
}

export default new Navigation();
