/*
 * Hook de React para obtener balances de tokens de la wallet conectada
 *
 * Este hook se integra con wagmi (Farcaster/Privy) para obtener
 * automáticamente la wallet conectada y consultar sus tokens
 *
 * Uso:
 *   import { useTokenBalances } from '@/Alchemy/useTokenBalances';
 *
 *   function MyComponent() {
 *     const { balances, isLoading, error, refetch } = useTokenBalances();
 *     // balances contiene los tokens en todas las redes
 *   }
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getAllTokenBalances, getAllTokenBalancesWithMetadata, TokenBalancesResult } from './alchemyconf';

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

export default useTokenBalances;
