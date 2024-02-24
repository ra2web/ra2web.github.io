/*
 * minilzo-js
 * JavaScript port of minilzo by Alistair Braidwood
 *
 *
 * This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU General Public License as
 *  published by the Free Software Foundation; either version 2 of
 *  the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 *  along with the minilzo-js library; see the file COPYING.
 *  If not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 */

/*
 * original minilzo.c by:
 *
 * Markus F.X.J. Oberhumer
 * <markus@oberhumer.com>
 * http://www.oberhumer.com/opensource/lzo/
 */

/*
 * NOTE:
 *   the full LZO package can be found at
 *   http://www.oberhumer.com/opensource/lzo/
 */

var lzo1x = (function () {
	'use strict';

	function _lzo1x() {
		this.blockSize = 128 * 1024;
		this.minNewSize = this.blockSize;
		this.maxSize = 0;

		this.OK = 0;
		this.INPUT_OVERRUN = -4;
		this.OUTPUT_OVERRUN = -5;
		this.LOOKBEHIND_OVERRUN = -6;
		this.EOF_FOUND = -999;
		this.ret = 0;

		this.buf = null;
		this.buf32 = null;

		this.out = new Uint8Array(256 * 1024);
		this.cbl = 0;
		this.ip_end = 0;
		this.op_end = 0;
		this.t = 0;

		this.ip = 0;
		this.op = 0;
		this.m_pos = 0;
		this.m_len = 0;
		this.m_off = 0;

		this.dv_hi = 0;
		this.dv_lo = 0;
		this.dindex = 0;

		this.ii = 0;
		this.jj = 0;
		this.tt = 0;
		this.v = 0;

		this.dict = new Uint32Array(16384);
		this.emptyDict = new Uint32Array(16384);

		this.skipToFirstLiteralFun = false;
		this.returnNewBuffers = true;

		this.setBlockSize = function(blockSize) {
			if(typeof blockSize === 'number' && !isNaN(blockSize) && parseInt(blockSize) > 0) {
				this.blockSize = parseInt(blockSize);
				return true;
			} else {
				return false;
			}
		};

		this.setOutputSize = function(outputSize) {
			if(typeof outputSize === 'number' && !isNaN(outputSize) && parseInt(outputSize) > 0) {
				this.out = new Uint8Array(parseInt(outputSize));
				return true;
			} else {
				return false;
			}
		};

		this.setReturnNewBuffers = function(b) {
			this.returnNewBuffers = !!b;
		};

		this.applyConfig = function(cfg) {
			if(cfg !== undefined) {
				if(cfg.outputSize !== undefined) {
					instance.setOutputSize(cfg.outputSize);
				}
				if(cfg.blockSize !== undefined) {
					instance.setBlockSize(cfg.blockSize);
				}
			}
		};

		this.ctzl = function(v) {
			// this might be needed for _compressCore (it isn't in my current test files)
	        /*
	         * https://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightBinSearch
	         * Matt Whitlock suggested this on January 25, 2006. Andrew Shapira shaved a couple operations off on Sept. 5, 2007 (by setting c=1 and unconditionally subtracting at the end).
	         */

	        var c;     // c will be the number of zero bits on the right,
	        // so if v is 1101000 (base 2), then c will be 3
	        // NOTE: if 0 == v, then c = 31.
	        if (v & 0x1) {
	            // special case for odd v (assumed to happen half of the time)
	            c = 0;
	        } else {
	            c = 1;
	            if ((v & 0xffff) === 0) {
	                v >>= 16;
	                c += 16;
	            }
	            if ((v & 0xff) === 0) {
	                v >>= 8;
	                c += 8;
	            }
	            if ((v & 0xf) === 0) {
	                v >>= 4;
	                c += 4;
	            }
	            if ((v & 0x3) === 0) {
	                v >>= 2;
	                c += 2;
	            }
	            c -= v & 0x1;
	        }
	        return c;
	    };

	    // It might be faster to copy 4 bytes at a time, but
	    // the allocation seems to kill performance.
		// this._get4ByteAlignedBuf = function(buf) {
		// 	if(buf.length % 4 === 0) {
		// 		return new Uint32Array(buf.buffer);

		// 	} else {
		// 		var buf_4b = new Uint8Array(buf.length + (4 - buf.length % 4));
		// 		buf_4b.set(buf);
		// 		return new Uint32Array(buf_4b.buffer);
		// 	}
		// };

	    this.extendBuffer = function() {
	        var newBuffer = new Uint8Array(this.minNewSize + (this.blockSize - this.minNewSize % this.blockSize));
	        newBuffer.set(this.out);
	        this.out = newBuffer;
	        this.cbl = this.out.length;
	    };

	    this.match_next = function() {
	        // if (op_end - op < t) return OUTPUT_OVERRUN;
	        // if (this.ip_end - ip < t+3) return INPUT_OVERRUN;

	        this.minNewSize = this.op + 3;
	        if(this.minNewSize > this.cbl) {this.extendBuffer();}

	        this.out[this.op++] = this.buf[this.ip++];
	        if(this.t > 1) {
	            this.out[this.op++] = this.buf[this.ip++];
	            if(this.t > 2) {
	                this.out[this.op++] = this.buf[this.ip++];
	            }
	        }

	        this.t = this.buf[this.ip++];
	    };

	    this.match_done = function() {
	        this.t = this.buf[this.ip-2] & 3;
	        return this.t;
	    };

	    this.copy_match = function() {
	        this.t += 2;
	        this.minNewSize = this.op + this.t;
	        if(this.minNewSize > this.cbl) {this.extendBuffer();}

	        do {
	            this.out[this.op++] = this.out[this.m_pos++];
	        } while(--this.t > 0);
	    };

	    this.copy_from_buf = function() {
	    	this.minNewSize = this.op + this.t;
	        if(this.minNewSize > this.cbl) {this.extendBuffer();}

	        do {
	            this.out[this.op++] = this.buf[this.ip++];
	        } while (--this.t > 0);
	    };

	    this.match = function() {
	        for (;;) {
	            if (this.t >= 64) {
	                this.m_pos = (this.op - 1) - ((this.t >> 2) & 7) - (this.buf[this.ip++] << 3);
	                this.t = (this.t >> 5) - 1;

	                // if ( m_pos < out || m_pos >= op) return LOOKBEHIND_OVERRUN;
	                // if (op_end - op < t+3-1) return OUTPUT_OVERRUN;

	                this.copy_match();

	            } else if (this.t >= 32) {
	                this.t &= 31;
	                if (this.t === 0) {
	                    while (this.buf[this.ip] === 0) {
	                        this.t += 255;
	                        this.ip++;
	                        // if (t > -511) return OUTPUT_OVERRUN;
	                        // if (this.ip_end - ip < 1) return INPUT_OVERRUN;
	                    }
	                    this.t += 31 + this.buf[this.ip++];
	                    // if (this.ip_end - ip < 2) return INPUT_OVERRUN;
	                }

	                this.m_pos = (this.op - 1) - (this.buf[this.ip] >> 2) - (this.buf[this.ip + 1] << 6);
	                this.ip += 2;

    	            this.copy_match();

	            } else if (this.t >= 16) {
	                this.m_pos = this.op - ((this.t & 8) << 11);

	                this.t &= 7;
	                if (this.t === 0) {
	                    while (this.buf[this.ip] === 0) {
	                        this.t += 255;
	                        this.ip++;
	                        // if (t > -511) return OUTPUT_OVERRUN;
	                        // if (this.ip_end - ip < 1) return INPUT_OVERRUN;
	                    }
	                    this.t += 7 + this.buf[this.ip++];
	                    // if (this.ip_end - ip < 2) return INPUT_OVERRUN;
	                }

	                this.m_pos -= (this.buf[this.ip] >> 2) + (this.buf[this.ip + 1] << 6);
	                this.ip += 2;

	                if (this.m_pos === this.op) {
	                    this.state.outputBuffer = this.returnNewBuffers === true ?
	                    	new Uint8Array(this.out.subarray(0, this.op)) :
	                    	this.out.subarray(0, this.op);
	                    return this.EOF_FOUND;

	                } else {
	                	this.m_pos -= 0x4000;
			            this.copy_match();
	                }

	            } else {
	                this.m_pos = (this.op - 1) - (this.t >> 2) - (this.buf[this.ip++] << 2);

	                // if (m_pos < out || m_pos >= op) return LOOKBEHIND_OVERRUN;
	                // if (op_end - op < 2) return OUTPUT_OVERRUN;
	                this.minNewSize = this.op + 2;
	                if(this.minNewSize > this.cbl) {this.extendBuffer();}

	                this.out[this.op++] = this.out[this.m_pos++];
	                this.out[this.op++] = this.out[this.m_pos];
	            }

	            // if (m_pos < out || m_pos >= op) return LOOKBEHIND_OVERRUN;
	            // if (op_end - op < t+3-1) return OUTPUT_OVERRUN;

	            if(this.match_done() === 0) {
	                return this.OK;
	            }
	            this.match_next();
		    }
	    };

	    this.decompress = function(state) {
	        this.state = state;

	        this.buf = this.state.inputBuffer;
	        this.cbl = this.out.length;
	        this.ip_end = this.buf.length;
	        // this.op_end = this.out.length;

	        this.t = 0;
	        this.ip = 0;
	        this.op = 0;
	        this.m_pos = 0;

	        this.skipToFirstLiteralFun = false;

	        // if (this.ip_end - ip < 1) return INPUT_OVERRUN;
	        if (this.buf[this.ip] > 17) {
	            this.t = this.buf[this.ip++] - 17;
	            if (this.t < 4) {
	                this.match_next();
	                this.ret = this.match();
	                if(this.ret !== this.OK) {
	                    return this.ret === this.EOF_FOUND ? this.OK : this.ret;
	                }

	            } else {
	                // if (op_end - op < t) return OUTPUT_OVERRUN;
	                // if (this.ip_end - ip < t+3) return INPUT_OVERRUN;
	                this.copy_from_buf();
	                this.skipToFirstLiteralFun = true;
	            }
	        }

	        for (;;) {
	            if(!this.skipToFirstLiteralFun) {
	                // if (this.ip_end - ip < 3) return INPUT_OVERRUN;
	                this.t = this.buf[this.ip++];

	                if (this.t >= 16) {
	                    this.ret = this.match();
	                    if(this.ret !== this.OK) {
	                        return this.ret === this.EOF_FOUND ? this.OK : this.ret;
	                    }
	                    continue;

	                } else if (this.t === 0) {
	                    while (this.buf[this.ip] === 0) {
	                        this.t += 255;
	                        this.ip++;
	                        // if (t > 511) return INPUT_OVERRUN;
	                        // if (this.ip_end - ip < 1) return INPUT_OVERRUN;
	                    }
	                    this.t += 15 + this.buf[this.ip++];
	                }
	                // if (op_end - op < t+3) return OUTPUT_OVERRUN;
	                // if (this.ip_end - ip < t+6) return INPUT_OVERRUN;

	                this.t += 3;
	                this.copy_from_buf();
	            } else {
	                this.skipToFirstLiteralFun = false;
	            }

	            this.t = this.buf[this.ip++];
	            if (this.t < 16) {
	                this.m_pos = this.op - (1 + 0x0800);
	                this.m_pos -= this.t >> 2;
	                this.m_pos -= this.buf[this.ip++] << 2;

	                // if ( m_pos <  out || m_pos >= op) return LOOKBEHIND_OVERRUN;
	                // if (op_end - op < 3) return OUTPUT_OVERRUN;
	                this.minNewSize = this.op + 3;
	                if(this.minNewSize > this.cbl) {this.extendBuffer();}
	                this.out[this.op++] = this.out[this.m_pos++];
	                this.out[this.op++] = this.out[this.m_pos++];
	                this.out[this.op++] = this.out[this.m_pos];

	                if(this.match_done() === 0) {
	                    continue;
	                } else {
	                    this.match_next();
	                }
	            }

	            this.ret = this.match();
	            if(this.ret !== this.OK) {
	                return this.ret === this.EOF_FOUND ? this.OK : this.ret;
	            }
	        }

	        return this.OK;
	    };

	    this._compressCore = function() {
	        this.ip_start = this.ip;
	        this.ip_end = this.ip + this.ll - 20;
	        this.jj = this.ip;
	        this.ti = this.t;

	        this.ip += this.ti < 4 ? 4 - this.ti : 0;

	        this.ip += 1 + ((this.ip - this.jj) >> 5);

	        for (;;) {
	            if(this.ip >= this.ip_end) {
	                break;
	            }

	            // dv = this.buf[this.ip] | (this.buf[this.ip + 1] << 8) | (this.buf[this.ip + 2] << 16) | (this.buf[this.ip + 3] << 24);
	            // this.dindex = ((0x1824429d * dv) >> 18) & 16383;
	            // The above code doesn't work in JavaScript due to a lack of 64 bit bitwise operations
	            // Instead, use (optimised two's complement integer arithmetic)
	            // Optimization is based on us only needing the high 16 bits of the lower 32 bit integer.
	            this.dv_lo = this.buf[this.ip] | (this.buf[this.ip + 1] << 8);
	            this.dv_hi = this.buf[this.ip + 2] | (this.buf[this.ip + 3] << 8);
	            this.dindex = (((this.dv_lo * 0x429d) >>> 16) + (this.dv_hi * 0x429d) + (this.dv_lo  * 0x1824) & 0xFFFF) >>> 2;

	            this.m_pos = this.ip_start + this.dict[this.dindex];

	            this.dict[this.dindex] = this.ip - this.ip_start;
	            if ((this.dv_hi<<16) + this.dv_lo != (this.buf[this.m_pos] | (this.buf[this.m_pos + 1] << 8) | (this.buf[this.m_pos + 2] << 16) | (this.buf[this.m_pos + 3] << 24))) {
	                this.ip += 1 + ((this.ip - this.jj) >> 5);
	                continue;
	            }
	            this.jj -= this.ti;
	            this.ti = 0;
	            this.v = this.ip - this.jj;

	            if (this.v !== 0) {
	                if (this.v <= 3) {
	                    this.out[this.op - 2] |= this.v;
	                    do {
	                        this.out[this.op++] = this.buf[this.jj++];
	                    } while (--this.v > 0);

	                } else {
	                    if (this.v <= 18) {
	                        this.out[this.op++] = this.v - 3;

	                    } else {
	                        this.tt = this.v - 18;
	                        this.out[this.op++] = 0;
	                        while (this.tt > 255) {
	                            this.tt -= 255;
	                            this.out[this.op++] = 0;
	                        }
	                        this.out[this.op++] = this.tt;
	                    }

	                    do {
	                        this.out[this.op++] = this.buf[this.jj++];
	                    } while (--this.v > 0);
	                }
	            }

	            this.m_len = 4;

	            // var skipTo_this.m_len_done = false;
	            if (this.buf[this.ip + this.m_len] === this.buf[this.m_pos + this.m_len]) {
	                do {
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    this.m_len += 1; if(this.buf[this.ip + this.m_len] !==  this.buf[this.m_pos + this.m_len]) {break;}
	                    if(this.ip + this.m_len >= this.ip_end) {
	                        // skipTo_this.m_len_done = true;
	                        break;
	                    }
	                } while (this.buf[this.ip + this.m_len] ===  this.buf[this.m_pos + this.m_len]);
	            }

	            // if (!skipTo_this.m_len_done) {
	            //     var inc = this.ctzl(this.buf[this.ip + this.m_len] ^ this.buf[this.m_pos + this.m_len]) >> 3;
	            //     this.m_len += inc;
	            // }

	            this.m_off = this.ip - this.m_pos;
	            this.ip += this.m_len;
	            this.jj = this.ip;
	            if (this.m_len <= 8 && this.m_off <= 0x0800) {

	                this.m_off -= 1;

	                this.out[this.op++] = ((this.m_len - 1) << 5) | ((this.m_off & 7) << 2);
	                this.out[this.op++] = this.m_off >> 3;

	            } else if (this.m_off <= 0x4000) {
	                this.m_off -= 1;
	                if (this.m_len <= 33) {
	                    this.out[this.op++] = 32 | (this.m_len - 2);

	                } else {
	                    this.m_len -= 33;
	                    this.out[this.op++] = 32;
	                    while (this.m_len > 255) {
	                        this.m_len -= 255;
	                        this.out[this.op++] = 0;
	                    }
	                    this.out[this.op++] = this.m_len;
	                }
	                this.out[this.op++] = this.m_off << 2;
	                this.out[this.op++] = this.m_off >> 6;
	            } else {
	                this.m_off -= 0x4000;
	                if (this.m_len <= 9) {
	                    this.out[this.op++] = 16 | ((this.m_off >> 11) & 8) | (this.m_len - 2);

	                } else {
	                    this.m_len -= 9;
	                    this.out[this.op++] = 16 | ((this.m_off >> 11) & 8);

	                    while (this.m_len > 255) {
	                        this.m_len -= 255;
	                        this.out[this.op++] = 0;
	                    }
	                    this.out[this.op++] = this.m_len;
	                }
	                this.out[this.op++] = this.m_off << 2;
	                this.out[this.op++] = this.m_off >> 6;
	            }
	        }
	        this.t = this.ll - ((this.jj - this.ip_start) - this.ti);
	    };

	    this.compress = function (state) {
	        this.state = state;
	        this.ip = 0;
	        this.buf = this.state.inputBuffer;
	        this.maxSize = this.buf.length + Math.ceil(this.buf.length / 16) + 64 + 3;
	        if(this.maxSize > this.out.length) {
	        	this.out = new Uint8Array(this.maxSize);
	        }
	        // this.state.outputBuffer = new Uint8Array(this.buf.length + Math.ceil(this.buf.length / 16) + 64 + 3);
	        // this.out = this.state.outputBuffer;
	        this.op = 0;
	        this.l = this.buf.length;
	        this.t = 0;

	        while (this.l > 20) {
	            this.ll = (this.l <= 49152) ? this.l : 49152;
	            if ((this.t + this.ll) >> 5 <= 0) {
	                break;
	            }

	            this.dict.set(this.emptyDict);

	            this.prev_ip = this.ip;
	            this._compressCore();
	            this.ip = this.prev_ip + this.ll;
	            this.l -= this.ll;
	        }
	        this.t += this.l;

	        if (this.t > 0) {
	            this.ii = this.buf.length - this.t;

	            if (this.op === 0 && this.t <= 238) {
	                this.out[this.op++] = 17 + this.t;

	            } else if (this.t <= 3) {
	                this.out[this.op-2] |= this.t;

	            } else if (this.t <= 18) {
	                this.out[this.op++] = this.t - 3;

	            } else {
	                this.tt = this.t - 18;
	                this.out[this.op++] = 0;
	                while (this.tt > 255) {
	                    this.tt -= 255;
	                    this.out[this.op++] = 0;
	                }
	                this.out[this.op++] = this.tt;
	            }

	            do {
	                this.out[this.op++] = this.buf[this.ii++];
	            } while (--this.t > 0);
	        }

	        this.out[this.op++] = 17;
	        this.out[this.op++] = 0;
	        this.out[this.op++] = 0;

	        this.state.outputBuffer = this.returnNewBuffers === true ?
	        	new Uint8Array(this.out.subarray(0, this.op)) :
	        	this.out.subarray(0, this.op);
	        return this.OK;
	    }
	};

	var instance = new _lzo1x();

	return {
		setBlockSize: function(blockSize) {
			return instance.setBlockSize(blockSize);
		},

		setOutputEstimate: function(outputSize) {
			return instance.setOutputSize(outputSize);
		},

		setReturnNewBuffers: function(b) {
			instance.setReturnNewBuffers(b);
		},

		compress: function(state, cfg) {
			if(cfg !== undefined) {
				instance.applyConfig(cfg);
			}
			return instance.compress(state);
		},

		decompress: function(state, cfg) {
			if(cfg !== undefined) {
				instance.applyConfig(cfg);
			}
			return instance.decompress(state);
		}
	};
})();
