"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
// Hook para obtener balances de tokens en múltiples redes
import { useMultiWalletTokenBalances } from "../../Alchemy/useTokenBalances";
// Hook para manejar múltiples wallets con Privy
import { useMultipleWallets } from "../../Privy/useMultipleWallets";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Hook para manejar múltiples wallets con Privy
  const {
    wallets,
    connectWithPrivy,
    disconnectPrivyWallet,
    isPrivyAuthenticated,
    isPrivyLoading,
  } = useMultipleWallets();

  // Hook para buscar tokens en múltiples wallets
  const {
    allBalances,
    isLoading: isSearchingTokens,
    searchAllWallets,
    summary,
  } = useMultiWalletTokenBalances({ includeMetadata: true });

  // Auto-connect wallet only when inside Farcaster (context exists)
  useEffect(() => {
    // Solo auto-conectar si estamos dentro de Farcaster (hay contexto de usuario)
    const isInsideFarcaster = context?.user !== undefined;

    if (isMiniAppReady && isInsideFarcaster && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, context, isConnected, isConnecting, connectors, connect]);

  // Extract user data from context
  const user = context?.user;
  // Use connected wallet address if available, otherwise fall back to user custody/verification
  const walletAddress = address || user?.custody || user?.verifications?.[0] || "0x1e4B...605B";
  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username || "@user";
  const pfpUrl = user?.pfpUrl;

  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Handler para buscar polvo en todas las wallets
  const handleSearchPolvo = () => {
    if (wallets.length > 0 && !isSearchingTokens) {
      searchAllWallets(wallets.map(w => ({ address: w.address, label: w.label })));
    }
  };

  if (!isMiniAppReady) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          {/* Welcome Header */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome
          </h1>

          {/* Status Message */}
          <p className="text-lg text-gray-600 mb-6">
            You are signed in!
          </p>

          {/* User Profile Section */}
          <div className="mb-6">
            {/* Profile Avatar */}
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center overflow-hidden">
              {pfpUrl ? (
                <img
                  src={pfpUrl}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                {displayName}
              </h2>
              <p className="text-gray-500">
                {username.startsWith('@') ? username : `@${username}`}
              </p>
            </div>
          </div>

          {/* Wallets Section */}
          <div className="mb-6">
            <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Wallets para escanear</h3>
                {/* Solo mostrar botón de Privy si NO hay wallet de Farcaster conectada */}
                {!isConnected && (
                  <button
                    onClick={connectWithPrivy}
                    disabled={isPrivyLoading}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                  >
                    {isPrivyLoading ? 'Cargando...' : '+ Conectar Wallet'}
                  </button>
                )}
              </div>

              {/* Lista de wallets */}
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.address}
                    className="flex items-center justify-between bg-white/50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        wallet.source === 'farcaster'
                          ? 'bg-purple-100 text-purple-700'
                          : wallet.source === 'privy'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {wallet.label}
                      </span>
                      <span className="text-sm font-mono text-gray-700">
                        {formatAddress(wallet.address)}
                      </span>
                    </div>
                    {wallet.source === 'privy' && (
                      <button
                        onClick={() => disconnectPrivyWallet(wallet.address)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
                {wallets.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-2">
                    {isConnected ? 'Tu wallet de Farcaster aparecera aqui' : 'Conecta tu wallet para empezar'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón Buscar Polvo - Busca tokens en todas las wallets */}
          <div className="mb-6">
            <button
              onClick={handleSearchPolvo}
              disabled={wallets.length === 0 || isSearchingTokens}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSearchingTokens ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Buscando polvo en {wallets.length} wallet{wallets.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  Buscar Polvo {wallets.length > 0 && `(${wallets.length} wallet${wallets.length > 1 ? 's' : ''})`}
                </>
              )}
            </button>
          </div>

          {/* Resultados de la búsqueda de tokens */}
          {allBalances.length > 0 && (
            <div className="mb-6">
              {/* Resumen total */}
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados</h3>
                <div className="text-sm text-gray-600">
                  <p>Wallets escaneadas: {summary.successfulWallets}/{summary.totalWallets}</p>
                  <p>Total tokens encontrados: {summary.totalTokens}</p>
                </div>
              </div>

              {/* Resultados por wallet */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {allBalances.map((walletResult) => (
                  <div key={walletResult.walletAddress} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    {/* Header de la wallet */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{walletResult.label}</span>
                        <span className="text-xs font-mono text-gray-500">
                          {formatAddress(walletResult.walletAddress)}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        walletResult.result ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {walletResult.result ? `${walletResult.result.summary.totalTokensFound} tokens` : 'Error'}
                      </span>
                    </div>

                    {/* Error de la wallet */}
                    {walletResult.error && (
                      <p className="text-xs text-red-500 mb-2">{walletResult.error}</p>
                    )}

                    {/* Tokens por red */}
                    {walletResult.result && (
                      <div className="space-y-2">
                        {Object.entries(walletResult.result.balances).map(([networkKey, networkData]: [string, any]) => (
                          <div key={networkKey} className="bg-white/30 rounded-lg p-2">
                            {/* Nombre de la red */}
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-900">{networkData.network}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${
                                networkData.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {networkData.success ? `${networkData.tokens.length}` : 'Err'}
                              </span>
                            </div>

                            {/* Lista de tokens */}
                            {networkData.success && networkData.tokens.length > 0 && (
                              <div className="space-y-1">
                                {networkData.tokens.map((token: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between text-xs bg-white/50 rounded px-2 py-1">
                                    <span className="text-gray-700 font-mono">
                                      {token.metadata?.symbol || 'UNKNOWN'}
                                    </span>
                                    <span className="text-gray-600">
                                      {token.formattedBalance || token.balance}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Sin tokens */}
                            {networkData.success && networkData.tokens.length === 0 && (
                              <p className="text-xs text-gray-400">Sin tokens</p>
                            )}

                            {/* Error de red */}
                            {!networkData.success && (
                              <p className="text-xs text-red-400">{networkData.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Miniapp Button */}
          <div className="mb-6">
            <button
              onClick={async () => {
                if (isAddingMiniApp) return;

                setIsAddingMiniApp(true);
                setAddMiniAppMessage(null);

                try {
                  const result = await sdk.actions.addMiniApp();
                  if (result) {
                    setAddMiniAppMessage("Miniapp added successfully!");
                  } else {
                    setAddMiniAppMessage("Miniapp was not added (user declined or already exists)");
                  }
                } catch (error: any) {
                  console.error('Add miniapp error:', error);
                  if (error?.message?.includes('domain')) {
                    setAddMiniAppMessage("This miniapp can only be added from its official domain");
                  } else {
                    setAddMiniAppMessage("Failed to add miniapp. Please try again.");
                  }
                } finally {
                  setIsAddingMiniApp(false);
                }
              }}
              disabled={isAddingMiniApp}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isAddingMiniApp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  Add Miniapp
                </>
              )}
            </button>

            {/* Add Miniapp Status Message */}
            {addMiniAppMessage && (
              <div className="mt-3 p-3 bg-white/30 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-gray-700">{addMiniAppMessage}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
