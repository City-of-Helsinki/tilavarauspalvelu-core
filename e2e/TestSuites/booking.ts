/**
 * What the customer booked, from the quick reservation to the cancellation. `userReservesAFreeQuickReservationSlot`
 * returns it. The test passes it to the keywords that check the booking, and the keyword that first shows the booking
 * number saves the number in it. `userModifiesBookingAndVerifiesTheChanges` returns the booking after a change.
 *
 * e.g. slot 12:15, info card time "To 12.11.2026 klo 12:15–13:15, 1 t", list time "To 12.11.2026 klo 12:15–13:15"
 * and number 59923
 */
export class Booking {
  constructor(
    /**
     * The slot's time, e.g. 12:15. Picked by quick_reservation.Select The Free Slot From Quick Reservation, and for a
     * change by reservation_calendar.Click And Store Free Reservation Time
     */
    readonly slot: string,
    /**
     * The time as the booking's info card shows it: the weekday, date and times, then the duration,
     * e.g. To 12.11.2026 klo 12:15–13:15, 1 t. Built by data_modification.Set Info Card Duration Time Info
     */
    readonly infoCardTime: string,
    /**
     * The time as My bookings lists it: the same as the info card's, without the duration,
     * e.g. To 12.11.2026 klo 12:15–13:15. Built by data_modification.Set Info Card Duration Time Info
     */
    readonly listTime: string,
    /**
     * The booking number, e.g. 59923. It is empty until a keyword has read it from the page:
     * quick_reservation.Get Booking Number or checkout.In Order Summary Get Booking Number From Product List
     */
    public number = ""
  ) {}

  /**
   * A step title and a log line show the booking by its list time and number, not as a long JSON object,
   * e.g. To 12.11.2026 klo 12:15–13:15, 59923
   */
  toJSON(): string {
    return this.number === "" ? this.listTime : `${this.listTime}, ${this.number}`;
  }
}
