import React from "react";
import styled from "styled-components";
import { Notification } from "hds-react";

const List = styled.ol`
  && {
    margin: 0;
    padding: 0 0 0 var(--spacing-m);
  }
`;

export function ErrorListBox({
  label,
  errors,
}: {
  label: string;
  errors: Array<{ key: string; label: string }>;
}): React.ReactElement {
  return (
    <Notification label={label} type="error">
      <List>
        {errors.map(({ key, label }) => (
          <li key={key}>{label}</li>
        ))}
      </List>
    </Notification>
  );
}
