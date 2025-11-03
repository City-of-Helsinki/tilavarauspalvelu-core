const HDS_CLOCK_ICON_SVG =
  'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQiIGhlaWdodD0iMTUiIHZpZXdCb3g9IjAgMCAxNCAxNSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02Ljk5OTY3IDAuODMzNDk2QzEwLjY4MTYgMC44MzM0OTYgMTMuNjY2MyAzLjgxODI2IDEzLjY2NjMgNy41MDAxNkMxMy42NjYzIDExLjE4MjEgMTAuNjgxNiAxNC4xNjY4IDYuOTk5NjcgMTQuMTY2OEMzLjMxNzc4IDE0LjE2NjggMC4zMzMwMDggMTEuMTgyMSAwLjMzMzAwOCA3LjUwMDE2QzAuMzMzMDA4IDMuODE4MjYgMy4zMTc3OCAwLjgzMzQ5NiA2Ljk5OTY3IDAuODMzNDk2Wk02Ljk5OTY3IDIuMTY2ODNDNC4wNTQxNiAyLjE2NjgzIDEuNjY2MzQgNC41NTQ2NCAxLjY2NjM0IDcuNTAwMTZDMS42NjYzNCAxMC40NDU3IDQuMDU0MTYgMTIuODMzNSA2Ljk5OTY3IDEyLjgzMzVDOS45NDUxOSAxMi44MzM1IDEyLjMzMyAxMC40NDU3IDEyLjMzMyA3LjUwMDE2QzEyLjMzMyA0LjU1NDY0IDkuOTQ1MTkgMi4xNjY4MyA2Ljk5OTY3IDIuMTY2ODNaTTcuNjY2MzQgMy41MDAxNkw3LjY2Njc3IDcuMjIyODNMOS44MjgxIDkuMzg1NzhMOC44ODUyOSAxMC4zMjg2TDYuNTI4MjcgNy45NzE1N0w2LjUyOTQzIDcuOTcwODNMNi4zMzM1MSA3Ljc3NjAyTDYuMzMzMDEgMy41MDAxNkg3LjY2NjM0WiIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4K")';

const STYLE_COMMON = {
  borderStyle: "solid",
  borderWidth: "0px 0px 0px 3px",
  color: "black",
};

export const CONFIRMED = {
  style: {
    ...STYLE_COMMON,
    background: "var(--color-tram-light)",
    borderColor: "var(--color-tram-dark)",
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
    background: "var(--color-summer-light)",
    borderColor: "var(--color-summer-dark)",
    borderStyle: "dashed",
  },
};

export const STAFF_RESERVATION = {
  style: {
    ...STYLE_COMMON,
    background: "var(--color-bus-light)",
    borderColor: "var(--color-bus-dark)",
  },
};

export const EVENT_BUFFER = {
  style: {
    background: "var(--color-black-10)",
    borderColor: "var(--color-black-40)",
    borderLeft: "3px / 1px solid var(--color-black)",
    opacity: "0.5",
    color: "var(--color-black-80)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

export const BLOCKED = {
  style: {
    ...STYLE_COMMON,
    background: "var(--color-black-10)",
    borderColor: "var(--color-black-90)",
  },
};

export const RESERVATION_UNIT_RELEASED = {
  style: {
    ...STYLE_COMMON,
    background: "var(--color-white)",
    borderColor: "var(--color-black-20)",
  },
};

export const RESERVATION_UNIT_DRAFT = {
  style: {
    ...STYLE_COMMON,
    background: "var(--color-white)",
    borderColor: "var(--color-alert-dark)",
    borderStyle: "dashed",
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

export const REST = {
  style: {
    background: `var(--tilavaraus-event-rest-background)`,
    color: `black`,
    borderColor: `var(--tilavaraus-event-rest-border-color)`,
    borderStyle: "solid",
    borderWidth: "0px 0px 0px 3px",
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

type EventKey =
  | "CONFIRMED"
  | "UNCONFIRMED"
  | "STAFF_RESERVATION"
  | "INTERSECTING_RESERVATION_UNIT"
  | "PAUSE"
  | "CLOSED"
  | "WAITING_PAYMENT"
  | "RESERVATION_UNIT_RELEASED"
  | "RESERVATION_UNIT_DRAFT"
  | "REST";

export type EventStyleType = {
  key: EventKey;
  label: string;
  style: Record<string, string>;
};

export const CALENDAR_LEGENDS: EventStyleType[] = [
  {
    key: "CONFIRMED",
    label: "myUnits:Calendar.legend.confirmed",
    style: CONFIRMED.style,
  },
  {
    key: "WAITING_PAYMENT",
    label: "myUnits:Calendar.legend.waitingPayment",
    style: WAITING_PAYMENT.style,
  },
  {
    key: "UNCONFIRMED",
    label: "myUnits:Calendar.legend.unconfirmed",
    style: UNCONFIRMED.style,
  },
  {
    key: "STAFF_RESERVATION",
    label: "myUnits:Calendar.legend.staffReservation",
    style: STAFF_RESERVATION.style,
  },

  {
    key: "INTERSECTING_RESERVATION_UNIT",
    label: "myUnits:Calendar.legend.intersecting",
    style: INTERSECTING_RESERVATION_UNIT.style,
  },
  {
    key: "PAUSE",
    label: "myUnits:Calendar.legend.pause",
    style: {
      ...EVENT_BUFFER.style,
      backgroundImage: HDS_CLOCK_ICON_SVG,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundSize: "20px",
    },
  },
  {
    key: "CLOSED",
    label: "myUnits:Calendar.legend.closed",
    style: BLOCKED.style,
  },
  {
    key: "RESERVATION_UNIT_RELEASED",
    label: "myUnits:Calendar.legend.reservationUnitReleased",
    style: RESERVATION_UNIT_RELEASED.style,
  },
  {
    key: "RESERVATION_UNIT_DRAFT",
    label: "myUnits:Calendar.legend.reservationUnitDraft",
    style: RESERVATION_UNIT_DRAFT.style,
  },

  {
    key: "REST",
    label: "myUnits:Calendar.legend.reserved",
    style: REST.style,
  },
] as const;
