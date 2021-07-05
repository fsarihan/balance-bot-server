const ccxt = require('ccxt')
const TRXRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ERCRegex = /^(0x)[0-9A-Fa-f]{40}$/;

export class CoinbasePRO {
    public client;

    constructor(key, secret, pass) {
        const auth = {
            apiKey: key,
            secret: secret,
            password: pass,
        };
        this.client = new ccxt.coinbasepro(auth);
    }


    public getInfo(token) {
        return new Promise(async (resolve, reject) => {
            this.client.createDepositAddress(token).then((result) => {
                let chain = {};
                let chainName;
                if (ERCRegex.test(result.address)) {
                    chainName = "ERC20";
                } else if (TRXRegex.test(result.address)) {
                    chainName = "TRC20";
                } else {
                    chainName = result.currency;
                }
                chain[chainName] = {
                    name: token,
                    coin: result.currency,
                    depositAddress: result.address,
                    depositMemo: result.tag,
                }
                resolve(chain);
            })
        });
    }

    private withdrawInfo(token, chain) {
        return new Promise(async (resolve, reject) => {
            this.client.fetchCurrencies().then((r) => {
                let result = r[token];
                let pre = result.precision.toString().length - result.precision.toString().indexOf(".") - 1;
                let fee = 0;
                if (typeof result.fee !== "undefined") {
                    fee = result.fee;
                }
                let info = {
                    fee: fee,
                    min: result.limits.withdraw.min,
                    precision: pre
                }
                resolve(info);
            });
        });
    }

    public getBalance(token) {
        return new Promise(async (resolve, reject) => {
            this.client.fetchBalance().then(x => resolve(x[token].free));
        });
    }


    public transfer(data) {
        return new Promise(async (resolve, reject) => {
            let transferData = {
                coin: data.asset,
                address: data.address,
                addressTag: data.addressTag,
                amount: data.amount,
            };
            this.client.withdraw(transferData.coin, transferData.amount, transferData.address, transferData.addressTag).then(r => resolve(r));
        });
    }
}