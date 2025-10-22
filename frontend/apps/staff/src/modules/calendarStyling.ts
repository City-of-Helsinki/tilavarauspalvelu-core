export const HDS_CLOCK_ICON_SVG =
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

export const NOT_RESERVABLE = {
  style: {
    background: "var(--color-black-10)",
    backgroundRepeat: "repeat",
    backgroundSize: "7px",
    backgroundImage:
      "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzUiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAzNSA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPG1hc2sgaWQ9Im1hc2swXzcxNzZfMTk1MTI4IiBzdHlsZT0ibWFzay10eXBlOmx1bWluYW5jZSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjM1IiBoZWlnaHQ9IjUwIj4KPHBhdGggZD0iTTM0Ljg3NDUgMEgwLjg3NDUxMlY1MEgzNC44NzQ1VjBaIiBmaWxsPSJ3aGl0ZSIvPgo8L21hc2s+CjxwYXRoIGQ9Ik0zNC4yNzk3IC0wLjc3OTMzNkwtMiA1MUwxLjQ2OTM1IDUwLjc3ODlMMzYuNDA0MyAwLjg3NDUxN0wzNC4yNzk3IC0wLjc3OTMzNloiIGZpbGw9IiM2NjY2NjYiLz4KPHBhdGggZD0iTTE3LjI3OTcgLTI1Ljc3OTNMLTE2LjY1NTMgMjQuMTI1TC0xNS41MzA3IDI1Ljc3ODlMMTguNDA0MyAtMjQuMTI1NUwxNy4yNzk3IC0yNS43NzkzWiIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNNTEuMjc5NyAyNC4yMjA3TDE3LjM0NDcgNzQuMTI1TDE4LjQ2OTMgNzUuNzc4OUw1Mi40MDQzIDI1Ljg3NDVMNTEuMjc5NyAyNC4yMjA3WiIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4=')",
  },
};

export const RESERVABLE = {
  style: {
    ...STYLE_COMMON,
    borderColor: "transparent",
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
    backgroundImage:
      'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA0MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzczOTJfMTg4NzcpIj4KPHJlY3QgeD0iLTciIHk9IjU1LjU5NjciIHdpZHRoPSI3NCIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTU2LjM1NzkgLTUuNzY4MzEgNTUuNTk2NykiIGZpbGw9IiMxQTFBMUEiIGZpbGwtb3BhY2l0eT0iMC4xIi8+CjxyZWN0IHg9Ii0yNS43Njg2IiB5PSIyNS41OTY3IiB3aWR0aD0iNzIuMTM5OCIgaGVpZ2h0PSIxNiIgdHJhbnNmb3JtPSJyb3RhdGUoLTU2LjM1NzkgLTI1Ljc2ODYgMjUuNTk2NykiIGZpbGw9IiMxQTFBMUEiIGZpbGwtb3BhY2l0eT0iMC4xIi8+CjxyZWN0IHg9IjE0LjIzMTQiIHk9Ijg1LjU5NjciIHdpZHRoPSI3Mi4xMzk4IiBoZWlnaHQ9IjE2IiB0cmFuc2Zvcm09InJvdGF0ZSgtNTYuMzU3OSAxNC4yMzE0IDg1LjU5NjcpIiBmaWxsPSIjMUExQTFBIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzczOTJfMTg4NzciPgo8cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNjAiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==")',
    backgroundSize: "25px",
    backgroundRepeat: "repeat",
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

export const CALENDAR_EVENT_BASE_STYLE: React.CSSProperties = {
  cursor: "pointer",
  borderRadius: "0px",
  display: "block",
  borderColor: "transparent",
  fontSize: "var(--fontsize-body-s)",
};

// Gray outline, for styles with white background
const LEGEND_BORDER_STYLE = {
  borderStyle: "solid",
  borderWidth: "1px",
  borderColor: "var(--color-black-20)",
};

type EventKey =
  | "CONFIRMED"
  | "WAITING_PAYMENT"
  | "UNCONFIRMED"
  | "STAFF_RESERVATION"
  | "INTERSECTING_RESERVATION_UNIT"
  | "PAUSE"
  | "CLOSED"
  | "NOT_RESERVABLE"
  | "RESERVABLE"
  | "REST"
  | "RESERVATION_UNIT_RELEASED" // TODO: Released -> Published
  | "RESERVATION_UNIT_DRAFT";

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
    key: "NOT_RESERVABLE",
    label: "myUnits:Calendar.legend.notReservable",
    style: { ...NOT_RESERVABLE.style, ...LEGEND_BORDER_STYLE },
  },

  {
    key: "RESERVABLE",
    label: "myUnits:Calendar.legend.reservable",
    style: { ...RESERVABLE.style, ...LEGEND_BORDER_STYLE },
  },

  {
    key: "REST",
    label: "myUnits:Calendar.legend.reserved",
    style: REST.style,
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
] as const;
