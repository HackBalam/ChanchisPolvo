/*
 * Hook para manejar múltiples wallets para escaneo de tokens
 *
 * Integra wallets de:
 * - Farcaster (wallet principal conectada via wagmi)
 * - Privy (wallets adicionales conectadas por el usuario)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Tipo para una wallet en la lista
export interface WalletEntry {
  address: string;
  label: string;
  source: 'farcaster' | 'privy' | 'manual';
  // Para wallets de Privy, guardamos referencia para poder firmar después
  walletClientType?: string;
}

// Tipo de retorno del hook
interface UseMultipleWalletsReturn {
  // Lista de todas las wallets agregadas
  wallets: WalletEntry[];
  // Wallet principal de Farcaster
  farcasterWallet: string | undefined;
  // Wallets conectadas via Privy
  privyWallets: WalletEntry[];
  // Conectar nueva wallet con Privy
  connectWithPrivy: () => void;
  // Desconectar wallet de Privy
  disconnectPrivyWallet: (address: string) => Promise<void>;
  // Estado de autenticación de Privy
  isPrivyAuthenticated: boolean;
  // Estado de carga de Privy
  isPrivyLoading: boolean;
  // Logout de Privy (desconecta todas las wallets de Privy)
  logoutPrivy: () => Promise<void>;
  // Obtener todas las direcciones para escanear
  getAllAddresses: () => string[];
  // Verificar si una dirección ya está en la lista
  isWalletAdded: (address: string) => boolean;
}

/**
 * Hook para gestionar múltiples wallets para escaneo de tokens
 * Integra Farcaster y Privy
 *
 * @returns Funciones y estado para manejar wallets
 */
export function useMultipleWallets(): UseMultipleWalletsReturn {
  // Wallet conectada via Farcaster/wagmi
  const { address: farcasterAddress } = useAccount();

  // Privy hooks
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets: privyWalletsRaw } = useWallets();

  // Estado para wallets de Privy procesadas
  const [privyWallets, setPrivyWallets] = useState<WalletEntry[]>([]);

  /**
   * Normaliza una dirección (lowercase para comparación)
   */
  const normalizeAddress = (address: string): string => {
    return address.toLowerCase();
  };

  /**
   * Procesar wallets de Privy cuando cambian
   */
  useEffect(() => {
    if (ready && authenticated && privyWalletsRaw) {
      const processed: WalletEntry[] = privyWalletsRaw
        .filter(w => w.address) // Solo wallets con dirección
        .filter(w => {
          // Excluir la wallet de Farcaster si ya está conectada
          if (farcasterAddress) {
            return normalizeAddress(w.address) !== normalizeAddress(farcasterAddress);
          }
          return true;
        })
        .map((w, index) => ({
          address: w.address,
          label: w.walletClientType === 'privy'
            ? 'Embedded'
            : `Privy ${index + 1}`,
          source: 'privy' as const,
          walletClientType: w.walletClientType,
        }));

      setPrivyWallets(processed);
    } else {
      setPrivyWallets([]);
    }
  }, [ready, authenticated, privyWalletsRaw, farcasterAddress]);

  /**
   * Verifica si una wallet ya está agregada
   */
  const isWalletAdded = useCallback((address: string): boolean => {
    const normalized = normalizeAddress(address);

    // Verificar contra wallet de Farcaster
    if (farcasterAddress && normalizeAddress(farcasterAddress) === normalized) {
      return true;
    }

    // Verificar contra wallets de Privy
    return privyWallets.some(w => normalizeAddress(w.address) === normalized);
  }, [farcasterAddress, privyWallets]);

  /**
   * Conectar nueva wallet con Privy
   */
  const connectWithPrivy = useCallback(() => {
    if (ready) {
      login();
    }
  }, [ready, login]);

  /**
   * Desconectar una wallet específica de Privy
   * Nota: Privy no permite desconectar wallets individuales fácilmente,
   * esto haría logout completo
   */
  const disconnectPrivyWallet = useCallback(async (address: string) => {
    // Por ahora, logout completo de Privy
    // En una versión más avanzada se podría usar unlink
    console.log('Desconectando wallet:', address);
    await logout();
  }, [logout]);

  /**
   * Logout completo de Privy
   */
  const logoutPrivy = useCallback(async () => {
    await logout();
  }, [logout]);

  /**
   * Construye la lista completa de wallets
   */
  const wallets: WalletEntry[] = [
    // Wallet de Farcaster primero (si está conectada)
    ...(farcasterAddress ? [{
      address: farcasterAddress,
      label: 'Farcaster',
      source: 'farcaster' as const,
    }] : []),
    // Wallets de Privy
    ...privyWallets,
  ];

  /**
   * Obtiene todas las direcciones para escanear
   */
  const getAllAddresses = useCallback((): string[] => {
    return wallets.map(w => w.address);
  }, [wallets]);

  return {
    wallets,
    farcasterWallet: farcasterAddress,
    privyWallets,
    connectWithPrivy,
    disconnectPrivyWallet,
    isPrivyAuthenticated: authenticated,
    isPrivyLoading: !ready,
    logoutPrivy,
    getAllAddresses,
    isWalletAdded,
  };
}

export default useMultipleWallets;
