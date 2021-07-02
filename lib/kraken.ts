const KrakenClient = require('kraken-api');
const request = require('request');
const TRXRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const ERCRegex = /^(0x)[0-9A-Fa-f]{40}$/;

export class KrakenLib {
    public client;

    constructor(key, secret) {
        this.client = new KrakenClient(key, secret);
    }

    private getAssetDetail(token) {
        return new Promise(async (resolve, reject) => {
            const URL = "https://api.kraken.com/0/public/Assets?asset=" + token;
            let options = {json: true};
            request(URL, options, async (error, res, body) => {
                    if (!error && res.statusCode == 200) {
                        resolve(body['result']);
                    }
                }
            )
        });
    }

    private networkNameCorrector(name) {
        switch (name) {
            case "Tether USD (ERC20)":
                return "ERC20";
                break;
            case "Tether USD (TRC20)":
                return "TRC20";
                break;
            default:
                return name;
        }
    }

    public getInfo(token) {
        return new Promise(async (resolve, reject) => {
            let detail = await this.getAssetDetail(token);
            const firstToken = token;
            token = detail[Object.keys(detail)[0]].altname;
            let chain = {};
            const methods = await this.client.privateMethod('DepositMethods', {asset: token});
            const resultMethods = methods['result'];
            if (resultMethods.length > 1) {
                for (let i in resultMethods) {
                    let address = await this.client.privateMethod('DepositAddresses', {
                        asset: token,
                        method: resultMethods[i].method,
                    });
                    if (address['result'].length == 0) {
                        address = await this.client.privateMethod('DepositAddresses', {
                            asset: token,
                            method: resultMethods[i].method,
                            new: true,
                        });
                    }
                    let chainName;
                    if (ERCRegex.test(address['result'][0].address)) {
                        chainName = "ERC20";
                    } else if (TRXRegex.test(address['result'][0].address)) {
                        chainName = "TRC20";
                    } else {
                        chainName = firstToken;
                    }
                    chain[chainName] = {
                        name: token,
                        coin: firstToken,
                        depositAddress: address['result'][0].address,
                        depositMemo: address['result'][0].tag,
                    }
                }
                resolve(chain);
            } else {
                let address = await this.client.privateMethod('DepositAddresses', {
                    asset: token,
                    method: resultMethods[0].method,
                });
                if (address['result'].length == 0) {
                    address = await this.client.privateMethod('DepositAddresses', {
                        asset: token,
                        method: resultMethods[0].method,
                        new: true,
                    });
                }
                let chainName;
                if (ERCRegex.test(address['result'][0].address)) {
                    chainName = "ERC20";
                } else if (TRXRegex.test(address['result'][0].address)) {
                    chainName = "TRC20";
                } else {
                    chainName = firstToken;
                }
                chain[chainName] = {
                    name: token,
                    coin: firstToken,
                    depositAddress: address['result'][0].address,
                    depositMemo: address['result'][0].tag,
                }
                resolve(chain);
            }
        });
    }

    private withdrawInfo(token, chain) {
        return new Promise(async (resolve, reject) => {
            let detail = await this.getAssetDetail(token);
            let precision = detail[Object.keys(detail)[0]].display_decimals;
            let info = {
                fee: 0,
                min: 0,
                precision: precision
            }
            resolve(info);
        });
    }

    public getBalance(token) {
        return new Promise(async (resolve, reject) => {
            let detail = await this.getAssetDetail(token);
            token = Object.keys(detail)[0];
            this.client.privateMethod('Balance', {
                asset: token
            }, async (err, balances) => {
                if (typeof balances["result"] !== "undefined") {
                    if (typeof balances["result"][token] !== "undefined") {
                        console.log("Kraken balance:", balances["result"][token]);
                        resolve(balances["result"][token]);
                    } else {
                        resolve(0);
                    }
                } else {
                    resolve(0);
                }
            });
        });
    }


    public transfer(data) {
        return new Promise(async (resolve, reject) => {
            let name = (data['accountID'] + data.asset + data.network + data.address.substring(0, 8)).toUpperCase();
            let token = data['asset'];
            let detail = await this.getAssetDetail(token);
            token = detail[Object.keys(detail)[0]].altname;
            this.client.privateMethod('Withdraw', {
                asset: token,
                key: name,
                amount: data.amount
            }, async (e, r) => {
                console.log(e);
                console.log(r);
            });
        });
    }
}