import styled from "styled-components";
import { Notification } from "hds-react";
import { breakpoints } from "common/src/common/style";
import LabelValue from "../common/LabelValue";

export const TimePreviewContainer = styled.div`
  margin: var(--spacing-xl) 0;

  svg {
    margin-top: 2px;
  }
`;

export const CheckboxContainer = styled.div`
  margin-top: var(--spacing-m);
  display: flex;
  align-items: center;
`;

export const StyledNotification = styled(Notification)`
  line-height: var(--fontsize-heading-m);
  margin-top: var(--spacing-m);

  svg {
    position: relative;
    top: -2px;
  }
`;

export const Terms = styled.div`
  margin-top: var(--spacing-s);
  width: (--container-width-m);
  white-space: break-spaces;
  height: 20em;
  overflow-y: scroll;
  background-color: var(--color-white);
  padding: var(--spacing-s);
  border: 1px solid var(--color-black-90);

  @media (max-width: ${breakpoints.m}) {
    height: auto;
    background-color: transparent;
    padding: 0;
    overflow-y: none;
  }
`;

export const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;
