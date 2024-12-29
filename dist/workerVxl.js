"use strict";
(self.webpackChunkra2ts_client = self.webpackChunkra2ts_client || []).push([
  [966],
  {
    514: () => {
      importScripts("../lib/three.min.js?v=0.94");
    },
    998: (e, t, n) => {
      n.r(t), n.d(t, { generateVxlGeometry: () => g }), n(514);
      class i {
        constructor(e, t, n = i.LITTLE_ENDIAN) {
          (this.endianness = n),
            (this.position = 0),
            (this._dynamicSize = !0),
            (this._byteLength = 0),
            (this._byteOffset = t || 0),
            e instanceof ArrayBuffer
              ? (this.buffer = e)
              : "object" == typeof e
              ? ((this.dataView = e), t && (this._byteOffset += t))
              : (this.buffer = new ArrayBuffer(e || 0));
        }
        get dynamicSize() {
          return this._dynamicSize;
        }
        set dynamicSize(e) {
          e || this._trimAlloc(), (this._dynamicSize = e);
        }
        get byteLength() {
          return this._byteLength - this._byteOffset;
        }
        get buffer() {
          return this._trimAlloc(), this._buffer;
        }
        set buffer(e) {
          (this._buffer = e),
            (this._dataView = new DataView(this._buffer, this._byteOffset)),
            (this._byteLength = this._buffer.byteLength);
        }
        get byteOffset() {
          return this._byteOffset;
        }
        set byteOffset(e) {
          (this._byteOffset = e),
            (this._dataView = new DataView(this._buffer, this._byteOffset)),
            (this._byteLength = this._buffer.byteLength);
        }
        get dataView() {
          return this._dataView;
        }
        set dataView(e) {
          (this._byteOffset = e.byteOffset),
            (this._buffer = e.buffer),
            (this._dataView = new DataView(this._buffer, this._byteOffset)),
            (this._byteLength = this._byteOffset + e.byteLength);
        }
        bigEndian() {
          return (this.endianness = i.BIG_ENDIAN), this;
        }
        _realloc(e) {
          if (!this._dynamicSize) return;
          const t = this._byteOffset + this.position + e;
          let n = this._buffer.byteLength;
          if (t <= n)
            return void (t > this._byteLength && (this._byteLength = t));
          for (n < 1 && (n = 1); t > n; ) n *= 2;
          const i = new ArrayBuffer(n),
            r = new Uint8Array(this._buffer);
          new Uint8Array(i, 0, r.length).set(r),
            (this.buffer = i),
            (this._byteLength = t);
        }
        _trimAlloc() {
          if (this._byteLength === this._buffer.byteLength) return;
          const e = new ArrayBuffer(this._byteLength),
            t = new Uint8Array(e),
            n = new Uint8Array(this._buffer, 0, t.length);
          t.set(n), (this.buffer = e);
        }
        seek(e) {
          const t = Math.max(0, Math.min(this.byteLength, e));
          this.position = isNaN(t) || !isFinite(t) ? 0 : t;
        }
        isEof() {
          return this.position >= this.byteLength;
        }
        mapInt32Array(e, t) {
          this._realloc(4 * e);
          const n = new Int32Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 4 * e),
            n
          );
        }
        mapInt16Array(e, t) {
          this._realloc(2 * e);
          const n = new Int16Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 2 * e),
            n
          );
        }
        mapInt8Array(e) {
          this._realloc(e);
          const t = new Int8Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (this.position += e), t;
        }
        mapUint32Array(e, t) {
          this._realloc(4 * e);
          const n = new Uint32Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 4 * e),
            n
          );
        }
        mapUint16Array(e, t) {
          this._realloc(2 * e);
          const n = new Uint16Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 2 * e),
            n
          );
        }
        mapUint8Array(e) {
          this._realloc(e);
          const t = new Uint8Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (this.position += e), t;
        }
        mapFloat64Array(e, t) {
          this._realloc(8 * e);
          const n = new Float64Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 8 * e),
            n
          );
        }
        mapFloat32Array(e, t) {
          this._realloc(4 * e);
          const n = new Float32Array(
            this._buffer,
            this.byteOffset + this.position,
            e
          );
          return (
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += 4 * e),
            n
          );
        }
        readInt32Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 4 : e;
          const n = new Int32Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        readInt16Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 2 : e;
          const n = new Int16Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        readInt8Array(e) {
          e = void 0 === e ? this.byteLength - this.position : e;
          const t = new Int8Array(e);
          return (
            i.memcpy(
              t.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * t.BYTES_PER_ELEMENT
            ),
            (this.position += t.byteLength),
            t
          );
        }
        readUint32Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 4 : e;
          const n = new Uint32Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        readUint16Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 2 : e;
          const n = new Uint16Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        readUint8Array(e) {
          e = void 0 === e ? this.byteLength - this.position : e;
          const t = new Uint8Array(e);
          return (
            i.memcpy(
              t.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * t.BYTES_PER_ELEMENT
            ),
            (this.position += t.byteLength),
            t
          );
        }
        readFloat64Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 8 : e;
          const n = new Float64Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        readFloat32Array(e, t) {
          e = void 0 === e ? this.byteLength - this.position / 4 : e;
          const n = new Float32Array(e);
          return (
            i.memcpy(
              n.buffer,
              0,
              this.buffer,
              this.byteOffset + this.position,
              e * n.BYTES_PER_ELEMENT
            ),
            i.arrayToNative(n, void 0 === t ? this.endianness : t),
            (this.position += n.byteLength),
            n
          );
        }
        writeInt32Array(e, t) {
          if (
            (this._realloc(4 * e.length),
            e instanceof Int32Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapInt32Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeInt32(e[n], t);
          return this;
        }
        writeInt16Array(e, t) {
          if (
            (this._realloc(2 * e.length),
            e instanceof Int16Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapInt16Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeInt16(e[n], t);
          return this;
        }
        writeInt8Array(e) {
          if (
            (this._realloc(e.length),
            e instanceof Int8Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapInt8Array(e.length);
          else for (let t = 0; t < e.length; t++) this.writeInt8(e[t]);
          return this;
        }
        writeUint32Array(e, t) {
          if (
            (this._realloc(4 * e.length),
            e instanceof Uint32Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapUint32Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeUint32(e[n], t);
          return this;
        }
        writeUint16Array(e, t) {
          if (
            (this._realloc(2 * e.length),
            e instanceof Uint16Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapUint16Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeUint16(e[n], t);
          return this;
        }
        writeUint8Array(e) {
          if (
            (this._realloc(e.length),
            e instanceof Uint8Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapUint8Array(e.length);
          else for (let t = 0; t < e.length; t++) this.writeUint8(e[t]);
          return this;
        }
        writeFloat64Array(e, t) {
          if (
            (this._realloc(8 * e.length),
            e instanceof Float64Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapFloat64Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeFloat64(e[n], t);
          return this;
        }
        writeFloat32Array(e, t) {
          if (
            (this._realloc(4 * e.length),
            e instanceof Float32Array &&
              (this.byteOffset + this.position) % e.BYTES_PER_ELEMENT == 0)
          )
            i.memcpy(
              this._buffer,
              this.byteOffset + this.position,
              e.buffer,
              e.byteOffset,
              e.byteLength
            ),
              this.mapFloat32Array(e.length, t);
          else for (let n = 0; n < e.length; n++) this.writeFloat32(e[n], t);
          return this;
        }
        readInt32(e) {
          const t = this._dataView.getInt32(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 4), t;
        }
        readInt16(e) {
          const t = this._dataView.getInt16(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 2), t;
        }
        readInt8() {
          const e = this._dataView.getInt8(this.position);
          return (this.position += 1), e;
        }
        readUint32(e) {
          const t = this._dataView.getUint32(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 4), t;
        }
        readUint16(e) {
          const t = this._dataView.getUint16(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 2), t;
        }
        readUint8() {
          const e = this._dataView.getUint8(this.position);
          return (this.position += 1), e;
        }
        readFloat32(e) {
          const t = this._dataView.getFloat32(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 4), t;
        }
        readFloat64(e) {
          const t = this._dataView.getFloat64(
            this.position,
            void 0 === e ? this.endianness : e
          );
          return (this.position += 8), t;
        }
        writeInt32(e, t) {
          return (
            this._realloc(4),
            this._dataView.setInt32(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 4),
            this
          );
        }
        writeInt16(e, t) {
          return (
            this._realloc(2),
            this._dataView.setInt16(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 2),
            this
          );
        }
        writeInt8(e) {
          return (
            this._realloc(1),
            this._dataView.setInt8(this.position, e),
            (this.position += 1),
            this
          );
        }
        writeUint32(e, t) {
          return (
            this._realloc(4),
            this._dataView.setUint32(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 4),
            this
          );
        }
        writeUint16(e, t) {
          return (
            this._realloc(2),
            this._dataView.setUint16(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 2),
            this
          );
        }
        writeUint8(e) {
          return (
            this._realloc(1),
            this._dataView.setUint8(this.position, e),
            (this.position += 1),
            this
          );
        }
        writeFloat32(e, t) {
          return (
            this._realloc(4),
            this._dataView.setFloat32(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 4),
            this
          );
        }
        writeFloat64(e, t) {
          return (
            this._realloc(8),
            this._dataView.setFloat64(
              this.position,
              e,
              void 0 === t ? this.endianness : t
            ),
            (this.position += 8),
            this
          );
        }
        static memcpy(e, t, n, i, r) {
          const s = new Uint8Array(e, t, r),
            o = new Uint8Array(n, i, r);
          s.set(o);
        }
        static arrayToNative(e, t) {
          return t === this.endianness ? e : this.flipArrayEndianness(e);
        }
        static nativeToEndian(e, t) {
          return this.endianness === t ? e : this.flipArrayEndianness(e);
        }
        static flipArrayEndianness(e) {
          const t = new Uint8Array(e.buffer, e.byteOffset, e.byteLength);
          for (let n = 0; n < e.byteLength; n += e.BYTES_PER_ELEMENT)
            for (let i = n + e.BYTES_PER_ELEMENT - 1, r = n; i > r; i--, r++) {
              const e = t[r];
              (t[r] = t[i]), (t[i] = e);
            }
          return e;
        }
        static createStringFromArray(e) {
          const t = [];
          for (let n = 0; n < e.length; n += 32768)
            t.push(String.fromCharCode.apply(void 0, e.subarray(n, n + 32768)));
          return t.join("");
        }
        readUCS2String(e, t) {
          return i.createStringFromArray(this.readUint16Array(e, t));
        }
        writeUCS2String(e, t, n) {
          void 0 === n && (n = e.length);
          let i = 0;
          for (; i < e.length && i < n; i++)
            this.writeUint16(e.charCodeAt(i), t);
          for (; i < n; i++) this.writeUint16(0);
          return this;
        }
        readString(e, t) {
          return void 0 === t || "ASCII" === t
            ? i.createStringFromArray(
                this.mapUint8Array(
                  void 0 === e ? this.byteLength - this.position : e
                )
              )
            : new TextDecoder(t).decode(this.mapUint8Array(e));
        }
        writeString(e, t, n) {
          if (void 0 === t || "ASCII" === t)
            if (void 0 !== n) {
              let t;
              const i = Math.min(e.length, n);
              for (t = 0; t < i; t++) this.writeUint8(e.charCodeAt(t));
              for (; t < n; t++) this.writeUint8(0);
            } else
              for (let t = 0; t < e.length; t++)
                this.writeUint8(e.charCodeAt(t));
          else
            this.writeUint8Array(new TextEncoder().encode(e.substring(0, n)));
          return this;
        }
        writeUtf8WithLen(e) {
          const t = new TextEncoder().encode(e);
          return this.writeUint16(t.length).writeUint8Array(t);
        }
        readUtf8WithLen() {
          const e = this.readUint16();
          return new TextDecoder().decode(this.mapUint8Array(e));
        }
        readCString(e) {
          const t = this.byteLength - this.position,
            n = new Uint8Array(this._buffer, this._byteOffset + this.position);
          let r = t;
          void 0 !== e && (r = Math.min(e, t));
          let s = 0;
          for (; s < r && 0 !== n[s]; s++);
          const o = i.createStringFromArray(this.mapUint8Array(s));
          return (
            void 0 !== e
              ? (this.position += r - s)
              : s !== t && (this.position += 1),
            o
          );
        }
        writeCString(e, t) {
          if (void 0 !== t) {
            let n;
            const i = Math.min(e.length, t);
            for (n = 0; n < i; n++) this.writeUint8(e.charCodeAt(n));
            for (; n < t; n++) this.writeUint8(0);
          } else {
            for (let t = 0; t < e.length; t++) this.writeUint8(e.charCodeAt(t));
            this.writeUint8(0);
          }
          return this;
        }
        toUint8Array() {
          return new Uint8Array(this.buffer, this.byteOffset, this.byteLength);
        }
      }
      (i.BIG_ENDIAN = !1),
        (i.LITTLE_ENDIAN = !0),
        (i.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0);
      class r extends Error {
        constructor() {
          super(...arguments), (this.name = "IOError");
        }
      }
      var s = THREE.Vector3;
      const o = [
          new s(0.54946297, -183e-6, -0.835518),
          new s(0.00014400001, 0.54940403, -0.83555698),
          new s(-0.54940403, -68000001e-12, -0.83555698),
          new s(106e-6, -0.54946297, -0.835518),
          new s(0.94900799, 0.00031599999, -0.31525001),
          new s(-186e-6, 0.94899702, -0.31528401),
          new s(-0.94899702, 0.00031800001, -0.31528401),
          new s(-447e-6, -0.94900799, -0.31525001),
          new s(0.95084399, -279e-6, 0.30967101),
          new s(202e-6, 0.95084798, 0.30965701),
          new s(-0.95084798, -70000002e-12, 0.30965701),
          new s(147e-6, -0.95084399, 0.30967101),
          new s(0.55237001, -11e-6, 0.83359897),
          new s(19999999e-12, 0.55238003, 0.833592),
          new s(-0.55238003, 57000001e-12, 0.83359301),
          new s(-66000001e-12, -0.55237001, 0.83359897),
        ],
        a = [
          new s(0.67121398, 0.19849201, -0.714194),
          new s(0.26964301, 0.58439398, -0.76536),
          new s(-0.040546, 0.096988, -0.99445897),
          new s(-0.57242799, -0.091913998, -0.81478697),
          new s(-0.17140099, -0.57270998, -0.80163902),
          new s(0.36255699, -0.30299899, -0.88133103),
          new s(0.81034702, -0.34897199, -0.470698),
          new s(0.103962, 0.93867201, -0.328767),
          new s(-0.324047, 0.58766901, -0.74137598),
          new s(-0.80086499, 0.34046099, -0.49264699),
          new s(-0.66549802, -0.59014702, -0.45698899),
          new s(0.314767, -0.803002, -0.506073),
          new s(0.97262901, 0.151076, -0.17655),
          new s(0.680291, 0.68423599, -0.26272699),
          new s(-0.52007902, 0.82777703, -0.210483),
          new s(-0.96164399, -0.179001, -0.207847),
          new s(-0.262714, -0.937451, -0.22840101),
          new s(0.219707, -0.97130102, 0.091124997),
          new s(0.92380798, -0.229975, 0.30608699),
          new s(-0.082488999, 0.97065997, 0.225866),
          new s(-0.59179801, 0.69678998, 0.40528899),
          new s(-0.92529601, 0.36660099, 0.097111002),
          new s(-0.705051, -0.68777502, 0.172828),
          new s(0.7324, -0.68036699, -0.026304999),
          new s(0.85516202, 0.37458199, 0.358311),
          new s(0.47300601, 0.83648002, 0.276705),
          new s(-0.097617, 0.65411198, 0.750072),
          new s(-0.90412402, -0.153725, 0.39865801),
          new s(-0.211916, -0.85808998, 0.46773201),
          new s(0.50022697, -0.67440802, 0.543091),
          new s(0.584539, -0.110249, 0.80384099),
          new s(0.43737301, 0.45464399, 0.77588898),
          new s(-0.042440999, 0.083318003, 0.995619),
          new s(-0.59625101, 0.22013199, 0.77202803),
          new s(-0.506455, -0.39697701, 0.76544899),
          new s(0.070569001, -0.47847399, 0.87526202),
        ],
        h = [
          new s(0.45651099, -0.073968001, -0.88663799),
          new s(0.50769401, 0.38511699, -0.77067),
          new s(0.095431998, 0.22666401, -0.96928602),
          new s(-0.35876599, 0.54318798, -0.75910097),
          new s(-0.361276, 0.13299499, -0.92292601),
          new s(-0.48311701, -0.32406601, -0.813375),
          new s(-0.018073, -0.197559, -0.980124),
          new s(0.3211, -0.501477, -0.80337799),
          new s(0.79949099, 0.069615997, -0.59662998),
          new s(0.390971, 0.77130598, -0.50222403),
          new s(0.080782004, 0.61448997, -0.784778),
          new s(-0.73275, 0.41143101, -0.54203498),
          new s(-0.73525399, 0.0091019999, -0.67773098),
          new s(-0.80249399, -0.39490801, -0.44727099),
          new s(-0.13413, -0.58915502, -0.79680902),
          new s(0.71955299, -0.37622699, -0.58369303),
          new s(0.96687502, 0.173593, -0.187132),
          new s(0.760831, 0.51910597, -0.38944301),
          new s(-0.114642, 0.87551898, -0.46938601),
          new s(-0.53236699, 0.76885903, -0.354177),
          new s(-0.96226698, 0.024977, -0.27095801),
          new s(-0.46738699, -0.721986, -0.51018202),
          new s(0.058449998, -0.85235399, -0.51968902),
          new s(0.49823299, -0.74374002, -0.44566301),
          new s(0.93915099, -0.27024499, -0.212044),
          new s(0.58393198, 0.80944198, -0.061857),
          new s(0.183797, 0.97322798, -0.138007),
          new s(-0.88435501, 0.45221901, -0.115822),
          new s(-0.943178, -0.33206701, 0.012138),
          new s(-0.69844002, -0.70656699, -0.113772),
          new s(-0.228411, -0.95470601, -0.190694),
          new s(0.73156399, -0.675861, -0.089588001),
          new s(0.96925098, 0.046804, 0.24158201),
          new s(0.85564703, 0.50347698, 0.119916),
          new s(-0.25115299, 0.96794701, -80999998e-12),
          new s(-0.64779502, 0.75674897, 0.087711997),
          new s(-0.96916401, 0.14519399, 0.1991),
          new s(-0.41479301, -0.88896698, 0.194126),
          new s(0.25077501, -0.961178, -0.115109),
          new s(0.47862899, -0.84259301, 0.246883),
          new s(0.89004397, -0.39614201, 0.225595),
          new s(0.52405101, 0.76235998, 0.37970701),
          new s(0.11962, 0.94548202, 0.30291),
          new s(-0.76085001, 0.49007499, 0.42536199),
          new s(-0.86978501, -0.20215, 0.450122),
          new s(-0.70946699, -0.60242403, 0.36570701),
          new s(0.019308999, -0.95887101, 0.28318599),
          new s(0.626113, -0.564677, 0.53770101),
          new s(0.769943, -0.126663, 0.62541503),
          new s(0.76419097, 0.35070199, 0.54131401),
          new s(-0.001878, 0.74136698, 0.67109799),
          new s(-0.37088001, 0.81836802, 0.43900099),
          new s(-0.71390897, 0.12865201, 0.68831801),
          new s(-0.295165, -0.73866397, 0.60601401),
          new s(0.186195, -0.73836899, 0.648184),
          new s(0.387523, -0.35878301, 0.84917599),
          new s(0.481022, 0.124846, 0.86777401),
          new s(0.391808, 0.54505599, 0.741216),
          new s(-0.0035359999, 0.36559799, 0.93076599),
          new s(-0.42049801, 0.484961, 0.76680797),
          new s(-0.35490301, 0.019470001, 0.93470001),
          new s(-0.54783702, -0.35920799, 0.75554299),
          new s(-0.106662, -0.445115, 0.88909799),
          new s(0.086796001, -0.059307002, 0.99445897),
        ],
        w = [
          new s(0.52657801, -0.35962099, -0.77031702),
          new s(0.150482, 0.43598399, 0.88728398),
          new s(0.414195, 0.73825502, -0.53237402),
          new s(0.075152002, 0.91624898, -0.393498),
          new s(-0.316149, 0.93073601, -0.18379299),
          new s(-0.77381903, 0.62333399, -0.11251),
          new s(-0.90084201, 0.42853701, -0.069568001),
          new s(-0.99894202, -0.010971, 0.044665001),
          new s(-0.979761, -0.15767001, -0.123324),
          new s(-0.91127402, -0.362371, -0.19562),
          new s(-0.62406898, -0.72094101, -0.301301),
          new s(-0.310173, -0.80934501, -0.498752),
          new s(0.146613, -0.81581903, -0.55941403),
          new s(-0.71651602, -0.69435602, -0.066887997),
          new s(0.50397199, -0.114202, -0.85613698),
          new s(0.45549101, 0.87262702, -0.176211),
          new s(-0.00501, -0.114373, -0.99342501),
          new s(-0.104675, -0.327701, -0.93896502),
          new s(0.56041199, 0.75258899, -0.34575599),
          new s(-0.060575999, 0.82162797, -0.566796),
          new s(-0.30234101, 0.79700702, -0.522847),
          new s(-0.671543, 0.67074001, -0.314863),
          new s(-0.77840102, -0.12835699, 0.61450499),
          new s(-0.92404997, 0.278382, -0.261985),
          new s(-0.69977301, -0.55049098, -0.45527801),
          new s(-0.56824797, -0.51718903, -0.64000797),
          new s(0.054097999, -0.93286401, -0.356143),
          new s(0.75838202, 0.57289302, -0.31088799),
          new s(0.0036200001, 0.30502599, -0.95233703),
          new s(-0.060849998, -0.98688602, -0.14951099),
          new s(0.63523, 0.045478001, -0.77098298),
          new s(0.52170497, 0.241309, -0.81828701),
          new s(0.26940399, 0.63542497, -0.72364098),
          new s(0.045676, 0.67275399, -0.738455),
          new s(-0.180511, 0.67465699, -0.71571898),
          new s(-0.397131, 0.63664001, -0.66104198),
          new s(-0.55200398, 0.47251499, -0.687038),
          new s(-0.77217001, 0.08309, -0.62996),
          new s(-0.669819, -0.119533, -0.73284),
          new s(-0.54045498, -0.31844401, -0.77878201),
          new s(-0.38613501, -0.522789, -0.75999397),
          new s(-0.261466, -0.68856698, -0.676395),
          new s(-0.019412, -0.69610298, -0.71767998),
          new s(0.30356899, -0.48184401, -0.82199299),
          new s(0.68193901, -0.19512901, -0.70490003),
          new s(-0.24488901, -0.116562, -0.96251899),
          new s(0.80075902, -0.022979001, -0.59854603),
          new s(-0.37027499, 0.095583998, -0.92399102),
          new s(-0.33067101, -0.32657799, -0.88543999),
          new s(-0.16322, -0.52757901, -0.83367902),
          new s(0.12639, -0.313146, -0.941257),
          new s(0.34954801, -0.27222601, -0.89649802),
          new s(0.23991799, -0.085825004, -0.96699202),
          new s(0.390845, 0.081537001, -0.91683799),
          new s(0.25526699, 0.26869699, -0.92878503),
          new s(0.146245, 0.48043799, -0.86474901),
          new s(-0.32601601, 0.47845599, -0.81534898),
          new s(-0.46968201, -0.112519, -0.87563598),
          new s(0.81844002, -0.25852001, -0.51315099),
          new s(-0.474318, 0.292238, -0.83043301),
          new s(0.778943, 0.39584199, -0.48637101),
          new s(0.62409401, 0.39377299, -0.67487001),
          new s(0.74088597, 0.203834, -0.63995302),
          new s(0.48021701, 0.565768, -0.67029703),
          new s(0.38093001, 0.42453501, -0.82137799),
          new s(-0.093422003, 0.50112402, -0.86031801),
          new s(-0.236485, 0.29619801, -0.92538702),
          new s(-0.131531, 0.093959004, -0.98684901),
          new s(-0.82356203, 0.29577699, -0.48400599),
          new s(0.61106598, -0.624304, -0.486664),
          new s(0.069495998, -0.52033001, -0.85113299),
          new s(0.226522, -0.66487902, -0.711775),
          new s(0.47130799, -0.56890398, -0.67395699),
          new s(0.38842499, -0.74262398, -0.54556),
          new s(0.78367501, -0.48072901, -0.39338499),
          new s(0.962394, 0.135676, -0.235349),
          new s(0.876607, 0.172034, -0.449406),
          new s(0.63340503, 0.58979303, -0.50094098),
          new s(0.182276, 0.80065799, -0.57072097),
          new s(0.177003, 0.76413399, 0.62029701),
          new s(-0.544016, 0.675515, -0.49772099),
          new s(-0.67929697, 0.28646699, -0.67564201),
          new s(-0.59039098, 0.091369003, -0.801929),
          new s(-0.82436001, -0.13312399, -0.55018902),
          new s(-0.71579403, -0.33454201, -0.61296099),
          new s(0.17428599, -0.89248401, 0.416049),
          new s(-0.082528003, -0.83712298, -0.54075301),
          new s(0.28333101, -0.88087398, -0.37918901),
          new s(0.675134, -0.42662701, -0.60181701),
          new s(0.84372002, -0.512335, -0.160156),
          new s(0.97730398, -0.098555997, -0.18752),
          new s(0.846295, 0.522672, -0.102947),
          new s(0.67714101, 0.72132498, -0.145501),
          new s(0.32096499, 0.87089199, -0.37219399),
          new s(-0.178978, 0.911533, -0.37023601),
          new s(-0.44716901, 0.82670099, -0.341474),
          new s(-0.70320302, 0.496328, -0.50908101),
          new s(-0.97718102, 0.063562997, -0.202674),
          new s(-0.87817001, -0.412938, 0.241455),
          new s(-0.83583099, -0.35855001, -0.415728),
          new s(-0.499174, -0.69343299, -0.51959199),
          new s(-0.188789, -0.92375302, -0.33322501),
          new s(0.19225401, -0.96936101, -0.152896),
          new s(0.51594001, -0.783907, -0.34539199),
          new s(0.90592498, -0.30095199, -0.29787099),
          new s(0.99111199, -0.127746, 0.037106998),
          new s(0.99513501, 0.098424003, -0.0043830001),
          new s(0.76012301, 0.64627701, 0.067367002),
          new s(0.205221, 0.95958, -0.192591),
          new s(-0.042750001, 0.97951299, -0.19679099),
          new s(-0.43801701, 0.89892697, 0.0084920004),
          new s(-0.82199401, 0.48078501, -0.30523899),
          new s(-0.89991701, 0.081710003, -0.42833701),
          new s(-0.92661202, -0.144618, -0.347096),
          new s(-0.79365999, -0.55779201, -0.24283899),
          new s(-0.43134999, -0.84777898, -0.30855799),
          new s(-0.0054919999, -0.96499997, 0.26219299),
          new s(0.58790499, -0.80402601, -0.088940002),
          new s(0.69949299, -0.66768599, -0.254765),
          new s(0.88930303, 0.359795, -0.282291),
          new s(0.780972, 0.197037, 0.59267199),
          new s(0.52012098, 0.50669599, 0.68755698),
          new s(0.40389499, 0.69396102, 0.59605998),
          new s(-0.154983, 0.89923602, 0.40909001),
          new s(-0.65733802, 0.53716803, 0.528543),
          new s(-0.74619502, 0.33409101, 0.575827),
          new s(-0.62495202, -0.049144, 0.77911502),
          new s(0.31814101, -0.254715, 0.913185),
          new s(-0.555897, 0.405294, 0.725752),
          new s(-0.79443401, 0.099405997, 0.59916002),
          new s(-0.64036101, -0.68946302, 0.33849499),
          new s(-0.12671299, -0.73409498, 0.66711998),
          new s(0.105457, -0.78081697, 0.61579502),
          new s(0.40799299, -0.48091599, 0.77605498),
          new s(0.69513601, -0.54512, 0.468647),
          new s(0.97319102, -0.0064889998, 0.229908),
          new s(0.94689399, 0.317509, -0.050799001),
          new s(0.56358302, 0.82561201, 0.027183),
          new s(0.325773, 0.94542301, 0.0069490001),
          new s(-0.171821, 0.98509699, -0.0078149997),
          new s(-0.67044097, 0.73993897, 0.054768998),
          new s(-0.822981, 0.55496198, 0.121322),
          new s(-0.96619302, 0.117857, 0.229307),
          new s(-0.95376903, -0.29470399, 0.058945),
          new s(-0.86438698, -0.50272799, -0.010015),
          new s(-0.53060901, -0.84200603, -0.097365998),
          new s(-0.162618, -0.98407501, 0.071772002),
          new s(0.081446998, -0.99601102, 0.036439002),
          new s(0.74598402, -0.66596299, 0.00076199998),
          new s(0.94205701, -0.32926899, -0.064106002),
          new s(0.93970197, -0.28108999, 0.194803),
          new s(0.77121401, 0.55067003, 0.319363),
          new s(0.641348, 0.73069, 0.23402099),
          new s(0.080682002, 0.99669099, 0.0098789996),
          new s(-0.046725001, 0.97664303, 0.20972501),
          new s(-0.53107601, 0.82100099, 0.209562),
          new s(-0.69581503, 0.65599, 0.29243499),
          new s(-0.97612202, 0.216709, -0.014913),
          new s(-0.96166098, -0.14412899, 0.23331399),
          new s(-0.772084, -0.61364698, 0.165299),
          new s(-0.44960001, -0.83605999, 0.314426),
          new s(-0.39269999, -0.91461599, 0.096247002),
          new s(0.390589, -0.91947001, 0.044890001),
          new s(0.58252901, -0.79919797, 0.148127),
          new s(0.866431, -0.48981199, 0.096864),
          new s(0.90458697, 0.111498, 0.41145),
          new s(0.95353699, 0.23232999, 0.191806),
          new s(0.497311, 0.77080297, 0.398177),
          new s(0.194066, 0.95631999, 0.218611),
          new s(0.422876, 0.882276, 0.206797),
          new s(-0.373797, 0.84956598, 0.37217399),
          new s(-0.53449702, 0.71402299, 0.4522),
          new s(-0.881827, 0.23716, 0.40759799),
          new s(-0.904948, -0.014069, 0.42528901),
          new s(-0.751827, -0.51281703, 0.41445801),
          new s(-0.50101501, -0.69791698, 0.51175803),
          new s(-0.23519, -0.92592299, 0.295555),
          new s(0.228983, -0.95393997, 0.193819),
          new s(0.734025, -0.63489801, 0.241062),
          new s(0.91375297, -0.063253, -0.40131599),
          new s(0.90573502, -0.161487, 0.391875),
          new s(0.85892999, 0.342446, 0.38074899),
          new s(0.62448603, 0.60758102, 0.49077699),
          new s(0.28926399, 0.85747898, 0.42550799),
          new s(0.069968, 0.90216899, 0.42567101),
          new s(-0.28617999, 0.94069999, 0.182165),
          new s(-0.57401299, 0.80511898, -0.14930899),
          new s(0.111258, 0.099717997, -0.98877603),
          new s(-0.30539301, -0.94422799, -0.12316),
          new s(-0.60116601, -0.78957599, 0.123163),
          new s(-0.290645, -0.81213999, 0.50591898),
          new s(-0.064920001, -0.87716299, 0.47578499),
          new s(0.408301, -0.862216, 0.29978901),
          new s(0.56609702, -0.72556603, 0.39126399),
          new s(0.83936399, -0.427387, 0.33586901),
          new s(0.81889999, -0.041305002, 0.57244802),
          new s(0.71978402, 0.41499701, 0.55649698),
          new s(0.88174403, 0.45027, 0.140659),
          new s(0.40182301, -0.89822, -0.17815199),
          new s(-0.054019999, 0.79134399, 0.60898),
          new s(-0.29377401, 0.76399398, 0.57446498),
          new s(-0.450798, 0.61034697, 0.65135098),
          new s(-0.63822103, 0.186694, 0.74687302),
          new s(-0.87287003, -0.25712699, 0.41470799),
          new s(-0.58725703, -0.52170998, 0.618828),
          new s(-0.35365799, -0.64197397, 0.680291),
          new s(0.041648999, -0.61127299, 0.79032302),
          new s(0.348342, -0.77918297, 0.52108699),
          new s(0.499167, -0.62244099, 0.602826),
          new s(0.79001898, -0.30383101, 0.53250003),
          new s(0.66011798, 0.060733002, 0.74870199),
          new s(0.60492098, 0.29416099, 0.73996001),
          new s(0.38569701, 0.37934601, 0.84103203),
          new s(0.239693, 0.207876, 0.94833201),
          new s(0.012623, 0.25853199, 0.96591997),
          new s(-0.100557, 0.457147, 0.88368797),
          new s(0.046967, 0.62858802, 0.77631903),
          new s(-0.43039101, -0.44540501, 0.785097),
          new s(-0.43429101, -0.196228, 0.87913901),
          new s(-0.25663701, -0.336867, 0.90590203),
          new s(-0.131372, -0.15891001, 0.97851402),
          new s(0.102379, -0.208767, 0.972592),
          new s(0.195687, -0.450129, 0.87125802),
          new s(0.62731898, -0.42314801, 0.65377098),
          new s(0.68743902, -0.171583, 0.70568198),
          new s(0.27592, -0.021255, 0.96094602),
          new s(0.45936701, 0.15746599, 0.87417799),
          new s(0.285395, 0.583184, 0.76055598),
          new s(-0.81217402, 0.46030301, 0.35846099),
          new s(-0.189068, 0.64122301, 0.743698),
          new s(-0.338875, 0.47648001, 0.811252),
          new s(-0.92099398, 0.347186, 0.176727),
          new s(0.040638998, 0.024465, 0.99887401),
          new s(-0.73913199, -0.35374701, 0.57318997),
          new s(-0.60351199, -0.28661501, 0.74405998),
          new s(-0.188676, -0.547059, 0.81555402),
          new s(-0.026045, -0.39782, 0.91709399),
          new s(0.26789701, -0.649041, 0.71202302),
          new s(0.518246, -0.28489101, 0.80638599),
          new s(0.493451, -0.066532999, 0.86722499),
          new s(-0.328188, 0.140251, 0.93414301),
          new s(0.328188, 0.140251, 0.93414301),
          new s(-0.328188, 0.140251, 0.93414301),
          new s(-0.328188, 0.140251, 0.93414301),
          new s(-0.328188, 0.140251, 0.93414301),
        ];
      class f {
        constructor(e, t, n) {
          (this.sizeX = e),
            (this.sizeY = t),
            (this.sizeZ = n),
            (this.arr = new Array(e * t * n));
        }
        add(e) {
          this.arr[e.x + e.y * this.sizeX + e.z * this.sizeX * this.sizeY] = e;
        }
        get(e, t, n) {
          if (!(e >= this.sizeX || t >= this.sizeY || n >= this.sizeZ))
            return this.arr[e + t * this.sizeX + n * this.sizeX * this.sizeY];
        }
      }
      class l {
        get spanX() {
          return this.maxBounds.x - this.minBounds.x;
        }
        get spanY() {
          return this.maxBounds.y - this.minBounds.y;
        }
        get spanZ() {
          return this.maxBounds.z - this.minBounds.z;
        }
        get scaleX() {
          return this.spanX / this.sizeX;
        }
        get scaleY() {
          return this.spanY / this.sizeY;
        }
        get scaleZ() {
          return this.spanZ / this.sizeZ;
        }
        get scale() {
          return new THREE.Vector3(this.scaleX, this.scaleY, this.scaleZ);
        }
        getAllVoxels() {
          let e = [],
            t = new f(this.sizeX + 1, this.sizeY + 1, this.sizeZ + 1);
          for (let n = 0, i = this.spans.length; n < i; n++) {
            let i = this.spans[n].voxels;
            for (let n = 0, r = i.length; n < r; n++) {
              let r = i[n];
              e.push(r), t.add(r);
            }
          }
          return { voxels: e, voxelField: t };
        }
        getNormals() {
          switch (this.normalsMode) {
            case 1:
              return o;
            case 2:
              return a;
            case 3:
              return h;
            case 4:
              return w;
            default:
              throw new Error(`Invalid normalsmode ${this.normalsMode}`);
          }
        }
        scaleHvaMatrix(e) {
          return (
            ((e = e.clone()).elements[12] *= this.hvaMultiplier),
            (e.elements[13] *= this.hvaMultiplier),
            (e.elements[14] *= this.hvaMultiplier),
            e
          );
        }
        toPlain() {
          return {
            name: this.name,
            normalsMode: this.normalsMode,
            minBounds: this.minBounds.toArray(),
            maxBounds: this.maxBounds.toArray(),
            sizeX: this.sizeX,
            sizeY: this.sizeY,
            sizeZ: this.sizeZ,
            hvaMultiplier: this.hvaMultiplier,
            transfMatrix: this.transfMatrix.toArray(),
            spans: this.spans,
          };
        }
        fromPlain(e) {
          return (
            (this.name = e.name),
            (this.normalsMode = e.normalsMode),
            (this.minBounds = new THREE.Vector3().fromArray(e.minBounds)),
            (this.maxBounds = new THREE.Vector3().fromArray(e.maxBounds)),
            (this.sizeX = e.sizeX),
            (this.sizeY = e.sizeY),
            (this.sizeZ = e.sizeZ),
            (this.hvaMultiplier = e.hvaMultiplier),
            (this.transfMatrix = new THREE.Matrix4().fromArray(e.transfMatrix)),
            (this.spans = e.spans),
            this
          );
        }
      }
      class u {
        read(e) {
          (this.fileName = e.readCString(16)),
            (this.paletteCount = e.readUint32()),
            (this.headerCount = e.readUint32()),
            (this.tailerCount = e.readUint32()),
            (this.bodySize = e.readUint32()),
            (this.paletteRemapStart = e.readUint8()),
            (this.paletteRemapEnd = e.readUint8()),
            e.seek(e.position + 768);
        }
      }
      u.size = 32;
      class y {
        constructor(e) {
          (this.voxelCount = 0),
            e instanceof
              class {
                constructor(e, t) {
                  (this.stream = e), (this.filename = t);
                }
                static async fromRealFile(e) {
                  try {
                    const t = new i(await e.arrayBuffer());
                    return (t._trimAlloc = () => {}), new this(t, e.name);
                  } catch (t) {
                    if (t instanceof DOMException)
                      throw new r(
                        `File "${e.name}" could not be read (${t.name})`,
                        { cause: t }
                      );
                    throw t;
                  }
                }
                static fromBytes(e, t) {
                  let n = new i(e);
                  return (n._trimAlloc = () => {}), new this(n, t);
                }
                static factory(e, t, n = 0, r = e.byteLength) {
                  const s = new DataView(e.buffer, e.byteOffset + n, r),
                    o = new i(s);
                  return (o._trimAlloc = () => {}), new this(o, t);
                }
                readAsString(e) {
                  return (
                    this.stream.seek(0),
                    this.stream.readString(this.stream.byteLength, e)
                  );
                }
                getBytes() {
                  return new Uint8Array(
                    this.stream.buffer,
                    this.stream.byteOffset,
                    this.stream.byteLength
                  );
                }
                getSize() {
                  return this.stream.byteLength;
                }
                asFile(e) {
                  return new File([this.getBytes()], this.filename, {
                    type: e,
                  });
                }
              } && this.fromVirtualFile(e);
        }
        fromVirtualFile(e) {
          this.filename = e.filename;
          let t = e.stream;
          if (((this.sections = []), t.byteLength < u.size)) return;
          let n = new u();
          if (
            (n.read(t),
            !n.headerCount || !n.tailerCount || n.tailerCount !== n.headerCount)
          )
            return;
          for (let e = 0; e < n.headerCount; ++e) {
            const e = new l();
            this.readSectionHeader(e, t),
              this.sections.find((t) => t.name === e.name) &&
                console.warn(
                  `Duplicate section name "${e.name}" found in VXL "${this.filename}".`
                ),
              this.sections.push(e);
          }
          let i = t.position;
          t.seek(t.position + n.bodySize);
          let r = [];
          for (let e = 0; e < n.tailerCount; ++e)
            r[e] = this.readSectionTailer(this.sections[e], t);
          let s = 0;
          for (let e = 0; e < n.headerCount; ++e)
            t.seek(i),
              (s += this.readSectionBodySpans(this.sections[e], r[e], t));
          this.voxelCount = s;
        }
        readSectionHeader(e, t) {
          (e.name = t.readCString(16)),
            t.readUint32(),
            t.readUint32(),
            t.readUint32();
        }
        readSectionTailer(e, t) {
          const n = t.readUint32(),
            i = t.readUint32(),
            r = t.readUint32();
          return (
            (e.hvaMultiplier = t.readFloat32()),
            (e.transfMatrix = this.readTransfMatrix(t)),
            (e.minBounds = new THREE.Vector3(
              t.readFloat32(),
              t.readFloat32(),
              t.readFloat32()
            )),
            (e.maxBounds = new THREE.Vector3(
              t.readFloat32(),
              t.readFloat32(),
              t.readFloat32()
            )),
            (e.sizeX = t.readUint8()),
            (e.sizeY = t.readUint8()),
            (e.sizeZ = t.readUint8()),
            (e.normalsMode = t.readUint8()),
            { startingSpanOffset: n, endingSpanOffset: i, dataSpanOffset: r }
          );
        }
        readTransfMatrix(e) {
          let t = [];
          for (let n = 0; n < 3; ++n)
            t.push(
              e.readFloat32(),
              e.readFloat32(),
              e.readFloat32(),
              e.readFloat32()
            );
          return (
            t.push(0, 0, 0, 1), new THREE.Matrix4().fromArray(t).transpose()
          );
        }
        readSectionBodySpans(e, t, n) {
          n.seek(n.position + t.startingSpanOffset);
          let { sizeX: i, sizeY: r, sizeZ: s } = e,
            o = new Array(r);
          for (let e = 0; e < r; ++e) {
            o[e] = new Array(i);
            for (let t = 0; t < i; ++t) o[e][t] = n.readInt32();
          }
          let a = new Array(r);
          for (let e = 0; e < r; ++e) {
            a[e] = new Array(i);
            for (let t = 0; t < i; ++t) a[e][t] = n.readInt32();
          }
          let h = (e.spans = []),
            w = 0;
          for (let e = 0; e < r; ++e)
            for (let t = 0; t < i; ++t) {
              let i = {
                x: t,
                y: e,
                voxels: this.readSpanVoxels(o[e][t], a[e][t], t, e, s, n),
              };
              h.push(i), (w += i.voxels.length);
            }
          return w;
        }
        readSpanVoxels(e, t, n, i, r, s) {
          if (-1 === e || -1 === t) return [];
          let o = [];
          for (let e = 0; e < r; ) {
            e += s.readUint8();
            let t = s.readUint8();
            for (let r = 0; r < t; ++r) {
              let t = {
                x: n,
                y: i,
                z: e++,
                colorIndex: s.readUint8(),
                normalIndex: s.readUint8(),
              };
              o.push(t);
            }
            s.readUint8();
          }
          return o;
        }
        fromPlain(e) {
          return (
            (this.sections = e.sections.map((e) => new l().fromPlain(e))),
            (this.voxelCount = e.voxelCount),
            this
          );
        }
        toPlain() {
          return {
            sections: this.sections.map((e) => e.toPlain()),
            voxelCount: this.voxelCount,
          };
        }
        getSection(e) {
          return this.sections[e];
        }
      }
      var d;
      !(function (e) {
        (e[(e.Low = 0)] = "Low"), (e[(e.High = 1)] = "High");
      })(d || (d = {}));
      class c {
        build(e, t = !1) {
          let { voxelField: n } = e.getAllVoxels();
          const i = t
            ? (e, t, i) => {
                let r = n.get(e, t, i);
                return r ? r.colorIndex : 0;
              }
            : (e, t, i) => {
                let r = n.get(e, t, i);
                return r ? r.normalIndex + 256 * r.colorIndex : 0;
              };
          let { vertices: r, faces: s } = (function (e, t) {
              for (var n = [], i = [], r = 0; r < 3; ++r) {
                var s = (r + 1) % 3,
                  o = (r + 2) % 3,
                  a = new Int32Array(3),
                  h = new Int32Array(3),
                  w = new Int32Array(2 * (t[s] + 1)),
                  f = new Int32Array(t[s]),
                  l = new Int32Array(t[s]),
                  u = new Int32Array(2 * t[o]),
                  y = new Int32Array(2 * t[o]),
                  d = new Int32Array(24 * t[o]),
                  c = [
                    [0, 0],
                    [0, 0],
                  ];
                for (h[r] = 1, a[r] = -1; a[r] < t[r]; ) {
                  var b = [],
                    g = 0;
                  for (a[o] = 0; a[o] < t[o]; ++a[o]) {
                    var m = 0,
                      A = 0,
                      E = 0;
                    for (a[s] = 0; a[s] < t[s]; ++a[s], A = E) {
                      var _ = 0 <= a[r] ? e(a[0], a[1], a[2]) : 0,
                        v =
                          a[r] < t[r] - 1
                            ? e(a[0] + h[0], a[1] + h[1], a[2] + h[2])
                            : 0;
                      (E = _),
                        !_ == !v ? (E = 0) : _ || (E = -v),
                        A !== E && ((w[m++] = a[s]), (w[m++] = E));
                    }
                    (w[m++] = t[s]), (w[m++] = 0);
                    for (var U = 0, T = 0, B = 0; T < g && B < m - 2; ) {
                      let e = b[f[T]];
                      var L = e.left[e.left.length - 1][0],
                        S = e.right[e.right.length - 1][0],
                        z = e.color,
                        x = w[B],
                        I = w[B + 2],
                        O = w[B + 1];
                      if (I > L && S > x && O === z)
                        e.merge_run(a[o], x, I), (l[U++] = f[T]), ++T, (B += 2);
                      else {
                        if (I <= S) {
                          if (O) {
                            var M = new p(O, a[o], x, I);
                            (l[U++] = b.length), b.push(M);
                          }
                          B += 2;
                        }
                        S <= I && (e.close_off(a[o]), ++T);
                      }
                    }
                    for (; T < g; ++T) b[f[T]].close_off(a[o]);
                    for (; B < m - 2; B += 2)
                      (x = w[B]),
                        (I = w[B + 2]),
                        (O = w[B + 1]) &&
                          ((M = new p(O, a[o], x, I)),
                          (l[U++] = b.length),
                          b.push(M));
                    var F = l;
                    (l = f), (f = F), (g = U);
                  }
                  for (T = 0; T < g; ++T) b[f[T]].close_off(t[o]);
                  for (a[r]++, T = 0; T < b.length; ++T) {
                    let e = b[T];
                    E = e.color;
                    var N = !1;
                    for (
                      E < 0 && ((N = !0), (E = -E)), B = 0;
                      B < e.left.length;
                      ++B
                    ) {
                      u[B] = n.length;
                      var R = [0, 0, 0],
                        V = e.left[B];
                      (R[r] = a[r]),
                        (R[s] = V[0]),
                        (R[o] = V[1]),
                        n.push({ position: R, value: E });
                    }
                    for (B = 0; B < e.right.length; ++B)
                      (y[B] = n.length),
                        (R = [0, 0, 0]),
                        (V = e.right[B]),
                        (R[r] = a[r]),
                        (R[s] = V[0]),
                        (R[o] = V[1]),
                        n.push({ position: R, value: E });
                    var Y = 0,
                      C = 0,
                      H = 1,
                      P = 1,
                      X = !0;
                    for (
                      d[C++] = u[0],
                        d[C++] = e.left[0][0],
                        d[C++] = e.left[0][1],
                        d[C++] = y[0],
                        d[C++] = e.right[0][0],
                        d[C++] = e.right[0][1];
                      H < e.left.length || P < e.right.length;

                    ) {
                      var k = !1;
                      if (H === e.left.length) k = !0;
                      else if (P !== e.right.length) {
                        var Z = e.left[H],
                          G = e.right[P];
                        k = Z[1] > G[1];
                      }
                      var D = k ? y[P] : u[H],
                        j = k ? e.right[P] : e.left[H];
                      if (k !== X)
                        for (; Y + 3 < C; )
                          N === k
                            ? i.push([d[Y], d[Y + 3], D])
                            : i.push([d[Y + 3], d[Y], D]),
                            (Y += 3);
                      else
                        for (; Y + 3 < C; ) {
                          for (B = 0; B < 2; ++B)
                            for (var $ = 0; $ < 2; ++$)
                              c[B][$] = d[C - 3 * (B + 1) + $ + 1] - j[$];
                          var W = c[0][0] * c[1][1] - c[1][0] * c[0][1];
                          if (k === W > 0) break;
                          0 !== W &&
                            (N === k
                              ? i.push([d[C - 3], d[C - 6], D])
                              : i.push([d[C - 6], d[C - 3], D])),
                            (C -= 3);
                        }
                      (d[C++] = D),
                        (d[C++] = j[0]),
                        (d[C++] = j[1]),
                        k ? ++P : ++H,
                        (X = k);
                    }
                  }
                }
              }
              return { vertices: n, faces: i };
            })(i, [e.sizeX, e.sizeY, e.sizeZ]),
            o = e.minBounds,
            a = e.scale,
            h = e.getNormals(),
            w = new Float32Array(3 * r.length),
            f = new Float32Array(3 * r.length),
            l = new Float32Array(3 * r.length),
            u = 0,
            y = 0,
            d = 0;
          for (let e = 0, n = r.length; e < n; e++) {
            let n = r[e],
              i = t ? n.value : (n.value / 256) | 0;
            if (
              ((w[u++] = o.x + n.position[0] * a.x),
              (w[u++] = o.y + n.position[1] * a.y),
              (w[u++] = o.z + n.position[2] * a.z),
              (l[d++] = i / 255),
              (l[d++] = 0),
              (l[d++] = 0),
              !t)
            ) {
              let e = n.value % 256,
                t = h[Math.min(e, h.length - 1)];
              (f[y++] = t.x), (f[y++] = t.y), (f[y++] = t.z);
            }
          }
          let c = new Uint32Array(3 * s.length),
            b = 0;
          for (let e = 0, t = s.length; e < t; e++) {
            let t = s[e];
            (c[b++] = t[0]), (c[b++] = t[1]), (c[b++] = t[2]);
          }
          let g = new THREE.BufferGeometry();
          return (
            g.addAttribute("position", new THREE.BufferAttribute(w, 3)),
            t || g.addAttribute("normal", new THREE.BufferAttribute(f, 3)),
            g.addAttribute("color", new THREE.BufferAttribute(l, 3)),
            g.setIndex(new THREE.BufferAttribute(c, 1)),
            (g = class {
              static mergeVertices(e, t = 1e-4) {
                t = Math.max(t, Number.EPSILON);
                const n = {},
                  i = e.getIndex(),
                  r = e.getAttribute("position"),
                  s = i ? i.count : r.count;
                let o = 0;
                const a = Object.keys(e.attributes),
                  h = {},
                  w = {},
                  f = [],
                  l = [
                    (e, t) => e.getX(t),
                    (e, t) => e.getY(t),
                    (e, t) => e.getZ(t),
                    (e, t) => e.getW(t),
                  ];
                for (let t = 0, n = a.length; t < n; t++) {
                  const n = a[t];
                  h[n] = [];
                  const i = e.morphAttributes[n];
                  i && (w[n] = new Array(i.length).fill(void 0).map(() => []));
                }
                const u = Math.log10(1 / t),
                  y = Math.pow(10, u);
                for (let t = 0; t < s; t++) {
                  const r = i ? i.getX(t) : t;
                  let s = "";
                  for (let t = 0, n = a.length; t < n; t++) {
                    const n = a[t],
                      i = e.getAttribute(n),
                      o = i.itemSize;
                    for (let e = 0; e < o; e++) s += ~~(l[e](i, r) * y) + ",";
                  }
                  if (s in n) f.push(n[s]);
                  else {
                    for (let t = 0, n = a.length; t < n; t++) {
                      const n = a[t],
                        i = e.getAttribute(n),
                        s = e.morphAttributes[n],
                        o = i.itemSize,
                        f = h[n],
                        u = w[n];
                      for (let e = 0; e < o; e++) {
                        const t = l[e];
                        if ((f.push(t(i, r)), s))
                          for (let e = 0, n = s.length; e < n; e++)
                            u[e].push(t(s[e], r));
                      }
                    }
                    (n[s] = o), f.push(o), o++;
                  }
                }
                const d = e.clone();
                for (let t = 0, n = a.length; t < n; t++) {
                  const n = a[t],
                    i = e.getAttribute(n),
                    r = new i.array.constructor(h[n]),
                    s = new THREE.BufferAttribute(r, i.itemSize, i.normalized);
                  if ((d.addAttribute(n, s), n in w))
                    for (let t = 0; t < w[n].length; t++) {
                      const i = e.morphAttributes[n][t],
                        r = new i.array.constructor(w[n][t]),
                        s = new THREE.BufferAttribute(
                          r,
                          i.itemSize,
                          i.normalized
                        );
                      d.morphAttributes[n][t] = s;
                    }
                }
                return (
                  d.setIndex(new THREE.BufferAttribute(new Uint32Array(f), 1)),
                  d
                );
              }
              static mergeBufferGeometries(e, t = !1) {
                const n = null !== e[0].index,
                  i = new Set(Object.keys(e[0].attributes)),
                  r = {},
                  s = new THREE.BufferGeometry();
                let o = 0;
                for (let a = 0; a < e.length; ++a) {
                  const h = e[a];
                  let w = 0;
                  if (n !== (null !== h.index))
                    throw new Error(
                      "mergeBufferGeometries() failed with geometry at index " +
                        a +
                        ". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."
                    );
                  if (Object.keys(h.morphAttributes).length)
                    throw new Error(
                      "mergeBufferGeometries() failed with geometry at index " +
                        a +
                        ". Morph attributes are not supported"
                    );
                  for (const e in h.attributes) {
                    if (!i.has(e))
                      throw new Error(
                        "mergeBufferGeometries() failed with geometry at index " +
                          a +
                          '. All geometries must have compatible attributes; make sure "' +
                          e +
                          '" attribute exists among all geometries, or in none of them.'
                      );
                    void 0 === r[e] && (r[e] = []),
                      r[e].push(h.attributes[e]),
                      w++;
                  }
                  if (w !== i.size)
                    throw new Error(
                      "mergeBufferGeometries() failed with geometry at index " +
                        a +
                        ". Make sure all geometries have the same number of attributes."
                    );
                  if (t) {
                    let e;
                    if (n) e = h.index.count;
                    else {
                      if (void 0 === h.attributes.position)
                        throw new Error(
                          "mergeBufferGeometries() failed with geometry at index " +
                            a +
                            ". The geometry must have either an index or a position attribute"
                        );
                      e = h.attributes.position.count;
                    }
                    s.addGroup(o, e, a), (o += e);
                  }
                }
                if (n) {
                  let t = 0;
                  const n = [];
                  for (let i = 0; i < e.length; ++i) {
                    const r = e[i].index;
                    for (let e = 0; e < r.count; ++e) n.push(r.getX(e) + t);
                    t += e[i].attributes.position.count;
                  }
                  s.setIndex(
                    new THREE.BufferAttribute(
                      new (n.length > 65535 ? Uint32Array : Uint16Array)(n),
                      1
                    )
                  );
                }
                for (const e in r) {
                  const t = this.mergeBufferAttributes(r[e]);
                  if (!t)
                    throw new Error(
                      "mergeBufferGeometries() failed while trying to merge the " +
                        e +
                        " attribute."
                    );
                  s.addAttribute(e, t);
                }
                return s;
              }
              static mergeBufferAttributes(e) {
                let t,
                  n,
                  i,
                  r = 0;
                for (let s = 0; s < e.length; ++s) {
                  const o = e[s];
                  if (o.isInterleavedBufferAttribute)
                    throw new Error(
                      "mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported."
                    );
                  if (
                    (void 0 === t && (t = o.array.constructor),
                    t !== o.array.constructor)
                  )
                    throw new Error(
                      "mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."
                    );
                  if ((void 0 === n && (n = o.itemSize), n !== o.itemSize))
                    throw new Error(
                      "mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."
                    );
                  if ((void 0 === i && (i = o.normalized), i !== o.normalized))
                    throw new Error(
                      "mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."
                    );
                  r += o.array.length;
                }
                const s = new t(r);
                let o = 0;
                for (let t = 0; t < e.length; ++t)
                  s.set(e[t].array, o), (o += e[t].array.length);
                return new THREE.BufferAttribute(s, n, i);
              }
            }.mergeVertices(g)),
            g.computeBoundingBox(),
            t && g.computeVertexNormals(),
            g
          );
        }
      }
      class p {
        constructor(e, t, n, i) {
          (this.color = e), (this.left = [[n, t]]), (this.right = [[i, t]]);
        }
        close_off(e) {
          this.left.push([this.left[this.left.length - 1][0], e]),
            this.right.push([this.right[this.right.length - 1][0], e]);
        }
        merge_run(e, t, n) {
          var i = this.left[this.left.length - 1][0],
            r = this.right[this.right.length - 1][0];
          i !== t && (this.left.push([i, e]), this.left.push([t, e])),
            r !== n && (this.right.push([r, e]), this.right.push([n, e]));
        }
      }
      class b {
        serialize(e) {
          if (Object.keys(e.morphAttributes).length)
            throw new Error("Morph attributes are not supported");
          if (e.groups.length > 1) throw new Error("Groups are not supported");
          let t = Object.keys(e.attributes),
            n = e.index,
            r =
              1 +
              22 * t.length +
              Object.values(e.attributes)
                .map((e) => this.getTypedArrayByteSize(e.array))
                .reduce((e, t) => e + t, 0) +
              1 +
              (n ? this.getTypedArrayByteSize(n.array) : 0),
            s = new i(new ArrayBuffer(r));
          s.writeUint8(t.length);
          for (let n of t) {
            let t = e.getAttribute(n);
            s.writeCString(n, 20),
              s.writeUint8(t.itemSize),
              s.writeUint8(Number(t.normalized)),
              this.writeTypedArray(s, t.array);
          }
          return (
            s.writeUint8(Number(Boolean(n))),
            n && this.writeTypedArray(s, n.array),
            s.seek(0),
            (s.dynamicSize = !1),
            s.buffer
          );
        }
        unserialize(e) {
          let t = new THREE.BufferGeometry(),
            n = e.readUint8();
          for (let i = 0; i < n; i++) {
            let n = e.readCString(20),
              i = e.readUint8(),
              r = Boolean(e.readUint8()),
              s = this.readTypedArray(e),
              o = new THREE.BufferAttribute(s, i, r);
            t.addAttribute(n, o);
          }
          if (Boolean(e.readUint8())) {
            let n = this.readTypedArray(e);
            t.setIndex(new THREE.BufferAttribute(n, 1));
          }
          return t;
        }
        writeTypedArray(e, t) {
          if ((e.writeUint32(t.length), t instanceof Float32Array))
            e.writeUint8(0), e.writeFloat32Array(t);
          else if (t instanceof Uint32Array)
            e.writeUint8(1), e.writeUint32Array(t);
          else {
            if (!(t instanceof Uint16Array))
              throw new Error(`Unsupported array type "${t.constructor.name}"`);
            e.writeUint8(2), e.writeUint16Array(t);
          }
        }
        readTypedArray(e) {
          let t = e.readUint32(),
            n = e.readUint8();
          switch (n) {
            case 0:
              return e.readFloat32Array(t);
            case 1:
              return e.readUint32Array(t);
            case 2:
              return e.readUint16Array(t);
            default:
              throw new Error(`Unsupported array type "${n}"`);
          }
        }
        getTypedArrayByteSize(e) {
          return 5 + e.BYTES_PER_ELEMENT * e.length;
        }
      }
      async function g(e, t) {
        let n = new y().fromPlain(e),
          i = [];
        for (let e of n.sections) {
          let n = new c().build(e, t === d.Low),
            r = new b().serialize(n);
          i.push(r);
        }
        return i;
      }
    },
  },
]);
