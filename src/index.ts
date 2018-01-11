import * as events from 'events';

enum QueueEvents {
    DONE = 'done',
    ERROR = 'op_error',
}

export type Operation = (...args: any[]) => Promise<any>;

export interface QueueElement {
    op: Operation;
    cb?: (err: any, ...args: any[]) => any;
}

export interface QueueInfo {
    length: number;
}

export default class OpQueue extends events.EventEmitter {
    private q: Array<QueueElement>;
    current: QueueElement = null;
    constructor() {
        super();
        this.q = [];
    }
    static buildOperation(fn: Operation) {
        return function(...args: any[]) {
            return function() {
                return fn.apply(fn, args);
            };
        };
    }
    get length() {
        return this.q.length;
    }
    push(op: Operation, cb?: (...args: any[]) => any) {
        this.q.push({
            op: op,
            cb: cb
        });
       this.beforeNext();
    }
    private next() {
        if (this.length < 1) {
            return;
        }
        this.current = this.q.shift();
        this.current.op().then((...args: any[]) => {
            this.onDone.apply(this, args);
        }).catch((e: any) => {
            this.onError.call(this, e);
        });
    }
    private onDone(...args: any[]) {
        this.emit(QueueEvents.DONE, args[0]);
        if (typeof this.current.cb === 'function') {
            this.current.cb.apply(this.current.cb, [null].concat(args));
        }
        this.afterNext();
    }
    private onError(e: any) {
        this.emit(QueueEvents.ERROR, e);
        if (typeof this.current.cb === 'function') {
            this.current.cb.call(this.current.cb, e);
        }
        this.afterNext();
    }
    private beforeNext() {
        if (!this.current) {
            this.next();
        }
    }
    private afterNext() {
        if (this.current) {
            this.current = null;
        }
        this.beforeNext();
    }
}