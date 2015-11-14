///<reference path="../../typings/es6-promise/es6-promise.d.ts"/>
import {Try, Success, Failure} from './Try';
import {Optional, Some, None} from './Optional';

export interface Future<A> {
  getPromise(): Promise<A>;
  onComplete<B>(f: (t: Try<A>) => B): void;
  isCompleted(): boolean;
  value(): Optional<Try<A>>;
  failed(): Future<Error>;
  foreach<B>(f: (a: A) => B): void;
  transform<B>(f: (t: Try<A>) => Try<B>): Future<B>;
  transform1<B>(fs: (a: A) => B, ff: (e: Error) => Error): Future<B>;
  transformWith<B>(f: (t: Try<A>) => Future<B>): Future<B>;
  map<B>(f: (a: A) => B): Future<B>;
  flatMap<B>(f: (a: A) => Future<B>): Future<B>;
  filter(f: (a: A) => boolean): Future<A>;
  recover<B extends A>(f: (e: Error) => Optional<B>): Future<A>;
  recoverWith<B extends A>(f: (e: Error) => Optional<Future<B>>): Future<A>;
  zip<B>(fu: Future<B>): Future<[A, B]>;
  zipWith<B, C>(fu: Future<B>, f: (a: A, b: B) => C): Future<C>;
  fallbackTo<B extends A>(fu: Future<B>): Future<A>;
  andThen<B>(f: (t: Try<A>) => B): Future<A>;
  // add methods
  apply1<B, C>(ob: Future<B>, f: (a: A, b: B) => C): Future<C>;
  apply2<B, C, D>(ob: Future<B>, oc: Future<C>, f: (a: A, b: B, c: C) => D): Future<D>;
  chain<B>(ob: Future<B>): FutureBuilder1<A, B>;
}

export function Future<A>(f: Promise<A> | (() => A)): Future<A> {
  if (f instanceof Promise) {
    return new FutureImpl(f);
  } else {
    return new FutureImpl<A>(
      new Promise((resolve, reject) => {
        Try(<() => A>f).fold(e => reject(e), a => resolve(a));
      })
    );
  }
}

export namespace Future {
  export function fromPromise<A>(p: Promise<A>): Future<A> {
    return new FutureImpl(p);
  }

  export function unit(): Future<void> {
    return new FutureImpl(Promise.resolve<void>(undefined), Success<void>(undefined));
  }

  export function failed<A>(e: Error): Future<A> {
    return new FutureImpl<A>(<Promise<A>>Promise.reject(e), Failure<A>(e));
  }

  export function successful<A>(a: A): Future<A> {
    return new FutureImpl(Promise.resolve(a), Success(a));
  }

  export function fromTry<A>(t: Try<A>): Future<A> {
    return t.fold((e) => this.failed(e), (a) => this.successful(a));
  }

  export function sequence<A>(fus: Array<Future<A>>): Future<Array<A>> {
    return new FutureImpl(Promise.all(fus.map(a => a.getPromise())));
  }

  export function firstCompletedOf<A>(fus: Array<Future<A>>): Future<A> {
    return new FutureImpl(Promise.race(fus.map(a => a.getPromise())));
  }

  export function find<A>(fus: Array<Future<A>>, f: (a: A) => boolean): Future<Optional<A>> {
    const searchRecursive = (fr: Array<Future<A>>): Future<Optional<A>> => {
      if (fr.length === 0) { return Future.successful<Optional<A>>(None); }
      const [fh, ...ft] = fr;
      return fh.transformWith(t =>
        t.fold(
          e => searchRecursive(ft),
          a => f(a) ? Future.successful(Optional(a)) : searchRecursive(ft))
      );
    };
    return searchRecursive(fus);
  }

  export function foldLeft<A, B>(fu: Array<Future<A>>, zero: B, f: (b: B, a: A) => B): Future<B> {
    const recursive = (fr: Array<Future<A>>, acc: B): Future<B> => {
      if (fr.length === 0) { return Future.successful(acc); }
      const [fh, ...ft] = fr;
      return fh.flatMap(a => recursive(ft, f(acc, a)));
    };
    return recursive(fu, zero);
  }

  // reduceLeft<A extends B, B>
  // Error : Constraint of a type parameter cannot reference any type parameter from the same type parameter list.
  // 無理くさいので一旦保留...
  //export function reduceLeft<A, B>(fu: Array<Future<A>>, f: (b: B, a: A) => B): Future<B> {
  //  if (fu.length === 0) {
  //    return Future.failed<B>(new Error('reduceLeft attempted on empty collection'));
  //  } else {
  //    const [fh, ...ft] = fu;
  //    return fh.flatMap<B>(zero => Future.foldLeft<A, B>(ft, zero, f));
  //  }
  //}
  export function reduceLeft<A, B>(fu: Array<Future<A>>, f: (b: B, a: A) => B): Future<B> {
    throw 'TODO';
  }

  export function traverse<A, B>(fu: Array<A>, f: (a: A) => Future<B>): Future<Array<B>> {
    const fzero = Future.successful<Array<B>>([]);
    if (fu.length === 0) { return fzero; }
    return fu.reduce<Future<Array<B>>>((fbs, a) =>
      fbs.zipWith(f(a), (bs, fa) => { bs.push(fa); return bs; }),
      fzero);
  }
}

class FutureImpl<A> implements Future<A> {
  private completeValue: Optional<Try<A>> = None;

  constructor(private promise: Promise<A>, already?: Try<A>) {
    if (already) {
      this.completeValue = Some(already);
    } else {
      promise.then(
        a => this.completeValue = Some(Success(a)),
        e => this.completeValue = Some(Failure<A>(e))
      );
    }
  }

  onComplete<B>(f: (t: Try<A>) => B): void {
    this.promise.then(a => f(Success(a)), e => f(Failure<A>(e)));
  }

  isCompleted(): boolean {
    return this.completeValue.nonEmpty;
  }

  value(): Optional<Try<A>> {
    return this.completeValue;
  }

  failed(): Future<Error> {
    return this.transform(t =>
      t.fold(
        e => Success(e),
        a => Failure<Error>(new Error('Future.failed not completed with a throwable.'))
      )
    );
  }

  foreach<B>(f: (a: A) => B): void {
    this.onComplete(t => t.foreach(f));
  }

  getPromise(): Promise<A> {
    return this.promise;
  }

  tryPromise<B>(f: () => Promise<B>): Promise<B> {
    try {
      return f();
    } catch (e) {
      return <Promise<B>>Promise.reject(e);
    }
  }

  transform<B>(f: (t: Try<A>) => Try<B>): Future<B> {
    return new FutureImpl(
      this.promise.then<B>(
        a => this.tryPromise(() => f(Success(a)).fold((e) => <Promise<B>>Promise.reject(e), (b) => Promise.resolve(b))),
        e => this.tryPromise(() => f(Failure<A>(e)).fold((e) => <Promise<B>>Promise.reject(e), (b) => Promise.resolve(b)))
      )
    );
  }

  transform1<B>(fs: (a: A) => B, ff: (e: Error) => Error): Future<B> {
    return this.transform<B>(t =>
      t.fold(
        e => { try { return Failure<B>(ff(e)); } catch (e) { return Failure<B>(e); } },
        a => Try(() => fs(a))
      )
    );
  }

  transformWith<B>(f: (t: Try<A>) => Future<B>): Future<B> {
    return new FutureImpl(
      this.promise.then<B>(
        a => this.tryPromise(() => f(Success(a)).getPromise()),
        e => this.tryPromise(() => f(Failure<A>(e)).getPromise())
      )
    );
  }

  map<B>(f: (a: A) => B): Future<B> {
    return this.transform(t => t.map(f));
  }

  flatMap<B>(f: (a: A) => Future<B>): Future<B> {
    return this.transformWith(t => t.fold(e => Future.failed<B>(e), a => f(a)));
  }

  filter(f: (a: A) => boolean): Future<A> {
    return this.map(a => {
      if (f(a)) { return a; } else { throw new Error('Future.filter predicate is not satisfied'); }
    });
  }

  recover<B extends A>(f: (e: Error) => Optional<B>): Future<A> {
    return this.transform(t => t.recover(f));
  }

  recoverWith<B extends A>(f: (e: Error) => Optional<Future<B>>): Future<A> {
    return this.transformWith(t =>
      t.fold(
        e => f(e).fold(Future.failed<B>(e), a => a),
        a => Future.successful(a)
      )
    );
  }

  zip<B>(fu: Future<B>): Future<[A, B]> {
    return this.flatMap(a => fu.map<[A, B]>(b => [a, b]));
  }

  zipWith<B, C>(fu: Future<B>, f: (a: A, b: B) => C): Future<C> {
    return this.flatMap(a => fu.map(b => f(a, b)));
  }

  fallbackTo<B extends A>(fu: Future<B>): Future<A> {
    return this.recoverWith(e => Some(fu)).recoverWith(e => Some(this));
  }

  andThen<B>(f: (t: Try<A>) => B): Future<A> {
    return this.transform(t => {
      try { f(t); } catch (e) { if (typeof console !== 'undefined') { console.error(e); } }
      return t;
    });
  }

  apply1<B, C>(ob: Future<B>, f: (a: A, b: B) => C): Future<C> {
    return this.zipWith(ob, f);
  }

  apply2<B, C, D>(ob: Future<B>, oc: Future<C>, f: (a: A, b: B, c: C) => D): Future<D> {
    return this.flatMap(a => ob.flatMap(b => oc.map(c => f(a, b, c))));
  }

  chain<B>(ob: Future<B>): FutureBuilder1<A, B> {
    return new FutureBuilder1(this, ob);
  }
}

/**
 * FutureBuilder.
 */
export class FutureBuilder1<A, B> {
  constructor(private oa: Future<A>, private ob: Future<B>) {}

  run<C>(f: (a: A, b: B) => C): Future<C> {
    return this.oa.flatMap(a => this.ob.map(b => f(a, b)));
  }

  chain<C>(oc: Future<C>): FutureBuilder2<A, B, C> {
    return new FutureBuilder2(this.oa, this.ob, oc);
  }
}

export class FutureBuilder2<A, B, C> {
  constructor(private oa: Future<A>, private ob: Future<B>, private oc: Future<C>) {}

  run<D>(f: (a: A, b: B, c: C) => D): Future<D> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.map(c => f(a, b, c))));
  }

  chain<D>(od: Future<D>): FutureBuilder3<A, B, C, D> {
    return new FutureBuilder3(this.oa, this.ob, this.oc, od);
  }
}

export class FutureBuilder3<A, B, C, D> {
  constructor(private oa: Future<A>, private ob: Future<B>, private oc: Future<C>, private od: Future<D>) {}

  run<E>(f: (a: A, b: B, c: C, d: D) => E): Future<E> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c =>
      this.od.map(d => f(a, b, c, d)))));
  }

  chain<E>(oe: Future<E>): FutureBuilder4<A, B, C, D, E> {
    return new FutureBuilder4(this.oa, this.ob, this.oc, this.od, oe);
  }
}

export class FutureBuilder4<A, B, C, D, E> {
  constructor(
    private oa: Future<A>, private ob: Future<B>, private oc: Future<C>,
    private od: Future<D>, private oe: Future<E>) {}

  run<F>(f: (a: A, b: B, c: C, d: D, e: E) => F): Future<F> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d =>
      this.oe.map(e => f(a, b, c, d, e))))));
  }

  chain<F>(of: Future<F>): FutureBuilder5<A, B, C, D, E, F> {
    return new FutureBuilder5(this.oa, this.ob, this.oc, this.od, this.oe, of);
  }
}

export class FutureBuilder5<A, B, C, D, E, F> {
  constructor(
    private oa: Future<A>, private ob: Future<B>, private oc: Future<C>,
    private od: Future<D>, private oe: Future<E>, private of: Future<F>) {}

  run<G>(f: (a: A, b: B, c: C, d: D, e: E, f: F) => G): Future<G> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d => this.oe.flatMap(e =>
      this.of.map(ff => f(a, b, c, d, e, ff)))))));
  }
}
