import {Optional, Some, None} from './Optional';

// Interface
// ======================================================
export interface Either<A, B> {
  value: A | B;
  isLeft: boolean;
  isRight: boolean;
  left(): LeftProjection<A, B>;
  right(): RightProjection<A, B>;
  fold<X>(fa: (a: A) => X, fb: (b: B) => X): X;
  swap(): Either<B, A>;
}

// Function
// ======================================================
export function Right<A, B>(b: B): Either<A, B> {
  return new RightImpl<A, B>(b);
}
export function Left<A, B>(a: A): Either<A, B> {
  return new LeftImpl<A, B>(a);
}

// Class - Either
// ======================================================
class EitherImpl<A, B> implements Either<A, B> {
  value: A | B;
  isLeft: boolean;
  isRight: boolean;

  toString(): string {
    return this.isLeft ? `Left(${this.value})` : `Right(${this.value})`;
  }

  left(): LeftProjection<A, B> {
    return new LeftProjection(this);
  }

  right(): RightProjection<A, B> {
    return new RightProjection(this);
  }

  fold<X>(fa: (a: A) => X, fb: (b: B) => X): X {
    return this.isLeft ? fa(<A>this.value) : fb(<B>this.value);
  }

  swap(): Either<B, A> {
    return this.isLeft ? Right<B, A>(<A>this.value) : Left<B, A>(<B>this.value);
  }
}
class LeftImpl<A, B> extends EitherImpl<A, B> implements Either<A, B> {
  isLeft: boolean = true;
  isRight: boolean = false;
  constructor(public value: A) { super(); }
}
class RightImpl<A, B> extends EitherImpl<A, B> implements Either<A, B> {
  isLeft: boolean = false;
  isRight: boolean = true;
  constructor(public value: B) { super(); }
}

// Class - Projection
// ======================================================
export class LeftProjection<A, B> {
  constructor(private self: Either<A, B>) {}

  toString(): string {
    return `LeftProjection(${this.self.toString()})`;
  }

  get(): A {
    if (this.self.isLeft) {
      return <A>this.self.value;
    } else {
      throw new Error('cannot get Left value');
    }
  }

  foreach(f: (a: A) => void): void {
    if (this.self.isLeft) { f(<A>this.self.value); }
  }

  getOrElse<X extends A>(x: X): A {
    return this.self.isLeft ? <A>this.self.value : x;
  }

  forall(f: (a: A) => boolean): boolean {
    return this.self.isLeft ? f(<A>this.self.value) : true;
  }

  exists(f: (a: A) => boolean): boolean {
    return this.self.isLeft ? f(<A>this.self.value) : false;
  }

  filter(f: (a: A) => boolean): Optional<Either<A, B>> {
    if (this.self.isLeft) {
      return f(<A>this.self.value) ? Optional(this) : None;
    } else {
      return None;
    }
  }

  map<X>(f: (a: A) => X): Either<X | A, B> {
    return this.self.isLeft ? Left<X, B>(f(<A>this.self.value)) : this.self;
  }

  flatMap<X>(f: (a: A) => Either<X, B>): Either<X | A, B> {
    return this.self.isLeft ? f(<A>this.self.value) : this.self;
  }

  toOptional(): Optional<A> {
    return this.self.isLeft ? Optional(<A>this.self.value) : None;
  }
}

export class RightProjection<A, B> {
  constructor(private self: Either<A, B>) {}

  toString(): string {
    return `RightProjection(${this.self.toString()})`;
  }

  get(): B {
    if (this.self.isRight) {
      return <B>this.self.value;
    } else {
      throw new Error('cannot get Right value');
    }
  }

  foreach(f: (b: B) => void): void {
    if (this.self.isRight) { f(<B>this.self.value); }
  }

  getOrElse<X extends B>(x: X): B {
    return this.self.isRight ? <B>this.self.value : x;
  }

  forall(f: (b: B) => boolean): boolean {
    return this.self.isRight ? f(<B>this.self.value) : true;
  }

  exists(f: (b: B) => boolean): boolean {
    return this.self.isRight ? f(<B>this.self.value) : false;
  }

  filter(f: (b: B) => boolean): Optional<Either<A, B>> {
    if (this.self.isRight) {
      return f(<B>this.self.value) ? Optional(this) : None;
    } else {
      return None;
    }
  }

  map<X>(f: (b: B) => X): Either<A, X | B> {
    return this.self.isLeft ? this.self : Right<A, X>(f(<B>this.self.value));
  }

  flatMap<X>(f: (a: B) => Either<A, X>): Either<A, X | B> {
    return this.self.isLeft ? this.self : f(<B>this.self.value);
  }

  toOptional(): Optional<B> {
    return this.self.isRight ? Optional(<B>this.self.value) : None;
  }
}
