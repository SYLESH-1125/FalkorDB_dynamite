"use client";

import { useEffect, useReducer, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setData: (value: T) => void;
}

type Action<T> =
  | { type: "start" }
  | { type: "success"; payload: T }
  | { type: "failure"; error: string }
  | { type: "set"; payload: T };

function reducer<T>(state: Omit<AsyncState<T>, "reload" | "setData">, action: Action<T>) {
  switch (action.type) {
    case "start":
      return { ...state, loading: true, error: null };
    case "success":
      return { data: action.payload, loading: false, error: null };
    case "failure":
      return { ...state, loading: false, error: action.error };
    case "set":
      return { ...state, data: action.payload };
  }
}

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [state, dispatch] = useReducer(reducer<T>, { data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  // hold the latest loader so changing its identity does not retrigger the fetch
  const loaderRef = useRef(loader);
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "start" });
    loaderRef
      .current()
      .then((result) => {
        if (!cancelled) dispatch({ type: "success", payload: result });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          dispatch({ type: "failure", error: err instanceof Error ? err.message : "Something went wrong" });
        }
      });
    return () => {
      cancelled = true;
    };
    // callers pass explicit deps describing what should refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return {
    ...state,
    reload: () => setNonce((n) => n + 1),
    setData: (value: T) => dispatch({ type: "set", payload: value }),
  };
}
