import * as API from 'kucoin-node-sdk';

export class KucoinLib {
    constructor(key, secret, pass) {
        let config = {
            baseUrl: 'https://api.kucoin.com',
            apiAuth: {
                key: key,
                secret: secret,
                passphrase: pass,
            },
            authVersion: 2,
        }
        API.init(config);

    }

    public getInfo(token) {
        return new Promise(async (resolve, reject) => {
            let a = await API.rest.User.Deposit.createDepositAddress(token);
            API.rest.User.Deposit.getDepositAddress(token).then(c => {
                let chain = {};
                for (let i in c.data) {
                    let network = c.data[i];
                    chain[network.chain] = {
                        name: network.chain,
                        coin: token,
                    }
                    chain[network.chain]['depositAddress'] = network.address;
                    chain[network.chain]['depositMemo'] = network.memo;
                }
                resolve(chain);
            }).catch(e => {
                console.log(e);
            });
        });
    }

    private withdrawInfo(token, chain) {
        return new Promise(async (resolve, reject) => {
            if (chain == "Default") {
                let data = await API.rest.User.Withdrawals.getWithdrawalQuotas(token);
                let info = {
                    fee: data.data.withdrawMinFee,
                    min: data.data.withdrawMinSize,
                    precision: data.data.precision
                }
                resolve(info);
            } else {
                let data = await API.rest.User.Withdrawals.getWithdrawalQuotas(token, {chain: chain});
                if (data.code == 900014) {
                    data = await API.rest.User.Withdrawals.getWithdrawalQuotas(token);
                    let info = {
                        fee: data.data.withdrawMinFee,
                        min: data.data.withdrawMinSize,
                        precision: data.data.precision
                    }
                    resolve(info);
                } else {
                    let info = {
                        fee: data.data.withdrawMinFee,
                        min: data.data.withdrawMinSize,
                        precision: data.data.precision
                    }
                    resolve(info);
                }


            }
        });
    }

    public getBalance(token) {
        return new Promise(async (resolve, reject) => {
            let a = await API.rest.User.Account.getAccountsList({
                type: "trade",
                currency: token
            });
            if (a.data.length == 0) {
                resolve(0);
            } else {
                resolve(a.data[0].available);
            }
        });
    }

    public mainToTrade(token, amount) {
        return new Promise(async (resolve, reject) => {
            let a = await API.rest.User.Account.getAccountsList({
                type: "main",
                currency: token
            });
            if (a.data.length !== 0) {
                if (a.data[0].available >= amount) {
                    API.rest.User.Account.innerTransfer(Date.now(), token, "main", "trade", amount).then(async (z) => {
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }

        });
    }

    public transfer(data) {
        return new Promise(async (resolve, reject) => {
            API.rest.User.Account.innerTransfer(Date.now(), data.asset, "trade", "main", data.amount).then(async (a) => {
                console.log(a);
                let transferData = {
                    chain: data.network,
                    memo: data.addressTag,
                };
                if (data.network == "Default") {
                    delete transferData.chain;
                }
                if (typeof transferData.memo === "undefined") {
                    delete transferData.memo;
                }

                let z = await API.rest.User.Withdrawals.applyWithdraw(data.asset, data.address, data.amount, transferData);
                if (z.code == 900014) {
                    delete transferData.chain;
                    let x = await API.rest.User.Withdrawals.applyWithdraw(data.asset, data.address, data.amount, transferData);
                }
            });

        });
    }
}