import { useTranslation } from "next-i18next";
import type { TFunction } from "next-i18next";
import { errorToast } from "../components/toast";
import { getApiErrors } from "../modules/apolloUtils";
import type { ApiError } from "../modules/apolloUtils";

/**
 * Converts a backend API error to a user-friendly translated message
 * Note: This should not check for missing translation keys - if the key is missing it's a bug
 * @param t - Translation function from i18next
 * @param err - API error object containing error code and optional validation code
 * @returns Translated error message string
 */
export function formatErrorMessage(t: TFunction, err: ApiError): string {
  if (err.code === "MUTATION_VALIDATION_ERROR") {
    const validation_code =
      "validation_code" in err && typeof err.validation_code === "string" ? err.validation_code : null;
    const trCode = validation_code ?? "generic_validation_error";
    return t(`errors:api.validation.${trCode}`);
  }
  return t(`errors:api.${err.code}`);
}

/**
 * Hook that provides a function to display backend errors as toast notifications
 * Converts backend error codes to user-friendly translated messages
 * Only usable for mutations - queries don't return error codes
 * @returns Function that accepts an error and displays it as a toast
 * @example
 * const displayError = useDisplayError();
 * try {
 *   await mutate();
 * } catch (error) {
 *   displayError(error);
 * }
 */
export function useDisplayError() {
  const { t } = useTranslation();

  return function displayError(error: unknown) {
    const errs = getApiErrors(error);
    if (errs.length > 0) {
      const msgs = errs.map((e) => formatErrorMessage(t, e));
      for (const text of msgs) {
        errorToast({
          text,
        });
      }
    } else {
      errorToast({
        text: t("errors:general_error"),
      });
    }
  };
}
