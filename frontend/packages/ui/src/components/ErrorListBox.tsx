import React from "react";
import { Notification } from "hds-react";
import styled from "styled-components";

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
  errors: { key: string; label: string }[];
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
