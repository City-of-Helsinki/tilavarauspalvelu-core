import React from "react";
import {
  ToastContainer as TC,
  toast as toastFn,
  type Id,
} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  IconCheckCircleFill,
  IconErrorFill,
  IconInfoCircleFill,
  Notification,
} from "hds-react";
import styled from "styled-components";

type ToastProps = {
  text: string;
  type?: "success" | "error" | "alert" | "info";
  label?: string;
  ariaLabel?: string;
  duration?: number;
  dataTestId?: string;
  options?: Record<string, unknown>;
  icon?: JSX.Element;
};

const Container = styled(TC)`
  [class^="Toastify__toast"] {
    position: relative;
    padding: 0;
  }

  --toastify-toast-bd-radius: 0;
  --toastify-toast-width: max(30%, 320px);
  --toastify-toast-min-height: 48px;

  /* We need to define the active color for the toast, to use it as the progress bar color... */
  --toastify-color-progress-info: var(--color-info);
  --toastify-color-progress-success: var(--color-success);
  --toastify-color-progress-warning: var(--color-gold);
  --toastify-color-progress-error: var(--color-brick);

  /* ...and use the same color for the icons */
  [class*="Toastify__toast--info"] {
    color: var(--toastify-color-progress-info);
  }
  [class*="Toastify__toast--success"] {
    color: var(--toastify-color-progress-success);
  }
  [class*="Toastify__toast--warning"] {
    color: var(--toastify-color-progress-warning);
  }
  [class*="Toastify__toast--error"] {
    color: var(--toastify-color-progress-error);
  }

  /* Styles for the toastify icon to play nice with HDS style definitions */
  [class^="Toastify__toast-icon"] {
    position: absolute;
    width: var(--spacing-m);
    height: var(--spacing-m);
    top: calc(50% + 4px);
    left: var(--spacing-s);
    transform: translateY(-50%);
    z-index: 1;
    display: none;
  }
  [class^="Toastify__toast-body"] {
    border-radius: 0;

    /* HDS doesn't render the icon if the toast doesn't have a label, so we
    show the toastify icon instead, and make room for it with padding */
    &:not(:has([class*="Notification-module_label"])) {
      [class^="Toastify__toast-icon"] {
        display: block;
      }
      [class*="Notification-module_notification"] {
        padding-left: var(--spacing-2-xl);
        padding-right: var(--spacing-2-xl);
      }
    }
  }
  [class^="Toastify__close-button"] {
    position: absolute;
    top: var(--spacing-s);
    right: var(--spacing-s);
    width: var(--spacing-m);
    height: var(--spacing-m);
    background: black;
    mask-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='currentColor' fill-rule='evenodd' d='M18 7.5 13.5 12l4.5 4.5-1.5 1.5-4.5-4.5L7.5 18 6 16.5l4.5-4.5L6 7.5 7.5 6l4.5 4.5L16.5 6 18 7.5z' clip-rule='evenodd'/%3E%3C/svg%3E");
  }
  [class^="Toastify__progress-bar--wrp"] {
    top: 0;
    bottom: auto;
    height: 8px;
  }
  [class^="Toastify__progress-bar--bg"] {
    background: transparent;
  }
  [class^="Toastify__progress-bar "] {
    opacity: 1;
  }
`;

const HDSNotification = styled(Notification)`
  && {
    /* We are using the border as progress bar, so we need to hide the default border */
    border-width: 0;
  }
  [class^="Notification-module_content"] {
    padding-top: 8px;
  }
  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 8px;
    background-color: var(--notification-border-color);
  }
`;

// any component can use this function to show a toast, as long as <ToastContainer /> is rendered somewhere in the app
export default function toast({
  label,
  text,
  type = "info",
  duration,
  dataTestId,
  ariaLabel = label,
  options,
}: ToastProps): Id {
  const toastOptions = options || {};
  if (duration) {
    toastOptions.autoClose = duration * 1000;
  }
  // toastify uses "warning" instead of "alert", so we need to convert it from HDS to toastify
  toastOptions.type = type === "alert" ? "warning" : type;
  switch (type) {
    case "error":
      toastOptions.icon = <IconErrorFill />;
      break;
    case "success":
      toastOptions.icon = <IconCheckCircleFill />;
      break;
    default:
      toastOptions.icon = <IconInfoCircleFill />;
  }
  return toastFn(
    <ToastNotification
      text={text}
      type={type ?? "info"}
      label={label}
      ariaLabel={ariaLabel}
      duration={duration && duration * 1000}
      dataTestId={dataTestId}
    />,
    toastOptions
  );
}

// This component is used to render the toast content, in our case it's a HDS Notification
function ToastNotification({
  type,
  text,
  label,
  duration,
  ariaLabel,
  dataTestId,
}: ToastProps): JSX.Element {
  return (
    <HDSNotification
      type={type}
      label={label}
      notificationAriaLabel={ariaLabel ?? label ?? text}
      dataTestId={dataTestId}
    >
      {
        // toastify doesn't show the progress-bar if the toast doesn't have an autoClose duration defined
        // so we need to add a custom "progress-bar" to comply with the HDS design
        !duration && <div className="progress-bar" />
      }
      {text}
    </HDSNotification>
  );
}

function ToastContainer(): JSX.Element {
  return (
    <Container
      position="top-right"
      autoClose={false}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={false}
      pauseOnHover
      pauseOnFocusLoss
      draggable
      draggablePercent={60}
    />
  );
}

// Helper functions to show toasts with predefined types, which won't allow setting type manually
const errorToast = (props: Omit<ToastProps, "type">) => {
  return toast({ ...props, type: "error" });
};

const successToast = (props: Omit<ToastProps, "type">) => {
  return toast({ ...props, type: "success" });
};

export { type Id, type ToastProps, ToastContainer, errorToast, successToast };
