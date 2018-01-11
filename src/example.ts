import OpQueue from './index';

let myQ = new OpQueue();

myQ.on('done', (p: any) => {
    console.log('event.done:', p);
});

myQ.on('op_error', (e: any) => {
    console.log('event.error:', e);
});

async function sleep(ms: number) {
    return new Promise((resolve: any, reject: any) => {
        setTimeout(resolve, ms);
    });
}

function promiseOperation(a: any) {
    return new Promise((resolve: any, reject: any) => {
        resolve({a: a});
    });
}

let myPromiseOp = OpQueue.buildOperation(promiseOperation);

async function asyncOperation(ms: number) {
    console.log('sleep start');
    await sleep(ms);
    console.log('sleep done');
    return ms;
}

let myAsyncOp = OpQueue.buildOperation(asyncOperation);

myQ.push(myAsyncOp(2000));
myQ.push(myPromiseOp(222));
myQ.push(myAsyncOp(3000));
myQ.push(myPromiseOp(333), (error: any, p: any) => {
    if (error) {
        console.log('cb.error', error);
    } else {
        console.log('cb.done', p);
    }
});

// output should be:
// sleep start
// sleep done
// event.done: 2000
// event.done: { a: 222 }
// sleep start
// sleep done
// event.done: 3000
// event.done: { a: 333 }
// cb.done { a: 333 }