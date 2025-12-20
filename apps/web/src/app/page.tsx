"use client";
import { useMiniApp } from "@/contexts/miniapp-context";
import { sdk } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
// Hook para obtener balances de tokens en múltiples redes
import { useTokenBalances } from "../../Alchemy/useTokenBalances";

export default function Home() {
  const { context, isMiniAppReady } = useMiniApp();
  const [isAddingMiniApp, setIsAddingMiniApp] = useState(false);
  const [addMiniAppMessage, setAddMiniAppMessage] = useState<string | null>(null);

  // Wallet connection hooks
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors } = useConnect();

  // Hook para buscar tokens - autoFetch desactivado para control manual
  const { balances, isLoading: isSearchingTokens, error: tokenError, refetch: searchTokens } = useTokenBalances({
    includeMetadata: true,
    autoFetch: false
  });
  
  // Auto-connect wallet when miniapp is ready
  useEffect(() => {
    if (isMiniAppReady && !isConnected && !isConnecting && connectors.length > 0) {
      const farcasterConnector = connectors.find(c => c.id === 'farcaster');
      if (farcasterConnector) {
        connect({ connector: farcasterConnector });
      }
    }
  }, [isMiniAppReady, isConnected, isConnecting, connectors, connect]);
  
  // Extract user data from context
  const user = context?.user;
  // Use connected wallet address if available, otherwise fall back to user custody/verification
  const walletAddress = address || user?.custody || user?.verifications?.[0] || "0x1e4B...605B";
  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username || "@user";
  const pfpUrl = user?.pfpUrl;
  
  // Format wallet address to show first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
          
          {/* User Wallet Address */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">Wallet Status</span>
                <div className={`flex items-center gap-1 text-xs ${
                  isConnected ? 'text-green-600' : isConnecting ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}></div>
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
                </div>
              </div>
              <p className="text-sm text-gray-700 font-mono">
                {formatAddress(walletAddress)}
              </p>
            </div>
          </div>
          
          {/* User Profile Section */}
          <div className="mb-8">
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

          {/* Botón Buscar Polvo - Busca tokens en todas las redes */}
          <div className="mb-6">
            <button
              onClick={() => {
                // Solo buscar si hay wallet conectada
                if (isConnected && !isSearchingTokens) {
                  searchTokens();
                }
              }}
              disabled={!isConnected || isSearchingTokens}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSearchingTokens ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Buscando polvo...
                </>
              ) : (
                <>
                  Buscar Polvo
                </>
              )}
            </button>

            {/* Mensaje de error si falla la búsqueda */}
            {tokenError && (
              <div className="mt-3 p-3 bg-red-100 backdrop-blur-sm rounded-lg">
                <p className="text-sm text-red-700">{tokenError}</p>
              </div>
            )}
          </div>

          {/* Resultados de la búsqueda de tokens */}
          {balances && (
            <div className="mb-6">
              {/* Resumen de la búsqueda */}
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Resultados</h3>
                <div className="text-sm text-gray-600">
                  <p>Redes consultadas: {balances.summary.successfulNetworks}/{balances.summary.totalNetworks}</p>
                  <p>Tokens encontrados: {balances.summary.totalTokensFound}</p>
                </div>
              </div>

              {/* Lista de tokens por red */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(balances.balances).map(([networkKey, networkData]: [string, any]) => (
                  <div key={networkKey} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    {/* Nombre de la red */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{networkData.network}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        networkData.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {networkData.success ? `${networkData.tokens.length} tokens` : 'Error'}
                      </span>
                    </div>

                    {/* Lista de tokens en esta red */}
                    {networkData.success && networkData.tokens.length > 0 && (
                      <div className="space-y-1">
                        {networkData.tokens.map((token: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm bg-white/30 rounded px-2 py-1">
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

                    {/* Mensaje si no hay tokens en esta red */}
                    {networkData.success && networkData.tokens.length === 0 && (
                      <p className="text-xs text-gray-500">Sin tokens</p>
                    )}

                    {/* Mensaje de error para esta red */}
                    {!networkData.success && (
                      <p className="text-xs text-red-500">{networkData.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
