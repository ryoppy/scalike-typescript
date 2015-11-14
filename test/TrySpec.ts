/// <reference path="../typings/tsd.d.ts" />

import * as assert from 'power-assert';
import {Try, Success, Failure} from '../app/src/Try';
import {Optional, Some} from '../app/src/Optional';

describe("Try", () => {
  const err = () => { throw 'err' };
  const f = () => 1;

  it("Success", () => {
    assert(Success(1).isSuccess);
    assert(Success(1).isFailure === false);
  });
  it("Failure", () => {
    assert(Failure(new Error).isFailure);
    assert(Failure(new Error).isSuccess === false);
  });

  it("isFailure", () => {
    assert(Try(err).isFailure);
    assert(Try(f).isFailure === false);
  });
  it("isSuccess", () => {
    assert(Try(err).isSuccess === false);
    assert(Try(f).isSuccess)
  });
  it("get", () => {
    assert(Try(f).get() === 1);
    try {
      Try(err).get();
      assert(false)
    } catch(e) {
      assert(true)
    }
  });
  it("fold", () => {
    assert(Try(f).fold((e) => 0, (a) => a) === 1);
    assert(Try(err).fold((e) => 0, (a) => a) === 0);
  });
  it("getOrElse", () => {
    assert(Try(f).getOrElse(0) === 1);
    assert(Try(err).getOrElse(0) === 0);
  });
  it("orElse", () => {
    assert(Try(err).orElse(Try(f)).get() === 1);
    assert(Try(f).orElse(Try(err)).get() === 1);
    assert(Try(err).orElse(Try(err)).isFailure)
  });
  it("foreach", () => {
    Try(err).foreach((a) => assert(false));
    Try(f).foreach((a) => assert(true));
  });
  it("flatMap", () => {
    assert(Try(f).flatMap((a) => Success(a + 1)).get() === 2);
    assert(Try(err).flatMap((a) => Success(a + 1)).isFailure);
  });
  it("map", () => {
    assert(Try(f).map((a) => a + 1).get() === 2);
    assert(Try(err).map((a) => a + 1).isFailure);
  });
  it("filter", () => {
    assert(Try(f).filter((a) => a === 1).isSuccess);
    assert(Try(f).filter((a) => a === 0).isFailure);
    assert(Try(err).filter((a) => a === 1).isFailure);
  });
  it("toOptional", () => {
    assert(Try(f).toOptional().nonEmpty);
    assert(Try(err).toOptional().isEmpty);
  });
  it("failed", () => {
    assert(Try(f).failed().isFailure);
    assert(Try(err).failed().isFailure);
  });
  it("transform", () => {
    assert(Try(f).transform((a) => Success(a + 1), (e) => Success(0)).get() === 2);
    assert(Try(err).transform((a) => Success(a + 1), (e) => Success(0)).get() === 0);
  });
  it("recover", () => {
    assert(Try(f).recover((e) => Some(0)).get() === 1);
    assert(Try(err).recover((e) => Some(0)).get() === 0);
  });
  it("recoverWith", () => {
    assert(Try(f).recoverWith((e) => Some(Success(0))).get() === 1);
    assert(Try(err).recoverWith((e) => Some(Success(0))).get() === 0);
  });
  it("apply1,2", () => {
    assert(Try(f).apply1(Try(f), (a, b) => a + b).get() === 2);
    assert(Try(f).apply2(Try(f), Try(f), (a, b, c) => a + b + c).get() === 3);
  });
  it("chain", () => {
    assert(Try(f).apply1(Try(f), (a, b) => a + b).get() === 2);
    assert(Try(f).apply2(Try(f), Try(f), (a, b, c) => a + b + c).get() === 3);
  });
});