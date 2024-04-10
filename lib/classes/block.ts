import { hash } from "../functions";
import type { Transaction } from "./transaction";

export class Block {

    private prevHash: string;
    private transactions: Transaction[];

    constructor(prevHash: string, transaction: Transaction[]) {
        this.prevHash = prevHash;
        this.transactions = transaction;
    }

    public getHash(): string {
        return hash(`${this.prevHash}:${this.transactions.toString()}`)
    }
}