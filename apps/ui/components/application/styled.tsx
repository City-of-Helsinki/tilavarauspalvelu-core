import styled from "styled-components";
import { Notification } from "hds-react";
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

export const StyledLabelValue = styled(LabelValue).attrs({ theme: "thin" })``;
