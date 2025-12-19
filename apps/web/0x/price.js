const priceParams = new URLSearchParams({
    chainId: '1', // / Ethereum mainnet. See the 0x Cheat Sheet for all supported endpoints: https://0x.org/docs/introduction/0x-cheat-sheet
    sellToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', //ETH
    buyToken: '0x6b175474e89094c44da98b954eedeac495271d0f', //DAI
    sellAmount: '100000000000000000000', // Note that the WETH token uses 18 decimal places, so `sellAmount` is `100 * 10^18`.
    taker: '$USER_TAKER_ADDRESS', //Address that will make the trade
});

const headers = {
    '0x-api-key': '[api-key]', // Get your live API key from the 0x Dashboard (https://dashboard.0x.org/apps)
    '0x-version': 'v2',
};

const priceResponse = await fetch('https://api.0x.org/swap/allowance-holder/price?' + priceParams.toString(), {
    headers,
});

console.log(await priceResponse.json());