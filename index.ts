import { Database } from 'sqlite3';
import { Block } from "./lib/classes/block";
import { Transaction } from "./lib/classes/transaction";
import { addReward, generateKeys, initializeWalletDB, transfer, walletToString } from "./lib/functions";

const amount = 1000;
const blockTransactionLenght = 2;
const db = new Database('./db.db');
let transactions: Transaction[] = [];
let prevBlockHash: string = 'this is a random string';
let blochChain: Block[] = [];

db.run('CREATE TABLE IF NOT EXISTS wallets (publicKey TEXT, privateKey TEXT, amount INTEGER)', (err) => {
    if (err) {
        return console.error(err.message);
    }
});

console.log("running...\n");
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);

        console.log(blochChain);

        switch (url.pathname) {
            case '/generatekeys':
                let keys = generateKeys();
                let res = await initializeWalletDB(db, keys);
                return new Response(res);
            case '/mine':
                if (req.method === 'POST') {
                    const data = await req.json();
                    let res = await addReward(db, data.privateKey);
                    return new Response(res);
                } else {
                    return new Response("Must use POST method");
                }
            case '/':
                if (req.method === 'POST') {
                    const data = await req.json();
                    let res = await walletToString(db, data.privateKey);
                    return new Response(res);
                } else {
                    return new Response("Must use POST method");
                }
            case '/transfer':
                if (req.method === 'POST') {
                    const data = await req.json();
                    let res = await transfer(db, data.senderPrivate, data.receiverPublic, data.amount);
                    transactions.push(new Transaction(data.senderPrivate, data.receiverPublic, data.amount));
                    if (transactions.length >= blockTransactionLenght) {
                        blochChain.push(new Block(prevBlockHash, transactions));
                        prevBlockHash = blochChain[blochChain.length - 1].getHash();
                        transactions = [];
                    }
                    return new Response(res);
                } else {
                    return new Response("Must use POST method");
                }
            default:
                return new Response("This endpoint does not exist");
        }
    },
    error(error) {
        return new Response(`<pre>${error}\n${error.stack}</pre>`, {
            headers: {
                "Content-Type": "text/html",
            },
        });
    },
})