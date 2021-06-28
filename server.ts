import {Bot} from "./lib/bot";
import {Accounts} from "./lib/accounts";
import * as Express from 'express';

const app = Express();
let http = require("http").Server(app);
let io = require("socket.io")(http, {
    cors: {
        methods: ["GET", "POST"]
    }
});
let notifier = (type: number, message: string) => {
    if (type) {
        let typeList = {
            1: "success",
            2: "error",
            3: "warning",
            4: "info"
        }
        io.emit('notification', {type: typeList[type], msg: message});
    }
}

let accounts = new Accounts();
let accountList;
accounts.syncGet().then((r) => {
    accountList = r;
});
let bots = new Bot(notifier);
let botList = {};
http.listen(7575, () => {
});

setInterval(() => {
    if (botList !== bots.getBotList()) {
        botList = bots.getBotList();
        io.emit('botList', botList);
    }
}, 100);
io.on("connection", function (socket: any) {

    socket.on('addAccount', (data) => {
        accounts.add(data).then(() => {
            notifier(1, "Account created!")
            io.emit('addAccountRedirect', "ping");
            accountList = accounts.get();
        });
    });
    socket.on('deleteAccount', (data) => {
        let accountID = data.id;
        accounts.delete(accountID).then(() => {
            notifier(1, "Account deleted!")
            io.emit('accountList', accounts.get());
            accountList = accounts.get();
        });
    });
    socket.on('botList', () => {
        io.emit('botList', botList);
    });
    socket.on('stopBot', (data) => {
        let botID = data.botID;
        bots.stop(botID);
    });
    socket.on('editBot', (data) => {
        let botID = data.botID;
        let firstHighLevel = data.firstHighLevel;
        let firstLowLevel = data.firstLowLevel;
        let secondHighLevel = data.secondHighLevel;
        let secondLowLevel = data.secondLowLevel;
        bots.edit(botID, firstHighLevel, firstLowLevel, secondHighLevel, secondLowLevel);
    });
    socket.on('deleteBot', (data) => {
        let botID = data.botID;
        bots.safeDelete(botID);
    });
    socket.on('reRunBot', (data) => {
        let botID = data.botID;
        let botData = botList[botID];
        if (botData.status !== 1) {
            bots.reRun(data.botID);
        }
    });
    socket.on('createBot', (data) => {
        for (let i in accountList) {
            let account = accountList[i];
            if (account['id'] == data['firstAccountID']) {
                data['firstAccount'] = account;
            }
            if (account['id'] == data['secondAccountID']) {
                data['secondAccount'] = account;
            }
        }
        bots.create(data);
    });
    socket.on('getInfo', (data) => {

        for (let i in accountList) {
            let account = accountList[i];
            if (account['id'] == data['firstAccountID']) {
                data['firstAccount'] = account;
            }
            if (account['id'] == data['secondAccountID']) {
                data['secondAccount'] = account;
            }
        }
        bots.getInfo(data).then((result) => {
            if (data.firstAccount.exchangeID == 4) {
                for (let i in result['availableChains']) {
                    let chainName = result['availableChains'][i];
                    result['second'][chainName]['info'] = {
                        note: "You need to add a withdrawal address to withdraw from Kraken.",
                        name: (data['secondAccountID'] + data.asset + chainName + result['second'][chainName].depositAddress.substring(0, 8)).toUpperCase(),
                        address: result['second'][chainName].depositAddress,
                        memo: result['second'][chainName].depositMemo
                    }
                }
            }
            if (data.secondAccount.exchangeID == 4) {
                for (let i in result['availableChains']) {
                    let chainName = result['availableChains'][i];
                    result['first'][chainName]['info'] = {
                        name: (data['firstAccountID'] + data.asset + chainName + result['first'][chainName].depositAddress.substring(0, 8)).toUpperCase(),
                        address: result['first'][chainName].depositAddress,
                        memo: result['first'][chainName].depositMemo
                    }
                }
            }
            console.log(result);
            io.emit('getInfo', result);
        });

    });

    socket.on('getAccounts', () => {
        io.emit('accountList', accounts.get());
    });

});

console.log("INFO:", "Started! v0.03", Date.now())

