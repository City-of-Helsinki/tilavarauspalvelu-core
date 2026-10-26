/** A resource file with top navigation keywords. */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { V, keywords, named, str } from "../../../lib/robot";
import type { RobotValue } from "../../../lib/robot";
import { mybookings } from "../../PO/User/mybookings";
import { custom_keywords } from "../../Resources/custom_keywords";
import "../../Resources/variables";
import "../../Resources/texts_FI";
import "../../Resources/serial_users";

export const topnav = keywords("topnav", {
  "Click Login": async () => {
    await Browser["Wait For Elements State"]("id=login", "stable");
    await Browser["Click"]("id=login");
  },

  "Click Login Admin Side": async () => {
    await Browser["Wait For Elements State"]("h1", "visible");
    await Browser["Click"](`button >> span:text-is("${str(V.LOGIN_TEXT_ADMIN)}") >> nth=-1`);
    await BuiltIn["Sleep"]("1s");
  },

  "Click Logout": async () => {
    await BuiltIn["Sleep"]("1s");
    await Browser["Wait For Elements State"]('css=[aria-label="Kirjaudu ulos"]', "stable");
    await Browser["Click"]('css=[aria-label="Kirjaudu ulos"]');
    await BuiltIn["Sleep"]("3s"); // wait for the page to load
  },

  "Click Logout Admin Side": async () => {
    await BuiltIn["Sleep"]("1s");
    await Browser["Wait For Elements State"]('css=[aria-label="signout"]', "visible");
    await Browser["Click"]('css=[aria-label="signout"]');
    await BuiltIn["Sleep"]("3s"); // wait for the page to load
  },

  "Click User Menu": async () => {
    await Browser["Wait For Elements State"]("id=user-menu", "stable");
    await Browser["Click"]("id=user-menu");
    await BuiltIn["Sleep"]("1s");
  },

  "Click Close Navigation Menu": async () => {
    await Browser["Wait For Elements State"]("id=Menu", "stable");
    await Browser["Click"]("id=Menu");
    await BuiltIn["Sleep"]("1s");
  },

  "Check Dropdown Menu Has User Info": async (name: RobotValue) => {
    let Topnav_Login_Button_Text: RobotValue;
    // DEVNOTE Enable this when the profile bug no longer empties the name info
    Topnav_Login_Button_Text = await Browser["Get Text"](`id=user-menu:text-is("${str(name)}")`);
    await BuiltIn["Log"](Topnav_Login_Button_Text);
    await BuiltIn["Log"](name);
    await BuiltIn["Should Be Equal"](Topnav_Login_Button_Text, name);
  },

  "Navigate To Single Booking Page": async () => {
    await custom_keywords["Click And Wait For Page"](
      `header >> [href="/search"]:text-is("${str(V.SINGLEBOOKING_FI)}")`,
      "/search"
    );
  },

  "Navigate To My Bookings": async () => {
    await Browser["Click"](`header >> [href="/reservations"]:text-is("${str(V.MYBOOKINGS_FI)}")`);

    // Confirms page is loaded
    await mybookings["Check My Bookings H1"](V.MYBOOKINGS_FI);
    await mybookings["Wait For Upcoming Bookings To Load"]();
  },

  "Navigate To Recurring Booking Page": async () => {
    await Browser["Click"](`header >> [href="/recurring"]:text-is("${str(V.RECURRING_BOOKINGS_FI)}")`);
    await BuiltIn["Sleep"]("4s");
  },

  "Navigate To My Applications": async () => {
    await Browser["Click"](`header >> [href="/applications"]:text-is("${str(V.MYAPPLICATIONS_FI)}")`);
    await BuiltIn["Sleep"]("4s");

    //
    // MOBILE UI
    //
  },

  "Click Navigation Menu Mobile": async () => {
    await Browser["Wait For Elements State"]("id=Menu", "visible");
    await Browser["Click"]("id=Menu");
    await BuiltIn["Sleep"]("1s"); // wait for animation to complete
  },

  "Click User Menu Mobile": async () => {
    await Browser["Click"]("id=user-menu");
    await BuiltIn["Sleep"]("1s"); // wait for animation to complete
  },

  "Click Login Mobile": async () => {
    await Browser["Wait For Elements State"]("id=login", "visible");
    await Browser["Click"]("id=login");
    await BuiltIn["Sleep"]("2s"); // wait for the page to load
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Click Logout Mobile": async () => {
    await Browser["Wait For Elements State"]('css=[aria-label="Kirjaudu ulos"]', "visible");
    await Browser["Click"]('css=[aria-label="Kirjaudu ulos"]');
    await BuiltIn["Sleep"]("2s"); // wait for the page to load
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Click Tablist Scroll Button To Right Mobile": async () => {
    await Browser["Wait For Elements State"]("[class*=Tabs-module_scrollButton__]", "visible");
    await Browser["Click"]('[class*=Tabs-module_scrollButton__] >> [aria-label="angle-right"]');
    await BuiltIn["Sleep"]("1.5s"); // wait for the animation to complete
    // Check menu has user info mobile
    // DEVNOTE - Waiting for fixes for the test environment from another team
    // this step will be enabled when the test environment is fixed

    // TODO - 4 selectors of the same name in the ui. Fix better selector
    // [Arguments]  ${Expected_name}  ${Expected_email}
    // Click navigation menu mobile
    // id="user-menu"
    // ${Topnav_menu_name_elements}=  Browser.Get Elements  id=hds-mobile-menu >> [data-testid="navigation__user-name"]
    // ${Topnav_menu_name_element_text}=  Get Text  ${Topnav_menu_name_elements}[1]
    // Should Be Equal  ${Topnav_menu_name_element_text}  ${Expected_name}
    //
    // ${Topnav_menu_email_element_text}=  Get Text  id=hds-mobile-menu >> [data-testid="navigation-user-email"]
    // ${Topnav_menu_email_elements}=  Browser.Get Elements  id=hds-mobile-menu >> [data-testid="navigation-user-email"]
    // ${Topnav_menu_email_element_text}=  Get Text  ${Topnav_menu_email_elements}[1]
    // Should Be Equal  ${Topnav_menu_email_element_text}  ${Expected_email}
  },

  "Navigate To Single Booking Page Mobile": async () => {
    await Browser["Click"]("id=Menu");
    await BuiltIn["Sleep"]("1s"); // wait for animation to complete
    await Browser["Click"](`header >> [href="/search"]:text-is("${str(V.SINGLEBOOKING_FI)}")`);
    await BuiltIn["Sleep"]("3s");
    await Browser["Wait For Load State"]("load", named({ timeout: "15s" }));
  },

  "Navigate To My Bookings Mobile": async () => {
    await topnav["Click Navigation Menu Mobile"]();
    await topnav["Navigate To My Bookings"]();
    await Browser["Wait For Elements State"]("h1", "visible");
  },
});
