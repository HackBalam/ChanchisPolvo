/*
 * Hook de React para obtener balances de tokens de la wallet conectada
 *
 * Este hook se integra con wagmi (Farcaster/Privy) para obtener
 * automáticamente la wallet conectada y consultar sus tokens
 *
 * Soporta múltiples wallets para escaneo simultáneo
 *
 * Uso:
 *   import { useTokenBalances, useMultiWalletTokenBalances } from '@/Alchemy/useTokenBalances';
 *
 *   // Para una sola wallet (Farcaster)
 *   const { balances, isLoading, error, refetch } = useTokenBalances();
 *
 *   // Para múltiples wallets
 *   const { allBalances, isLoading, searchAllWallets } = useMultiWalletTokenBalances();
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getAllTokenBalances, getAllTokenBalancesWithMetadata, TokenBalancesResult } from './alchemyconf';

// Tipo para resultados de múltiples wallets
export interface MultiWalletBalancesResult {
  // Dirección de la wallet
  walletAddress: string;
  // Label de la wallet (ej: "Farcaster", "Wallet 1")
  label: string;
  // Resultado de los balances
  result: TokenBalancesResult | null;
  // Error específico de esta wallet
  error: string | null;
}

// Tipos para las opciones del hook
interface UseTokenBalancesOptions {
  includeMetadata?: boolean;
  autoFetch?: boolean;
}

// Tipo de retorno del hook
interface UseTokenBalancesReturn {
  balances: TokenBalancesResult | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  walletAddress: string | undefined;
  isConnected: boolean;
}

/**
 * Hook para obtener los balances de tokens de la wallet conectada via Farcaster
 *
 * @param options - Opciones de configuración
 * @param options.includeMetadata - Si true, obtiene metadata (nombre, símbolo) de cada token (más lento)
 * @param options.autoFetch - Si true, consulta automáticamente al conectar la wallet
 * @returns Estado con balances, loading, error y función refetch
 */
export function useTokenBalances({ includeMetadata = false, autoFetch = true }: UseTokenBalancesOptions = {}): UseTokenBalancesReturn {
  // Obtener la dirección de la wallet conectada via wagmi (Farcaster)
  const { address, isConnected } = useAccount();

  // Estados del hook
  const [balances, setBalances] = useState<TokenBalancesResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Función para obtener los balances de tokens
   * Puede ser llamada manualmente para refrescar los datos
   */
  const fetchBalances = useCallback(async () => {
    // Verificar que hay una wallet conectada
    if (!address) {
      setError('No hay wallet conectada');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Elegir el método según si se necesita metadata
      const result = includeMetadata
        ? await getAllTokenBalancesWithMetadata(address)
        : await getAllTokenBalances(address);

      setBalances(result);
    } catch (err: unknown) {
      console.error('Error obteniendo balances:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al obtener balances';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, includeMetadata]);

  // Auto-fetch cuando se conecta la wallet (si autoFetch está habilitado)
  useEffect(() => {
    if (autoFetch && isConnected && address) {
      fetchBalances();
    }
  }, [autoFetch, isConnected, address, fetchBalances]);

  // Limpiar balances cuando se desconecta la wallet
  useEffect(() => {
    if (!isConnected) {
      setBalances(null);
      setError(null);
    }
  }, [isConnected]);

  return {
    // Datos de balances agrupados por red
    balances,
    // Estado de carga
    isLoading,
    // Error si ocurrió alguno
    error,
    // Función para refrescar manualmente los balances
    refetch: fetchBalances,
    // Dirección de la wallet conectada
    walletAddress: address,
    // Si hay wallet conectada
    isConnected,
  };
}

// Tipo para el hook de red específica
interface UseNetworkTokenBalancesReturn {
  networkBalances: TokenBalancesResult['balances'][string] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  walletAddress: string | undefined;
  isConnected: boolean;
}

/**
 * Hook para obtener balances de una red específica
 *
 * @param networkKey - Clave de la red (base, polygon, celo, etc.)
 * @returns Balances solo de esa red
 */
export function useNetworkTokenBalances(networkKey: string): UseNetworkTokenBalancesReturn {
  const { balances, isLoading, error, refetch, walletAddress, isConnected } = useTokenBalances();

  // Extraer solo los balances de la red solicitada
  const networkBalances = balances?.balances?.[networkKey] || null;

  return {
    networkBalances,
    isLoading,
    error,
    refetch,
    walletAddress,
    isConnected,
  };
}

// Tipo para wallet con label
interface WalletWithLabel {
  address: string;
  label: string;
}

// Opciones para el hook de múltiples wallets
interface UseMultiWalletTokenBalancesOptions {
  includeMetadata?: boolean;
}

// Retorno del hook de múltiples wallets
interface UseMultiWalletTokenBalancesReturn {
  // Resultados por wallet
  allBalances: MultiWalletBalancesResult[];
  // Estado de carga
  isLoading: boolean;
  // Función para escanear todas las wallets
  searchAllWallets: (wallets: WalletWithLabel[]) => Promise<void>;
  // Resumen total
  summary: {
    totalWallets: number;
    totalTokens: number;
    successfulWallets: number;
  };
}

/**
 * Hook para escanear tokens en múltiples wallets simultáneamente
 *
 * @param options - Opciones de configuración
 * @returns Estado y funciones para escanear múltiples wallets
 */
export function useMultiWalletTokenBalances(
  { includeMetadata = true }: UseMultiWalletTokenBalancesOptions = {}
): UseMultiWalletTokenBalancesReturn {
  const [allBalances, setAllBalances] = useState<MultiWalletBalancesResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Escanea tokens en todas las wallets proporcionadas
   */
  const searchAllWallets = useCallback(async (wallets: WalletWithLabel[]) => {
    if (wallets.length === 0) {
      return;
    }

    setIsLoading(true);
    setAllBalances([]);

    try {
      // Ejecutar todas las consultas en paralelo
      const results = await Promise.all(
        wallets.map(async (wallet): Promise<MultiWalletBalancesResult> => {
          try {
            const result = includeMetadata
              ? await getAllTokenBalancesWithMetadata(wallet.address)
              : await getAllTokenBalances(wallet.address);

            return {
              walletAddress: wallet.address,
              label: wallet.label,
              result,
              error: null,
            };
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            return {
              walletAddress: wallet.address,
              label: wallet.label,
              result: null,
              error: errorMessage,
            };
          }
        })
      );

      setAllBalances(results);
    } finally {
      setIsLoading(false);
    }
  }, [includeMetadata]);

  // Calcular resumen
  const summary = {
    totalWallets: allBalances.length,
    totalTokens: allBalances.reduce((sum, wb) => {
      return sum + (wb.result?.summary.totalTokensFound || 0);
    }, 0),
    successfulWallets: allBalances.filter(wb => wb.result !== null).length,
  };

  return {
    allBalances,
    isLoading,
    searchAllWallets,
    summary,
  };
}

export default useTokenBalances;
