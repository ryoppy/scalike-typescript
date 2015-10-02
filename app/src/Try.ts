import {Optional, None} from './Optional';

export interface Try<A> {
  isSuccess: boolean;
  isFailure: boolean;
  get(): A;
  getError(): Error;
  fold<B>(fe: (e: Error) => B, ff: (a: A) => B): B;
  getOrElse<B extends A>(a: B): A;
  orElse<B extends A>(a: Try<B>): Try<A>;
  foreach<B>(f: (a: A) => void): void;
  flatMap<B>(f: (a: A) => Try<B>): Try<B>;
  map<B>(f: (a: A) => B): Try<B>;
  filter(f: (a: A) => boolean): Try<A>;
  toOptional(): Optional<A>;
  //flatten(): Try<A>;
  failed(): Try<A>;
  transform<B>(fs: (a: A) => Try<B>, ff: (e: Error) => Try<B>): Try<B>;
  recover<B extends A>(f: (e: Error) => Optional<B>): Try<A>;
  recoverWith<B extends A>(f: (e: Error) => Optional<Try<B>>): Try<A>;
  // add methods
  apply1<B, C>(ob: Try<B>, f: (a: A, b: B) => C): Try<C>;
  apply2<B, C, D>(ob: Try<B>, oc: Try<C>, f: (a: A, b: B, c: C) => D): Try<D>;
  chain<B>(ob: Try<B>): TryBuilder1<A, B>;
}
export function Try<A>(f: () => A): Try<A> {
  try {
    return new SuccessImpl(f());
  } catch (e) {
    return new FailureImpl<A>(e);
  }
}
export function Success<A>(a: A): Try<A> {
  return new SuccessImpl(a);
}
export function Failure<A>(e: Error): Try<A> {
  return new FailureImpl<A>(e);
}

class TryImpl<A> implements Try<A> {
  isSuccess: boolean;
  isFailure: boolean;

  toString(): string {
    return this.isSuccess ? `Success(${this.get()}})` : `Failure(${this.getError()}})`;
  }

  get(): A { throw 'impl child'; }
  getError(): Error { throw 'impl child'; }
  flatMap<B>(f: (a: A) => Try<B>): Try<B> { throw 'impl child'; }
  map<B>(f: (a: A) => B): Try<B> { throw 'impl child'; }
  filter(f: (a: A) => boolean): Try<A> { throw 'impl child'; }
  toOptional(): Optional<A> { throw 'impl child'; }
  failed(): Try<A> { throw 'impl child'; }
  recover<B>(f: (e: Error) => Optional<B>): Try<B> { throw 'impl child'; }
  recoverWith<B>(f: (e: Error) => Optional<Try<B>>): Try<B> { throw 'impl child'; }

  fold<B>(fe: (e: Error) => B, ff: (a: A) => B): B {
    return this.isFailure ? fe(this.getError()) : ff(this.get());
  }

  getOrElse<B extends A>(a: B): A {
    return this.isFailure ? a : this.get();
  }
  orElse<B extends A>(a: Try<B>): Try<A> {
    return this.isFailure ? a : <Try<A>>this;
  }
  foreach<B>(f: (a: A) => void): void {
    if (this.isSuccess) { f(this.get()); }
  }
  transform<B>(fs: (a: A) => Try<B>, ff: (e: Error) => Try<B>): Try<B> {
    try {
      return this.isSuccess ? fs(this.get()) : ff(this.getError());
    } catch (e) {
      return Failure<B>(e);
    }
  }

  apply1<B, C>(ob: Try<B>, f: (a: A, b: B) => C): Try<C> {
    return this.flatMap(a => ob.map(b => f(a, b)));
  }

  apply2<B, C, D>(ob: Try<B>, oc: Try<C>, f: (a: A, b: B, c: C) => D): Try<D> {
    return this.flatMap(a => ob.flatMap(b => oc.map(c => f(a, b, c))));
  }

  chain<B>(ob: Try<B>): TryBuilder1<A, B> {
    return new TryBuilder1(this, ob);
  }
}

class SuccessImpl<A> extends TryImpl<A> implements Try<A> {
  isSuccess: boolean = true;
  isFailure: boolean = false;

  constructor(private value: A) {
    super();
  }

  get(): A {
    return this.value;
  }

  getError(): Error {
    throw 'Success has not Error';
  }

  flatMap<B>(f: (a: A) => Try<B>): Try<B> {
    try {
      return f(this.value);
    } catch (e) {
      return Failure<B>(e);
    }
  }

  map<B>(f: (a: A) => B): Try<B> {
    return Try(() => f(this.value));
  }

  filter(f: (a: A) => boolean): Try<A> {
    if (this.isSuccess) {
      try {
        return f(this.value) ? this : Failure<A>(new Error('Predicate does not hold for ' + this.value));
      } catch (e) {
        return Failure<A>(e);
      }
    }
  }

  toOptional(): Optional<A> {
    return Optional(this.value);
  }

  failed(): Try<A> {
    return Failure<A>(new Error('Success.failed'));
  }

  recover<B extends A>(f: (e: Error) => Optional<B>): Try<A> {
    return Success(this.value);
  }

  recoverWith<B extends A>(f: (e: Error) => Optional<Try<B>>): Try<A> {
    return Success(this.value);
  }

  toString(): string {
    return 'Success(' + this.value + ')';
  }
}

class FailureImpl<A> extends TryImpl<A> implements Try<A> {
  isSuccess: boolean = false;
  isFailure: boolean = true;

  constructor(private e: Error) {
    super();
  }

  get(): any {
    throw this.e;
  }

  getError(): Error {
    return this.e;
  }

  flatMap<B>(f: (a: A) => Try<B>): Try<B> {
    return Failure<B>(this.e);
  }

  map<B>(f: (a: A) => B): Try<B> {
    return new FailureImpl<B>(this.e);
  }

  filter(f: (a: A) => boolean): Try<A> {
    return this;
  }

  toOptional(): Optional<A> {
    return None;
  }

  failed(): Try<A> {
    return <Try<A>>this;
  }

  recover<B extends A>(f: (e: Error) => Optional<B>): Try<A> {
    try {
      const op = f(this.e);
      return op.nonEmpty ? Success(op.get()) : Failure<B>(this.e);
    } catch (e) {
      return Failure<B>(e);
    }
  }

  recoverWith<B extends A>(f: (e: Error) => Optional<Try<B>>): Try<A> {
    try {
      const op = f(this.e);
      return op.nonEmpty ? op.get() : Failure<B>(this.e);
    } catch (e) {
      return Failure<B>(e);
    }
  }
}

/**
 * TryBuilder.
 */
export class TryBuilder1<A, B> {
  constructor(private oa: Try<A>, private ob: Try<B>) {}

  run<C>(f: (a: A, b: B) => C): Try<C> {
    return this.oa.flatMap(a => this.ob.map(b => f(a, b)));
  }

  chain<C>(oc: Try<C>): TryBuilder2<A, B, C> {
    return new TryBuilder2(this.oa, this.ob, oc);
  }
}

export class TryBuilder2<A, B, C> {
  constructor(private oa: Try<A>, private ob: Try<B>, private oc: Try<C>) {}

  run<D>(f: (a: A, b: B, c: C) => D): Try<D> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.map(c => f(a, b, c))));
  }

  chain<D>(od: Try<D>): TryBuilder3<A, B, C, D> {
    return new TryBuilder3(this.oa, this.ob, this.oc, od);
  }
}

export class TryBuilder3<A, B, C, D> {
  constructor(private oa: Try<A>, private ob: Try<B>, private oc: Try<C>, private od: Try<D>) {}

  run<E>(f: (a: A, b: B, c: C, d: D) => E): Try<E> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c =>
      this.od.map(d => f(a, b, c, d)))));
  }

  chain<E>(oe: Try<E>): TryBuilder4<A, B, C, D, E> {
    return new TryBuilder4(this.oa, this.ob, this.oc, this.od, oe);
  }
}

export class TryBuilder4<A, B, C, D, E> {
  constructor(
    private oa: Try<A>, private ob: Try<B>, private oc: Try<C>,
    private od: Try<D>, private oe: Try<E>) {}

  run<F>(f: (a: A, b: B, c: C, d: D, e: E) => F): Try<F> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d =>
      this.oe.map(e => f(a, b, c, d, e))))));
  }

  chain<F>(of: Try<F>): TryBuilder5<A, B, C, D, E, F> {
    return new TryBuilder5(this.oa, this.ob, this.oc, this.od, this.oe, of);
  }
}

export class TryBuilder5<A, B, C, D, E, F> {
  constructor(
    private oa: Try<A>, private ob: Try<B>, private oc: Try<C>,
    private od: Try<D>, private oe: Try<E>, private of: Try<F>) {}

  run<G>(f: (a: A, b: B, c: C, d: D, e: E, f: F) => G): Try<G> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d => this.oe.flatMap(e =>
      this.of.map(ff => f(a, b, c, d, e, ff)))))));
  }
}
