import { Notification } from "hds-react";

export function ErrorListBox({
  label,
  errors,
}: {
  label: string;
  errors: Array<{ key: string; label: string }>;
}): React.ReactElement {
  return (
    <Notification label={label} type="error">
      <ol>
        {errors.map(({ key, label }) => (
          <li key={key}>{label}</li>
        ))}
      </ol>
    </Notification>
  );
}
