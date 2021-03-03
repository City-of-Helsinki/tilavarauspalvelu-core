import { Selector } from "testcafe";

class Application {
  detailsLink: Selector;
  heading: Selector;
  statusBlock: Selector;
  applicantType: Selector;
  participants: Selector;
  reservationsTotal: Selector;
  minDurationTotal: Selector;
  stateToggleButton: Selector;

  constructor() {
    this.detailsLink = Selector('[data-testid="application__link--details"]');
    this.heading = Selector('[data-testid="application__heading--main"]');
    this.statusBlock = Selector('[data-testid="status-block__wrapper"]');
    this.applicantType = Selector(
      '[data-testid="application__data--applicant-type"]'
    );
    this.participants = Selector(
      '[data-testid="application__data--participants"]'
    );
    this.reservationsTotal = Selector(
      '[data-testid="application__data--reservations-total"'
    );
    this.minDurationTotal = Selector(
      '[data-testid="application__data--min-duration-total"'
    );
    this.stateToggleButton = Selector(
      '[data-testid="application__button--toggle-state"]'
    );
  }
}

export default new Application();
