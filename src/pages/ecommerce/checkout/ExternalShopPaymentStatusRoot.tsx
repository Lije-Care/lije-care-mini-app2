import "@/i18n/i18n.ts";

import { AppRoot } from "@telegram-apps/telegram-ui";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import i18n from "@/i18n/i18n";
import { store } from "@/redux/store";

import ShopPaymentStatusPage from "./ShopPaymentStatusPage";

export function ExternalShopPaymentStatusRoot() {
  return (
    <AppRoot appearance="light" platform="base">
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <HashRouter>
            <Routes>
              <Route
                path="/shop/payment-status"
                element={<ShopPaymentStatusPage allowProtectedNavigation={false} />}
              />
              <Route
                path="*"
                element={<Navigate to="/shop/payment-status" replace />}
              />
            </Routes>
          </HashRouter>
        </I18nextProvider>
      </Provider>
    </AppRoot>
  );
}
