import { resolve } from 'bun';
import * as crypto from 'crypto';
import type { Database } from 'sqlite3';
import { resolveProjectReferencePath } from 'typescript';

export function hash(s: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(s);
    return hash.digest('hex');
}

export function generateKeys(): string[] {
    const privateKey = crypto.randomBytes(32).toString('hex');
    const publicKey = hash(privateKey);
    return [publicKey, privateKey];
}

export function initializeWalletDB(db: Database, keys: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO wallets(publicKey, privateKey, amount) VALUES(?, ?, ?)`, keys[0], keys[1], 0, (err: any) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(`public: ${keys[0]}\nprivate: ${keys[1]}`);
            }
        });
    });
}

export function addReward(db: Database, privateKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE wallets SET amount = amount + 1 WHERE privateKey = ?`, privateKey, function (err: any) {
            if (err) {
                reject(err.message);
            } else if (this.changes > 0) {
                resolve('+1 lalala coin');
            } else {
                reject('No wallet found with the provided private key.');
            }
        });
    });
}

export function walletToString(db: Database, privateKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM wallets WHERE privateKey = ?`, privateKey, (err: any, row: any) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                resolve(`publicKey: ${row.publicKey}\nprivateKey: ${row.privateKey}\namount: ${row.amount}`);
            } else {
                reject('No wallet found with the provided private key.');
            }
        });
    });
}

export function transfer(db: Database, senderPrivate: string, receiverPublic: string, amount: number): Promise<string> {
    return new Promise((resolve, reject) => {
        if (amount < 0) {
            reject('Amount must be greater than 0');
        }

        db.get(`SELECT amount FROM wallets WHERE privateKey = ?`, senderPrivate, (err: any, row: any) => {
            if (err) {
                reject(err.message);
            } else if (row) {
                if (row.amount < amount) {
                    reject('Insufficient funds');
                } else {
                    db.get(`SELECT 1 FROM wallets WHERE publicKey = ?`, receiverPublic, (err: any, row: any) => {
                        if (err) {
                            reject(err.message);
                        } else if (row) {
                            db.run(`UPDATE wallets SET amount = amount - ? WHERE privateKey = ?`, amount, senderPrivate, function (err: any) {
                                if (err) {
                                    reject(err.message);
                                }

                                db.run(`UPDATE wallets SET amount = amount + ? WHERE publicKey = ?`, amount, receiverPublic, function (err: any) {
                                    if (err) {
                                        reject(err.message);
                                    } else {
                                        resolve('Transfered');
                                    }
                                });
                            });
                        } else {
                            reject('No wallet found with the provided public key.');
                        }
                    });
                }
            } else {
                reject('No wallet found with the provided private key.');
            }
        });
    });
}