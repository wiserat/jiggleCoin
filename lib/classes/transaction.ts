export class Transaction {

    private from: string;
    private to: string;
    private amount: string;

    constructor(from: string, to: string, amount: string) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    public toString(): string {
        return `${this.from}-${this.amount}-${this.to}`
    }
}