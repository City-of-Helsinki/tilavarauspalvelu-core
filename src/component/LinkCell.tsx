import React from "react";
import styled from "styled-components";
import { IconArrowRight } from "hds-react";
import { Link } from "react-router-dom";
import { ApplicationStatus } from "../common/types";
import { Dot } from "../styles/util";

interface ILinkCellProps {
  text: string;
  status: ApplicationStatus;
  link: string;
}

const LinkCellWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${Dot} {
    margin-right: 0.625em;
  }

  a {
    color: var(--tilavaraus-admin-content-text-color);
  }
`;

export default function LinkCell({
  text,
  status,
  link,
}: ILinkCellProps): JSX.Element {
  return (
    <LinkCellWrapper>
      <div>
        <Dot status={status} />
        <span>{text}</span>
      </div>
      <Link to={link}>
        <IconArrowRight />
      </Link>
    </LinkCellWrapper>
  );
}
