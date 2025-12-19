/*
Este componente obtiene el balance de los tokens en una wallet
Redes en las que se buscara:
-Base https://base-mainnet.g.alchemy.com/v2/:apiKey 
-Polygon https://polygon-mainnet.g.alchemy.com/v2/:apiKey
-Celo https://celo-mainnet.g.alchemy.com/v2/:apiKey
-Arbitrum https://arb-mainnet.g.alchemy.com/v2/:apiKey
-Scroll https://scroll-mainnet.g.alchemy.com/v2/:apiKey
-Monad https://monad-mainnet.g.alchemy.com/v2/:apiKey


Pendientes: 
-Pasar la variable de la ApiKey por el .env
-Modificar para que busque en las redes puestas previamente
-Modificar para que tome la wallet del Farcaster o las de Privy
*/
const url = 'https://base-mainnet.g.alchemy.com/v2/:apiKey';
const options = {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: '["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"]]'//-Se debe de pasar la wallet del farcaster o las agregadas en Privy
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}