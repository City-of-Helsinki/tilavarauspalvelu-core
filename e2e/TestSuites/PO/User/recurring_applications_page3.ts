/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { keywords, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page3 = keywords("recurring_applications_page3", {
  "User Selects Who Is The Application Created For": async (application_type_element: RobotValue) => {
    await Browser["Click"](`label[for="${str(application_type_element)}"]`);
  },

  "User Types First Name": async (first_name: RobotValue) => {
    await Browser["Fill Text"]("id=contactPersonFirstName", first_name);
  },

  "User Types Last Name": async (last_name: RobotValue) => {
    await Browser["Fill Text"]("id=contactPersonLastName", last_name);
  },

  "User Types Street Address": async (street_address: RobotValue) => {
    await Browser["Fill Text"]("id=billingStreetAddress", street_address);
  },

  "User Types Post Code": async (post_code: RobotValue) => {
    await Browser["Fill Text"]("id=billingPostCode", post_code);
  },

  "User Types City": async (city: RobotValue) => {
    await Browser["Fill Text"]("id=billingCity", city);
  },

  "User Types Phone Number": async (phone_number: RobotValue) => {
    await Browser["Fill Text"]("id=contactPersonPhoneNumber", phone_number);
  },

  "User Types Email": async (email: RobotValue) => {
    await Browser["Fill Text"]("id=contactPersonEmail", email);
  },

  "User Types Additional Information": async (the_purpose_of_the_booking: RobotValue) => {
    await Browser["Fill Text"]("id=additionalInformation", the_purpose_of_the_booking);
  },
});
