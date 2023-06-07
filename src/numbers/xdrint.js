/* eslint no-bitwise: ["error", {"allow": [">>"]}] */
import { Hyper, UnsignedHyper } from 'js-xdr';

import { Uint128 } from './u128';
import { Int128 } from './i128';
import { Int256 } from './i256';
import { Uint256 } from './u256';

import xdr from '../xdr';

export class XdrInt {
  int; // child class of a jsXdr.LargeInt
  type; // string, one of i64, u64, i128, u128, i256, or u256

  /**
   * Transforms an opaque {@link xdr.ScVal} into a native BigInt, if possible.
   *
   * You can then give this back to create an {@link ScInt} instance, but the
   * rationale here is that the native type is more likely to be immediately
   * useful.
   *
   * @param {xdr.ScVal} scv - the raw XDR value to parse into an integer
   * @returns {bigint} the integer value, regardless of size (even 32-bit)
   * @throws {TypeError} if the input value doesn't represent an integer
   */
  static fromScVal(scv) {
    switch (scv.switch().name) {
      case 'scvU32':
      case 'scvI32':
        return BigInt(scv.value());

      case 'scvU64':
      case 'scvI64':
        return scv.value().toBigInt();

      case 'scvU128':
        return new Uint128(scv.value().lo(), scv.value().hi()).toBigInt();

      case 'scvI128':
        return new Int128(scv.value().lo(), scv.value().hi()).toBigInt();

      case 'scvU256':
        return new Uint256(
          scv.value().loLo(),
          scv.value().loHi(),
          scv.value().hiLo(),
          scv.value().hiHi()
        ).toBigInt();

      case 'scvI256':
        return new Int256(
          scv.value().loLo(),
          scv.value().loHi(),
          scv.value().hiLo(),
          scv.value().hiHi()
        ).toBigInt();

      default:
        throw TypeError(`expected integer type, got ${scv.switch()}`);
    }
  }

  constructor(type, values) {
    if (!(values instanceof Array)) {
      values = [values];
    }

    // normalize values to one type
    values = values.map((i) => {
      // micro-optimization to no-op on the likeliest input value:
      if (typeof i === 'bigint') {
        return i;
      }
      if (i instanceof XdrInt) {
        return i.toBigInt();
      }
      return BigInt(i);
    });

    switch (type) {
      case 'i64':
        this.int = new Hyper(values);
        break;
      case 'i128':
        this.int = new Int128(values);
        break;
      case 'i256':
        this.int = new Int256(values);
        break;
      case 'u64':
        this.int = new UnsignedHyper(values);
        break;
      case 'u128':
        this.int = new Uint128(values);
        break;
      case 'u256':
        this.int = new Uint256(values);
        break;
      default:
        throw TypeError(`invalid type: ${type}`);
    }

    this.type = type;
  }

  /**
   * @returns {number}
   * @throws {RangeError} if the value can't fit into a Number
   */
  toNumber() {
    const bi = this.int.toBigInt();
    if (bi > Number.MAX_SAFE_INTEGER || bi < Number.MIN_SAFE_INTEGER) {
      throw RangeError(`value ${bi} too large for Number`);
    }

    return Number(bi);
  }

  /**
   * @returns {bigint}
   */
  toBigInt() {
    return this.int.toBigInt();
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = I64`
   */
  toI64() {
    this._sizeCheck(64);
    const v = this.toBigInt();
    if (BigInt.asIntN(64, v) !== v) {
      throw RangeError(`value too large for i64: ${v}`);
    }

    return xdr.ScVal.scvI64(new xdr.Int64(v));
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = U64`
   */
  toU64() {
    this._sizeCheck(64);
    return xdr.ScVal.scvU64(
      new xdr.Uint64(BigInt.asUintN(64, this.toBigInt())) // reiterpret as unsigned
    );
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = I128`
   * @throws {RangeError} if the value cannot fit in 128 bits
   */
  toI128() {
    this._sizeCheck(128);

    const v = this.int.toBigInt();
    const hi64 = BigInt.asIntN(64, v >> 64n); // encode top 64 w/ sign bit
    const lo64 = BigInt.asUintN(64, v); // grab btm 64, encode sign

    return xdr.ScVal.scvI128(
      new xdr.Int128Parts({
        hi: new xdr.Int64(hi64),
        lo: new xdr.Uint64(lo64)
      })
    );
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = U128`
   * @throws {RangeError} if the value cannot fit in 128 bits
   */
  toU128() {
    this._sizeCheck(128);
    const v = this.int.toBigInt();

    return xdr.ScVal.scvU128(
      new xdr.UInt128Parts({
        hi: new xdr.Uint64(BigInt.asUintN(64, v >> 64n)),
        lo: new xdr.Uint64(BigInt.asUintN(64, v))
      })
    );
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = I256`
   */
  toI256() {
    const v = this.int.toBigInt();
    const hiHi64 = BigInt.asIntN(64, v >> 192n); // keep sign bit
    const hiLo64 = BigInt.asUintN(64, v >> 128n);
    const loHi64 = BigInt.asUintN(64, v >> 64n);
    const loLo64 = BigInt.asUintN(64, v);

    return xdr.ScVal.scvI256(
      new xdr.Int256Parts({
        hiHi: new xdr.Int64(hiHi64),
        hiLo: new xdr.Uint64(hiLo64),
        loHi: new xdr.Uint64(loHi64),
        loLo: new xdr.Uint64(loLo64)
      })
    );
  }

  /**
   * @returns {xdr.ScVal} the integer encoded with `ScValType = U256`
   */
  toU256() {
    const v = this.int.toBigInt();
    const hiHi64 = BigInt.asUintN(64, v >> 192n); // encode sign bit
    const hiLo64 = BigInt.asUintN(64, v >> 128n);
    const loHi64 = BigInt.asUintN(64, v >> 64n);
    const loLo64 = BigInt.asUintN(64, v);

    return xdr.ScVal.scvU256(
      new xdr.UInt256Parts({
        hiHi: new xdr.Uint64(hiHi64),
        hiLo: new xdr.Uint64(hiLo64),
        loHi: new xdr.Uint64(loHi64),
        loLo: new xdr.Uint64(loLo64)
      })
    );
  }

  valueOf() {
    return this.int.valueOf();
  }

  toString() {
    return this.int.toString();
  }

  toJSON() {
    return {
      value: this.toBigInt().toString(),
      type: this.type
    };
  }

  _sizeCheck(bits) {
    if (this.int.size > bits) {
      throw RangeError(`value too large for ${bits} bits (${this.type})`);
    }
  }
}

export { Uint128, Int128, Uint256, Int256 };
