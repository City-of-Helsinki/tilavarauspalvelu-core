import { Selector } from "testcafe";

class ApplicationDetails {
  heading: Selector;
  applicantType: Selector;
  participants: Selector;

  constructor() {
    this.heading = Selector(
      '[data-testid="application-details__heading--main"]'
    );
    this.applicantType = Selector(
      '[data-testid="application-details__data--applicant-type"]'
    );
    this.participants = Selector(
      '[data-testid="application-details__data--participants"]'
    );
  }
}

export default new ApplicationDetails();
