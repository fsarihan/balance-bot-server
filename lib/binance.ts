import Binance from 'binance-api-node'

export class BinanceLib {
    public binance: any;

    constructor(apiKey: string, apiSecret: string, pass?: string) {

        this.binance = Binance({
            apiKey: apiKey,
            apiSecret: apiSecret,
        });
    }

    public getInfo(token) {
        return new Promise(async (resolve, reject) => {
            let configs = await this.binance.capitalConfigs();

            for (let c in configs) {
                let config = configs[c];
                if (config.coin == token) {
                    let chain = {};
                    for (let i in config.networkList) {
                        let network = config.networkList[i];
                        if (network.name === "BTC(SegWit)") {
                            network.name = "BTC-Segwit";
                        }
                        if (network.name === "BEP20 (BSC)") {
                            network.name = "BEP20(BSC)";
                        }
                        chain[network.name] = network;
                        let c = await this.binance.depositAddress({
                            asset: "",
                            coin: token,
                            network: network.network
                        });
                        chain[network.name]['depositAddress'] = c.address;
                        chain[network.name]['depositMemo'] = c.tag;

                    }
                    resolve(chain);
                }
            }
        });
    }

    private withdrawInfo(token, chain) {
        return new Promise(async (resolve, reject) => {
            let r = await this.getInfo(token);
            if (chain == "Default") {
                let data = r[Object.keys(r)[0]];
                let pre = data.withdrawIntegerMultiple.toString().split(".")[1].length;
                let info = {
                    fee: data.withdrawFee,
                    min: data.withdrawMin,
                    precision: pre
                }
                resolve(info);
            } else {
                let data = r[chain];
                let pre = data.withdrawIntegerMultiple.toString().split(".")[1].length;
                let info = {
                    fee: data.withdrawFee,
                    min: data.withdrawMin,
                    precision: pre
                }
                resolve(info);
            }
        });
    }

    private networkNameCorrector(token, network) {
        return new Promise(async (resolve, reject) => {
            if (network === "BTC-Segwit") {
                network = "BTC(SegWit)";
            }
            if (network === "BEP20(BSC)") {
                network = "BEP20 (BSC)";
            }
            let configs = await this.binance.capitalConfigs();
            for (let c in configs) {
                let config = configs[c];
                if (config.coin == token) {
                    for (let z in config.networkList) {
                        let networkC = config.networkList[z];
                        if (networkC.name == network) {
                            resolve(networkC.network);
                        }
                        if (networkC.network == network) {
                            resolve(networkC.network);
                        }
                    }

                }
            }
        });
    }

    public getBalance(token) {
        return new Promise(async (resolve, reject) => {
            let balances = await this.binance.accountCoins();
            for (let i in balances) {
                let balance = balances[i];
                if (balance.coin == token) {
                    resolve(balance.free);
                }
            }
        });
    }

    public transfer(data) {
        return new Promise(async (resolve, reject) => {

            if (data.network == "Default") {
                let transferData = {
                    coin: data.asset,
                    address: data.address,
                    addressTag: data.addressTag,
                    amount: data.amount,
                };
                if (typeof transferData.addressTag === "undefined") {
                    delete transferData.addressTag;
                }

                let z = await this.binance.withdraw(transferData);
                console.log(z);
            } else {
                this.networkNameCorrector(data.asset, data.network).then(async (networkName) => {

                    let transferData = {
                        coin: data.asset,
                        address: data.address,
                        network: networkName,
                        addressTag: data.addressTag,
                        amount: data.amount,
                    };
                    if (typeof transferData.addressTag === "undefined") {
                        delete transferData.addressTag;
                    }

                    let z = await this.binance.withdraw(transferData);
                    console.log(z);

                    resolve(true);
                });
            }
        });
    }

}