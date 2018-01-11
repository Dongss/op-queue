# op-queue

[![Build Status](https://travis-ci.org/Dongss/op-queue.svg?branch=master)](https://travis-ci.org/Dongss/op-queue)
[![Coverage Status](https://coveralls.io/repos/github/Dongss/op-queue/badge.svg?branch=master)](https://coveralls.io/github/Dongss/op-queue?branch=master)
[![Dependency Status](https://dependencyci.com/github/Dongss/op-queue/badge)](https://dependencyci.com/github/Dongss/op-queue)


A simple module for operations in queue.

Push operations to queue, they will execute one by one.

Support `async` functions or functions returned `Promise`.

## Intall

`npm install op-queue --save`

## Usage

```
const OpQueue = require('op-queue').default;
let myQ = new OpQueue();

function promiseOperation(...args) {
    return new Promise((resolve: any, reject: any) => {
        // ...
    });
}

async function asyncOperation(...args) {
    // ...
}

let myPromiseOp = OpQueue.buildOperation(promiseOperation);
let myAsyncOp = OpQueue.buildOperation(asyncOperation);

myQ.push(myPromiseOp(...args), (err. data) => {
    // ... handle returns of function "promiseOperation"
});
myQ.push(myAsyncOp(...args), (err, data) => {
    // ... handle returns of function "asyncOperation"
});
```

## Events

### done

```
myQ.on('done', (data) => {
    console.log('event.done:', data);
});
```

### op_error

```
myQ.on('op_error', (error) => {
    console.log('event.error:', error);
});
```

## API

```
const OpQueue = require('op-queue').default;
let myQ = new OpQueue();
```

### OpQueue.buildOperation(fn)

* `fn`: `async` function or function returned `Promise`

### length

`let l = myQ.length`

Get length of operations pending in queue (exclude the operation in processing)

### push(op, callback)

Push operation to queue

* `op` value returned by `OpQueue.buildOperation(fn)`
* `callback` returns of op, optional, (error, data) => {}

## Example

typescript example:

```
import OpQueue from 'op-queue';

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
```

## Test

`npm test`