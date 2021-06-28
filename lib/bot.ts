import {KucoinLib} from "./kucoin";
import {BinanceLib} from "./binance";
import {PoloniexLib} from "./poloniex";
import {KrakenLib} from "./kraken";
import {Database} from "./database";
import {Accounts} from "./accounts";


export class Bot {
    public exchanges;
    public notifier;
    public database;
    public accounts;
    public bots: object;
    public botList: object;
    public kucoinInner;

    constructor(notifier) {
        this.exchanges = {
            1: {
                name: "Binance",
                lib: BinanceLib,
                available: true,
            },
            2: {
                name: "Kucoin",
                lib: KucoinLib,
                available: true,
            },
            3: {
                name: "Poloniex",
                lib: PoloniexLib,
                available: true,
            },
            4: {
                name: "Kraken",
                lib: KrakenLib,
                available: true,
            }

        }
        this.database = new Database();
        this.accounts = new Accounts();
        this.bots = {};
        this.notifier = notifier;
        this.kucoinInner = [];
        // let second = new this.exchanges[2].lib("60be29fc25c18200067aa9e2", "12c2a358-9d8a-4e70-b0d2-77107355cd70", "123456esgg");
        // this.kucoinInner.push({
        //     lib: second,
        //     asset: "USDT",
        // });
        const starter = async () => {
            await this.initOrUpdateBotList();
            await this.automation();
        }
        starter();
    }

    public getBotList() {
        return this.bots;
    }

    public edit(botID, fH, fL, sH, sL) {
        this.database.editBot(botID, fH, fL, sH, sL).then(() => {
            this.initOrUpdateBotList();
            this.notifier(1, "Bot ID:" + botID + " edited!");
        });
    }

    public stop(botID) {
        this.database.stop(botID).then(() => {
            this.initOrUpdateBotList();
            this.notifier(1, "Bot ID:" + botID + " stopped!");
        });
    }

    public reRun(botID) {
        this.database.reRun(botID).then(() => {
            this.initOrUpdateBotList();
            this.notifier(1, "Bot ID:" + botID + " started!");
        });
    }

    public safeDelete(botID) {
        this.database.deleteBot(botID).then(() => {
            this.initOrUpdateBotList();
            this.notifier(1, "Bot ID:" + botID + " deleted!");
        });
    }

    public initOrUpdateBotList() {
        this.accounts.syncGet().then((accounts) => {
            let botList: object = {};
            this.database.getBots().then((dbBots) => {
                for (let index in dbBots) {
                    let dbBot = dbBots[index];
                    let data = {};
                    for (let i in accounts) {
                        let account = accounts[i];
                        if (account['id'] == dbBot['first_account_id']) {
                            data['firstAccount'] = account;
                        }
                        if (account['id'] == dbBot['second_account_id']) {
                            data['secondAccount'] = account;
                        }
                    }
                    botList[dbBot['id']] = {
                        botID: dbBot['id'],
                        token: dbBot['asset'],
                        chain: dbBot['chain'],
                        status: dbBot['status'],
                        first: {
                            exchangeID: data['firstAccount'].exchangeID,
                            accountID: dbBot['first_account_id'],
                            account: data['firstAccount'],
                            lowLevel: dbBot['first_exchange_low_level'],
                            highLevel: dbBot['first_exchange_high_level'],
                            address: JSON.parse(dbBot['first_deposit']).address,
                            memo: JSON.parse(dbBot['first_deposit']).memo,
                            chain: dbBot['chain'],
                        },
                        second: {
                            exchangeID: data['secondAccount'].exchangeID,
                            accountID: dbBot['second_account_id'],
                            account: data['secondAccount'],
                            lowLevel: dbBot['second_exchange_low_level'],
                            highLevel: dbBot['second_exchange_high_level'],
                            address: JSON.parse(dbBot['second_deposit']).address,
                            memo: JSON.parse(dbBot['second_deposit']).memo,
                            chain: dbBot['chain'],
                        }
                    }
                }
                this.bots = botList;
            });
        });
    }

    public create(data) {
        let token = data['asset'];
        let firstAccountID = data['firstAccountID'];
        let secondAccountID = data['secondAccountID'];
        let firstHighLevel = data['firstHighLevel'];
        let firstLowLevel = data['firstLowLevel'];
        let secondHighLevel = data['secondHighLevel'];
        let secondLowLevel = data['secondLowLevel'];
        let chain = data['chain'];
        let firstAddress = data['firstAddress'];
        let firstMemo = data['firstMemo'];
        let firstDeposit = JSON.stringify({address: firstAddress, memo: firstMemo});
        let secondAddress = data['secondAddress'];
        let secondMemo = data['secondMemo'];
        let secondDeposit = JSON.stringify({address: secondAddress, memo: secondMemo});
        let firstAccount = data['firstAccount'];
        let secondAccount = data['secondAccount'];
        this.database.createBot(token, firstAccountID, secondAccountID, firstHighLevel, firstLowLevel, secondHighLevel, secondLowLevel, chain, firstDeposit, secondDeposit).then((botID) => {
            this.bots[botID] = {
                botID: botID,
                token: token,
                chain: chain,
                status: 1,
                first: {
                    exchangeID: firstAccount.exchangeID,
                    accountID: firstAccountID,
                    account: firstAccount,
                    lowLevel: firstLowLevel,
                    highLevel: firstHighLevel,
                    address: firstAddress,
                    memo: firstMemo,
                    chain: chain,
                },
                second: {
                    exchangeID: secondAccount.exchangeID,
                    accountID: secondAccountID,
                    account: secondAccount,
                    lowLevel: secondLowLevel,
                    highLevel: secondHighLevel,
                    address: secondAddress,
                    memo: secondMemo,
                    chain: chain,
                }
            }
            this.notifier(1, "Bot ID:" + botID + " created!");
        });

    }

    public getInfo(data) {
        return new Promise(async (resolve, reject) => {
            let token = data['asset'];
            let firstAccount = data['firstAccount'];
            let secondAccount = data['secondAccount'];
            const findDuplicates = (arr) => {
                let sorted_arr = arr.slice().sort();
                let results = [];
                for (let i = 0; i < sorted_arr.length - 1; i++) {
                    if (sorted_arr[i + 1] == sorted_arr[i]) {
                        results.push(sorted_arr[i]);
                    }
                }
                return results;
            }
            let first = new this.exchanges[firstAccount.exchangeID].lib(firstAccount.apiKey, firstAccount.apiSecret, firstAccount.pass);
            let second = new this.exchanges[secondAccount.exchangeID].lib(secondAccount.apiKey, secondAccount.apiSecret, secondAccount.pass);

            let firstInfo = await first.getInfo(token);
            let secondInfo = await second.getInfo(token);
            let result = {
                allChains: [],
                first: firstInfo,
                second: secondInfo,
                availableChains: [],
            };
            for (let chain in firstInfo) {
                result.allChains.push(chain);
                if (typeof firstInfo[chain].network !== "undefined") {
                    if (chain !== firstInfo[chain].network) {
                        result.first[firstInfo[chain].network] = firstInfo[chain];
                        result.allChains.push(firstInfo[chain].network);
                    }
                }
            }
            for (let chain in secondInfo) {
                result.allChains.push(chain);
                if (typeof secondInfo[chain].network !== "undefined") {
                    if (chain !== secondInfo[chain].network) {
                        result.second[secondInfo[chain].network] = secondInfo[chain];
                        result.allChains.push(secondInfo[chain].network);
                    }
                }
            }
            result.availableChains = findDuplicates(result.allChains);

            if (result.availableChains.length === 0) {
                for (let chain in firstInfo) {
                    if (typeof firstInfo[chain].isDefault !== "undefined") {
                        result.availableChains.push("Default");
                    }
                }
                for (let chain in secondInfo) {
                    if (typeof secondInfo[chain].isDefault !== "undefined") {
                        result.availableChains.push("Default");
                    }
                }
            }
            // console.log(result.availableChains);
            // console.log("_______");
            // console.log(result.allChains);
            delete result.allChains;
            resolve(result)

        });
    }

    public automation() {
        let loop = async () => {
            for (let i in this.kucoinInner) {
                let inner = this.kucoinInner[i];
                inner.lib.mainToTrade(inner.asset, inner.amount).then((result) => {
                    if (result === true) {
                        delete this.kucoinInner[i];
                    }
                });
            }
            for (let botID in this.bots) {
                let bot = this.bots[botID];
                if (bot.status == 1) {
                    let first = new this.exchanges[bot.first.exchangeID].lib(bot.first.account.apiKey, bot.first.account.apiSecret, bot.first.account.pass);
                    let second = new this.exchanges[bot.second.exchangeID].lib(bot.second.account.apiKey, bot.second.account.apiSecret, bot.second.account.pass);
                    if (typeof bot.first.withdrawInfo === "undefined") {
                        first.withdrawInfo(bot.token, bot.chain).then((r) => {
                            bot.first.withdrawInfo = r;
                        })
                    }
                    if (typeof bot.second.withdrawInfo === "undefined") {
                        second.withdrawInfo(bot.token, bot.chain).then((r) => {
                            bot.second.withdrawInfo = r;
                        })
                    }
                    if (typeof bot.first.withdrawInfo !== "undefined" && typeof bot.second.withdrawInfo !== "undefined") {
                        let firstBalance = await first.getBalance(bot.token);
                        let secondBalance = await second.getBalance(bot.token);
                        let transferValue = 0;
                        if (parseFloat(firstBalance) <= parseFloat(bot.first.lowLevel)) {
                            transferValue = secondBalance - bot.second.highLevel;
                            //1. Botun bakiyesi, istenilen en düşük seviyeden az, 2->1 ye transfer yapılması gerekiyor.
                            if (transferValue > bot.second.withdrawInfo.min) {
                                let x = {
                                    asset: bot.token,
                                    address: bot.first.address,
                                    network: bot.chain,
                                    addressTag: bot.first.memo,
                                    amount: transferValue.toFixed(bot.second.withdrawInfo.precision),
                                    accountID: bot.first.accountID,
                                };
                                second.transfer(x).then(() => {
                                    this.notifier(1, "Bot ID:" + bot.botID + " Balance Transfer, 2nd Exchange to 1st Exchange. " + JSON.stringify(x));
                                    if (bot.first.exchangeID == 2) {
                                        this.kucoinInner.push({
                                            lib: first,
                                            asset: bot.token,
                                            amount: parseFloat(x.amount) - parseFloat(bot.second.withdrawInfo.fee)
                                        });
                                    }
                                }).catch((err) => {
                                    this.notifier(2, "Bot ID:" + bot.botID + " Balance Transfer, 2nd Exchange to 1st Exchange. ERROR: " + err);
                                });

                            }
                        }
                        if (parseFloat(secondBalance) <= parseFloat(bot.second.lowLevel)) {
                            transferValue = firstBalance - bot.first.highLevel;
                            //2. Botun bakiyesi, istenilen en düşük seviyeden az, 1->2 ye transfer yapılması gerekiyor.
                            if (transferValue > bot.first.withdrawInfo.min) {
                                let x = {
                                    asset: bot.token,
                                    address: bot.second.address,
                                    network: bot.chain,
                                    addressTag: bot.second.memo,
                                    amount: transferValue.toFixed(bot.first.withdrawInfo.precision),
                                    accountID: bot.second.accountID,
                                }
                                first.transfer(x).then(() => {
                                    this.notifier(1, "Bot ID:" + bot.botID + " Balance Transfer, 1st Exchange to 2nd Exchange. " + JSON.stringify(x));
                                    if (bot.second.exchangeID == 2) {
                                        this.kucoinInner.push({
                                            lib: second,
                                            asset: bot.token,
                                            amount: parseFloat(x.amount) - parseFloat(bot.first.withdrawInfo.fee),
                                        });
                                    }
                                }).catch((err) => {
                                    this.notifier(2, "Bot ID:" + bot.botID + " Balance Transfer, st Exchange to 2nd Exchange. ERROR: " + err);
                                });
                            }
                        }
                    }
                }
            }
        }
        setInterval(loop, 10000); //TODO: 15 saniyeye çıkart.

    }
}
