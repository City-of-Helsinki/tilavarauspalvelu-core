import { useEffect } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { toast } from "../components/toast";

/**
 * Hook that displays a toast notification when specific query parameters are present in the URL
 * Automatically removes the query parameter after showing the toast
 * @param key - Query parameter name(s) to check for. If array, all keys must be present
 * @param message - Toast message text or function that returns the message
 * @param type - Toast notification type (success, error, or alert)
 * @param title - Optional toast title text or function that returns the title
 * @example
 * useToastIfQueryParam({
 *   key: "updated",
 *   message: "Reservation updated successfully",
 *   type: "success"
 * });
 */
export function useToastIfQueryParam({
  key,
  message,
  type = "success",
  title,
}: {
  key: string | string[];
  message: string | (() => string);
  type?: "success" | "error" | "alert";
  title?: string | (() => string);
}) {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    /**
     * Removes the query parameter(s) from the URL without page reload
     */
    const removeTimeUpdatedParam = () => {
      // TODO this could be changed to useSearchParams instead of router
      const { pathname, query } = router;
      // NOTE ParsedQuery is a Record<string, string>
      const params = new URLSearchParams(query as Record<string, string>);
      if (Array.isArray(key)) {
        for (const k of key) {
          params.delete(k);
        }
      } else {
        params.delete(key);
      }

      router.replace(
        {
          pathname,
          query: params.toString(),
        },
        undefined,
        {
          shallow: true,
          scroll: false,
        }
      );
    };
    const q = router.query;

    const titleText = title ? (typeof title === "string" ? title : title()) : undefined;
    const text = typeof message === "string" ? message : message();
    const handle = () => {
      toast({
        text,
        type,
        label: titleText,
      });
      removeTimeUpdatedParam();
    };
    if (Array.isArray(key)) {
      if (key.every((k) => q[k])) {
        handle();
      }
    } else if (q[key]) {
      handle();
    }
  }, [router, t, key, message, type, title]);
}
