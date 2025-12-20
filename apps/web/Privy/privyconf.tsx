/*
 * Configuración de Privy para manejo de wallets adicionales
 *
 * Este provider permite a los usuarios:
 * - Conectar wallets externas adicionales
 * - Crear wallets embebidas
 * - Gestionar múltiples wallets para escanear tokens
 */

'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

// Configuración de las chains soportadas para Privy
const supportedChains = [
  {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
  },
  {
    id: 10,
    name: 'OP Mainnet',
    network: 'optimism',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://mainnet.optimism.io'] },
      public: { http: ['https://mainnet.optimism.io'] },
    },
  },
  {
    id: 42220,
    name: 'Celo',
    network: 'celo',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://forno.celo.org'] },
      public: { http: ['https://forno.celo.org'] },
    },
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    network: 'arbitrum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://arb1.arbitrum.io/rpc'] },
      public: { http: ['https://arb1.arbitrum.io/rpc'] },
    },
  },
  {
    id: 534352,
    name: 'Scroll',
    network: 'scroll',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.scroll.io'] },
      public: { http: ['https://rpc.scroll.io'] },
    },
  },
  {
    id: 100,
    name: 'Gnosis',
    network: 'gnosis',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://rpc.gnosischain.com'] },
      public: { http: ['https://rpc.gnosischain.com'] },
    },
  },
];

interface PrivyConfigProviderProps {
  children: ReactNode;
}

/**
 * Provider de Privy configurado para la aplicación
 * Permite conectar wallets adicionales para escanear tokens
 */
export default function PrivyConfigProvider({ children }: PrivyConfigProviderProps) {
  // Obtener las credenciales de Privy desde variables de entorno
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || '';

  // Si no hay credenciales, renderizar children sin el provider
  if (!appId || appId === 'your-privy-app-id') {
    console.warn('Privy: No se encontraron credenciales válidas. Configura NEXT_PUBLIC_PRIVY_APP_ID en .env');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        // Apariencia del modal de Privy
        appearance: {
          theme: 'light',
          accentColor: '#7C3AED', // Púrpura para coincidir con el botón "Buscar Polvo"
          logo: undefined,
        },
        // Métodos de login habilitados
        loginMethods: ['wallet'],
        // Configuración de wallets embebidas
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        // Chains soportadas
        supportedChains: supportedChains as any,
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export { supportedChains };
