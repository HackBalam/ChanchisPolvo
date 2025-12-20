"use client";

import { MiniAppProvider } from "@/contexts/miniapp-context";
import FrameWalletProvider from "@/contexts/frame-wallet-context";
import PrivyConfigProvider from "../../Privy/privyconf";
import dynamic from "next/dynamic";

const ErudaProvider = dynamic(
  () => import("../components/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErudaProvider>
      <PrivyConfigProvider>
        <FrameWalletProvider>
          <MiniAppProvider addMiniAppOnLoad={true}>{children}</MiniAppProvider>
        </FrameWalletProvider>
      </PrivyConfigProvider>
    </ErudaProvider>
  );
}
