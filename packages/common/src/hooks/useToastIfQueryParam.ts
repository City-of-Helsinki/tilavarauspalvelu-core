import { useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { toast } from "../components/toast";

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
