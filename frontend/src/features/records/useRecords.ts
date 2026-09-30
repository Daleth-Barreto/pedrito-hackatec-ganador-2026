import { useEffect, useState } from "react";
import { api, errorMessage } from "../../services/api";
import type { RecordList } from "../../types";

export function useRecords(query = "") {
  const [data, setData] = useState<RecordList>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<RecordList>(`/records${query ? `?${query}` : ""}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, revision]);
  return { data, loading, error, reload: () => setRevision((v) => v + 1) };
}
