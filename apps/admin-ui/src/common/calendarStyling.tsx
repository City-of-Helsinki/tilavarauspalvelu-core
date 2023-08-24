const STYLE_COMMON = {
  borderStyle: "solid",
  borderWidth: "0px 0px 0px 3px",
  color: "black",
};

export const CONFIRMED = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--tilavaraus-event-booking-success-border)",
    background: "var(--tilavaraus-event-booking-success)",
  },
};

export const WAITING_PAYMENT = {
  style: {
    ...CONFIRMED.style,
    borderStyle: "dashed",
  },
};

export const UNCONFIRMED = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--tilavaraus-event-booking-wish-border)",
    borderStyle: "dashed",
    background: "var(--tilavaraus-event-booking-wish)",
  },
};

export const STAFF_RESERVATION = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--tilavaraus-event-booking-internal-border)",
    background: "var(--tilavaraus-event-booking-internal)",
  },
};

export const PRE_PAUSE = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--color-black-40)",
    borderLeft: "3px / 1px solid var(--color-black)",
    background: "var(--color-black-10)",
    color: "black",
  },
};

export const POST_PAUSE = {
  style: {
    borderColor: "var(--color-black-40)",
    borderLeft: "3px / 1px solid var(--color-black)",
    background: "var(--tilavaraus-event-booking-break)",
    // Invisibile text, real solution is to fix big-calendar not to render it
    color: "var(--tilavaraus-event-booking-break)",
  },
};

export const CLOSED = {
  style: {
    ...STYLE_COMMON,
    backgroundColor: "var(--color-black-20)",
    borderColor: "var(--tilavaraus-event-booking-closed-border)",
    background: "var(--tilavaraus-event-booking-closed)",
  },
};

export const RESERVATION_UNIT_RELEASED = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--color-black-20)",
    background: "var(--color-white)",
  },
};

export const RESERVATION_UNIT_DRAFT = {
  style: {
    ...STYLE_COMMON,
    borderColor: "var(--color-alert-dark)",
    borderStyle: "dashed",
    background: "var(--color-white)",
    width: "4px",
  },
};

export const INTERSECTING_RESERVATION_UNIT = {
  style: {
    backgroundColor: "var(--color-white)",
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd0cmFuc3BhcmVudCcvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J3JnYigxNTAsMTUwLDE1MCknIHN0cm9rZS13aWR0aD0nMScvPgo8L3N2Zz4="',
    backgroundRepeat: "repeat",
    backgroundSize: "5px",
  },
};

export const EVENT_STYLE: React.CSSProperties = {
  cursor: "pointer",
  borderRadius: "0px",
  display: "block",
  borderColor: "transparent",
  fontSize: "var(--fontsize-body-s)",
  opacity: 0.8,
};

export const COMMON_LEGEND = [
  {
    key: "CONFIRMED",
    label: "MyUnits.Calendar.legend.confirmed",
    style: CONFIRMED.style,
  },
  {
    key: "WAITING_PAYMENT",
    label: "MyUnits.Calendar.legend.waitingPayment",
    style: WAITING_PAYMENT.style,
  },
  {
    key: "UNCONFIRMED",
    label: "MyUnits.Calendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  {
    key: "STAFF_RESERVATION",
    label: "MyUnits.Calendar.legend.staffReservation",
    style: STAFF_RESERVATION.style,
  },
] as const;
