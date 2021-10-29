describe("Tilavaraus ui reservation unit page (recurring)", () => {
  beforeEach(() => {
    cy.visit("/reservation-unit/36");
  });

  it("displays default elements", () => {
    cy.get("h1").should("contain", "Pukinmäen nuorisotalon keittiö");
  });
});
