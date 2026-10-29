/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { keywords } from "../../../lib/robot";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const recurring_applications_page3 = keywords("recurring_applications_page3", {
  "User Selects Who Is The Application Created For": async (application_type_element: string) => {
    await Browser["Click"](`label[for="${application_type_element}"]`);
  },

  "User Types First Name": async (first_name: string) => {
    await Browser["Fill Text"]("id=contactPersonFirstName", first_name);
  },

  "User Types Last Name": async (last_name: string) => {
    await Browser["Fill Text"]("id=contactPersonLastName", last_name);
  },

  "User Types Street Address": async (street_address: string) => {
    await Browser["Fill Text"]("id=billingStreetAddress", street_address);
  },

  "User Types Post Code": async (post_code: string) => {
    await Browser["Fill Text"]("id=billingPostCode", post_code);
  },

  "User Types City": async (city: string) => {
    await Browser["Fill Text"]("id=billingCity", city);
  },

  "User Types Phone Number": async (phone_number: string) => {
    await Browser["Fill Text"]("id=contactPersonPhoneNumber", phone_number);
  },

  "User Types Email": async (email: string) => {
    await Browser["Fill Text"]("id=contactPersonEmail", email);
  },

  "User Types Additional Information": async (the_purpose_of_the_booking: string) => {
    await Browser["Fill Text"]("id=additionalInformation", the_purpose_of_the_booking);
  },
});
