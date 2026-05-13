import { PropsWithChildren } from 'react';

// Back button visibility and navigation are handled centrally by the Layout
// in App.tsx. Registering another handler here would cause navigate(-1) to
// fire twice (once per handler) when the Telegram back button is pressed,
// skipping the intermediate page in the history stack.
export function Page({ children }: PropsWithChildren<{
  back?: boolean
}>) {
  return <>{children}</>;
}
