import test from 'ava';
import * as assert from 'assert';
import * as sinon from 'sinon';
import OpQueue from '../src/index';

async function sleep(ms: number, fail?: boolean) {
    return new Promise((resolve: any, reject: any) => {
        if (!fail) {
            setTimeout(() => {
                resolve(ms);
            }, ms);
        } else {
            setTimeout(() => {
                reject(ms);
            }, ms);
        }
    });
}

function promiseOperation(a: any) {
    return new Promise((resolve: any, reject: any) => {
        resolve({a: a});
    });
}

async function asyncOperation(ms: number, fail?: boolean) {
    await sleep(ms, fail);
    return ms;
}

test('build operation with promise function', async t => {
    let myQ = new OpQueue();
    let myPromiseOp = OpQueue.buildOperation(promiseOperation);
    t.is('function', typeof myPromiseOp);
    let closureF = myPromiseOp(123456);
    t.is('function', typeof closureF);
    let r = await closureF();
    t.deepEqual(r, {a: 123456});
    t.pass();
});

test('build operation with async function', async t => {
    let myQ = new OpQueue();
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    t.is('function', typeof myAsyncOp);
    let closureF = myAsyncOp(1000);
    t.is('function', typeof closureF);
    let r = await closureF();
    t.deepEqual(1000, r);
    t.pass();
});

test('push and length', async t => {
    let myQ = new OpQueue();
    t.is(0, myQ.length);
    let mock = sinon.mock(myQ);
    mock.expects('next').once();
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    myQ.push(myAsyncOp(1000));
    mock.verify();
    mock.restore();
    t.is(1, myQ.length);
    t.pass();
});

test('queue events', async t => {
    let myQ = new OpQueue();
    let spy = sinon.spy();
    let spy2 = sinon.spy();
    myQ.on('done', spy);
    myQ.on('op_error', spy2);
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    myQ.push(myAsyncOp(100));
    myQ.push(myAsyncOp(200, true));
    await sleep(3000);
    assert(spy.withArgs(100).calledOnce);
    assert(spy2.withArgs(200).calledOnce);
    t.pass();
});

test('operation callback', async t => {
    let myQ = new OpQueue();
    let spy = sinon.spy();
    let spy2 = sinon.spy();
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    myQ.push(myAsyncOp(100), spy);
    myQ.push(myAsyncOp(200, true), spy2);
    await sleep(3000);
    assert(spy.withArgs(null, 100).calledOnce);
    assert(spy2.withArgs(200).calledOnce);
    t.pass();
});

test('synchronously execute', async t => {
    let myQ = new OpQueue();
    let result: any[] = [];
    let cb = (error: any, v: any) => {
        result.push(v);
    };
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    myQ.push(myAsyncOp(500), cb);
    myQ.push(myAsyncOp(100), cb);
    myQ.push(myAsyncOp(200), cb);
    await sleep(3000);
    t.is(0, myQ.length);
    t.deepEqual([500, 100, 200], result);
    t.pass();
});

test('manual start', async t => {
    let myQ = new OpQueue({ manualStart: true });
    let result: any[] = [];
    t.is(0, myQ.length);
    let cb = (error: any, v: any) => {
        result.push(v);
    };
    let myAsyncOp = OpQueue.buildOperation(asyncOperation);
    myQ.push(myAsyncOp(500), cb);
    myQ.push(myAsyncOp(100), cb);
    myQ.push(myAsyncOp(200), cb);
    await sleep(1000);
    t.is(3, myQ.length);
    myQ.start();
    await sleep(3000);
    t.is(0, myQ.length);
    t.deepEqual([500, 100, 200], result);
    t.pass();
});