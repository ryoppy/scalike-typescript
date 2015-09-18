/**
 * Represents optional values.
 * Optional has `Some` and `None` classes.
 *
 * Why 'Optional'? 'Option' is reserved word in JavaScript.
 */
export interface Optional<A> {
  isEmpty: boolean;
  nonEmpty: boolean;
  get(): A;
  getOrElse<B extends A>(a: B): A;
  map<B>(f: (a: A) => B): Optional<B>;
  fold<B>(ifEmpty: B, f: (a: A) => B): B;
  flatten(): Optional<A>;
  filter(f: (a: A) => boolean): Optional<A>;
  contains<B extends A>(b: B): boolean;
  exists(f: (a: A) => boolean): boolean;
  forall(f: (a: A) => boolean): boolean;
  flatMap<B>(f: (a: A) => Optional<B>): Optional<B>;
  foreach(f: (a: A) => void): void;
  orElse<B extends A>(ob: Optional<B>): Optional<A>;
  // add methods
  apply1<B, C>(ob: Optional<B>, f: (a: A, b: B) => C): Optional<C>;
  apply2<B, C, D>(ob: Optional<B>, oc: Optional<C>, f: (a: A, b: B, c: C) => D): Optional<D>;
  chain<B>(ob: Optional<B>): OptionalBuilder1<A, B>;
}

/**
 * Optional function.
 *
 * @example
 * > Optional(1) // Some(1)
 * > Optional('a') // Some('a')
 * > Optional(undefined) // None
 * > Optional(null) // None
 *
 * @param a value
 * @returns {Optional<A>} Optional type
 */
export function Optional<A>(a: A): Optional<A> {
  return (a !== undefined && a !== null) ? new SomeImpl<A>(a) : None;
}

/**
 * Some is represents not empty. ('not undefined and not null')
 * @param a value
 * @returns {Optional<A>} Some
 */
export function Some<A>(a: A): Optional<A> {
  return new SomeImpl(a);
}

/**
 * Optional implements.
 */
class OptionalImpl<A> implements Optional<A> {
  /**
   * Returns true if the option is None, false otherwise.
   */
  isEmpty: boolean;
  nonEmpty: boolean;

  /**
   * Returns the option's value.
   * This is shouldn't use.
   */
  get(): A {
    throw 'err';
  }

  /**
   * If Some is return A, None is return passing value B.
   * @param a use if None
   */
  getOrElse<B extends A>(a: B): A {
    return this.isEmpty ? a : this.get();
  }

  map<B>(f: (a: A) => B): Optional<B> {
    return this.isEmpty ? None : new SomeImpl(f(this.get()));
  }

  fold<B>(ifEmpty: B, f: (a: A) => B): B {
    return this.isEmpty ? ifEmpty : f(this.get());
  }

  flatten(): Optional<A> {
    throw 'TODO';
  }

  filter(f: (a: A) => boolean): Optional<A> {
    return (this.isEmpty || f(this.get())) ? this : None;
  }

  contains<B extends A>(b: B): boolean {
    return !this.isEmpty && this.get() === b;
  }

  exists(f: (a: A) => boolean): boolean {
    return !this.isEmpty && f(this.get());
  }

  forall(f: (a: A) => boolean): boolean {
    return this.isEmpty || f(this.get());
  }

  flatMap<B>(f: (a: A) => Optional<B>): Optional<B> {
    return this.isEmpty ? None : f(this.get());
  }

  foreach(f: (a: A) => void): void {
    if (!this.isEmpty) { f(this.get()); }
  }

  orElse<B extends A>(d: Optional<B>): Optional<A> {
    return this.isEmpty ? d : this;
  }

  apply1<B, C>(ob: Optional<B>, f: (a: A, b: B) => C): Optional<C> {
    return this.flatMap(a => ob.map(b => f(a, b)));
  }

  apply2<B, C, D>(ob: Optional<B>, oc: Optional<C>, f: (a: A, b: B, c: C) => D): Optional<D> {
    return this.flatMap(a => ob.flatMap(b => oc.map(c => f(a, b, c))));
  }

  chain<B>(ob: Optional<B>): OptionalBuilder1<A, B> {
    return new OptionalBuilder1(this, ob);
  }
}

class SomeImpl<A> extends OptionalImpl<A> implements Optional<A> {
  isEmpty: boolean = false;
  nonEmpty: boolean = true;

  get(): A {
    return this.value;
  }

  constructor(private value: A) {
    super();
  }

  toString(): string {
    return 'Some(' + this.value + ')';
  }
}

class NoneImpl extends OptionalImpl<any> implements Optional<any> {
  isEmpty: boolean = true;
  nonEmpty: boolean = false;

  get(): any {
    throw new TypeError('None can not #get');
  }

  toString(): string {
    return 'None';
  }
}

/**
 * None is represents empty.
 */
export const None: Optional<any> = new NoneImpl();

/**
 * OptionalBuilder.
 */
export class OptionalBuilder1<A, B> {
  constructor(private oa: Optional<A>, private ob: Optional<B>) {}

  run<C>(f: (a: A, b: B) => C): Optional<C> {
    return this.oa.flatMap(a => this.ob.map(b => f(a, b)));
  }

  chain<C>(oc: Optional<C>): OptionalBuilder2<A, B, C> {
    return new OptionalBuilder2(this.oa, this.ob, oc);
  }
}

export class OptionalBuilder2<A, B, C> {
  constructor(private oa: Optional<A>, private ob: Optional<B>, private oc: Optional<C>) {}

  run<D>(f: (a: A, b: B, c: C) => D): Optional<D> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.map(c => f(a, b, c))));
  }

  chain<D>(od: Optional<D>): OptionalBuilder3<A, B, C, D> {
    return new OptionalBuilder3(this.oa, this.ob, this.oc, od);
  }
}

export class OptionalBuilder3<A, B, C, D> {
  constructor(private oa: Optional<A>, private ob: Optional<B>, private oc: Optional<C>, private od: Optional<D>) {}

  run<E>(f: (a: A, b: B, c: C, d: D) => E): Optional<E> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c =>
      this.od.map(d => f(a, b, c, d)))));
  }

  chain<E>(oe: Optional<E>): OptionalBuilder4<A, B, C, D, E> {
    return new OptionalBuilder4(this.oa, this.ob, this.oc, this.od, oe);
  }
}

export class OptionalBuilder4<A, B, C, D, E> {
  constructor(
    private oa: Optional<A>, private ob: Optional<B>, private oc: Optional<C>,
    private od: Optional<D>, private oe: Optional<E>) {}

  run<F>(f: (a: A, b: B, c: C, d: D, e: E) => F): Optional<F> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d =>
      this.oe.map(e => f(a, b, c, d, e))))));
  }

  chain<F>(of: Optional<F>): OptionalBuilder5<A, B, C, D, E, F> {
    return new OptionalBuilder5(this.oa, this.ob, this.oc, this.od, this.oe, of);
  }
}

export class OptionalBuilder5<A, B, C, D, E, F> {
  constructor(
    private oa: Optional<A>, private ob: Optional<B>, private oc: Optional<C>,
    private od: Optional<D>, private oe: Optional<E>, private of: Optional<F>) {}

  run<G>(f: (a: A, b: B, c: C, d: D, e: E, f: F) => G): Optional<G> {
    return this.oa.flatMap(a => this.ob.flatMap(b => this.oc.flatMap(c => this.od.flatMap(d => this.oe.flatMap(e =>
      this.of.map(ff => f(a, b, c, d, e, ff)))))));
  }
}
