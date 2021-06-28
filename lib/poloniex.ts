const Poloniex = require('poloniex-api-node');
const request = require('request');


export class PoloniexLib {
    public client;

    constructor(key, secret) {
        this.client = new Poloniex(key, secret);
    }

    private tokenNameCorrector(name) {
        switch (name) {
            case "XLM":
                return "STR";
                break;
            default:
                return name;
        }
    }

    private networkNameCorrector(name) {
        switch (name) {
            case "ETH":
                return "ERC20";
                break;
            case "BNB":
                return "BEP2";
                break;
            case "TRX":
                return "TRC20";
                break;
            case "STR":
                return "XLM";
                break;
            default:
                return name;
        }
    }

    public getInfo(token) {
        token = this.tokenNameCorrector(token);
        return new Promise(async (resolve, reject) => {
            let chain = {};
            const URL = "https://poloniex.com/public?command=returnCurrencies&includeMultiChainCurrencies=true";
            let options = {json: true};
            let currencies;
            await request(URL, options, async (error, res, body) => {
                if (!error && res.statusCode == 200) {
                    currencies = body;
                    await this.client.generateNewAddress(token);
                    this.client.returnDepositAddresses((err, addr) => {
                        let chain = {};
                        if (currencies[token].isMultiChain == 1) {
                            if (currencies[token].disabled != 1) {
                                chain[this.networkNameCorrector(currencies[token].blockchain)] = {
                                    name: currencies[token].blockchain,
                                    coin: token,
                                    depositAddress: "",
                                    depositMemo: "",
                                }
                                if (currencies[token].depositAddress != null) {
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositAddress = currencies[token].depositAddress;
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositMemo = addr[token];

                                } else {
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositAddress = addr[token];
                                }
                            }
                            for (let i in currencies[token].childChains) {
                                let childChain = currencies[token].childChains[i];
                                this.client.generateNewAddress(childChain);
                                if (currencies[childChain].disabled != 1) {
                                    chain[this.networkNameCorrector(currencies[childChain].blockchain)] = {
                                        name: childChain,
                                        coin: token,
                                        depositAddress: "",
                                        depositMemo: "",
                                    }
                                    if (currencies[childChain].depositAddress != null) {
                                        chain[this.networkNameCorrector(currencies[childChain].blockchain)].depositAddress = currencies[childChain].depositAddress;
                                        chain[this.networkNameCorrector(currencies[childChain].blockchain)].depositMemo = addr[childChain];
                                    } else {
                                        chain[this.networkNameCorrector(currencies[childChain].blockchain)].depositAddress = addr[childChain];
                                    }
                                }
                            }
                            resolve(chain);
                        } else {
                            if (currencies[token].disabled != 1) {
                                chain[this.networkNameCorrector(currencies[token].blockchain)] = {
                                    name: currencies[token].blockchain,
                                    coin: token,
                                    depositAddress: "",
                                    depositMemo: "",
                                }
                                if (currencies[token].depositAddress != null) {
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositAddress = currencies[token].depositAddress;
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositMemo = addr[token];
                                } else {
                                    chain[this.networkNameCorrector(currencies[token].blockchain)].depositAddress = addr[token];
                                }
                                resolve(chain);
                            }
                        }
                    });
                }
            });
        });
    }

    private withdrawInfo(token, chain) {
        token = this.tokenNameCorrector(token);
        return new Promise(async (resolve, reject) => {
            const URL = "https://poloniex.com/public?command=returnCurrencies&includeMultiChainCurrencies=true";
            let options = {json: true};
            let currencies;
            await request(URL, options, async (error, res, body) => {
                if (!error && res.statusCode == 200) {
                    currencies = body;
                    let info = {
                        fee: currencies[token].txFee,
                        min: 0,
                        precision: 8
                    }
                    resolve(info);
                }
            });
        });
    }

    public getBalance(token) {
        token = this.tokenNameCorrector(token);
        return new Promise(async (resolve, reject) => {
            const balances = await this.client.returnCompleteBalances();
            resolve(balances[token].available);
        });
    }


    public transfer(data) {
        return new Promise(async (resolve, reject) => {

            if (data.network == "TRC20") {
                data.asset = data.asset + "TRON";
            }
            if (data.network == "ERC20" && data.asset == "USDT") {
                data.asset = "USDTETH";
            }
            this.client.withdraw(data.asset, data.amount, data.address, data.addressTag, (e, r) => {
                console.log(r);
                console.log(e);
            })
        });
    }
}