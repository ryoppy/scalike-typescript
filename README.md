# Scala like utility for TypeScript

[![Travis CI](https://travis-ci.org/ryoppy/scalike-typescript.svg?branch=master)](https://travis-ci.org/ryoppy/scalike-typescript)

[![npm version](https://badge.fury.io/js/scalikea.svg)](http://badge.fury.io/js/scalike)

- Optional (Option is reserved word..)
- Try
- Either

You can use `map`, `flatMap` like a Scala. Almost implements methods of Scala. and of counse Immutable.

If you wanna `List`, `Map`, ... You can use [Immutable.js](https://github.com/facebook/immutable-js/)

## Getting started

Install scalike using npm.

```
npm install scalike
```

Then require it into any module.

```
var scalike = require('scalike');
...
```

### Browser

add a script tag to your page.

```
<script src="scalike.min.js"></script>
<script>
  ...
</script>
```

Or use an AMD loader (such as RequireJS):

```
require(['./scalike.min.js'], function (scalike) {
  ...
});
```

### TypeScript

```
///<reference path='./node_modules/scalike/dist/scalike.d.ts'/>
import scalike = require('scalike');
...
```

## Example

### Optional

This is `Option` (or `Maybe`).

`Some<A>` or `None`.

```
scalike.Optional(1).map((x) => x + 1) // Some(2)
```

### Try

Excpetion safe collection.

`Success<A>` or `Failure`.

```
function something() {...}
scalike.Try(something) // Success(...)
```

### Either

represent A or B.

`Left<A>` or `Right<B>`.

```
function validate(x: number): scalike.Either<string, number> {
  return x !== 1 ? scalike.Left('this is not 1') : scalike.Right(x)
}
validate(1).right().getOrElse(0) // 1
validate(2).left().getOrElse("err") // "this is not 1"
```

### for-comprehension...?

TypeScript has not `for` comprehension. Of corse.

so, I write like this.

```
Optional(1).apply1(Opption(2), (a, b) => a + b) // Optional(3)
```

and

```
Optional(1)
  .chain(Optional(2))
  .chain(Optional(3))
  .chain(Optional(4))
  .run((a, b, c, d) => a + b + c + d) // Optional(10)

Optional(1)
  .chain(Optional(2))
  .chain(Optional(null)) // if None?, be all None
  .chain(Optional(4))
  .run((a, b, c, d) => a + b + c + d) // None
```

like a [scalaz ApplicativeBuilder](https://github.com/scalaz/scalaz/blob/949b338f362a98566c5f8ba29e17d5c03b171efa/core/src/main/scala/scalaz/syntax/ApplySyntax.scala#L27).

## Documentation

soon

## Feature

- [x] Option
- [x] Try
- [x] Either
- [ ] Future
- [ ] combine Immutable.js (Seq, Map, Stream, ...)

## Setup

```
$ npm install
$ npm install tsd -g
$ tsd install
$ npm test // run unit test in mocha
```

## License

MIT