import * as mysql from 'mysql';

require('dotenv').config();


export class Database {
    public connection: any;

    public constructor() {
        this.connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        });
        this.connection.on('error', function (err) {
            this.connection.connect();
        });
    }

    public dateTime() {
        return new Date();
    }

    public addAccount(name: string, exchangeID: number, apiKey: string, apiSecret: string, pass: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connection.query('INSERT INTO accounts SET ?', {
                name: name,
                exchangeID: exchangeID,
                apiKey: apiKey,
                apiSecret: apiSecret,
                pass: pass,
                status: 1,
                created_at: this.dateTime()
            }, function (error, results) {
                if (!error) {
                    resolve(results['insertId']);
                } else {
                    reject(error);
                }
            });
        });
    }

    public getAccounts() {
        return new Promise((resolve, reject): any => {
            this.connection.query('SELECT * FROM accounts WHERE status != 0;', function (error, results) {
                if (!error) {
                    resolve(results);
                } else {
                    reject(error);
                }
            });
        });
    }

    public deleteAccount(accountID: number) {
        return new Promise((resolve, reject) => {
            this.connection.query('UPDATE accounts SET status = 0 WHERE id = ' + accountID, function (error, results) {
                if (!error) {
                    resolve(results.changedRows);
                } else {
                    reject(error);
                }
            });
        });
    }

    public getBots(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connection.query('SELECT * FROM bots WHERE status != -1;', function (error, results) {
                if (!error) {
                    resolve(results);
                } else {
                    reject(error);
                }
            });
        });
    }

    public createBot(asset: string, first_account_id: number, second_account_id: number, first_exchange_high_level, first_exchange_low_level, second_exchange_high_level, second_exchange_low_level, chain, first_deposit, second_deposit): Promise<any> {
        return new Promise((resolve, reject) => {
            this.connection.query('INSERT INTO bots SET ?', {
                asset: asset,
                first_account_id: first_account_id,
                second_account_id: second_account_id,
                first_exchange_high_level: first_exchange_high_level,
                first_exchange_low_level: first_exchange_low_level,
                second_exchange_high_level: second_exchange_high_level,
                second_exchange_low_level: second_exchange_low_level,
                chain: chain,
                first_deposit: first_deposit,
                second_deposit: second_deposit,
                status: 1,
                created_at: this.dateTime()
            }, function (error, results) {
                if (!error) {
                    resolve(results['insertId']);
                } else {
                    reject(error);
                }
            });
        });
    }

    public editBot(botID, fH, fL, sH, sL) {
        return new Promise((resolve, reject) => {
            let query = 'UPDATE bots SET first_exchange_high_level = ' + fH + ', first_exchange_low_level = ' + fL + ', second_exchange_high_level = ' + sH + ', second_exchange_low_level = ' + sL + ' WHERE id = ' + botID;
            this.connection.query(query, function (error, results) {
                if (!error) {
                    resolve(results.changedRows);
                } else {
                    reject(error);
                }
            });
        });
    }

    public reRun(botID) {
        return new Promise((resolve, reject) => {
            this.connection.query('UPDATE bots SET status = 1 WHERE id = ' + botID, function (error, results) {
                if (!error) {
                    resolve(results.changedRows);
                } else {
                    reject(error);
                }
            });
        });
    }

    public stop(botID) {
        return new Promise((resolve, reject) => {
            this.connection.query('UPDATE bots SET status = 0 WHERE id = ' + botID, function (error, results) {
                if (!error) {
                    resolve(results.changedRows);
                } else {
                    reject(error);
                }
            });
        });
    }

    public deleteBot(botID) {
        let dateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return new Promise((resolve, reject) => {
            this.connection.query('UPDATE bots SET status = -1, updated_at = "' + dateTime + '" WHERE id = ' + botID, function (error, results) {
                if (!error) {
                    resolve(results.changedRows);
                } else {
                    reject(error);
                }
            });
        });
    }

}