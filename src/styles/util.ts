import styled from "styled-components";
import { ApplicationStatus } from "../common/types";

export const breakpoints = {
  xs: "320px",
  s: "576px",
  m: "768px",
  l: "992px",
  xl: "1248px",
};

export const getGridFraction = (space: number, columns = 12): number => {
  return (space / columns) * 100;
};

const getStatusColor = (status: ApplicationStatus): string => {
  let color = "";
  switch (status) {
    case "draft":
      color = "var(--color-engel)";
      break;
    case "declined":
    case "cancelled":
      color = "var(--color-brick)";
      break;
    default:
      color = "var(--color-coat-of-arms)";
  }

  return color;
};

export const Dot = styled.div<{ status: ApplicationStatus }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${({ status }) => getStatusColor(status)};
`;
