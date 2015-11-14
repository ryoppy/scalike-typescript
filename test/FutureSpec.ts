/// <reference path="../typings/tsd.d.ts" />

import * as assert from 'power-assert';
import {Try, Success, Failure} from '../app/src/Try';
import {Optional, Some, None} from '../app/src/Optional';
import {Future} from '../app/src/Future';
require('es6-promise').polyfill();

describe("Future", () => {
  describe("onComplete", () => {
    it("ok", (done) => {
      Future(() => 1).onComplete(t => { assert(t.get() === 1); done() });
    });
    it("ng", (done) => {
      Future(() => {throw 'a'}).onComplete(t => { assert(t.isFailure); done() });
    });
  });

  describe("isCompleted", () => {
    it("ok async", (done) => {
      var fu = Future(() => 1);
      assert(fu.isCompleted() === false);
      setTimeout(() => {
        assert(fu.isCompleted());
        done();
      }, 10);
    });
    it("ok sync", () => {
      assert(Future.successful(1).isCompleted());
    });
  });

  describe("value", () => {
    it("async", (done) => {
      var fu = Future(() => 1);
      assert(fu.value().isEmpty);
      setTimeout(() => {
        assert(fu.value().get().get() === 1);
        done();
      }, 10);
    });
    it("sync", () => {
      assert(Future.successful(1).value().get().get() === 1);
    });
  });

  describe("failed", () => {
    it("ok", () => {
      return Future(() => 1).failed().promise.catch(e => assert(e instanceof Error));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).failed().promise.then(a => assert(a === 'err'));
    });
  });

  describe("foreach", () => {
    it("ok", (done) => {
      Future(() => 1).foreach(a => {assert(a === 1); done()})
    });
  });

  describe("transform", () => {
    it("ok", () => {
      return Future(() => 1).transform(t => t).promise.then(x => assert(x === 1));
    });
    it("ok to ng", () => {
      return Future(() => 1).transform(t => t.failed()).promise.catch(e => assert(e instanceof Error));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).transform(t => t).promise.catch(e => assert(e === 'err'));
    });
    it("ng to ok", () => {
      return Future(() => {throw 'err'}).transform(t => Success(1)).promise.then(x => assert(x === 1));
    });
  });

  describe("transformWith", () => {
    it("ok", () => {
      return Future(() => 1).transformWith(t => Future.fromTry(t)).promise.then(x => assert(x === 1));
    });
    it("ok to ng", () => {
      return Future(() => 1).transformWith(t => Future.fromTry(t.failed())).promise.catch(e => assert(e instanceof Error));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).transformWith(t => Future.fromTry(t)).promise.catch(e => assert(e === 'err'));
    });
    it("ng to ok", () => {
      return Future(() => {throw 'err'}).transformWith(t => Future.successful(1)).promise.then(x => assert(x === 1));
    });
  });

  describe("map", () => {
    it("ok", () => {
      return Future(() => 1).map(x => x + 1).promise.then(x => assert(x === 2));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).map(x => x + 1).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("flatMap", () => {
    it("ok", () => {
      return Future(() => 1).flatMap(x => Future(() => x + 1)).promise.then(x => assert(x === 2));
    });
    it("ok to ng", () => {
      return Future(() => 1).flatMap(x => Future.failed(new Error)).promise.catch(e => assert(e instanceof Error));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).flatMap(x => Future(() => x + 1)).promise.catch(e => assert(e === 'err'));
    });
    it("ng is ng", () => {
      return Future(() => {throw 'err'}).flatMap(x => Future(() => 1)).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("recover", () => {
    it("ok", () => {
      return Future(() => 1).recover(e => Some(0)).promise.then(x => assert(x === 1));
    });
    it("ng to ok", () => {
      return Future(() => {throw 'err'}).recover(e => Some(1)).promise.then(x => assert(x === 1));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).recover(e => None).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("recoverWith", () => {
    it("ok", () => {
      return Future(() => 1).recoverWith(e => Some(Future.successful(0))).promise.then(x => assert(x === 1));
    });
    it("ok to ng", () => {
      return Future(() => 1).recoverWith(e => Some(Future.failed(new Error))).promise.catch(e => assert(e instanceof Error));
    });
    it("ng to ok", () => {
      return Future(() => {throw 'err'}).recoverWith(e => Some(Future.successful(0))).promise.then(x => assert(x === 0));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).recoverWith(e => None).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("zip", () => {
    it("ok", () => {
      return Future(() => 1).zip(Future(() => 2)).promise.then(x => assert.deepEqual(x, [1,2]));
    });
    it("ng", () => {
      return Future(() => 1).zip(Future.failed(new Error)).promise.catch(e => assert(e instanceof Error));
    });
  });

  describe("zipWith", () => {
    it("ok", () => {
      return Future(() => 1).zipWith(Future(() => 2), (a, b) => a + b).promise.then(x => assert(x === 3));
    });
    it("ng", () => {
      return Future(() => 1).zipWith(Future.failed(new Error), (a, b) => a + b).promise.catch(e => assert(e instanceof Error));
    });
  });

  describe("fallbackTo", () => {
    it("ok", () => {
      return Future(() => 1).fallbackTo(Future(() => 2)).promise.then(x => assert(x === 1));
    });
    it("ng to ok", () => {
      return Future(() => {throw 'err'}).fallbackTo(Future(() => 2)).promise.then(x => assert(x === 2));
    });
    it("ng to ng", () => {
      return Future(() => {throw 'err'}).fallbackTo(Future(() => {throw 'err2'})).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("andThen", () => {
    it("ok", () => {
      return Future(() => 1).andThen(t => assert(t.get() === 1)).promise.then(x => assert(x === 1));
    });
    it("ok", () => {
      return Future(() => 1).andThen(() => {throw 'err'}).promise.then(x => assert(x === 1));
    });
    it("ng", () => {
      return Future(() => {throw 'err'}).andThen(t => assert(t.isFailure)).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("apply1", () => {
    it("ok", () => {
      return Future(() => 1).apply1(Future(() => 2), (a, b) => a + b).promise.then(x => assert(x === 3));
    });
    it("ng", () => {
      return Future(() => 1).apply1(Future.failed(new Error), (a, b) => a + b).promise.catch(e => assert(e instanceof Error));
    });
  });

  describe("apply2", () => {
    it("ok", () => {
      return Future(() => 1).apply2(Future(() => 2), Future(() => 3), (a, b, c) => a + b + c).promise.then(x => assert(x === 6));
    });
    it("ng", () => {
      return Future(() => 1).apply2(Future.failed(new Error), Future(() => 3), (a, b, c) => a + b + c).promise.catch(e => assert(e instanceof Error));
    });
  });

  describe("chain", () => {
    it("ok1", () => {
      return Future(() => 1).chain(Future(() => 2)).run((a, b) => a + b).promise.then(x => assert(x === 3));
    });
    it("ok2", () => {
      return Future(() => 1).chain(Future(() => 2)).chain(Future(() => 3)).run((a, b, c) => a + b + c).promise.then(x => assert(x === 6));
    });
    it("ng", () => {
      return Future(() => 1).chain(Future.failed(new Error)).run((a, b, c) => a + b + c).promise.catch(e => assert(e instanceof Error));
    });
  });

  // static

  describe("unit", () => {
    it("ok", () => {
      assert(Future.unit().value().get().get() === undefined);
    });
  });

  describe("successful", () => {
    it("ok", () => {
      assert(Future.successful(1).value().get().get() === 1);
    });
  });

  describe("failed", () => {
    it("ok", () => {
      assert(Future.failed(new Error).value().get().isFailure);
    });
  });

  describe("fromTry", () => {
    it("ok", () => {
      assert(Future.fromTry(Success(1)).value().get().get() === 1);
      assert(Future.fromTry(Failure(new Error)).value().get().isFailure);
    });
  });

  describe("sequence", () => {
    it("ok", () => {
      return Future.sequence([Future(() => 1), Future(() => 2)]).promise.then(a => assert.deepEqual(a, [1, 2]));
    });
    it("ng", () => {
      return Future.sequence([Future(() => {throw 'err'}), Future(() => 2)]).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("firstCompletedOf", () => {
    it("ok", () => {
      return Future.firstCompletedOf([Future(() => 1), Future(() => 2)]).promise.then(a => assert(a === 1))
    });
    it("ng", () => {
      return Future.firstCompletedOf([Future(() => {throw 'err'}), Future(() => 2)]).promise.catch(e => assert(e === 'err'));
    });
  });

  describe("find", () => {
    it("ok", () => {
      const futures = [Future(() => 1), Future(() => 2)];
      return Future.find(futures, x => x === 2).promise.then(a => assert(a.get() === 2));
    });
    it("ok none", () => {
      const futures = [Future(() => 1), Future(() => 2)];
      return Future.find(futures, x => x === 0).promise.then(a => assert(a.isEmpty));
    });
    it("in ng", () => {
      const futures = [Future(() => {throw 'err'}), Future(() => 2)];
      return Future.find(futures, x => x === 2).promise.then(a => assert(a.get() === 2));
    });
    it("empty", () => {
      const futures = [];
      return Future.find(futures, x => x === 0).promise.then(a => assert(a.isEmpty));
    });
  });

  describe("foldLeft", () => {
    it("ok", () => {
      const futures = [Future(() => 1), Future(() => 2)];
      return Future.foldLeft(futures, 0, (b, a) => b + a).promise.then(a => assert(a === 3));
    });
    it("empty", () => {
      const futures = [];
      return Future.foldLeft(futures, 0, (b, a) => b + a).promise.then(a => assert(a === 0));
    });
    it("in ng", () => {
      const futures = [Future(() => {throw 'err'}), Future(() => 2)];
      return Future.foldLeft(futures, 0, (b, a) => b + a).promise.catch(e => assert(e === 'err'));
    });
  });

  // TODO
  //describe("reduceLeft", () => {
  //  it("ok", () => {
  //    const futures = [Future(() => 1), Future(() => 2)];
  //    return Future.reduceLeft(futures, (b, a) => b + a).promise.then(a => assert(a === 3));
  //  });
  //  it("empty", () => {
  //    const futures = [];
  //    return Future.reduceLeft(futures, (b, a) => b + a).promise.catch(e => assert(e instanceof Error));
  //  });
  //  it("in ng", () => {
  //    const futures = [Future(() => {throw 'err'}), Future(() => 2)];
  //    return Future.reduceLeft(futures, (b, a) => b + a).promise.catch(e => assert(e === 'err'));
  //  });
  //});

  describe("traverse", () => {
    it("ok", () => {
      const xs = [1, 2];
      return Future.traverse(xs, (a) => Future.successful(a + "ok")).promise.then(a => assert.deepEqual(a, ["1ok", "2ok"]));
    });
    it("empty", () => {
      const xs = [];
      return Future.traverse(xs, (a) => Future.successful(a + "ok")).promise.then(a => assert.deepEqual(a, []));
    });
    it("ng", () => {
      const xs = [1,2,3];
      return Future.traverse(xs, (a) => Future.failed(new Error)).promise.catch(e => assert(e instanceof Error));
    });
  });

});
