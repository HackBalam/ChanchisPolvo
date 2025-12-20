/*
 * Módulo de Alchemy para obtener balances de tokens en múltiples redes
 *
 * Este módulo proporciona funcionalidades para:
 * - Consultar balances de tokens ERC20 en múltiples redes blockchain
 * - Soporta: Base, Polygon, Celo, Arbitrum, Scroll, Monad
 *
 * Uso: Importar las funciones y usarlas con la wallet conectada de Farcaster
 */

// Tipos para la configuración de redes
interface NetworkConfig {
  name: string;
  url: string;
  chainId: number;
}

// Tipo para metadata de un token
export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
}

// Tipo para un token con balance
export interface TokenBalance {
  contractAddress: string;
  balance: string;
  metadata?: TokenMetadata | null;
  formattedBalance?: string;
}

// Tipo para los balances de una red
export interface NetworkBalances {
  network: string;
  chainId: number;
  success: boolean;
  error?: string;
  tokens: TokenBalance[];
}

// Tipo para el resultado completo de balances
export interface TokenBalancesResult {
  walletAddress: string;
  timestamp: string;
  summary: {
    totalNetworks: number;
    successfulNetworks: number;
    totalTokensFound: number;
  };
  balances: Record<string, NetworkBalances>;
}

// Configuración de las redes soportadas con sus endpoints de Alchemy
const ALCHEMY_NETWORKS: Record<string, NetworkConfig> = {
  base: {
    name: 'Base',
    url: 'https://base-mainnet.g.alchemy.com/v2',
    chainId: 8453,
  },
  polygon: {
    name: 'Polygon',
    url: 'https://polygon-mainnet.g.alchemy.com/v2',
    chainId: 137,
  },
  celo: {
    name: 'Celo',
    url: 'https://celo-mainnet.g.alchemy.com/v2',
    chainId: 42220,
  },
  arbitrum: {
    name: 'Arbitrum',
    url: 'https://arb-mainnet.g.alchemy.com/v2',
    chainId: 42161,
  },
  scroll: {
    name: 'Scroll',
    url: 'https://scroll-mainnet.g.alchemy.com/v2',
    chainId: 534352,
  },
  monad: {
    name: 'Monad',
    url: 'https://monad-mainnet.g.alchemy.com/v2',
    chainId: 10143,
  },
};

/**
 * Obtiene la API key de Alchemy desde las variables de entorno
 * @returns La API key de Alchemy
 */
function getAlchemyApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_ALCHEMY_API_KEY no está configurada en las variables de entorno');
  }
  return apiKey;
}

/**
 * Obtiene los balances de tokens para una wallet en una red específica
 * Usa el método alchemy_getTokenBalances de la API de Alchemy
 *
 * @param walletAddress - Dirección de la wallet a consultar
 * @param networkKey - Clave de la red (base, polygon, celo, arbitrum, scroll, monad)
 * @returns Objeto con los balances de tokens en esa red
 */
async function getTokenBalancesForNetwork(walletAddress: string, networkKey: string): Promise<NetworkBalances> {
  const network = ALCHEMY_NETWORKS[networkKey];
  if (!network) {
    throw new Error(`Red no soportada: ${networkKey}`);
  }

  const apiKey = getAlchemyApiKey();
  const url = `${network.url}/${apiKey}`;

  // Configuración de la petición para obtener balances de tokens
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      // "erc20" obtiene todos los tokens ERC20 que la wallet posee
      params: [walletAddress, 'erc20'],
    }),
  };

  try {
    const response = await fetch(url, options);

    // Verificar si la respuesta es OK
    if (!response.ok) {
      return {
        network: network.name,
        chainId: network.chainId,
        success: false,
        error: `HTTP ${response.status}: Red no disponible o API key sin acceso`,
        tokens: [],
      };
    }

    // Intentar parsear como JSON, manejar respuestas HTML/texto
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // La respuesta no es JSON (probablemente HTML de error)
      return {
        network: network.name,
        chainId: network.chainId,
        success: false,
        error: 'API key no tiene acceso a esta red',
        tokens: [],
      };
    }

    // Verificar si hay errores en la respuesta JSON-RPC
    if (data.error) {
      console.error(`Error en ${network.name}:`, data.error);
      return {
        network: network.name,
        chainId: network.chainId,
        success: false,
        error: data.error.message || 'Error de la API',
        tokens: [],
      };
    }

    // Procesar los balances de tokens
    const tokenBalances = data.result?.tokenBalances || [];

    // Filtrar tokens con balance mayor a 0
    const nonZeroBalances = tokenBalances.filter((token: { tokenBalance: string }) => {
      const balance = BigInt(token.tokenBalance || '0');
      return balance > 0n;
    });

    return {
      network: network.name,
      chainId: network.chainId,
      success: true,
      tokens: nonZeroBalances.map((token: { contractAddress: string; tokenBalance: string }) => ({
        contractAddress: token.contractAddress,
        // El balance viene en hex, lo convertimos a string decimal
        balance: BigInt(token.tokenBalance).toString(),
      })),
    };
  } catch (error: unknown) {
    console.error(`Error fetching tokens from ${network.name}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
    return {
      network: network.name,
      chainId: network.chainId,
      success: false,
      error: errorMessage,
      tokens: [],
    };
  }
}

/**
 * Obtiene metadata de un token (nombre, símbolo, decimales)
 * Usa el método alchemy_getTokenMetadata de la API de Alchemy
 *
 * @param contractAddress - Dirección del contrato del token
 * @param networkKey - Clave de la red
 * @returns Metadata del token
 */
async function getTokenMetadata(contractAddress: string, networkKey: string): Promise<TokenMetadata | null> {
  const network = ALCHEMY_NETWORKS[networkKey];
  if (!network) {
    throw new Error(`Red no soportada: ${networkKey}`);
  }

  const apiKey = getAlchemyApiKey();
  const url = `${network.url}/${apiKey}`;

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenMetadata',
      params: [contractAddress],
    }),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.error) {
      return null;
    }

    return {
      name: data.result?.name || 'Unknown',
      symbol: data.result?.symbol || 'UNKNOWN',
      decimals: data.result?.decimals || 18,
      logo: data.result?.logo || null,
    };
  } catch (error) {
    console.error(`Error fetching token metadata:`, error);
    return null;
  }
}

/**
 * Obtiene los balances de tokens en TODAS las redes soportadas
 * Ejecuta las consultas en paralelo para mayor eficiencia
 *
 * @param walletAddress - Dirección de la wallet de Farcaster/Privy
 * @returns Objeto con los balances agrupados por red
 */
async function getAllTokenBalances(walletAddress: string): Promise<TokenBalancesResult> {
  if (!walletAddress) {
    throw new Error('Se requiere una dirección de wallet');
  }

  // Validar formato de la dirección
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('Formato de dirección de wallet inválido');
  }

  // Obtener las claves de todas las redes configuradas
  const networkKeys = Object.keys(ALCHEMY_NETWORKS);

  // Ejecutar todas las consultas en paralelo para mayor eficiencia
  const results = await Promise.all(
    networkKeys.map(networkKey => getTokenBalancesForNetwork(walletAddress, networkKey))
  );

  // Organizar resultados en un objeto con la red como clave
  const balancesByNetwork: Record<string, NetworkBalances> = {};
  networkKeys.forEach((networkKey, index) => {
    balancesByNetwork[networkKey] = results[index];
  });

  // Calcular estadísticas generales
  const totalTokens = results.reduce((sum, result) => sum + (result.tokens?.length || 0), 0);
  const successfulNetworks = results.filter(r => r.success).length;

  return {
    walletAddress,
    timestamp: new Date().toISOString(),
    summary: {
      totalNetworks: networkKeys.length,
      successfulNetworks,
      totalTokensFound: totalTokens,
    },
    balances: balancesByNetwork,
  };
}

/**
 * Obtiene los balances de tokens CON metadata (nombre, símbolo, decimales)
 * Este método es más lento pero proporciona información más completa
 *
 * @param walletAddress - Dirección de la wallet
 * @returns Balances con metadata de cada token
 */
async function getAllTokenBalancesWithMetadata(walletAddress: string): Promise<TokenBalancesResult> {
  // Primero obtenemos todos los balances básicos
  const basicBalances = await getAllTokenBalances(walletAddress);

  // Para cada red, obtenemos la metadata de los tokens
  for (const [networkKey, networkData] of Object.entries(basicBalances.balances)) {
    if (networkData.success && networkData.tokens.length > 0) {
      // Obtener metadata para cada token en paralelo
      const metadataPromises = networkData.tokens.map(token =>
        getTokenMetadata(token.contractAddress, networkKey)
      );
      const metadataResults = await Promise.all(metadataPromises);

      // Agregar metadata a cada token
      networkData.tokens = networkData.tokens.map((token, index) => ({
        ...token,
        metadata: metadataResults[index],
        // Calcular balance formateado si tenemos decimales
        formattedBalance: metadataResults[index]?.decimals
          ? formatTokenBalance(token.balance, metadataResults[index].decimals)
          : token.balance,
      }));
    }
  }

  return basicBalances;
}

/**
 * Formatea un balance de token considerando los decimales
 *
 * @param balance - Balance en unidades mínimas (wei)
 * @param decimals - Número de decimales del token
 * @returns Balance formateado con decimales
 */
function formatTokenBalance(balance: string, decimals: number): string {
  const balanceBigInt = BigInt(balance);
  const divisor = BigInt(10 ** decimals);
  const integerPart = balanceBigInt / divisor;
  const fractionalPart = balanceBigInt % divisor;

  // Formatear parte fraccionaria con padding de ceros
  const fractionalString = fractionalPart.toString().padStart(decimals, '0');
  // Limitar a 6 decimales para mejor legibilidad
  const truncatedFractional = fractionalString.slice(0, 6);

  return `${integerPart}.${truncatedFractional}`;
}

// Exportar las funciones y constantes para uso externo
export {
  ALCHEMY_NETWORKS,
  getTokenBalancesForNetwork,
  getTokenMetadata,
  getAllTokenBalances,
  getAllTokenBalancesWithMetadata,
  formatTokenBalance,
};
