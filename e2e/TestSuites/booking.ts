/**
 * What the customer booked, from the quick reservation to the cancellation. `userReservesAFreeQuickReservationSlot`
 * returns it. The test passes it to the keywords that check the booking, and the keyword that first shows the booking
 * number saves the number in it.
 */
export class Booking {
  constructor(
    /** The slot as the quick reservation lists it */
    readonly slot: string,
    /** The time as the booking's info card shows it: the weekday, date and times, then the duration "1 t" */
    readonly infoCardTime: string,
    /** The time as My bookings lists it: the same as the info card's, without the duration */
    readonly listTime: string,
    /** The booking number. It is empty until a keyword has read it from the page. */
    public number = ""
  ) {}

  /** A step title and a log line show the booking by its list time and number, not as a long JSON object */
  toJSON(): string {
    return this.number === "" ? this.listTime : `${this.listTime}, ${this.number}`;
  }
}
