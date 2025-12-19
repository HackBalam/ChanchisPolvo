await client.sendTransaction({
    to: quote?.transaction.to,
    data: quote?.transaction.data,
    value: quote?.transaction.value ? BigInt(quote.transaction.value) : undefined, // value is used for native tokens
});