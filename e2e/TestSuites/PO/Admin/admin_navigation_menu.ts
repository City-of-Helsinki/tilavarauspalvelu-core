/** Port of PO/Admin/admin_navigation_menu.robot */
import { Browser } from "../../../lib/Browser";
import { BuiltIn } from "../../../lib/BuiltIn";
import { keywords, named } from "../../../lib/robot";

export const admin_navigation_menu = keywords("admin_navigation_menu", {
  "Admin Navigates To Requested Reservations": async () => {
    await Browser["Click"]('[href="/kasittely/reservations/requested"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To Reservations": async () => {
    await Browser["Click"]('[href="/kasittely/reservations"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To Application Rounds": async () => {
    await Browser["Click"]('[href="/kasittely/application-rounds"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To Reservation Units": async () => {
    await Browser["Click"]('[href="/kasittely/reservation-units"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To Units": async () => {
    await Browser["Click"]('[href="/kasittely/units"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To My Units": async () => {
    await Browser["Click"]('[href="/kasittely/my-units"]');
    await BuiltIn["Sleep"]("4s");
  },

  "Admin Navigates To Notifications": async () => {
    await Browser["Click"]('[href="/kasittely/notifications"]');
    // The create link is only on the notifications list page
    await Browser["Wait For Elements State"](
      '[href="/kasittely/notifications/new"]',
      "visible",
      named({ timeout: "15s" })
    );
  },
});
