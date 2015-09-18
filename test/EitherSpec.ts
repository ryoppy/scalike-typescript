/// <reference path="../typings/tsd.d.ts" />

import * as assert from 'power-assert';
import {Right, Left} from '../app/src/Either';
import {Try} from '../app/src/Try';

describe("Either", () => {
  it('isRight', () => {
    assert(Right(1).isRight);
    assert(Left(1).isRight === false);
  });
  it('isLeft', () => {
    assert(Right(1).isLeft === false);
    assert(Left(1).isLeft);
  });
  it('fold', () => {
    assert(Right(1).fold((a) => 0, (b) => 1) === 1);
    assert(Left(1).fold((a) => 0, (b) => 1) === 0);
  });
  it('swap', () => {
    assert(Right(1).swap().isLeft);
    assert(Right(1).swap().left().get() === 1);
    assert(Left(1).swap().isRight);
    assert(Left(1).swap().right().get() === 1);
  });
  it('get', () => {
    assert(Right(1).right().get() === 1);
    assert(Try(() => Right(1).left().get()).isFailure);
    assert(Left(1).left().get() === 1);
    assert(Try(() => Left(1).right().get()).isFailure)
  });
  it('getOrElse', () => {
    assert(Right(1).right().getOrElse(0) === 1);
    assert(Right(1).left().getOrElse(0) === 0);
    assert(Left(1).left().getOrElse(0) === 1);
    assert(Left(1).right().getOrElse(0) === 0);
  });
  it('forall', () => {
    assert(Right(1).right().forall((x) => x === 1));
    assert(Right(1).right().forall((x) => x === 2) === false);
    assert(Right(1).left().forall((x) => x === 1));
    assert(Left(1).left().forall((x) => x === 1));
    assert(Left(1).left().forall((x) => x === 2) === false);
    assert(Left(1).right().forall((x) => x === 1));
  });
  it('exists', () => {
    assert(Right(1).right().exists((x) => x === 1));
    assert(Right(1).right().exists((x) => x === 2) === false);
    assert(Right(1).left().exists((x) => x === 1) === false);
    assert(Left(1).left().exists((x) => x === 1));
    assert(Left(1).left().exists((x) => x === 2) === false);
    assert(Left(1).right().exists((x) => x === 1) === false);
  });
  it('filter', () => {
    assert(Right(1).right().filter((x) => x === 1).nonEmpty);
    assert(Right(1).right().filter((x) => x === 2).isEmpty);
    assert(Right(1).left().filter((x) => x === 1).isEmpty);
    assert(Left(1).left().filter((x) => x === 1).nonEmpty);
    assert(Left(1).left().filter((x) => x === 2).isEmpty);
    assert(Left(1).right().filter((x) => x === 1).isEmpty);
  });
  it('map', () => {
    assert(Right(1).right().map((x) => x + 1).right().getOrElse(0) === 2);
    assert(Right(1).left().map((x) => x + 1).right().getOrElse(0) === 1);
    assert(Left(1).left().map((x) => x + 1).left().getOrElse(0) === 2);
    assert(Left(1).right().map((x) => x + 1).left().getOrElse(0) === 1);
  });
  it('flatMap', () => {
    assert(Right(1).right().flatMap((x) => Right(x + 1)).isRight);
    assert(Right(1).left().flatMap((x) => Right(x + 1)).isRight);
    assert(Right(1).right().flatMap((x) => Left(x + 1)).isLeft);
    assert(Left(1).left().flatMap((x) => Left(x + 1)).isLeft);
    assert(Left(1).right().flatMap((x) => Left(x + 1)).isLeft);
    assert(Left(1).left().flatMap((x) => Right(x + 1)).isRight);
  });
  it('toOptional', () => {
    assert(Right(1).right().toOptional().get() === 1);
    assert(Right(1).left().toOptional().isEmpty);
    assert(Left(1).left().toOptional().get() === 1);
    assert(Left(1).right().toOptional().isEmpty);
  });
});
