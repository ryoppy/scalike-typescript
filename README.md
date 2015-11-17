# Scala like utility for TypeScript

[![Travis CI](https://travis-ci.org/ryoppy/scalike-typescript.svg?branch=master)](https://travis-ci.org/ryoppy/scalike-typescript) 

- Optional (Option is reserved word..)
- Try
- Either
- Future

You can use `map`, `flatMap` like a Scala. Almost implements methods of Scala. and, of counse Immutable.

If you wanna `List`, `Map`, ... You can use [Immutable.js](https://github.com/facebook/immutable-js/)

## Getting started

Install scalike using npm.

```
$ npm install scalike
```

Example in TypeScript. install d.ts.

```
$ tsd install scalike
$ vi example.ts
```

write.

```
///<reference path='./typings/scalike/scalike.d.ts'/>
import {Optional} from 'scalike';

var a = Optional(1).map(x => x + 1); // Some(2)
var b = Optional(null).getOrElse(0); // 0

console.log(a, b);
```

run.

```
$ tsc example.ts --module commonjs // generate js file.
$ node example.js // run it.
```

I use IntellijIDEA, it's supported TypeScript.

### Node.js or CoffeeScript

Then require it into any module.

node

```
$ node
> var scalike = require('scalike');
...
```

coffee

```
$ coffee
> scalike = require 'scalike'
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

## Example

### Optional

`Some<A>` or `None`.

```
Optional(1).map(x => x + 1) // Some(2)
Optional(null).map(x => x + 1) // None
Optional(undefined).map(x => x + 1) // None
Optional(1).flatMap(x => Some(x + 1)).fold(0, x => x + 1) // 3
```

### Try

Excpetion safe collection.

`Success<A>` or `Failure`.

```
function something() { return 1 }
Try(something) // Success(1)

function throwError() { throw new Error }
Try(throwError) // Failure(Error)

Try(() => 1).map(x => x + 1) // Success(2)
```

### Either

Represent A or B.

`Left<A>` or `Right<B>`.

```
function validate(x: number): Either<string, number> {
  return x !== 1 ? Left('this is not 1') : Right(x)
}
validate(1).right().getOrElse(0) // 1
validate(2).left().getOrElse("err") // "this is not 1"
```

### Future

Future is like a Promise. Exception safety.

```
function something() { return 1 }
Future(something).map(x => x + 1) // Future(2)

Future.successful(1).value // Optional(Success(1))

const fu = Future(something)
Future.sequence([fu, fu, fu]) // Future([1, 1, 1])
```

Future can received Promise.

```
function getGithub(): Promise<Response> {
  return fetch('https://github.com/');
}

Future(getGithub())
  .map(response => response.status)
  .foreach(status => console.log(status));
```

Future is implemented `ES6 Promise`.

You'll also need a Promise polyfill for [older browsers](http://caniuse.com/#feat=promises).

for browser.

```
$ bower install es6-promise

and

<script src="/path/es6-promise.js"></script>
```

for node.

```
$ npm install es6-promise

and

require('es6-promise').polyfill();
```

## for-comprehension...?

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

```
const fu = x => Future(() => x)

fu(1)
  .chain(fu(2))
  .chain(fu(3))
  .run((a, b, c) => a + b + c)
  .foreach(x => console.log(x)) // 6
```

like a [scalaz ApplicativeBuilder](https://github.com/scalaz/scalaz/blob/949b338f362a98566c5f8ba29e17d5c03b171efa/core/src/main/scala/scalaz/syntax/ApplySyntax.scala#L27).

## Documentation

soon

## Feature

- [x] Option
- [x] Try
- [x] Either
- [x] Future
- [ ] combine Immutable.js (Seq, Map, Stream, ...)

## Setup for scalike development

```
$ npm install
$ npm install tsd -g
$ tsd install
$ npm test // run unit test in mocha
```

## License

MIT
