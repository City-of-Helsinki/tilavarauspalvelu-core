import config from "./config";
import application from "./model/application";
import applicationDetails from "./model/applicationDetails";
import DataTable from "./model/DataTable";
import filterControls from "./model/filterControls";
import Navigation from "./model/navigation";

fixture`ApplicationRound handling`.page(`${config.BASE_URL}/applicationRound`);

test("Active Application Round", async (t) => {
  await t
    // TODO: fetch (in this case active) application rounds and navigate to detail page
    .navigateTo("../applicationRound/1");

  const dataTableRowsCount = await DataTable.body.childElementCount;

  await t
    .expect(await DataTable.applicationCount.innerText)
    .eql(
      `${dataTableRowsCount} ${
        dataTableRowsCount === 1 ? "hakemus" : "hakemusta"
      }`
    );

  await t.click(filterControls.toggleButton);
  await t.click(filterControls.lastGroup);

  await t
    .expect(await filterControls.resetButton.hasAttribute("disabled"))
    .eql(true)
    .expect(await filterControls.submitButton.hasAttribute("disabled"))
    .eql(true);
  await t.click(filterControls.lastGroupCheckbox);
  await t
    .expect(await filterControls.resetButton.hasAttribute("disabled"))
    .notEql(true)
    .expect(await filterControls.submitButton.hasAttribute("disabled"))
    .notEql(true);
  await t.click(filterControls.resetButton);
  await t
    .expect(await filterControls.resetButton.hasAttribute("disabled"))
    .eql(true)
    .expect(await filterControls.submitButton.hasAttribute("disabled"))
    .eql(true);
  await t.click(filterControls.lastGroupCheckbox);
  await t.click(filterControls.submitButton);
  await t
    .expect(await filterControls.resetButton.hasAttribute("disabled"))
    .notEql(true)
    .expect(await filterControls.submitButton.hasAttribute("disabled"))
    .eql(true)
    .click(filterControls.lastGroupCheckbox);

  await t
    .expect(await filterControls.submitButton.hasAttribute("disabled"))
    .eql(false);

  await t.click(filterControls.toggleButton);
  await t.expect(await filterControls.lastGroup.count).eql(0);

  const firstRow = DataTable.rows.nth(0);

  const applicationData = {
    organisation: await firstRow.child("td").nth(0).innerText,
    participants: await firstRow.child("td").nth(1).innerText,
    applicantType: await firstRow.child("td").nth(2).innerText,
    applicationCount: await firstRow.child("td").nth(3).innerText,
    status: await firstRow.child("td").nth(4).innerText,
  };

  await t.click(firstRow);

  await t
    .expect(application.heading.innerText)
    .eql(applicationData.organisation)
    .expect(application.applicantType.innerText)
    .eql(applicationData.applicantType)
    .expect(application.statusBlock.innerText)
    .eql(applicationData.status)
    .expect(application.participants.innerText)
    .eql(applicationData.participants)
    .expect(application.reservationsTotal.innerText)
    .eql(applicationData.applicationCount.split("/")[0].trim())
    .expect(application.minDurationTotal.innerText)
    .eql(applicationData.applicationCount.split("/")[1].trim());

  if (["in_review", "review_done"].includes(applicationData.status)) {
    await t
      .expect(application.stateToggleButton.innerText)
      .eql("Hylkää hakemus");
  } else if (["declined"].includes(applicationData.status)) {
    await t
      .expect(application.stateToggleButton.innerText)
      .eql("Palauta hakemus osaksi jakoa");
  }

  await t.click(application.detailsLink);

  await t
    .expect(applicationDetails.heading.innerText)
    .eql(applicationData.organisation)
    .expect(applicationDetails.applicantType.innerText)
    .eql(applicationData.applicantType);

  await t.click(Navigation.linkPrev);
  await t.click(Navigation.linkPrev);
  t.expect(DataTable.body.exists);
});
