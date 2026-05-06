import { useSyncExternalStore } from "react";

import {
  consumeRegisteredBackHandler,
  getBackStoreSnapshot,
  subscribeBackStore,
} from "@/navigation/backStore";

export const APP_BACK_INTENT_EVENT = "lije:back-intent";

type GoBackInAppOptions = {
  navigate: (delta: number) => void;
  pathname: string;
};

function dispatchLegacyBackIntent(pathname: string) {
  const backIntent = new CustomEvent(APP_BACK_INTENT_EVENT, {
    cancelable: true,
    detail: { pathname },
  });

  window.dispatchEvent(backIntent);
  return backIntent.defaultPrevented;
}

export function goBackInApp({ navigate, pathname }: GoBackInAppOptions) {
  if (dispatchLegacyBackIntent(pathname)) {
    return true;
  }

  if (consumeRegisteredBackHandler()) {
    return true;
  }

  navigate(-1);
  return false;
}

export function useBackControllerState() {
  return useSyncExternalStore(
    subscribeBackStore,
    getBackStoreSnapshot,
    getBackStoreSnapshot,
  );
}
