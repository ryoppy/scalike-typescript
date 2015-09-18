/// <reference path="../typings/tsd.d.ts" />

import * as assert from 'power-assert';
import {Optional, Some, None} from '../app/src/Optional';

describe("Optional", () => {
  it('isEmpty', () => {
    assert(Optional(null).isEmpty);
    assert(Optional(undefined).isEmpty);
    assert(Optional(1).isEmpty === false);
  });
  it('nonEmpty', () => {
    assert(Optional(null).nonEmpty === false);
    assert(Optional(undefined).nonEmpty === false);
    assert(Optional(1).nonEmpty);
  });
  it('get', () => {
    assert(Optional(1).get() === 1);
    try {
      assert(Optional(null).get());
      assert(false)
    } catch (e) {
      assert(true);
    }
  });
  it('getOrElse', () => {
    assert(Optional(1).getOrElse(0) === 1);
    assert(Optional(null).getOrElse(0) === 0);
  });
  it('map', () => {
    assert(Optional(1).map((x) => x + 1).get() === 2);
    assert(Optional(null).map((x) => x + 1).isEmpty);
  });
  it('fold', () => {
    assert(Optional(1).fold(0, (x) => x + 1) === 2);
    assert(Optional(null).fold(0, (x) => x + 1) === 0);
  });
  it('flatten'); // TODO
  it('filter', () => {
    assert(Optional(1).filter((x) => x === 1).nonEmpty);
    assert(Optional(1).filter((x) => x === 2).isEmpty);
    assert(Optional(null).filter((x) => x === 1).isEmpty);
  });
  it('contains', () => {
    assert(Optional(1).contains(1));
    assert(Optional(1).contains(2) === false);
    assert(Optional(null).contains(1) === false);
  });
  it('exists', () => {
    assert(Optional(1).exists((x) => x === 1));
    assert(Optional(1).exists((x) => x === 2) === false);
    assert(Optional(null).exists((x) => x === 1) === false);
  });
  it('forall', () => {
    assert(Optional(1).forall((x) => x === 1));
    assert(Optional(1).forall((x) => x === 2) === false);
    assert(Optional(null).forall((x) => x === 1) === true);
  });
  it('flatMap', () => {
    assert(Optional(1).flatMap((x) => Optional(null)).isEmpty);
    assert(Optional(1).flatMap((x) => Optional(x + 1)).get() === 2);
    assert(Optional(null).flatMap((x) => Optional(x + 1)).isEmpty);
  });
  it('foreach', () => {
    Optional(1).foreach((x) => assert(x === 1));
    Optional(null).foreach((x) => assert(x === 1));
  });
  it('orElse', () => {
    assert(Optional(1).orElse(Optional(2)).get() === 1);
    assert(Optional(null).orElse(Optional(2)).get() === 2);
  });
  it('apply1', () => {
    assert(Optional(1).apply1(Optional(2), (a, b) => a + b).get() === 3);
    assert(Optional(null).apply1(Optional(2), (a, b) => a + b).isEmpty);
    assert(Optional(1).apply1(Optional(null), (a, b) => a + b).isEmpty);
  });
  it('apply2', () => {
    assert(Optional(1).apply2(Optional(2), Optional(3), (a, b, c) => a + b + c).get() === 6);
    assert(Optional(null).apply2(Optional(2), Optional(3), (a, b, c) => a + b + c).isEmpty);
    assert(Optional(1).apply2(Optional(null), Optional(3), (a, b, c) => a + b + c).isEmpty);
    assert(Optional(1).apply2(Optional(2), Optional(null), (a, b, c) => a + b + c).isEmpty);
  });
  it('chain', () => {
    assert(Optional(1).chain(Optional(2)).run((a, b) => a + b).get() === 3);
    assert(Optional(1).chain(Optional(2)).chain(Optional(3)).run((a, b, c) => a + b + c).get() === 6);
    assert(Optional(1).chain(Optional(2)).chain(Optional(3)).chain(Optional(4)).run((a, b, c, d) => a + b + c + d).get() === 10);
    assert(Optional(1).chain(Optional(2)).chain(Optional(3)).chain(Optional(4)).chain(Optional(5)).run((a, b, c, d, e) => a + b + c + d + e).get() === 15);
    assert(Optional(1).chain(Optional(2)).chain(Optional(3)).chain(Optional(4)).chain(Optional(5)).chain(Optional(6)).run((a, b, c, d, e, f) => a + b + c + d + e + f).get() === 21);
    assert(Optional(null).chain(Optional(1)).run((a, b) => a + b).isEmpty);
    assert(Optional(1).chain(Optional(null)).run((a, b) => a + b).isEmpty);
  });
});