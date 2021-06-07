import 'reflect-metadata'

import {Accounts} from "./lib/accounts";
import {Database} from "./lib/database";
import * as Express from 'express';


const database = new Database();
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
    // logger(message);
}

let accounts = new Accounts();
let accountList = accounts.get();
http.listen(7575, () => {
});


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
    socket.on('getAccounts', () => {
        io.emit('accountList', accounts.get());
    });

});

console.log("INFO:", "Started! v0.01", Date.now())



