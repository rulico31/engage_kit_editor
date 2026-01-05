import Ct, { protocol as Cl, app as bl, net as rc, dialog as dr, BrowserWindow as nc, ipcMain as zr } from "electron";
import pt from "fs";
import ic from "constants";
import hr from "stream";
import Ji from "util";
import Pl from "assert";
import be from "path";
import $r from "child_process";
import Ol from "events";
import pr from "crypto";
import Il from "tty";
import kr from "os";
import Ut, { fileURLToPath as ac, pathToFileURL as oc } from "url";
import sc from "string_decoder";
import Dl from "zlib";
import lc from "http";
import * as Aa from "fs/promises";
var Ze = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, _t = {}, Xr = {}, Rr = {}, Ra;
function Ve() {
  return Ra || (Ra = 1, Rr.fromCallback = function(t) {
    return Object.defineProperty(function(...c) {
      if (typeof c[c.length - 1] == "function") t.apply(this, c);
      else
        return new Promise((h, u) => {
          c.push((f, l) => f != null ? u(f) : h(l)), t.apply(this, c);
        });
    }, "name", { value: t.name });
  }, Rr.fromPromise = function(t) {
    return Object.defineProperty(function(...c) {
      const h = c[c.length - 1];
      if (typeof h != "function") return t.apply(this, c);
      c.pop(), t.apply(this, c).then((u) => h(null, u), h);
    }, "name", { value: t.name });
  }), Rr;
}
var Kr, Ta;
function uc() {
  if (Ta) return Kr;
  Ta = 1;
  var t = ic, c = process.cwd, h = null, u = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return h || (h = c.call(process)), h;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var f = process.chdir;
    process.chdir = function(a) {
      h = null, f.call(process, a);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, f);
  }
  Kr = l;
  function l(a) {
    t.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && d(a), a.lutimes || i(a), a.chown = o(a.chown), a.fchown = o(a.fchown), a.lchown = o(a.lchown), a.chmod = s(a.chmod), a.fchmod = s(a.fchmod), a.lchmod = s(a.lchmod), a.chownSync = n(a.chownSync), a.fchownSync = n(a.fchownSync), a.lchownSync = n(a.lchownSync), a.chmodSync = r(a.chmodSync), a.fchmodSync = r(a.fchmodSync), a.lchmodSync = r(a.lchmodSync), a.stat = m(a.stat), a.fstat = m(a.fstat), a.lstat = m(a.lstat), a.statSync = v(a.statSync), a.fstatSync = v(a.fstatSync), a.lstatSync = v(a.lstatSync), a.chmod && !a.lchmod && (a.lchmod = function(p, S, T) {
      T && process.nextTick(T);
    }, a.lchmodSync = function() {
    }), a.chown && !a.lchown && (a.lchown = function(p, S, T, P) {
      P && process.nextTick(P);
    }, a.lchownSync = function() {
    }), u === "win32" && (a.rename = typeof a.rename != "function" ? a.rename : (function(p) {
      function S(T, P, O) {
        var M = Date.now(), C = 0;
        p(T, P, function _(A) {
          if (A && (A.code === "EACCES" || A.code === "EPERM" || A.code === "EBUSY") && Date.now() - M < 6e4) {
            setTimeout(function() {
              a.stat(P, function(E, k) {
                E && E.code === "ENOENT" ? p(T, P, _) : O(A);
              });
            }, C), C < 100 && (C += 10);
            return;
          }
          O && O(A);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(S, p), S;
    })(a.rename)), a.read = typeof a.read != "function" ? a.read : (function(p) {
      function S(T, P, O, M, C, _) {
        var A;
        if (_ && typeof _ == "function") {
          var E = 0;
          A = function(k, U, L) {
            if (k && k.code === "EAGAIN" && E < 10)
              return E++, p.call(a, T, P, O, M, C, A);
            _.apply(this, arguments);
          };
        }
        return p.call(a, T, P, O, M, C, A);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(S, p), S;
    })(a.read), a.readSync = typeof a.readSync != "function" ? a.readSync : /* @__PURE__ */ (function(p) {
      return function(S, T, P, O, M) {
        for (var C = 0; ; )
          try {
            return p.call(a, S, T, P, O, M);
          } catch (_) {
            if (_.code === "EAGAIN" && C < 10) {
              C++;
              continue;
            }
            throw _;
          }
      };
    })(a.readSync);
    function d(p) {
      p.lchmod = function(S, T, P) {
        p.open(
          S,
          t.O_WRONLY | t.O_SYMLINK,
          T,
          function(O, M) {
            if (O) {
              P && P(O);
              return;
            }
            p.fchmod(M, T, function(C) {
              p.close(M, function(_) {
                P && P(C || _);
              });
            });
          }
        );
      }, p.lchmodSync = function(S, T) {
        var P = p.openSync(S, t.O_WRONLY | t.O_SYMLINK, T), O = !0, M;
        try {
          M = p.fchmodSync(P, T), O = !1;
        } finally {
          if (O)
            try {
              p.closeSync(P);
            } catch {
            }
          else
            p.closeSync(P);
        }
        return M;
      };
    }
    function i(p) {
      t.hasOwnProperty("O_SYMLINK") && p.futimes ? (p.lutimes = function(S, T, P, O) {
        p.open(S, t.O_SYMLINK, function(M, C) {
          if (M) {
            O && O(M);
            return;
          }
          p.futimes(C, T, P, function(_) {
            p.close(C, function(A) {
              O && O(_ || A);
            });
          });
        });
      }, p.lutimesSync = function(S, T, P) {
        var O = p.openSync(S, t.O_SYMLINK), M, C = !0;
        try {
          M = p.futimesSync(O, T, P), C = !1;
        } finally {
          if (C)
            try {
              p.closeSync(O);
            } catch {
            }
          else
            p.closeSync(O);
        }
        return M;
      }) : p.futimes && (p.lutimes = function(S, T, P, O) {
        O && process.nextTick(O);
      }, p.lutimesSync = function() {
      });
    }
    function s(p) {
      return p && function(S, T, P) {
        return p.call(a, S, T, function(O) {
          y(O) && (O = null), P && P.apply(this, arguments);
        });
      };
    }
    function r(p) {
      return p && function(S, T) {
        try {
          return p.call(a, S, T);
        } catch (P) {
          if (!y(P)) throw P;
        }
      };
    }
    function o(p) {
      return p && function(S, T, P, O) {
        return p.call(a, S, T, P, function(M) {
          y(M) && (M = null), O && O.apply(this, arguments);
        });
      };
    }
    function n(p) {
      return p && function(S, T, P) {
        try {
          return p.call(a, S, T, P);
        } catch (O) {
          if (!y(O)) throw O;
        }
      };
    }
    function m(p) {
      return p && function(S, T, P) {
        typeof T == "function" && (P = T, T = null);
        function O(M, C) {
          C && (C.uid < 0 && (C.uid += 4294967296), C.gid < 0 && (C.gid += 4294967296)), P && P.apply(this, arguments);
        }
        return T ? p.call(a, S, T, O) : p.call(a, S, O);
      };
    }
    function v(p) {
      return p && function(S, T) {
        var P = T ? p.call(a, S, T) : p.call(a, S);
        return P && (P.uid < 0 && (P.uid += 4294967296), P.gid < 0 && (P.gid += 4294967296)), P;
      };
    }
    function y(p) {
      if (!p || p.code === "ENOSYS")
        return !0;
      var S = !process.getuid || process.getuid() !== 0;
      return !!(S && (p.code === "EINVAL" || p.code === "EPERM"));
    }
  }
  return Kr;
}
var Jr, Ca;
function cc() {
  if (Ca) return Jr;
  Ca = 1;
  var t = hr.Stream;
  Jr = c;
  function c(h) {
    return {
      ReadStream: u,
      WriteStream: f
    };
    function u(l, a) {
      if (!(this instanceof u)) return new u(l, a);
      t.call(this);
      var d = this;
      this.path = l, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, a = a || {};
      for (var i = Object.keys(a), s = 0, r = i.length; s < r; s++) {
        var o = i[s];
        this[o] = a[o];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          d._read();
        });
        return;
      }
      h.open(this.path, this.flags, this.mode, function(n, m) {
        if (n) {
          d.emit("error", n), d.readable = !1;
          return;
        }
        d.fd = m, d.emit("open", m), d._read();
      });
    }
    function f(l, a) {
      if (!(this instanceof f)) return new f(l, a);
      t.call(this), this.path = l, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, a = a || {};
      for (var d = Object.keys(a), i = 0, s = d.length; i < s; i++) {
        var r = d[i];
        this[r] = a[r];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = h.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return Jr;
}
var Qr, ba;
function fc() {
  if (ba) return Qr;
  ba = 1, Qr = c;
  var t = Object.getPrototypeOf || function(h) {
    return h.__proto__;
  };
  function c(h) {
    if (h === null || typeof h != "object")
      return h;
    if (h instanceof Object)
      var u = { __proto__: t(h) };
    else
      var u = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(h).forEach(function(f) {
      Object.defineProperty(u, f, Object.getOwnPropertyDescriptor(h, f));
    }), u;
  }
  return Qr;
}
var Tr, Pa;
function Ge() {
  if (Pa) return Tr;
  Pa = 1;
  var t = pt, c = uc(), h = cc(), u = fc(), f = Ji, l, a;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (l = Symbol.for("graceful-fs.queue"), a = Symbol.for("graceful-fs.previous")) : (l = "___graceful-fs.queue", a = "___graceful-fs.previous");
  function d() {
  }
  function i(p, S) {
    Object.defineProperty(p, l, {
      get: function() {
        return S;
      }
    });
  }
  var s = d;
  if (f.debuglog ? s = f.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (s = function() {
    var p = f.format.apply(f, arguments);
    p = "GFS4: " + p.split(/\n/).join(`
GFS4: `), console.error(p);
  }), !t[l]) {
    var r = Ze[l] || [];
    i(t, r), t.close = (function(p) {
      function S(T, P) {
        return p.call(t, T, function(O) {
          O || v(), typeof P == "function" && P.apply(this, arguments);
        });
      }
      return Object.defineProperty(S, a, {
        value: p
      }), S;
    })(t.close), t.closeSync = (function(p) {
      function S(T) {
        p.apply(t, arguments), v();
      }
      return Object.defineProperty(S, a, {
        value: p
      }), S;
    })(t.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      s(t[l]), Pl.equal(t[l].length, 0);
    });
  }
  Ze[l] || i(Ze, t[l]), Tr = o(u(t)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !t.__patched && (Tr = o(t), t.__patched = !0);
  function o(p) {
    c(p), p.gracefulify = o, p.createReadStream = de, p.createWriteStream = ce;
    var S = p.readFile;
    p.readFile = T;
    function T(J, ve, w) {
      return typeof ve == "function" && (w = ve, ve = null), g(J, ve, w);
      function g(H, N, ue, he) {
        return S(H, N, function(pe) {
          pe && (pe.code === "EMFILE" || pe.code === "ENFILE") ? n([g, [H, N, ue], pe, he || Date.now(), Date.now()]) : typeof ue == "function" && ue.apply(this, arguments);
        });
      }
    }
    var P = p.writeFile;
    p.writeFile = O;
    function O(J, ve, w, g) {
      return typeof w == "function" && (g = w, w = null), H(J, ve, w, g);
      function H(N, ue, he, pe, _e) {
        return P(N, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [N, ue, he, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var M = p.appendFile;
    M && (p.appendFile = C);
    function C(J, ve, w, g) {
      return typeof w == "function" && (g = w, w = null), H(J, ve, w, g);
      function H(N, ue, he, pe, _e) {
        return M(N, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [N, ue, he, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var _ = p.copyFile;
    _ && (p.copyFile = A);
    function A(J, ve, w, g) {
      return typeof w == "function" && (g = w, w = 0), H(J, ve, w, g);
      function H(N, ue, he, pe, _e) {
        return _(N, ue, he, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [N, ue, he, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var E = p.readdir;
    p.readdir = U;
    var k = /^v[0-5]\./;
    function U(J, ve, w) {
      typeof ve == "function" && (w = ve, ve = null);
      var g = k.test(process.version) ? function(ue, he, pe, _e) {
        return E(ue, H(
          ue,
          he,
          pe,
          _e
        ));
      } : function(ue, he, pe, _e) {
        return E(ue, he, H(
          ue,
          he,
          pe,
          _e
        ));
      };
      return g(J, ve, w);
      function H(N, ue, he, pe) {
        return function(_e, ye) {
          _e && (_e.code === "EMFILE" || _e.code === "ENFILE") ? n([
            g,
            [N, ue, he],
            _e,
            pe || Date.now(),
            Date.now()
          ]) : (ye && ye.sort && ye.sort(), typeof he == "function" && he.call(this, _e, ye));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var L = h(p);
      I = L.ReadStream, Y = L.WriteStream;
    }
    var q = p.ReadStream;
    q && (I.prototype = Object.create(q.prototype), I.prototype.open = Q);
    var D = p.WriteStream;
    D && (Y.prototype = Object.create(D.prototype), Y.prototype.open = ne), Object.defineProperty(p, "ReadStream", {
      get: function() {
        return I;
      },
      set: function(J) {
        I = J;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(p, "WriteStream", {
      get: function() {
        return Y;
      },
      set: function(J) {
        Y = J;
      },
      enumerable: !0,
      configurable: !0
    });
    var F = I;
    Object.defineProperty(p, "FileReadStream", {
      get: function() {
        return F;
      },
      set: function(J) {
        F = J;
      },
      enumerable: !0,
      configurable: !0
    });
    var j = Y;
    Object.defineProperty(p, "FileWriteStream", {
      get: function() {
        return j;
      },
      set: function(J) {
        j = J;
      },
      enumerable: !0,
      configurable: !0
    });
    function I(J, ve) {
      return this instanceof I ? (q.apply(this, arguments), this) : I.apply(Object.create(I.prototype), arguments);
    }
    function Q() {
      var J = this;
      Ee(J.path, J.flags, J.mode, function(ve, w) {
        ve ? (J.autoClose && J.destroy(), J.emit("error", ve)) : (J.fd = w, J.emit("open", w), J.read());
      });
    }
    function Y(J, ve) {
      return this instanceof Y ? (D.apply(this, arguments), this) : Y.apply(Object.create(Y.prototype), arguments);
    }
    function ne() {
      var J = this;
      Ee(J.path, J.flags, J.mode, function(ve, w) {
        ve ? (J.destroy(), J.emit("error", ve)) : (J.fd = w, J.emit("open", w));
      });
    }
    function de(J, ve) {
      return new p.ReadStream(J, ve);
    }
    function ce(J, ve) {
      return new p.WriteStream(J, ve);
    }
    var ge = p.open;
    p.open = Ee;
    function Ee(J, ve, w, g) {
      return typeof w == "function" && (g = w, w = null), H(J, ve, w, g);
      function H(N, ue, he, pe, _e) {
        return ge(N, ue, he, function(ye, je) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [N, ue, he, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    return p;
  }
  function n(p) {
    s("ENQUEUE", p[0].name, p[1]), t[l].push(p), y();
  }
  var m;
  function v() {
    for (var p = Date.now(), S = 0; S < t[l].length; ++S)
      t[l][S].length > 2 && (t[l][S][3] = p, t[l][S][4] = p);
    y();
  }
  function y() {
    if (clearTimeout(m), m = void 0, t[l].length !== 0) {
      var p = t[l].shift(), S = p[0], T = p[1], P = p[2], O = p[3], M = p[4];
      if (O === void 0)
        s("RETRY", S.name, T), S.apply(null, T);
      else if (Date.now() - O >= 6e4) {
        s("TIMEOUT", S.name, T);
        var C = T.pop();
        typeof C == "function" && C.call(null, P);
      } else {
        var _ = Date.now() - M, A = Math.max(M - O, 1), E = Math.min(A * 1.2, 100);
        _ >= E ? (s("RETRY", S.name, T), S.apply(null, T.concat([O]))) : t[l].push(p);
      }
      m === void 0 && (m = setTimeout(y, 0));
    }
  }
  return Tr;
}
var Oa;
function $t() {
  return Oa || (Oa = 1, (function(t) {
    const c = Ve().fromCallback, h = Ge(), u = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((f) => typeof h[f] == "function");
    Object.assign(t, h), u.forEach((f) => {
      t[f] = c(h[f]);
    }), t.exists = function(f, l) {
      return typeof l == "function" ? h.exists(f, l) : new Promise((a) => h.exists(f, a));
    }, t.read = function(f, l, a, d, i, s) {
      return typeof s == "function" ? h.read(f, l, a, d, i, s) : new Promise((r, o) => {
        h.read(f, l, a, d, i, (n, m, v) => {
          if (n) return o(n);
          r({ bytesRead: m, buffer: v });
        });
      });
    }, t.write = function(f, l, ...a) {
      return typeof a[a.length - 1] == "function" ? h.write(f, l, ...a) : new Promise((d, i) => {
        h.write(f, l, ...a, (s, r, o) => {
          if (s) return i(s);
          d({ bytesWritten: r, buffer: o });
        });
      });
    }, typeof h.writev == "function" && (t.writev = function(f, l, ...a) {
      return typeof a[a.length - 1] == "function" ? h.writev(f, l, ...a) : new Promise((d, i) => {
        h.writev(f, l, ...a, (s, r, o) => {
          if (s) return i(s);
          d({ bytesWritten: r, buffers: o });
        });
      });
    }), typeof h.realpath.native == "function" ? t.realpath.native = c(h.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(Xr)), Xr;
}
var Cr = {}, Zr = {}, Ia;
function dc() {
  if (Ia) return Zr;
  Ia = 1;
  const t = be;
  return Zr.checkPath = function(h) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(h.replace(t.parse(h).root, ""))) {
      const f = new Error(`Path contains invalid characters: ${h}`);
      throw f.code = "EINVAL", f;
    }
  }, Zr;
}
var Da;
function hc() {
  if (Da) return Cr;
  Da = 1;
  const t = /* @__PURE__ */ $t(), { checkPath: c } = /* @__PURE__ */ dc(), h = (u) => {
    const f = { mode: 511 };
    return typeof u == "number" ? u : { ...f, ...u }.mode;
  };
  return Cr.makeDir = async (u, f) => (c(u), t.mkdir(u, {
    mode: h(f),
    recursive: !0
  })), Cr.makeDirSync = (u, f) => (c(u), t.mkdirSync(u, {
    mode: h(f),
    recursive: !0
  })), Cr;
}
var en, Na;
function nt() {
  if (Na) return en;
  Na = 1;
  const t = Ve().fromPromise, { makeDir: c, makeDirSync: h } = /* @__PURE__ */ hc(), u = t(c);
  return en = {
    mkdirs: u,
    mkdirsSync: h,
    // alias
    mkdirp: u,
    mkdirpSync: h,
    ensureDir: u,
    ensureDirSync: h
  }, en;
}
var tn, Fa;
function bt() {
  if (Fa) return tn;
  Fa = 1;
  const t = Ve().fromPromise, c = /* @__PURE__ */ $t();
  function h(u) {
    return c.access(u).then(() => !0).catch(() => !1);
  }
  return tn = {
    pathExists: t(h),
    pathExistsSync: c.existsSync
  }, tn;
}
var rn, xa;
function Nl() {
  if (xa) return rn;
  xa = 1;
  const t = Ge();
  function c(u, f, l, a) {
    t.open(u, "r+", (d, i) => {
      if (d) return a(d);
      t.futimes(i, f, l, (s) => {
        t.close(i, (r) => {
          a && a(s || r);
        });
      });
    });
  }
  function h(u, f, l) {
    const a = t.openSync(u, "r+");
    return t.futimesSync(a, f, l), t.closeSync(a);
  }
  return rn = {
    utimesMillis: c,
    utimesMillisSync: h
  }, rn;
}
var nn, La;
function kt() {
  if (La) return nn;
  La = 1;
  const t = /* @__PURE__ */ $t(), c = be, h = Ji;
  function u(n, m, v) {
    const y = v.dereference ? (p) => t.stat(p, { bigint: !0 }) : (p) => t.lstat(p, { bigint: !0 });
    return Promise.all([
      y(n),
      y(m).catch((p) => {
        if (p.code === "ENOENT") return null;
        throw p;
      })
    ]).then(([p, S]) => ({ srcStat: p, destStat: S }));
  }
  function f(n, m, v) {
    let y;
    const p = v.dereference ? (T) => t.statSync(T, { bigint: !0 }) : (T) => t.lstatSync(T, { bigint: !0 }), S = p(n);
    try {
      y = p(m);
    } catch (T) {
      if (T.code === "ENOENT") return { srcStat: S, destStat: null };
      throw T;
    }
    return { srcStat: S, destStat: y };
  }
  function l(n, m, v, y, p) {
    h.callbackify(u)(n, m, y, (S, T) => {
      if (S) return p(S);
      const { srcStat: P, destStat: O } = T;
      if (O) {
        if (s(P, O)) {
          const M = c.basename(n), C = c.basename(m);
          return v === "move" && M !== C && M.toLowerCase() === C.toLowerCase() ? p(null, { srcStat: P, destStat: O, isChangingCase: !0 }) : p(new Error("Source and destination must not be the same."));
        }
        if (P.isDirectory() && !O.isDirectory())
          return p(new Error(`Cannot overwrite non-directory '${m}' with directory '${n}'.`));
        if (!P.isDirectory() && O.isDirectory())
          return p(new Error(`Cannot overwrite directory '${m}' with non-directory '${n}'.`));
      }
      return P.isDirectory() && r(n, m) ? p(new Error(o(n, m, v))) : p(null, { srcStat: P, destStat: O });
    });
  }
  function a(n, m, v, y) {
    const { srcStat: p, destStat: S } = f(n, m, y);
    if (S) {
      if (s(p, S)) {
        const T = c.basename(n), P = c.basename(m);
        if (v === "move" && T !== P && T.toLowerCase() === P.toLowerCase())
          return { srcStat: p, destStat: S, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (p.isDirectory() && !S.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${m}' with directory '${n}'.`);
      if (!p.isDirectory() && S.isDirectory())
        throw new Error(`Cannot overwrite directory '${m}' with non-directory '${n}'.`);
    }
    if (p.isDirectory() && r(n, m))
      throw new Error(o(n, m, v));
    return { srcStat: p, destStat: S };
  }
  function d(n, m, v, y, p) {
    const S = c.resolve(c.dirname(n)), T = c.resolve(c.dirname(v));
    if (T === S || T === c.parse(T).root) return p();
    t.stat(T, { bigint: !0 }, (P, O) => P ? P.code === "ENOENT" ? p() : p(P) : s(m, O) ? p(new Error(o(n, v, y))) : d(n, m, T, y, p));
  }
  function i(n, m, v, y) {
    const p = c.resolve(c.dirname(n)), S = c.resolve(c.dirname(v));
    if (S === p || S === c.parse(S).root) return;
    let T;
    try {
      T = t.statSync(S, { bigint: !0 });
    } catch (P) {
      if (P.code === "ENOENT") return;
      throw P;
    }
    if (s(m, T))
      throw new Error(o(n, v, y));
    return i(n, m, S, y);
  }
  function s(n, m) {
    return m.ino && m.dev && m.ino === n.ino && m.dev === n.dev;
  }
  function r(n, m) {
    const v = c.resolve(n).split(c.sep).filter((p) => p), y = c.resolve(m).split(c.sep).filter((p) => p);
    return v.reduce((p, S, T) => p && y[T] === S, !0);
  }
  function o(n, m, v) {
    return `Cannot ${v} '${n}' to a subdirectory of itself, '${m}'.`;
  }
  return nn = {
    checkPaths: l,
    checkPathsSync: a,
    checkParentPaths: d,
    checkParentPathsSync: i,
    isSrcSubdir: r,
    areIdentical: s
  }, nn;
}
var an, Ua;
function pc() {
  if (Ua) return an;
  Ua = 1;
  const t = Ge(), c = be, h = nt().mkdirs, u = bt().pathExists, f = Nl().utimesMillis, l = /* @__PURE__ */ kt();
  function a(U, L, q, D) {
    typeof q == "function" && !D ? (D = q, q = {}) : typeof q == "function" && (q = { filter: q }), D = D || function() {
    }, q = q || {}, q.clobber = "clobber" in q ? !!q.clobber : !0, q.overwrite = "overwrite" in q ? !!q.overwrite : q.clobber, q.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), l.checkPaths(U, L, "copy", q, (F, j) => {
      if (F) return D(F);
      const { srcStat: I, destStat: Q } = j;
      l.checkParentPaths(U, I, L, "copy", (Y) => Y ? D(Y) : q.filter ? i(d, Q, U, L, q, D) : d(Q, U, L, q, D));
    });
  }
  function d(U, L, q, D, F) {
    const j = c.dirname(q);
    u(j, (I, Q) => {
      if (I) return F(I);
      if (Q) return r(U, L, q, D, F);
      h(j, (Y) => Y ? F(Y) : r(U, L, q, D, F));
    });
  }
  function i(U, L, q, D, F, j) {
    Promise.resolve(F.filter(q, D)).then((I) => I ? U(L, q, D, F, j) : j(), (I) => j(I));
  }
  function s(U, L, q, D, F) {
    return D.filter ? i(r, U, L, q, D, F) : r(U, L, q, D, F);
  }
  function r(U, L, q, D, F) {
    (D.dereference ? t.stat : t.lstat)(L, (I, Q) => I ? F(I) : Q.isDirectory() ? O(Q, U, L, q, D, F) : Q.isFile() || Q.isCharacterDevice() || Q.isBlockDevice() ? o(Q, U, L, q, D, F) : Q.isSymbolicLink() ? E(U, L, q, D, F) : Q.isSocket() ? F(new Error(`Cannot copy a socket file: ${L}`)) : Q.isFIFO() ? F(new Error(`Cannot copy a FIFO pipe: ${L}`)) : F(new Error(`Unknown file: ${L}`)));
  }
  function o(U, L, q, D, F, j) {
    return L ? n(U, q, D, F, j) : m(U, q, D, F, j);
  }
  function n(U, L, q, D, F) {
    if (D.overwrite)
      t.unlink(q, (j) => j ? F(j) : m(U, L, q, D, F));
    else return D.errorOnExist ? F(new Error(`'${q}' already exists`)) : F();
  }
  function m(U, L, q, D, F) {
    t.copyFile(L, q, (j) => j ? F(j) : D.preserveTimestamps ? v(U.mode, L, q, F) : T(q, U.mode, F));
  }
  function v(U, L, q, D) {
    return y(U) ? p(q, U, (F) => F ? D(F) : S(U, L, q, D)) : S(U, L, q, D);
  }
  function y(U) {
    return (U & 128) === 0;
  }
  function p(U, L, q) {
    return T(U, L | 128, q);
  }
  function S(U, L, q, D) {
    P(L, q, (F) => F ? D(F) : T(q, U, D));
  }
  function T(U, L, q) {
    return t.chmod(U, L, q);
  }
  function P(U, L, q) {
    t.stat(U, (D, F) => D ? q(D) : f(L, F.atime, F.mtime, q));
  }
  function O(U, L, q, D, F, j) {
    return L ? C(q, D, F, j) : M(U.mode, q, D, F, j);
  }
  function M(U, L, q, D, F) {
    t.mkdir(q, (j) => {
      if (j) return F(j);
      C(L, q, D, (I) => I ? F(I) : T(q, U, F));
    });
  }
  function C(U, L, q, D) {
    t.readdir(U, (F, j) => F ? D(F) : _(j, U, L, q, D));
  }
  function _(U, L, q, D, F) {
    const j = U.pop();
    return j ? A(U, j, L, q, D, F) : F();
  }
  function A(U, L, q, D, F, j) {
    const I = c.join(q, L), Q = c.join(D, L);
    l.checkPaths(I, Q, "copy", F, (Y, ne) => {
      if (Y) return j(Y);
      const { destStat: de } = ne;
      s(de, I, Q, F, (ce) => ce ? j(ce) : _(U, q, D, F, j));
    });
  }
  function E(U, L, q, D, F) {
    t.readlink(L, (j, I) => {
      if (j) return F(j);
      if (D.dereference && (I = c.resolve(process.cwd(), I)), U)
        t.readlink(q, (Q, Y) => Q ? Q.code === "EINVAL" || Q.code === "UNKNOWN" ? t.symlink(I, q, F) : F(Q) : (D.dereference && (Y = c.resolve(process.cwd(), Y)), l.isSrcSubdir(I, Y) ? F(new Error(`Cannot copy '${I}' to a subdirectory of itself, '${Y}'.`)) : U.isDirectory() && l.isSrcSubdir(Y, I) ? F(new Error(`Cannot overwrite '${Y}' with '${I}'.`)) : k(I, q, F)));
      else
        return t.symlink(I, q, F);
    });
  }
  function k(U, L, q) {
    t.unlink(L, (D) => D ? q(D) : t.symlink(U, L, q));
  }
  return an = a, an;
}
var on, $a;
function mc() {
  if ($a) return on;
  $a = 1;
  const t = Ge(), c = be, h = nt().mkdirsSync, u = Nl().utimesMillisSync, f = /* @__PURE__ */ kt();
  function l(_, A, E) {
    typeof E == "function" && (E = { filter: E }), E = E || {}, E.clobber = "clobber" in E ? !!E.clobber : !0, E.overwrite = "overwrite" in E ? !!E.overwrite : E.clobber, E.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: k, destStat: U } = f.checkPathsSync(_, A, "copy", E);
    return f.checkParentPathsSync(_, k, A, "copy"), a(U, _, A, E);
  }
  function a(_, A, E, k) {
    if (k.filter && !k.filter(A, E)) return;
    const U = c.dirname(E);
    return t.existsSync(U) || h(U), i(_, A, E, k);
  }
  function d(_, A, E, k) {
    if (!(k.filter && !k.filter(A, E)))
      return i(_, A, E, k);
  }
  function i(_, A, E, k) {
    const L = (k.dereference ? t.statSync : t.lstatSync)(A);
    if (L.isDirectory()) return S(L, _, A, E, k);
    if (L.isFile() || L.isCharacterDevice() || L.isBlockDevice()) return s(L, _, A, E, k);
    if (L.isSymbolicLink()) return M(_, A, E, k);
    throw L.isSocket() ? new Error(`Cannot copy a socket file: ${A}`) : L.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${A}`) : new Error(`Unknown file: ${A}`);
  }
  function s(_, A, E, k, U) {
    return A ? r(_, E, k, U) : o(_, E, k, U);
  }
  function r(_, A, E, k) {
    if (k.overwrite)
      return t.unlinkSync(E), o(_, A, E, k);
    if (k.errorOnExist)
      throw new Error(`'${E}' already exists`);
  }
  function o(_, A, E, k) {
    return t.copyFileSync(A, E), k.preserveTimestamps && n(_.mode, A, E), y(E, _.mode);
  }
  function n(_, A, E) {
    return m(_) && v(E, _), p(A, E);
  }
  function m(_) {
    return (_ & 128) === 0;
  }
  function v(_, A) {
    return y(_, A | 128);
  }
  function y(_, A) {
    return t.chmodSync(_, A);
  }
  function p(_, A) {
    const E = t.statSync(_);
    return u(A, E.atime, E.mtime);
  }
  function S(_, A, E, k, U) {
    return A ? P(E, k, U) : T(_.mode, E, k, U);
  }
  function T(_, A, E, k) {
    return t.mkdirSync(E), P(A, E, k), y(E, _);
  }
  function P(_, A, E) {
    t.readdirSync(_).forEach((k) => O(k, _, A, E));
  }
  function O(_, A, E, k) {
    const U = c.join(A, _), L = c.join(E, _), { destStat: q } = f.checkPathsSync(U, L, "copy", k);
    return d(q, U, L, k);
  }
  function M(_, A, E, k) {
    let U = t.readlinkSync(A);
    if (k.dereference && (U = c.resolve(process.cwd(), U)), _) {
      let L;
      try {
        L = t.readlinkSync(E);
      } catch (q) {
        if (q.code === "EINVAL" || q.code === "UNKNOWN") return t.symlinkSync(U, E);
        throw q;
      }
      if (k.dereference && (L = c.resolve(process.cwd(), L)), f.isSrcSubdir(U, L))
        throw new Error(`Cannot copy '${U}' to a subdirectory of itself, '${L}'.`);
      if (t.statSync(E).isDirectory() && f.isSrcSubdir(L, U))
        throw new Error(`Cannot overwrite '${L}' with '${U}'.`);
      return C(U, E);
    } else
      return t.symlinkSync(U, E);
  }
  function C(_, A) {
    return t.unlinkSync(A), t.symlinkSync(_, A);
  }
  return on = l, on;
}
var sn, ka;
function Qi() {
  if (ka) return sn;
  ka = 1;
  const t = Ve().fromCallback;
  return sn = {
    copy: t(/* @__PURE__ */ pc()),
    copySync: /* @__PURE__ */ mc()
  }, sn;
}
var ln, qa;
function gc() {
  if (qa) return ln;
  qa = 1;
  const t = Ge(), c = be, h = Pl, u = process.platform === "win32";
  function f(v) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((p) => {
      v[p] = v[p] || t[p], p = p + "Sync", v[p] = v[p] || t[p];
    }), v.maxBusyTries = v.maxBusyTries || 3;
  }
  function l(v, y, p) {
    let S = 0;
    typeof y == "function" && (p = y, y = {}), h(v, "rimraf: missing path"), h.strictEqual(typeof v, "string", "rimraf: path should be a string"), h.strictEqual(typeof p, "function", "rimraf: callback function required"), h(y, "rimraf: invalid options argument provided"), h.strictEqual(typeof y, "object", "rimraf: options should be object"), f(y), a(v, y, function T(P) {
      if (P) {
        if ((P.code === "EBUSY" || P.code === "ENOTEMPTY" || P.code === "EPERM") && S < y.maxBusyTries) {
          S++;
          const O = S * 100;
          return setTimeout(() => a(v, y, T), O);
        }
        P.code === "ENOENT" && (P = null);
      }
      p(P);
    });
  }
  function a(v, y, p) {
    h(v), h(y), h(typeof p == "function"), y.lstat(v, (S, T) => {
      if (S && S.code === "ENOENT")
        return p(null);
      if (S && S.code === "EPERM" && u)
        return d(v, y, S, p);
      if (T && T.isDirectory())
        return s(v, y, S, p);
      y.unlink(v, (P) => {
        if (P) {
          if (P.code === "ENOENT")
            return p(null);
          if (P.code === "EPERM")
            return u ? d(v, y, P, p) : s(v, y, P, p);
          if (P.code === "EISDIR")
            return s(v, y, P, p);
        }
        return p(P);
      });
    });
  }
  function d(v, y, p, S) {
    h(v), h(y), h(typeof S == "function"), y.chmod(v, 438, (T) => {
      T ? S(T.code === "ENOENT" ? null : p) : y.stat(v, (P, O) => {
        P ? S(P.code === "ENOENT" ? null : p) : O.isDirectory() ? s(v, y, p, S) : y.unlink(v, S);
      });
    });
  }
  function i(v, y, p) {
    let S;
    h(v), h(y);
    try {
      y.chmodSync(v, 438);
    } catch (T) {
      if (T.code === "ENOENT")
        return;
      throw p;
    }
    try {
      S = y.statSync(v);
    } catch (T) {
      if (T.code === "ENOENT")
        return;
      throw p;
    }
    S.isDirectory() ? n(v, y, p) : y.unlinkSync(v);
  }
  function s(v, y, p, S) {
    h(v), h(y), h(typeof S == "function"), y.rmdir(v, (T) => {
      T && (T.code === "ENOTEMPTY" || T.code === "EEXIST" || T.code === "EPERM") ? r(v, y, S) : T && T.code === "ENOTDIR" ? S(p) : S(T);
    });
  }
  function r(v, y, p) {
    h(v), h(y), h(typeof p == "function"), y.readdir(v, (S, T) => {
      if (S) return p(S);
      let P = T.length, O;
      if (P === 0) return y.rmdir(v, p);
      T.forEach((M) => {
        l(c.join(v, M), y, (C) => {
          if (!O) {
            if (C) return p(O = C);
            --P === 0 && y.rmdir(v, p);
          }
        });
      });
    });
  }
  function o(v, y) {
    let p;
    y = y || {}, f(y), h(v, "rimraf: missing path"), h.strictEqual(typeof v, "string", "rimraf: path should be a string"), h(y, "rimraf: missing options"), h.strictEqual(typeof y, "object", "rimraf: options should be object");
    try {
      p = y.lstatSync(v);
    } catch (S) {
      if (S.code === "ENOENT")
        return;
      S.code === "EPERM" && u && i(v, y, S);
    }
    try {
      p && p.isDirectory() ? n(v, y, null) : y.unlinkSync(v);
    } catch (S) {
      if (S.code === "ENOENT")
        return;
      if (S.code === "EPERM")
        return u ? i(v, y, S) : n(v, y, S);
      if (S.code !== "EISDIR")
        throw S;
      n(v, y, S);
    }
  }
  function n(v, y, p) {
    h(v), h(y);
    try {
      y.rmdirSync(v);
    } catch (S) {
      if (S.code === "ENOTDIR")
        throw p;
      if (S.code === "ENOTEMPTY" || S.code === "EEXIST" || S.code === "EPERM")
        m(v, y);
      else if (S.code !== "ENOENT")
        throw S;
    }
  }
  function m(v, y) {
    if (h(v), h(y), y.readdirSync(v).forEach((p) => o(c.join(v, p), y)), u) {
      const p = Date.now();
      do
        try {
          return y.rmdirSync(v, y);
        } catch {
        }
      while (Date.now() - p < 500);
    } else
      return y.rmdirSync(v, y);
  }
  return ln = l, l.sync = o, ln;
}
var un, Ma;
function qr() {
  if (Ma) return un;
  Ma = 1;
  const t = Ge(), c = Ve().fromCallback, h = /* @__PURE__ */ gc();
  function u(l, a) {
    if (t.rm) return t.rm(l, { recursive: !0, force: !0 }, a);
    h(l, a);
  }
  function f(l) {
    if (t.rmSync) return t.rmSync(l, { recursive: !0, force: !0 });
    h.sync(l);
  }
  return un = {
    remove: c(u),
    removeSync: f
  }, un;
}
var cn, Ba;
function vc() {
  if (Ba) return cn;
  Ba = 1;
  const t = Ve().fromPromise, c = /* @__PURE__ */ $t(), h = be, u = /* @__PURE__ */ nt(), f = /* @__PURE__ */ qr(), l = t(async function(i) {
    let s;
    try {
      s = await c.readdir(i);
    } catch {
      return u.mkdirs(i);
    }
    return Promise.all(s.map((r) => f.remove(h.join(i, r))));
  });
  function a(d) {
    let i;
    try {
      i = c.readdirSync(d);
    } catch {
      return u.mkdirsSync(d);
    }
    i.forEach((s) => {
      s = h.join(d, s), f.removeSync(s);
    });
  }
  return cn = {
    emptyDirSync: a,
    emptydirSync: a,
    emptyDir: l,
    emptydir: l
  }, cn;
}
var fn, Ha;
function Ec() {
  if (Ha) return fn;
  Ha = 1;
  const t = Ve().fromCallback, c = be, h = Ge(), u = /* @__PURE__ */ nt();
  function f(a, d) {
    function i() {
      h.writeFile(a, "", (s) => {
        if (s) return d(s);
        d();
      });
    }
    h.stat(a, (s, r) => {
      if (!s && r.isFile()) return d();
      const o = c.dirname(a);
      h.stat(o, (n, m) => {
        if (n)
          return n.code === "ENOENT" ? u.mkdirs(o, (v) => {
            if (v) return d(v);
            i();
          }) : d(n);
        m.isDirectory() ? i() : h.readdir(o, (v) => {
          if (v) return d(v);
        });
      });
    });
  }
  function l(a) {
    let d;
    try {
      d = h.statSync(a);
    } catch {
    }
    if (d && d.isFile()) return;
    const i = c.dirname(a);
    try {
      h.statSync(i).isDirectory() || h.readdirSync(i);
    } catch (s) {
      if (s && s.code === "ENOENT") u.mkdirsSync(i);
      else throw s;
    }
    h.writeFileSync(a, "");
  }
  return fn = {
    createFile: t(f),
    createFileSync: l
  }, fn;
}
var dn, ja;
function yc() {
  if (ja) return dn;
  ja = 1;
  const t = Ve().fromCallback, c = be, h = Ge(), u = /* @__PURE__ */ nt(), f = bt().pathExists, { areIdentical: l } = /* @__PURE__ */ kt();
  function a(i, s, r) {
    function o(n, m) {
      h.link(n, m, (v) => {
        if (v) return r(v);
        r(null);
      });
    }
    h.lstat(s, (n, m) => {
      h.lstat(i, (v, y) => {
        if (v)
          return v.message = v.message.replace("lstat", "ensureLink"), r(v);
        if (m && l(y, m)) return r(null);
        const p = c.dirname(s);
        f(p, (S, T) => {
          if (S) return r(S);
          if (T) return o(i, s);
          u.mkdirs(p, (P) => {
            if (P) return r(P);
            o(i, s);
          });
        });
      });
    });
  }
  function d(i, s) {
    let r;
    try {
      r = h.lstatSync(s);
    } catch {
    }
    try {
      const m = h.lstatSync(i);
      if (r && l(m, r)) return;
    } catch (m) {
      throw m.message = m.message.replace("lstat", "ensureLink"), m;
    }
    const o = c.dirname(s);
    return h.existsSync(o) || u.mkdirsSync(o), h.linkSync(i, s);
  }
  return dn = {
    createLink: t(a),
    createLinkSync: d
  }, dn;
}
var hn, Ga;
function wc() {
  if (Ga) return hn;
  Ga = 1;
  const t = be, c = Ge(), h = bt().pathExists;
  function u(l, a, d) {
    if (t.isAbsolute(l))
      return c.lstat(l, (i) => i ? (i.message = i.message.replace("lstat", "ensureSymlink"), d(i)) : d(null, {
        toCwd: l,
        toDst: l
      }));
    {
      const i = t.dirname(a), s = t.join(i, l);
      return h(s, (r, o) => r ? d(r) : o ? d(null, {
        toCwd: s,
        toDst: l
      }) : c.lstat(l, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), d(n)) : d(null, {
        toCwd: l,
        toDst: t.relative(i, l)
      })));
    }
  }
  function f(l, a) {
    let d;
    if (t.isAbsolute(l)) {
      if (d = c.existsSync(l), !d) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: l,
        toDst: l
      };
    } else {
      const i = t.dirname(a), s = t.join(i, l);
      if (d = c.existsSync(s), d)
        return {
          toCwd: s,
          toDst: l
        };
      if (d = c.existsSync(l), !d) throw new Error("relative srcpath does not exist");
      return {
        toCwd: l,
        toDst: t.relative(i, l)
      };
    }
  }
  return hn = {
    symlinkPaths: u,
    symlinkPathsSync: f
  }, hn;
}
var pn, Wa;
function _c() {
  if (Wa) return pn;
  Wa = 1;
  const t = Ge();
  function c(u, f, l) {
    if (l = typeof f == "function" ? f : l, f = typeof f == "function" ? !1 : f, f) return l(null, f);
    t.lstat(u, (a, d) => {
      if (a) return l(null, "file");
      f = d && d.isDirectory() ? "dir" : "file", l(null, f);
    });
  }
  function h(u, f) {
    let l;
    if (f) return f;
    try {
      l = t.lstatSync(u);
    } catch {
      return "file";
    }
    return l && l.isDirectory() ? "dir" : "file";
  }
  return pn = {
    symlinkType: c,
    symlinkTypeSync: h
  }, pn;
}
var mn, Va;
function Sc() {
  if (Va) return mn;
  Va = 1;
  const t = Ve().fromCallback, c = be, h = /* @__PURE__ */ $t(), u = /* @__PURE__ */ nt(), f = u.mkdirs, l = u.mkdirsSync, a = /* @__PURE__ */ wc(), d = a.symlinkPaths, i = a.symlinkPathsSync, s = /* @__PURE__ */ _c(), r = s.symlinkType, o = s.symlinkTypeSync, n = bt().pathExists, { areIdentical: m } = /* @__PURE__ */ kt();
  function v(S, T, P, O) {
    O = typeof P == "function" ? P : O, P = typeof P == "function" ? !1 : P, h.lstat(T, (M, C) => {
      !M && C.isSymbolicLink() ? Promise.all([
        h.stat(S),
        h.stat(T)
      ]).then(([_, A]) => {
        if (m(_, A)) return O(null);
        y(S, T, P, O);
      }) : y(S, T, P, O);
    });
  }
  function y(S, T, P, O) {
    d(S, T, (M, C) => {
      if (M) return O(M);
      S = C.toDst, r(C.toCwd, P, (_, A) => {
        if (_) return O(_);
        const E = c.dirname(T);
        n(E, (k, U) => {
          if (k) return O(k);
          if (U) return h.symlink(S, T, A, O);
          f(E, (L) => {
            if (L) return O(L);
            h.symlink(S, T, A, O);
          });
        });
      });
    });
  }
  function p(S, T, P) {
    let O;
    try {
      O = h.lstatSync(T);
    } catch {
    }
    if (O && O.isSymbolicLink()) {
      const A = h.statSync(S), E = h.statSync(T);
      if (m(A, E)) return;
    }
    const M = i(S, T);
    S = M.toDst, P = o(M.toCwd, P);
    const C = c.dirname(T);
    return h.existsSync(C) || l(C), h.symlinkSync(S, T, P);
  }
  return mn = {
    createSymlink: t(v),
    createSymlinkSync: p
  }, mn;
}
var gn, Ya;
function Ac() {
  if (Ya) return gn;
  Ya = 1;
  const { createFile: t, createFileSync: c } = /* @__PURE__ */ Ec(), { createLink: h, createLinkSync: u } = /* @__PURE__ */ yc(), { createSymlink: f, createSymlinkSync: l } = /* @__PURE__ */ Sc();
  return gn = {
    // file
    createFile: t,
    createFileSync: c,
    ensureFile: t,
    ensureFileSync: c,
    // link
    createLink: h,
    createLinkSync: u,
    ensureLink: h,
    ensureLinkSync: u,
    // symlink
    createSymlink: f,
    createSymlinkSync: l,
    ensureSymlink: f,
    ensureSymlinkSync: l
  }, gn;
}
var vn, za;
function Zi() {
  if (za) return vn;
  za = 1;
  function t(h, { EOL: u = `
`, finalEOL: f = !0, replacer: l = null, spaces: a } = {}) {
    const d = f ? u : "";
    return JSON.stringify(h, l, a).replace(/\n/g, u) + d;
  }
  function c(h) {
    return Buffer.isBuffer(h) && (h = h.toString("utf8")), h.replace(/^\uFEFF/, "");
  }
  return vn = { stringify: t, stripBom: c }, vn;
}
var En, Xa;
function Rc() {
  if (Xa) return En;
  Xa = 1;
  let t;
  try {
    t = Ge();
  } catch {
    t = pt;
  }
  const c = Ve(), { stringify: h, stripBom: u } = Zi();
  async function f(r, o = {}) {
    typeof o == "string" && (o = { encoding: o });
    const n = o.fs || t, m = "throws" in o ? o.throws : !0;
    let v = await c.fromCallback(n.readFile)(r, o);
    v = u(v);
    let y;
    try {
      y = JSON.parse(v, o ? o.reviver : null);
    } catch (p) {
      if (m)
        throw p.message = `${r}: ${p.message}`, p;
      return null;
    }
    return y;
  }
  const l = c.fromPromise(f);
  function a(r, o = {}) {
    typeof o == "string" && (o = { encoding: o });
    const n = o.fs || t, m = "throws" in o ? o.throws : !0;
    try {
      let v = n.readFileSync(r, o);
      return v = u(v), JSON.parse(v, o.reviver);
    } catch (v) {
      if (m)
        throw v.message = `${r}: ${v.message}`, v;
      return null;
    }
  }
  async function d(r, o, n = {}) {
    const m = n.fs || t, v = h(o, n);
    await c.fromCallback(m.writeFile)(r, v, n);
  }
  const i = c.fromPromise(d);
  function s(r, o, n = {}) {
    const m = n.fs || t, v = h(o, n);
    return m.writeFileSync(r, v, n);
  }
  return En = {
    readFile: l,
    readFileSync: a,
    writeFile: i,
    writeFileSync: s
  }, En;
}
var yn, Ka;
function Tc() {
  if (Ka) return yn;
  Ka = 1;
  const t = Rc();
  return yn = {
    // jsonfile exports
    readJson: t.readFile,
    readJsonSync: t.readFileSync,
    writeJson: t.writeFile,
    writeJsonSync: t.writeFileSync
  }, yn;
}
var wn, Ja;
function ea() {
  if (Ja) return wn;
  Ja = 1;
  const t = Ve().fromCallback, c = Ge(), h = be, u = /* @__PURE__ */ nt(), f = bt().pathExists;
  function l(d, i, s, r) {
    typeof s == "function" && (r = s, s = "utf8");
    const o = h.dirname(d);
    f(o, (n, m) => {
      if (n) return r(n);
      if (m) return c.writeFile(d, i, s, r);
      u.mkdirs(o, (v) => {
        if (v) return r(v);
        c.writeFile(d, i, s, r);
      });
    });
  }
  function a(d, ...i) {
    const s = h.dirname(d);
    if (c.existsSync(s))
      return c.writeFileSync(d, ...i);
    u.mkdirsSync(s), c.writeFileSync(d, ...i);
  }
  return wn = {
    outputFile: t(l),
    outputFileSync: a
  }, wn;
}
var _n, Qa;
function Cc() {
  if (Qa) return _n;
  Qa = 1;
  const { stringify: t } = Zi(), { outputFile: c } = /* @__PURE__ */ ea();
  async function h(u, f, l = {}) {
    const a = t(f, l);
    await c(u, a, l);
  }
  return _n = h, _n;
}
var Sn, Za;
function bc() {
  if (Za) return Sn;
  Za = 1;
  const { stringify: t } = Zi(), { outputFileSync: c } = /* @__PURE__ */ ea();
  function h(u, f, l) {
    const a = t(f, l);
    c(u, a, l);
  }
  return Sn = h, Sn;
}
var An, eo;
function Pc() {
  if (eo) return An;
  eo = 1;
  const t = Ve().fromPromise, c = /* @__PURE__ */ Tc();
  return c.outputJson = t(/* @__PURE__ */ Cc()), c.outputJsonSync = /* @__PURE__ */ bc(), c.outputJSON = c.outputJson, c.outputJSONSync = c.outputJsonSync, c.writeJSON = c.writeJson, c.writeJSONSync = c.writeJsonSync, c.readJSON = c.readJson, c.readJSONSync = c.readJsonSync, An = c, An;
}
var Rn, to;
function Oc() {
  if (to) return Rn;
  to = 1;
  const t = Ge(), c = be, h = Qi().copy, u = qr().remove, f = nt().mkdirp, l = bt().pathExists, a = /* @__PURE__ */ kt();
  function d(n, m, v, y) {
    typeof v == "function" && (y = v, v = {}), v = v || {};
    const p = v.overwrite || v.clobber || !1;
    a.checkPaths(n, m, "move", v, (S, T) => {
      if (S) return y(S);
      const { srcStat: P, isChangingCase: O = !1 } = T;
      a.checkParentPaths(n, P, m, "move", (M) => {
        if (M) return y(M);
        if (i(m)) return s(n, m, p, O, y);
        f(c.dirname(m), (C) => C ? y(C) : s(n, m, p, O, y));
      });
    });
  }
  function i(n) {
    const m = c.dirname(n);
    return c.parse(m).root === m;
  }
  function s(n, m, v, y, p) {
    if (y) return r(n, m, v, p);
    if (v)
      return u(m, (S) => S ? p(S) : r(n, m, v, p));
    l(m, (S, T) => S ? p(S) : T ? p(new Error("dest already exists.")) : r(n, m, v, p));
  }
  function r(n, m, v, y) {
    t.rename(n, m, (p) => p ? p.code !== "EXDEV" ? y(p) : o(n, m, v, y) : y());
  }
  function o(n, m, v, y) {
    h(n, m, {
      overwrite: v,
      errorOnExist: !0
    }, (S) => S ? y(S) : u(n, y));
  }
  return Rn = d, Rn;
}
var Tn, ro;
function Ic() {
  if (ro) return Tn;
  ro = 1;
  const t = Ge(), c = be, h = Qi().copySync, u = qr().removeSync, f = nt().mkdirpSync, l = /* @__PURE__ */ kt();
  function a(o, n, m) {
    m = m || {};
    const v = m.overwrite || m.clobber || !1, { srcStat: y, isChangingCase: p = !1 } = l.checkPathsSync(o, n, "move", m);
    return l.checkParentPathsSync(o, y, n, "move"), d(n) || f(c.dirname(n)), i(o, n, v, p);
  }
  function d(o) {
    const n = c.dirname(o);
    return c.parse(n).root === n;
  }
  function i(o, n, m, v) {
    if (v) return s(o, n, m);
    if (m)
      return u(n), s(o, n, m);
    if (t.existsSync(n)) throw new Error("dest already exists.");
    return s(o, n, m);
  }
  function s(o, n, m) {
    try {
      t.renameSync(o, n);
    } catch (v) {
      if (v.code !== "EXDEV") throw v;
      return r(o, n, m);
    }
  }
  function r(o, n, m) {
    return h(o, n, {
      overwrite: m,
      errorOnExist: !0
    }), u(o);
  }
  return Tn = a, Tn;
}
var Cn, no;
function Dc() {
  if (no) return Cn;
  no = 1;
  const t = Ve().fromCallback;
  return Cn = {
    move: t(/* @__PURE__ */ Oc()),
    moveSync: /* @__PURE__ */ Ic()
  }, Cn;
}
var bn, io;
function mt() {
  return io || (io = 1, bn = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ $t(),
    // Export extra methods:
    .../* @__PURE__ */ Qi(),
    .../* @__PURE__ */ vc(),
    .../* @__PURE__ */ Ac(),
    .../* @__PURE__ */ Pc(),
    .../* @__PURE__ */ nt(),
    .../* @__PURE__ */ Dc(),
    .../* @__PURE__ */ ea(),
    .../* @__PURE__ */ bt(),
    .../* @__PURE__ */ qr()
  }), bn;
}
var jt = {}, St = {}, Pn = {}, At = {}, ao;
function ta() {
  if (ao) return At;
  ao = 1, Object.defineProperty(At, "__esModule", { value: !0 }), At.CancellationError = At.CancellationToken = void 0;
  const t = Ol;
  let c = class extends t.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(f) {
      this.removeParentCancelHandler(), this._parent = f, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(f) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, f != null && (this.parent = f);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(f) {
      this.cancelled ? f() : this.once("cancel", f);
    }
    createPromise(f) {
      if (this.cancelled)
        return Promise.reject(new h());
      const l = () => {
        if (a != null)
          try {
            this.removeListener("cancel", a), a = null;
          } catch {
          }
      };
      let a = null;
      return new Promise((d, i) => {
        let s = null;
        if (a = () => {
          try {
            s != null && (s(), s = null);
          } finally {
            i(new h());
          }
        }, this.cancelled) {
          a();
          return;
        }
        this.onCancel(a), f(d, i, (r) => {
          s = r;
        });
      }).then((d) => (l(), d)).catch((d) => {
        throw l(), d;
      });
    }
    removeParentCancelHandler() {
      const f = this._parent;
      f != null && this.parentCancelHandler != null && (f.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  At.CancellationToken = c;
  class h extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return At.CancellationError = h, At;
}
var br = {}, oo;
function Mr() {
  if (oo) return br;
  oo = 1, Object.defineProperty(br, "__esModule", { value: !0 }), br.newError = t;
  function t(c, h) {
    const u = new Error(c);
    return u.code = h, u;
  }
  return br;
}
var $e = {}, Pr = { exports: {} }, Or = { exports: {} }, On, so;
function Nc() {
  if (so) return On;
  so = 1;
  var t = 1e3, c = t * 60, h = c * 60, u = h * 24, f = u * 7, l = u * 365.25;
  On = function(r, o) {
    o = o || {};
    var n = typeof r;
    if (n === "string" && r.length > 0)
      return a(r);
    if (n === "number" && isFinite(r))
      return o.long ? i(r) : d(r);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(r)
    );
  };
  function a(r) {
    if (r = String(r), !(r.length > 100)) {
      var o = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        r
      );
      if (o) {
        var n = parseFloat(o[1]), m = (o[2] || "ms").toLowerCase();
        switch (m) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * l;
          case "weeks":
          case "week":
          case "w":
            return n * f;
          case "days":
          case "day":
          case "d":
            return n * u;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * c;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return;
        }
      }
    }
  }
  function d(r) {
    var o = Math.abs(r);
    return o >= u ? Math.round(r / u) + "d" : o >= h ? Math.round(r / h) + "h" : o >= c ? Math.round(r / c) + "m" : o >= t ? Math.round(r / t) + "s" : r + "ms";
  }
  function i(r) {
    var o = Math.abs(r);
    return o >= u ? s(r, o, u, "day") : o >= h ? s(r, o, h, "hour") : o >= c ? s(r, o, c, "minute") : o >= t ? s(r, o, t, "second") : r + " ms";
  }
  function s(r, o, n, m) {
    var v = o >= n * 1.5;
    return Math.round(r / n) + " " + m + (v ? "s" : "");
  }
  return On;
}
var In, lo;
function Fl() {
  if (lo) return In;
  lo = 1;
  function t(c) {
    u.debug = u, u.default = u, u.coerce = s, u.disable = d, u.enable = l, u.enabled = i, u.humanize = Nc(), u.destroy = r, Object.keys(c).forEach((o) => {
      u[o] = c[o];
    }), u.names = [], u.skips = [], u.formatters = {};
    function h(o) {
      let n = 0;
      for (let m = 0; m < o.length; m++)
        n = (n << 5) - n + o.charCodeAt(m), n |= 0;
      return u.colors[Math.abs(n) % u.colors.length];
    }
    u.selectColor = h;
    function u(o) {
      let n, m = null, v, y;
      function p(...S) {
        if (!p.enabled)
          return;
        const T = p, P = Number(/* @__PURE__ */ new Date()), O = P - (n || P);
        T.diff = O, T.prev = n, T.curr = P, n = P, S[0] = u.coerce(S[0]), typeof S[0] != "string" && S.unshift("%O");
        let M = 0;
        S[0] = S[0].replace(/%([a-zA-Z%])/g, (_, A) => {
          if (_ === "%%")
            return "%";
          M++;
          const E = u.formatters[A];
          if (typeof E == "function") {
            const k = S[M];
            _ = E.call(T, k), S.splice(M, 1), M--;
          }
          return _;
        }), u.formatArgs.call(T, S), (T.log || u.log).apply(T, S);
      }
      return p.namespace = o, p.useColors = u.useColors(), p.color = u.selectColor(o), p.extend = f, p.destroy = u.destroy, Object.defineProperty(p, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (v !== u.namespaces && (v = u.namespaces, y = u.enabled(o)), y),
        set: (S) => {
          m = S;
        }
      }), typeof u.init == "function" && u.init(p), p;
    }
    function f(o, n) {
      const m = u(this.namespace + (typeof n > "u" ? ":" : n) + o);
      return m.log = this.log, m;
    }
    function l(o) {
      u.save(o), u.namespaces = o, u.names = [], u.skips = [];
      const n = (typeof o == "string" ? o : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of n)
        m[0] === "-" ? u.skips.push(m.slice(1)) : u.names.push(m);
    }
    function a(o, n) {
      let m = 0, v = 0, y = -1, p = 0;
      for (; m < o.length; )
        if (v < n.length && (n[v] === o[m] || n[v] === "*"))
          n[v] === "*" ? (y = v, p = m, v++) : (m++, v++);
        else if (y !== -1)
          v = y + 1, p++, m = p;
        else
          return !1;
      for (; v < n.length && n[v] === "*"; )
        v++;
      return v === n.length;
    }
    function d() {
      const o = [
        ...u.names,
        ...u.skips.map((n) => "-" + n)
      ].join(",");
      return u.enable(""), o;
    }
    function i(o) {
      for (const n of u.skips)
        if (a(o, n))
          return !1;
      for (const n of u.names)
        if (a(o, n))
          return !0;
      return !1;
    }
    function s(o) {
      return o instanceof Error ? o.stack || o.message : o;
    }
    function r() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return u.enable(u.load()), u;
  }
  return In = t, In;
}
var uo;
function Fc() {
  return uo || (uo = 1, (function(t, c) {
    c.formatArgs = u, c.save = f, c.load = l, c.useColors = h, c.storage = a(), c.destroy = /* @__PURE__ */ (() => {
      let i = !1;
      return () => {
        i || (i = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), c.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function h() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let i;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (i = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(i[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function u(i) {
      if (i[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + i[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const s = "color: " + this.color;
      i.splice(1, 0, s, "color: inherit");
      let r = 0, o = 0;
      i[0].replace(/%[a-zA-Z%]/g, (n) => {
        n !== "%%" && (r++, n === "%c" && (o = r));
      }), i.splice(o, 0, s);
    }
    c.log = console.debug || console.log || (() => {
    });
    function f(i) {
      try {
        i ? c.storage.setItem("debug", i) : c.storage.removeItem("debug");
      } catch {
      }
    }
    function l() {
      let i;
      try {
        i = c.storage.getItem("debug") || c.storage.getItem("DEBUG");
      } catch {
      }
      return !i && typeof process < "u" && "env" in process && (i = process.env.DEBUG), i;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = Fl()(c);
    const { formatters: d } = t.exports;
    d.j = function(i) {
      try {
        return JSON.stringify(i);
      } catch (s) {
        return "[UnexpectedJSONParseError]: " + s.message;
      }
    };
  })(Or, Or.exports)), Or.exports;
}
var Ir = { exports: {} }, Dn, co;
function xc() {
  return co || (co = 1, Dn = (t, c = process.argv) => {
    const h = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", u = c.indexOf(h + t), f = c.indexOf("--");
    return u !== -1 && (f === -1 || u < f);
  }), Dn;
}
var Nn, fo;
function Lc() {
  if (fo) return Nn;
  fo = 1;
  const t = kr, c = Il, h = xc(), { env: u } = process;
  let f;
  h("no-color") || h("no-colors") || h("color=false") || h("color=never") ? f = 0 : (h("color") || h("colors") || h("color=true") || h("color=always")) && (f = 1), "FORCE_COLOR" in u && (u.FORCE_COLOR === "true" ? f = 1 : u.FORCE_COLOR === "false" ? f = 0 : f = u.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(u.FORCE_COLOR, 10), 3));
  function l(i) {
    return i === 0 ? !1 : {
      level: i,
      hasBasic: !0,
      has256: i >= 2,
      has16m: i >= 3
    };
  }
  function a(i, s) {
    if (f === 0)
      return 0;
    if (h("color=16m") || h("color=full") || h("color=truecolor"))
      return 3;
    if (h("color=256"))
      return 2;
    if (i && !s && f === void 0)
      return 0;
    const r = f || 0;
    if (u.TERM === "dumb")
      return r;
    if (process.platform === "win32") {
      const o = t.release().split(".");
      return Number(o[0]) >= 10 && Number(o[2]) >= 10586 ? Number(o[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in u)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((o) => o in u) || u.CI_NAME === "codeship" ? 1 : r;
    if ("TEAMCITY_VERSION" in u)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(u.TEAMCITY_VERSION) ? 1 : 0;
    if (u.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in u) {
      const o = parseInt((u.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (u.TERM_PROGRAM) {
        case "iTerm.app":
          return o >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(u.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(u.TERM) || "COLORTERM" in u ? 1 : r;
  }
  function d(i) {
    const s = a(i, i && i.isTTY);
    return l(s);
  }
  return Nn = {
    supportsColor: d,
    stdout: l(a(!0, c.isatty(1))),
    stderr: l(a(!0, c.isatty(2)))
  }, Nn;
}
var ho;
function Uc() {
  return ho || (ho = 1, (function(t, c) {
    const h = Il, u = Ji;
    c.init = r, c.log = d, c.formatArgs = l, c.save = i, c.load = s, c.useColors = f, c.destroy = u.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), c.colors = [6, 2, 3, 4, 5, 1];
    try {
      const n = Lc();
      n && (n.stderr || n).level >= 2 && (c.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    c.inspectOpts = Object.keys(process.env).filter((n) => /^debug_/i.test(n)).reduce((n, m) => {
      const v = m.substring(6).toLowerCase().replace(/_([a-z])/g, (p, S) => S.toUpperCase());
      let y = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), n[v] = y, n;
    }, {});
    function f() {
      return "colors" in c.inspectOpts ? !!c.inspectOpts.colors : h.isatty(process.stderr.fd);
    }
    function l(n) {
      const { namespace: m, useColors: v } = this;
      if (v) {
        const y = this.color, p = "\x1B[3" + (y < 8 ? y : "8;5;" + y), S = `  ${p};1m${m} \x1B[0m`;
        n[0] = S + n[0].split(`
`).join(`
` + S), n.push(p + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        n[0] = a() + m + " " + n[0];
    }
    function a() {
      return c.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function d(...n) {
      return process.stderr.write(u.formatWithOptions(c.inspectOpts, ...n) + `
`);
    }
    function i(n) {
      n ? process.env.DEBUG = n : delete process.env.DEBUG;
    }
    function s() {
      return process.env.DEBUG;
    }
    function r(n) {
      n.inspectOpts = {};
      const m = Object.keys(c.inspectOpts);
      for (let v = 0; v < m.length; v++)
        n.inspectOpts[m[v]] = c.inspectOpts[m[v]];
    }
    t.exports = Fl()(c);
    const { formatters: o } = t.exports;
    o.o = function(n) {
      return this.inspectOpts.colors = this.useColors, u.inspect(n, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, o.O = function(n) {
      return this.inspectOpts.colors = this.useColors, u.inspect(n, this.inspectOpts);
    };
  })(Ir, Ir.exports)), Ir.exports;
}
var po;
function $c() {
  return po || (po = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Pr.exports = Fc() : Pr.exports = Uc()), Pr.exports;
}
var Gt = {}, mo;
function xl() {
  if (mo) return Gt;
  mo = 1, Object.defineProperty(Gt, "__esModule", { value: !0 }), Gt.ProgressCallbackTransform = void 0;
  const t = hr;
  let c = class extends t.Transform {
    constructor(u, f, l) {
      super(), this.total = u, this.cancellationToken = f, this.onProgress = l, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(u, f, l) {
      if (this.cancellationToken.cancelled) {
        l(new Error("cancelled"), null);
        return;
      }
      this.transferred += u.length, this.delta += u.length;
      const a = Date.now();
      a >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = a + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((a - this.start) / 1e3))
      }), this.delta = 0), l(null, u);
    }
    _flush(u) {
      if (this.cancellationToken.cancelled) {
        u(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, u(null);
    }
  };
  return Gt.ProgressCallbackTransform = c, Gt;
}
var go;
function kc() {
  if (go) return $e;
  go = 1, Object.defineProperty($e, "__esModule", { value: !0 }), $e.DigestTransform = $e.HttpExecutor = $e.HttpError = void 0, $e.createHttpError = s, $e.parseJson = n, $e.configureRequestOptionsFromUrl = v, $e.configureRequestUrl = y, $e.safeGetHeader = T, $e.configureRequestOptions = O, $e.safeStringifyJson = M;
  const t = pr, c = $c(), h = pt, u = hr, f = Ut, l = ta(), a = Mr(), d = xl(), i = (0, c.default)("electron-builder");
  function s(C, _ = null) {
    return new o(C.statusCode || -1, `${C.statusCode} ${C.statusMessage}` + (_ == null ? "" : `
` + JSON.stringify(_, null, "  ")) + `
Headers: ` + M(C.headers), _);
  }
  const r = /* @__PURE__ */ new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"]
  ]);
  class o extends Error {
    constructor(_, A = `HTTP error: ${r.get(_) || _}`, E = null) {
      super(A), this.statusCode = _, this.description = E, this.name = "HttpError", this.code = `HTTP_ERROR_${_}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  $e.HttpError = o;
  function n(C) {
    return C.then((_) => _ == null || _.length === 0 ? null : JSON.parse(_));
  }
  class m {
    constructor() {
      this.maxRedirects = 10;
    }
    request(_, A = new l.CancellationToken(), E) {
      O(_);
      const k = E == null ? void 0 : JSON.stringify(E), U = k ? Buffer.from(k) : void 0;
      if (U != null) {
        i(k);
        const { headers: L, ...q } = _;
        _ = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": U.length,
            ...L
          },
          ...q
        };
      }
      return this.doApiRequest(_, A, (L) => L.end(U));
    }
    doApiRequest(_, A, E, k = 0) {
      return i.enabled && i(`Request: ${M(_)}`), A.createPromise((U, L, q) => {
        const D = this.createRequest(_, (F) => {
          try {
            this.handleResponse(F, _, A, U, L, k, E);
          } catch (j) {
            L(j);
          }
        });
        this.addErrorAndTimeoutHandlers(D, L, _.timeout), this.addRedirectHandlers(D, _, L, k, (F) => {
          this.doApiRequest(F, A, E, k).then(U).catch(L);
        }), E(D, L), q(() => D.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(_, A, E, k, U) {
    }
    addErrorAndTimeoutHandlers(_, A, E = 60 * 1e3) {
      this.addTimeOutHandler(_, A, E), _.on("error", A), _.on("aborted", () => {
        A(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(_, A, E, k, U, L, q) {
      var D;
      if (i.enabled && i(`Response: ${_.statusCode} ${_.statusMessage}, request options: ${M(A)}`), _.statusCode === 404) {
        U(s(_, `method: ${A.method || "GET"} url: ${A.protocol || "https:"}//${A.hostname}${A.port ? `:${A.port}` : ""}${A.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (_.statusCode === 204) {
        k();
        return;
      }
      const F = (D = _.statusCode) !== null && D !== void 0 ? D : 0, j = F >= 300 && F < 400, I = T(_, "location");
      if (j && I != null) {
        if (L > this.maxRedirects) {
          U(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(m.prepareRedirectUrlOptions(I, A), E, q, L).then(k).catch(U);
        return;
      }
      _.setEncoding("utf8");
      let Q = "";
      _.on("error", U), _.on("data", (Y) => Q += Y), _.on("end", () => {
        try {
          if (_.statusCode != null && _.statusCode >= 400) {
            const Y = T(_, "content-type"), ne = Y != null && (Array.isArray(Y) ? Y.find((de) => de.includes("json")) != null : Y.includes("json"));
            U(s(_, `method: ${A.method || "GET"} url: ${A.protocol || "https:"}//${A.hostname}${A.port ? `:${A.port}` : ""}${A.path}

          Data:
          ${ne ? JSON.stringify(JSON.parse(Q)) : Q}
          `));
          } else
            k(Q.length === 0 ? null : Q);
        } catch (Y) {
          U(Y);
        }
      });
    }
    async downloadToBuffer(_, A) {
      return await A.cancellationToken.createPromise((E, k, U) => {
        const L = [], q = {
          headers: A.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        y(_, q), O(q), this.doDownload(q, {
          destination: null,
          options: A,
          onCancel: U,
          callback: (D) => {
            D == null ? E(Buffer.concat(L)) : k(D);
          },
          responseHandler: (D, F) => {
            let j = 0;
            D.on("data", (I) => {
              if (j += I.length, j > 524288e3) {
                F(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              L.push(I);
            }), D.on("end", () => {
              F(null);
            });
          }
        }, 0);
      });
    }
    doDownload(_, A, E) {
      const k = this.createRequest(_, (U) => {
        if (U.statusCode >= 400) {
          A.callback(new Error(`Cannot download "${_.protocol || "https:"}//${_.hostname}${_.path}", status ${U.statusCode}: ${U.statusMessage}`));
          return;
        }
        U.on("error", A.callback);
        const L = T(U, "location");
        if (L != null) {
          E < this.maxRedirects ? this.doDownload(m.prepareRedirectUrlOptions(L, _), A, E++) : A.callback(this.createMaxRedirectError());
          return;
        }
        A.responseHandler == null ? P(A, U) : A.responseHandler(U, A.callback);
      });
      this.addErrorAndTimeoutHandlers(k, A.callback, _.timeout), this.addRedirectHandlers(k, _, A.callback, E, (U) => {
        this.doDownload(U, A, E++);
      }), k.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(_, A, E) {
      _.on("socket", (k) => {
        k.setTimeout(E, () => {
          _.abort(), A(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(_, A) {
      const E = v(_, { ...A }), k = E.headers;
      if (k?.authorization) {
        const U = new f.URL(_);
        (U.hostname.endsWith(".amazonaws.com") || U.searchParams.has("X-Amz-Credential")) && delete k.authorization;
      }
      return E;
    }
    static retryOnServerError(_, A = 3) {
      for (let E = 0; ; E++)
        try {
          return _();
        } catch (k) {
          if (E < A && (k instanceof o && k.isServerError() || k.code === "EPIPE"))
            continue;
          throw k;
        }
    }
  }
  $e.HttpExecutor = m;
  function v(C, _) {
    const A = O(_);
    return y(new f.URL(C), A), A;
  }
  function y(C, _) {
    _.protocol = C.protocol, _.hostname = C.hostname, C.port ? _.port = C.port : _.port && delete _.port, _.path = C.pathname + C.search;
  }
  class p extends u.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(_, A = "sha512", E = "base64") {
      super(), this.expected = _, this.algorithm = A, this.encoding = E, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, t.createHash)(A);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(_, A, E) {
      this.digester.update(_), E(null, _);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(_) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (A) {
          _(A);
          return;
        }
      _(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, a.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, a.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  $e.DigestTransform = p;
  function S(C, _, A) {
    return C != null && _ != null && C !== _ ? (A(new Error(`checksum mismatch: expected ${_} but got ${C} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function T(C, _) {
    const A = C.headers[_];
    return A == null ? null : Array.isArray(A) ? A.length === 0 ? null : A[A.length - 1] : A;
  }
  function P(C, _) {
    if (!S(T(_, "X-Checksum-Sha2"), C.options.sha2, C.callback))
      return;
    const A = [];
    if (C.options.onProgress != null) {
      const L = T(_, "content-length");
      L != null && A.push(new d.ProgressCallbackTransform(parseInt(L, 10), C.options.cancellationToken, C.options.onProgress));
    }
    const E = C.options.sha512;
    E != null ? A.push(new p(E, "sha512", E.length === 128 && !E.includes("+") && !E.includes("Z") && !E.includes("=") ? "hex" : "base64")) : C.options.sha2 != null && A.push(new p(C.options.sha2, "sha256", "hex"));
    const k = (0, h.createWriteStream)(C.destination);
    A.push(k);
    let U = _;
    for (const L of A)
      L.on("error", (q) => {
        k.close(), C.options.cancellationToken.cancelled || C.callback(q);
      }), U = U.pipe(L);
    k.on("finish", () => {
      k.close(C.callback);
    });
  }
  function O(C, _, A) {
    A != null && (C.method = A), C.headers = { ...C.headers };
    const E = C.headers;
    return _ != null && (E.authorization = _.startsWith("Basic") || _.startsWith("Bearer") ? _ : `token ${_}`), E["User-Agent"] == null && (E["User-Agent"] = "electron-builder"), (A == null || A === "GET" || E["Cache-Control"] == null) && (E["Cache-Control"] = "no-cache"), C.protocol == null && process.versions.electron != null && (C.protocol = "https:"), C;
  }
  function M(C, _) {
    return JSON.stringify(C, (A, E) => A.endsWith("Authorization") || A.endsWith("authorization") || A.endsWith("Password") || A.endsWith("PASSWORD") || A.endsWith("Token") || A.includes("password") || A.includes("token") || _ != null && _.has(A) ? "<stripped sensitive data>" : E, 2);
  }
  return $e;
}
var Wt = {}, vo;
function qc() {
  if (vo) return Wt;
  vo = 1, Object.defineProperty(Wt, "__esModule", { value: !0 }), Wt.MemoLazy = void 0;
  let t = class {
    constructor(u, f) {
      this.selector = u, this.creator = f, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const u = this.selector();
      if (this._value !== void 0 && c(this.selected, u))
        return this._value;
      this.selected = u;
      const f = this.creator(u);
      return this.value = f, f;
    }
    set value(u) {
      this._value = u;
    }
  };
  Wt.MemoLazy = t;
  function c(h, u) {
    if (typeof h == "object" && h !== null && (typeof u == "object" && u !== null)) {
      const a = Object.keys(h), d = Object.keys(u);
      return a.length === d.length && a.every((i) => c(h[i], u[i]));
    }
    return h === u;
  }
  return Wt;
}
var Vt = {}, Eo;
function Mc() {
  if (Eo) return Vt;
  Eo = 1, Object.defineProperty(Vt, "__esModule", { value: !0 }), Vt.githubUrl = t, Vt.getS3LikeProviderBaseUrl = c;
  function t(l, a = "github.com") {
    return `${l.protocol || "https"}://${l.host || a}`;
  }
  function c(l) {
    const a = l.provider;
    if (a === "s3")
      return h(l);
    if (a === "spaces")
      return f(l);
    throw new Error(`Not supported provider: ${a}`);
  }
  function h(l) {
    let a;
    if (l.accelerate == !0)
      a = `https://${l.bucket}.s3-accelerate.amazonaws.com`;
    else if (l.endpoint != null)
      a = `${l.endpoint}/${l.bucket}`;
    else if (l.bucket.includes(".")) {
      if (l.region == null)
        throw new Error(`Bucket name "${l.bucket}" includes a dot, but S3 region is missing`);
      l.region === "us-east-1" ? a = `https://s3.amazonaws.com/${l.bucket}` : a = `https://s3-${l.region}.amazonaws.com/${l.bucket}`;
    } else l.region === "cn-north-1" ? a = `https://${l.bucket}.s3.${l.region}.amazonaws.com.cn` : a = `https://${l.bucket}.s3.amazonaws.com`;
    return u(a, l.path);
  }
  function u(l, a) {
    return a != null && a.length > 0 && (a.startsWith("/") || (l += "/"), l += a), l;
  }
  function f(l) {
    if (l.name == null)
      throw new Error("name is missing");
    if (l.region == null)
      throw new Error("region is missing");
    return u(`https://${l.name}.${l.region}.digitaloceanspaces.com`, l.path);
  }
  return Vt;
}
var Dr = {}, yo;
function Bc() {
  if (yo) return Dr;
  yo = 1, Object.defineProperty(Dr, "__esModule", { value: !0 }), Dr.retry = c;
  const t = ta();
  async function c(h, u, f, l = 0, a = 0, d) {
    var i;
    const s = new t.CancellationToken();
    try {
      return await h();
    } catch (r) {
      if ((!((i = d?.(r)) !== null && i !== void 0) || i) && u > 0 && !s.cancelled)
        return await new Promise((o) => setTimeout(o, f + l * a)), await c(h, u - 1, f, l, a + 1, d);
      throw r;
    }
  }
  return Dr;
}
var Nr = {}, wo;
function Hc() {
  if (wo) return Nr;
  wo = 1, Object.defineProperty(Nr, "__esModule", { value: !0 }), Nr.parseDn = t;
  function t(c) {
    let h = !1, u = null, f = "", l = 0;
    c = c.trim();
    const a = /* @__PURE__ */ new Map();
    for (let d = 0; d <= c.length; d++) {
      if (d === c.length) {
        u !== null && a.set(u, f);
        break;
      }
      const i = c[d];
      if (h) {
        if (i === '"') {
          h = !1;
          continue;
        }
      } else {
        if (i === '"') {
          h = !0;
          continue;
        }
        if (i === "\\") {
          d++;
          const s = parseInt(c.slice(d, d + 2), 16);
          Number.isNaN(s) ? f += c[d] : (d++, f += String.fromCharCode(s));
          continue;
        }
        if (u === null && i === "=") {
          u = f, f = "";
          continue;
        }
        if (i === "," || i === ";" || i === "+") {
          u !== null && a.set(u, f), u = null, f = "";
          continue;
        }
      }
      if (i === " " && !h) {
        if (f.length === 0)
          continue;
        if (d > l) {
          let s = d;
          for (; c[s] === " "; )
            s++;
          l = s;
        }
        if (l >= c.length || c[l] === "," || c[l] === ";" || u === null && c[l] === "=" || u !== null && c[l] === "+") {
          d = l - 1;
          continue;
        }
      }
      f += i;
    }
    return a;
  }
  return Nr;
}
var Rt = {}, _o;
function jc() {
  if (_o) return Rt;
  _o = 1, Object.defineProperty(Rt, "__esModule", { value: !0 }), Rt.nil = Rt.UUID = void 0;
  const t = pr, c = Mr(), h = "options.name must be either a string or a Buffer", u = (0, t.randomBytes)(16);
  u[0] = u[0] | 1;
  const f = {}, l = [];
  for (let o = 0; o < 256; o++) {
    const n = (o + 256).toString(16).substr(1);
    f[n] = o, l[o] = n;
  }
  class a {
    constructor(n) {
      this.ascii = null, this.binary = null;
      const m = a.check(n);
      if (!m)
        throw new Error("not a UUID");
      this.version = m.version, m.format === "ascii" ? this.ascii = n : this.binary = n;
    }
    static v5(n, m) {
      return s(n, "sha1", 80, m);
    }
    toString() {
      return this.ascii == null && (this.ascii = r(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(n, m = 0) {
      if (typeof n == "string")
        return n = n.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(n) ? n === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (f[n[14] + n[15]] & 240) >> 4,
          variant: d((f[n[19] + n[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(n)) {
        if (n.length < m + 16)
          return !1;
        let v = 0;
        for (; v < 16 && n[m + v] === 0; v++)
          ;
        return v === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (n[m + 6] & 240) >> 4,
          variant: d((n[m + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, c.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(n) {
      const m = Buffer.allocUnsafe(16);
      let v = 0;
      for (let y = 0; y < 16; y++)
        m[y] = f[n[v++] + n[v++]], (y === 3 || y === 5 || y === 7 || y === 9) && (v += 1);
      return m;
    }
  }
  Rt.UUID = a, a.OID = a.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function d(o) {
    switch (o) {
      case 0:
      case 1:
      case 3:
        return "ncs";
      case 4:
      case 5:
        return "rfc4122";
      case 6:
        return "microsoft";
      default:
        return "future";
    }
  }
  var i;
  (function(o) {
    o[o.ASCII = 0] = "ASCII", o[o.BINARY = 1] = "BINARY", o[o.OBJECT = 2] = "OBJECT";
  })(i || (i = {}));
  function s(o, n, m, v, y = i.ASCII) {
    const p = (0, t.createHash)(n);
    if (typeof o != "string" && !Buffer.isBuffer(o))
      throw (0, c.newError)(h, "ERR_INVALID_UUID_NAME");
    p.update(v), p.update(o);
    const T = p.digest();
    let P;
    switch (y) {
      case i.BINARY:
        T[6] = T[6] & 15 | m, T[8] = T[8] & 63 | 128, P = T;
        break;
      case i.OBJECT:
        T[6] = T[6] & 15 | m, T[8] = T[8] & 63 | 128, P = new a(T);
        break;
      default:
        P = l[T[0]] + l[T[1]] + l[T[2]] + l[T[3]] + "-" + l[T[4]] + l[T[5]] + "-" + l[T[6] & 15 | m] + l[T[7]] + "-" + l[T[8] & 63 | 128] + l[T[9]] + "-" + l[T[10]] + l[T[11]] + l[T[12]] + l[T[13]] + l[T[14]] + l[T[15]];
        break;
    }
    return P;
  }
  function r(o) {
    return l[o[0]] + l[o[1]] + l[o[2]] + l[o[3]] + "-" + l[o[4]] + l[o[5]] + "-" + l[o[6]] + l[o[7]] + "-" + l[o[8]] + l[o[9]] + "-" + l[o[10]] + l[o[11]] + l[o[12]] + l[o[13]] + l[o[14]] + l[o[15]];
  }
  return Rt.nil = new a("00000000-0000-0000-0000-000000000000"), Rt;
}
var Nt = {}, Fn = {}, So;
function Gc() {
  return So || (So = 1, (function(t) {
    (function(c) {
      c.parser = function(w, g) {
        return new u(w, g);
      }, c.SAXParser = u, c.SAXStream = r, c.createStream = s, c.MAX_BUFFER_LENGTH = 64 * 1024;
      var h = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      c.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function u(w, g) {
        if (!(this instanceof u))
          return new u(w, g);
        var H = this;
        l(H), H.q = H.c = "", H.bufferCheckPosition = c.MAX_BUFFER_LENGTH, H.opt = g || {}, H.opt.lowercase = H.opt.lowercase || H.opt.lowercasetags, H.looseCase = H.opt.lowercase ? "toLowerCase" : "toUpperCase", H.tags = [], H.closed = H.closedRoot = H.sawRoot = !1, H.tag = H.error = null, H.strict = !!w, H.noscript = !!(w || H.opt.noscript), H.state = E.BEGIN, H.strictEntities = H.opt.strictEntities, H.ENTITIES = H.strictEntities ? Object.create(c.XML_ENTITIES) : Object.create(c.ENTITIES), H.attribList = [], H.opt.xmlns && (H.ns = Object.create(y)), H.opt.unquotedAttributeValues === void 0 && (H.opt.unquotedAttributeValues = !w), H.trackPosition = H.opt.position !== !1, H.trackPosition && (H.position = H.line = H.column = 0), U(H, "onready");
      }
      Object.create || (Object.create = function(w) {
        function g() {
        }
        g.prototype = w;
        var H = new g();
        return H;
      }), Object.keys || (Object.keys = function(w) {
        var g = [];
        for (var H in w) w.hasOwnProperty(H) && g.push(H);
        return g;
      });
      function f(w) {
        for (var g = Math.max(c.MAX_BUFFER_LENGTH, 10), H = 0, N = 0, ue = h.length; N < ue; N++) {
          var he = w[h[N]].length;
          if (he > g)
            switch (h[N]) {
              case "textNode":
                q(w);
                break;
              case "cdata":
                L(w, "oncdata", w.cdata), w.cdata = "";
                break;
              case "script":
                L(w, "onscript", w.script), w.script = "";
                break;
              default:
                F(w, "Max buffer length exceeded: " + h[N]);
            }
          H = Math.max(H, he);
        }
        var pe = c.MAX_BUFFER_LENGTH - H;
        w.bufferCheckPosition = pe + w.position;
      }
      function l(w) {
        for (var g = 0, H = h.length; g < H; g++)
          w[h[g]] = "";
      }
      function a(w) {
        q(w), w.cdata !== "" && (L(w, "oncdata", w.cdata), w.cdata = ""), w.script !== "" && (L(w, "onscript", w.script), w.script = "");
      }
      u.prototype = {
        end: function() {
          j(this);
        },
        write: ve,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          a(this);
        }
      };
      var d;
      try {
        d = require("stream").Stream;
      } catch {
        d = function() {
        };
      }
      d || (d = function() {
      });
      var i = c.EVENTS.filter(function(w) {
        return w !== "error" && w !== "end";
      });
      function s(w, g) {
        return new r(w, g);
      }
      function r(w, g) {
        if (!(this instanceof r))
          return new r(w, g);
        d.apply(this), this._parser = new u(w, g), this.writable = !0, this.readable = !0;
        var H = this;
        this._parser.onend = function() {
          H.emit("end");
        }, this._parser.onerror = function(N) {
          H.emit("error", N), H._parser.error = null;
        }, this._decoder = null, i.forEach(function(N) {
          Object.defineProperty(H, "on" + N, {
            get: function() {
              return H._parser["on" + N];
            },
            set: function(ue) {
              if (!ue)
                return H.removeAllListeners(N), H._parser["on" + N] = ue, ue;
              H.on(N, ue);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      r.prototype = Object.create(d.prototype, {
        constructor: {
          value: r
        }
      }), r.prototype.write = function(w) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(w)) {
          if (!this._decoder) {
            var g = sc.StringDecoder;
            this._decoder = new g("utf8");
          }
          w = this._decoder.write(w);
        }
        return this._parser.write(w.toString()), this.emit("data", w), !0;
      }, r.prototype.end = function(w) {
        return w && w.length && this.write(w), this._parser.end(), !0;
      }, r.prototype.on = function(w, g) {
        var H = this;
        return !H._parser["on" + w] && i.indexOf(w) !== -1 && (H._parser["on" + w] = function() {
          var N = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          N.splice(0, 0, w), H.emit.apply(H, N);
        }), d.prototype.on.call(H, w, g);
      };
      var o = "[CDATA[", n = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", v = "http://www.w3.org/2000/xmlns/", y = { xml: m, xmlns: v }, p = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, S = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, T = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, P = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function O(w) {
        return w === " " || w === `
` || w === "\r" || w === "	";
      }
      function M(w) {
        return w === '"' || w === "'";
      }
      function C(w) {
        return w === ">" || O(w);
      }
      function _(w, g) {
        return w.test(g);
      }
      function A(w, g) {
        return !_(w, g);
      }
      var E = 0;
      c.STATE = {
        BEGIN: E++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: E++,
        // leading whitespace
        TEXT: E++,
        // general stuff
        TEXT_ENTITY: E++,
        // &amp and such.
        OPEN_WAKA: E++,
        // <
        SGML_DECL: E++,
        // <!BLARG
        SGML_DECL_QUOTED: E++,
        // <!BLARG foo "bar
        DOCTYPE: E++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: E++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: E++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: E++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: E++,
        // <!-
        COMMENT: E++,
        // <!--
        COMMENT_ENDING: E++,
        // <!-- blah -
        COMMENT_ENDED: E++,
        // <!-- blah --
        CDATA: E++,
        // <![CDATA[ something
        CDATA_ENDING: E++,
        // ]
        CDATA_ENDING_2: E++,
        // ]]
        PROC_INST: E++,
        // <?hi
        PROC_INST_BODY: E++,
        // <?hi there
        PROC_INST_ENDING: E++,
        // <?hi "there" ?
        OPEN_TAG: E++,
        // <strong
        OPEN_TAG_SLASH: E++,
        // <strong /
        ATTRIB: E++,
        // <a
        ATTRIB_NAME: E++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: E++,
        // <a foo _
        ATTRIB_VALUE: E++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: E++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: E++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: E++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: E++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: E++,
        // <foo bar=&quot
        CLOSE_TAG: E++,
        // </a
        CLOSE_TAG_SAW_WHITE: E++,
        // </a   >
        SCRIPT: E++,
        // <script> ...
        SCRIPT_ENDING: E++
        // <script> ... <
      }, c.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, c.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      }, Object.keys(c.ENTITIES).forEach(function(w) {
        var g = c.ENTITIES[w], H = typeof g == "number" ? String.fromCharCode(g) : g;
        c.ENTITIES[w] = H;
      });
      for (var k in c.STATE)
        c.STATE[c.STATE[k]] = k;
      E = c.STATE;
      function U(w, g, H) {
        w[g] && w[g](H);
      }
      function L(w, g, H) {
        w.textNode && q(w), U(w, g, H);
      }
      function q(w) {
        w.textNode = D(w.opt, w.textNode), w.textNode && U(w, "ontext", w.textNode), w.textNode = "";
      }
      function D(w, g) {
        return w.trim && (g = g.trim()), w.normalize && (g = g.replace(/\s+/g, " ")), g;
      }
      function F(w, g) {
        return q(w), w.trackPosition && (g += `
Line: ` + w.line + `
Column: ` + w.column + `
Char: ` + w.c), g = new Error(g), w.error = g, U(w, "onerror", g), w;
      }
      function j(w) {
        return w.sawRoot && !w.closedRoot && I(w, "Unclosed root tag"), w.state !== E.BEGIN && w.state !== E.BEGIN_WHITESPACE && w.state !== E.TEXT && F(w, "Unexpected end"), q(w), w.c = "", w.closed = !0, U(w, "onend"), u.call(w, w.strict, w.opt), w;
      }
      function I(w, g) {
        if (typeof w != "object" || !(w instanceof u))
          throw new Error("bad call to strictFail");
        w.strict && F(w, g);
      }
      function Q(w) {
        w.strict || (w.tagName = w.tagName[w.looseCase]());
        var g = w.tags[w.tags.length - 1] || w, H = w.tag = { name: w.tagName, attributes: {} };
        w.opt.xmlns && (H.ns = g.ns), w.attribList.length = 0, L(w, "onopentagstart", H);
      }
      function Y(w, g) {
        var H = w.indexOf(":"), N = H < 0 ? ["", w] : w.split(":"), ue = N[0], he = N[1];
        return g && w === "xmlns" && (ue = "xmlns", he = ""), { prefix: ue, local: he };
      }
      function ne(w) {
        if (w.strict || (w.attribName = w.attribName[w.looseCase]()), w.attribList.indexOf(w.attribName) !== -1 || w.tag.attributes.hasOwnProperty(w.attribName)) {
          w.attribName = w.attribValue = "";
          return;
        }
        if (w.opt.xmlns) {
          var g = Y(w.attribName, !0), H = g.prefix, N = g.local;
          if (H === "xmlns")
            if (N === "xml" && w.attribValue !== m)
              I(
                w,
                "xml: prefix must be bound to " + m + `
Actual: ` + w.attribValue
              );
            else if (N === "xmlns" && w.attribValue !== v)
              I(
                w,
                "xmlns: prefix must be bound to " + v + `
Actual: ` + w.attribValue
              );
            else {
              var ue = w.tag, he = w.tags[w.tags.length - 1] || w;
              ue.ns === he.ns && (ue.ns = Object.create(he.ns)), ue.ns[N] = w.attribValue;
            }
          w.attribList.push([w.attribName, w.attribValue]);
        } else
          w.tag.attributes[w.attribName] = w.attribValue, L(w, "onattribute", {
            name: w.attribName,
            value: w.attribValue
          });
        w.attribName = w.attribValue = "";
      }
      function de(w, g) {
        if (w.opt.xmlns) {
          var H = w.tag, N = Y(w.tagName);
          H.prefix = N.prefix, H.local = N.local, H.uri = H.ns[N.prefix] || "", H.prefix && !H.uri && (I(
            w,
            "Unbound namespace prefix: " + JSON.stringify(w.tagName)
          ), H.uri = N.prefix);
          var ue = w.tags[w.tags.length - 1] || w;
          H.ns && ue.ns !== H.ns && Object.keys(H.ns).forEach(function(e) {
            L(w, "onopennamespace", {
              prefix: e,
              uri: H.ns[e]
            });
          });
          for (var he = 0, pe = w.attribList.length; he < pe; he++) {
            var _e = w.attribList[he], ye = _e[0], je = _e[1], Ae = Y(ye, !0), qe = Ae.prefix, lt = Ae.local, it = qe === "" ? "" : H.ns[qe] || "", rt = {
              name: ye,
              value: je,
              prefix: qe,
              local: lt,
              uri: it
            };
            qe && qe !== "xmlns" && !it && (I(
              w,
              "Unbound namespace prefix: " + JSON.stringify(qe)
            ), rt.uri = qe), w.tag.attributes[ye] = rt, L(w, "onattribute", rt);
          }
          w.attribList.length = 0;
        }
        w.tag.isSelfClosing = !!g, w.sawRoot = !0, w.tags.push(w.tag), L(w, "onopentag", w.tag), g || (!w.noscript && w.tagName.toLowerCase() === "script" ? w.state = E.SCRIPT : w.state = E.TEXT, w.tag = null, w.tagName = ""), w.attribName = w.attribValue = "", w.attribList.length = 0;
      }
      function ce(w) {
        if (!w.tagName) {
          I(w, "Weird empty close tag."), w.textNode += "</>", w.state = E.TEXT;
          return;
        }
        if (w.script) {
          if (w.tagName !== "script") {
            w.script += "</" + w.tagName + ">", w.tagName = "", w.state = E.SCRIPT;
            return;
          }
          L(w, "onscript", w.script), w.script = "";
        }
        var g = w.tags.length, H = w.tagName;
        w.strict || (H = H[w.looseCase]());
        for (var N = H; g--; ) {
          var ue = w.tags[g];
          if (ue.name !== N)
            I(w, "Unexpected close tag");
          else
            break;
        }
        if (g < 0) {
          I(w, "Unmatched closing tag: " + w.tagName), w.textNode += "</" + w.tagName + ">", w.state = E.TEXT;
          return;
        }
        w.tagName = H;
        for (var he = w.tags.length; he-- > g; ) {
          var pe = w.tag = w.tags.pop();
          w.tagName = w.tag.name, L(w, "onclosetag", w.tagName);
          var _e = {};
          for (var ye in pe.ns)
            _e[ye] = pe.ns[ye];
          var je = w.tags[w.tags.length - 1] || w;
          w.opt.xmlns && pe.ns !== je.ns && Object.keys(pe.ns).forEach(function(Ae) {
            var qe = pe.ns[Ae];
            L(w, "onclosenamespace", { prefix: Ae, uri: qe });
          });
        }
        g === 0 && (w.closedRoot = !0), w.tagName = w.attribValue = w.attribName = "", w.attribList.length = 0, w.state = E.TEXT;
      }
      function ge(w) {
        var g = w.entity, H = g.toLowerCase(), N, ue = "";
        return w.ENTITIES[g] ? w.ENTITIES[g] : w.ENTITIES[H] ? w.ENTITIES[H] : (g = H, g.charAt(0) === "#" && (g.charAt(1) === "x" ? (g = g.slice(2), N = parseInt(g, 16), ue = N.toString(16)) : (g = g.slice(1), N = parseInt(g, 10), ue = N.toString(10))), g = g.replace(/^0+/, ""), isNaN(N) || ue.toLowerCase() !== g || N < 0 || N > 1114111 ? (I(w, "Invalid character entity"), "&" + w.entity + ";") : String.fromCodePoint(N));
      }
      function Ee(w, g) {
        g === "<" ? (w.state = E.OPEN_WAKA, w.startTagPosition = w.position) : O(g) || (I(w, "Non-whitespace before first tag."), w.textNode = g, w.state = E.TEXT);
      }
      function J(w, g) {
        var H = "";
        return g < w.length && (H = w.charAt(g)), H;
      }
      function ve(w) {
        var g = this;
        if (this.error)
          throw this.error;
        if (g.closed)
          return F(
            g,
            "Cannot write after close. Assign an onready handler."
          );
        if (w === null)
          return j(g);
        typeof w == "object" && (w = w.toString());
        for (var H = 0, N = ""; N = J(w, H++), g.c = N, !!N; )
          switch (g.trackPosition && (g.position++, N === `
` ? (g.line++, g.column = 0) : g.column++), g.state) {
            case E.BEGIN:
              if (g.state = E.BEGIN_WHITESPACE, N === "\uFEFF")
                continue;
              Ee(g, N);
              continue;
            case E.BEGIN_WHITESPACE:
              Ee(g, N);
              continue;
            case E.TEXT:
              if (g.sawRoot && !g.closedRoot) {
                for (var he = H - 1; N && N !== "<" && N !== "&"; )
                  N = J(w, H++), N && g.trackPosition && (g.position++, N === `
` ? (g.line++, g.column = 0) : g.column++);
                g.textNode += w.substring(he, H - 1);
              }
              N === "<" && !(g.sawRoot && g.closedRoot && !g.strict) ? (g.state = E.OPEN_WAKA, g.startTagPosition = g.position) : (!O(N) && (!g.sawRoot || g.closedRoot) && I(g, "Text data outside of root node."), N === "&" ? g.state = E.TEXT_ENTITY : g.textNode += N);
              continue;
            case E.SCRIPT:
              N === "<" ? g.state = E.SCRIPT_ENDING : g.script += N;
              continue;
            case E.SCRIPT_ENDING:
              N === "/" ? g.state = E.CLOSE_TAG : (g.script += "<" + N, g.state = E.SCRIPT);
              continue;
            case E.OPEN_WAKA:
              if (N === "!")
                g.state = E.SGML_DECL, g.sgmlDecl = "";
              else if (!O(N)) if (_(p, N))
                g.state = E.OPEN_TAG, g.tagName = N;
              else if (N === "/")
                g.state = E.CLOSE_TAG, g.tagName = "";
              else if (N === "?")
                g.state = E.PROC_INST, g.procInstName = g.procInstBody = "";
              else {
                if (I(g, "Unencoded <"), g.startTagPosition + 1 < g.position) {
                  var ue = g.position - g.startTagPosition;
                  N = new Array(ue).join(" ") + N;
                }
                g.textNode += "<" + N, g.state = E.TEXT;
              }
              continue;
            case E.SGML_DECL:
              if (g.sgmlDecl + N === "--") {
                g.state = E.COMMENT, g.comment = "", g.sgmlDecl = "";
                continue;
              }
              g.doctype && g.doctype !== !0 && g.sgmlDecl ? (g.state = E.DOCTYPE_DTD, g.doctype += "<!" + g.sgmlDecl + N, g.sgmlDecl = "") : (g.sgmlDecl + N).toUpperCase() === o ? (L(g, "onopencdata"), g.state = E.CDATA, g.sgmlDecl = "", g.cdata = "") : (g.sgmlDecl + N).toUpperCase() === n ? (g.state = E.DOCTYPE, (g.doctype || g.sawRoot) && I(
                g,
                "Inappropriately located doctype declaration"
              ), g.doctype = "", g.sgmlDecl = "") : N === ">" ? (L(g, "onsgmldeclaration", g.sgmlDecl), g.sgmlDecl = "", g.state = E.TEXT) : (M(N) && (g.state = E.SGML_DECL_QUOTED), g.sgmlDecl += N);
              continue;
            case E.SGML_DECL_QUOTED:
              N === g.q && (g.state = E.SGML_DECL, g.q = ""), g.sgmlDecl += N;
              continue;
            case E.DOCTYPE:
              N === ">" ? (g.state = E.TEXT, L(g, "ondoctype", g.doctype), g.doctype = !0) : (g.doctype += N, N === "[" ? g.state = E.DOCTYPE_DTD : M(N) && (g.state = E.DOCTYPE_QUOTED, g.q = N));
              continue;
            case E.DOCTYPE_QUOTED:
              g.doctype += N, N === g.q && (g.q = "", g.state = E.DOCTYPE);
              continue;
            case E.DOCTYPE_DTD:
              N === "]" ? (g.doctype += N, g.state = E.DOCTYPE) : N === "<" ? (g.state = E.OPEN_WAKA, g.startTagPosition = g.position) : M(N) ? (g.doctype += N, g.state = E.DOCTYPE_DTD_QUOTED, g.q = N) : g.doctype += N;
              continue;
            case E.DOCTYPE_DTD_QUOTED:
              g.doctype += N, N === g.q && (g.state = E.DOCTYPE_DTD, g.q = "");
              continue;
            case E.COMMENT:
              N === "-" ? g.state = E.COMMENT_ENDING : g.comment += N;
              continue;
            case E.COMMENT_ENDING:
              N === "-" ? (g.state = E.COMMENT_ENDED, g.comment = D(g.opt, g.comment), g.comment && L(g, "oncomment", g.comment), g.comment = "") : (g.comment += "-" + N, g.state = E.COMMENT);
              continue;
            case E.COMMENT_ENDED:
              N !== ">" ? (I(g, "Malformed comment"), g.comment += "--" + N, g.state = E.COMMENT) : g.doctype && g.doctype !== !0 ? g.state = E.DOCTYPE_DTD : g.state = E.TEXT;
              continue;
            case E.CDATA:
              for (var he = H - 1; N && N !== "]"; )
                N = J(w, H++), N && g.trackPosition && (g.position++, N === `
` ? (g.line++, g.column = 0) : g.column++);
              g.cdata += w.substring(he, H - 1), N === "]" && (g.state = E.CDATA_ENDING);
              continue;
            case E.CDATA_ENDING:
              N === "]" ? g.state = E.CDATA_ENDING_2 : (g.cdata += "]" + N, g.state = E.CDATA);
              continue;
            case E.CDATA_ENDING_2:
              N === ">" ? (g.cdata && L(g, "oncdata", g.cdata), L(g, "onclosecdata"), g.cdata = "", g.state = E.TEXT) : N === "]" ? g.cdata += "]" : (g.cdata += "]]" + N, g.state = E.CDATA);
              continue;
            case E.PROC_INST:
              N === "?" ? g.state = E.PROC_INST_ENDING : O(N) ? g.state = E.PROC_INST_BODY : g.procInstName += N;
              continue;
            case E.PROC_INST_BODY:
              if (!g.procInstBody && O(N))
                continue;
              N === "?" ? g.state = E.PROC_INST_ENDING : g.procInstBody += N;
              continue;
            case E.PROC_INST_ENDING:
              N === ">" ? (L(g, "onprocessinginstruction", {
                name: g.procInstName,
                body: g.procInstBody
              }), g.procInstName = g.procInstBody = "", g.state = E.TEXT) : (g.procInstBody += "?" + N, g.state = E.PROC_INST_BODY);
              continue;
            case E.OPEN_TAG:
              _(S, N) ? g.tagName += N : (Q(g), N === ">" ? de(g) : N === "/" ? g.state = E.OPEN_TAG_SLASH : (O(N) || I(g, "Invalid character in tag name"), g.state = E.ATTRIB));
              continue;
            case E.OPEN_TAG_SLASH:
              N === ">" ? (de(g, !0), ce(g)) : (I(
                g,
                "Forward-slash in opening tag not followed by >"
              ), g.state = E.ATTRIB);
              continue;
            case E.ATTRIB:
              if (O(N))
                continue;
              N === ">" ? de(g) : N === "/" ? g.state = E.OPEN_TAG_SLASH : _(p, N) ? (g.attribName = N, g.attribValue = "", g.state = E.ATTRIB_NAME) : I(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_NAME:
              N === "=" ? g.state = E.ATTRIB_VALUE : N === ">" ? (I(g, "Attribute without value"), g.attribValue = g.attribName, ne(g), de(g)) : O(N) ? g.state = E.ATTRIB_NAME_SAW_WHITE : _(S, N) ? g.attribName += N : I(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_NAME_SAW_WHITE:
              if (N === "=")
                g.state = E.ATTRIB_VALUE;
              else {
                if (O(N))
                  continue;
                I(g, "Attribute without value"), g.tag.attributes[g.attribName] = "", g.attribValue = "", L(g, "onattribute", {
                  name: g.attribName,
                  value: ""
                }), g.attribName = "", N === ">" ? de(g) : _(p, N) ? (g.attribName = N, g.state = E.ATTRIB_NAME) : (I(g, "Invalid attribute name"), g.state = E.ATTRIB);
              }
              continue;
            case E.ATTRIB_VALUE:
              if (O(N))
                continue;
              M(N) ? (g.q = N, g.state = E.ATTRIB_VALUE_QUOTED) : (g.opt.unquotedAttributeValues || F(g, "Unquoted attribute value"), g.state = E.ATTRIB_VALUE_UNQUOTED, g.attribValue = N);
              continue;
            case E.ATTRIB_VALUE_QUOTED:
              if (N !== g.q) {
                N === "&" ? g.state = E.ATTRIB_VALUE_ENTITY_Q : g.attribValue += N;
                continue;
              }
              ne(g), g.q = "", g.state = E.ATTRIB_VALUE_CLOSED;
              continue;
            case E.ATTRIB_VALUE_CLOSED:
              O(N) ? g.state = E.ATTRIB : N === ">" ? de(g) : N === "/" ? g.state = E.OPEN_TAG_SLASH : _(p, N) ? (I(g, "No whitespace between attributes"), g.attribName = N, g.attribValue = "", g.state = E.ATTRIB_NAME) : I(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_VALUE_UNQUOTED:
              if (!C(N)) {
                N === "&" ? g.state = E.ATTRIB_VALUE_ENTITY_U : g.attribValue += N;
                continue;
              }
              ne(g), N === ">" ? de(g) : g.state = E.ATTRIB;
              continue;
            case E.CLOSE_TAG:
              if (g.tagName)
                N === ">" ? ce(g) : _(S, N) ? g.tagName += N : g.script ? (g.script += "</" + g.tagName, g.tagName = "", g.state = E.SCRIPT) : (O(N) || I(g, "Invalid tagname in closing tag"), g.state = E.CLOSE_TAG_SAW_WHITE);
              else {
                if (O(N))
                  continue;
                A(p, N) ? g.script ? (g.script += "</" + N, g.state = E.SCRIPT) : I(g, "Invalid tagname in closing tag.") : g.tagName = N;
              }
              continue;
            case E.CLOSE_TAG_SAW_WHITE:
              if (O(N))
                continue;
              N === ">" ? ce(g) : I(g, "Invalid characters in closing tag");
              continue;
            case E.TEXT_ENTITY:
            case E.ATTRIB_VALUE_ENTITY_Q:
            case E.ATTRIB_VALUE_ENTITY_U:
              var pe, _e;
              switch (g.state) {
                case E.TEXT_ENTITY:
                  pe = E.TEXT, _e = "textNode";
                  break;
                case E.ATTRIB_VALUE_ENTITY_Q:
                  pe = E.ATTRIB_VALUE_QUOTED, _e = "attribValue";
                  break;
                case E.ATTRIB_VALUE_ENTITY_U:
                  pe = E.ATTRIB_VALUE_UNQUOTED, _e = "attribValue";
                  break;
              }
              if (N === ";") {
                var ye = ge(g);
                g.opt.unparsedEntities && !Object.values(c.XML_ENTITIES).includes(ye) ? (g.entity = "", g.state = pe, g.write(ye)) : (g[_e] += ye, g.entity = "", g.state = pe);
              } else _(g.entity.length ? P : T, N) ? g.entity += N : (I(g, "Invalid character in entity name"), g[_e] += "&" + g.entity + N, g.entity = "", g.state = pe);
              continue;
            default:
              throw new Error(g, "Unknown state: " + g.state);
          }
        return g.position >= g.bufferCheckPosition && f(g), g;
      }
      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      String.fromCodePoint || (function() {
        var w = String.fromCharCode, g = Math.floor, H = function() {
          var N = 16384, ue = [], he, pe, _e = -1, ye = arguments.length;
          if (!ye)
            return "";
          for (var je = ""; ++_e < ye; ) {
            var Ae = Number(arguments[_e]);
            if (!isFinite(Ae) || // `NaN`, `+Infinity`, or `-Infinity`
            Ae < 0 || // not a valid Unicode code point
            Ae > 1114111 || // not a valid Unicode code point
            g(Ae) !== Ae)
              throw RangeError("Invalid code point: " + Ae);
            Ae <= 65535 ? ue.push(Ae) : (Ae -= 65536, he = (Ae >> 10) + 55296, pe = Ae % 1024 + 56320, ue.push(he, pe)), (_e + 1 === ye || ue.length > N) && (je += w.apply(null, ue), ue.length = 0);
          }
          return je;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: H,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = H;
      })();
    })(t);
  })(Fn)), Fn;
}
var Ao;
function Wc() {
  if (Ao) return Nt;
  Ao = 1, Object.defineProperty(Nt, "__esModule", { value: !0 }), Nt.XElement = void 0, Nt.parseXml = a;
  const t = Gc(), c = Mr();
  class h {
    constructor(i) {
      if (this.name = i, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !i)
        throw (0, c.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!f(i))
        throw (0, c.newError)(`Invalid element name: ${i}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(i) {
      const s = this.attributes === null ? null : this.attributes[i];
      if (s == null)
        throw (0, c.newError)(`No attribute "${i}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return s;
    }
    removeAttribute(i) {
      this.attributes !== null && delete this.attributes[i];
    }
    element(i, s = !1, r = null) {
      const o = this.elementOrNull(i, s);
      if (o === null)
        throw (0, c.newError)(r || `No element "${i}"`, "ERR_XML_MISSED_ELEMENT");
      return o;
    }
    elementOrNull(i, s = !1) {
      if (this.elements === null)
        return null;
      for (const r of this.elements)
        if (l(r, i, s))
          return r;
      return null;
    }
    getElements(i, s = !1) {
      return this.elements === null ? [] : this.elements.filter((r) => l(r, i, s));
    }
    elementValueOrEmpty(i, s = !1) {
      const r = this.elementOrNull(i, s);
      return r === null ? "" : r.value;
    }
  }
  Nt.XElement = h;
  const u = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function f(d) {
    return u.test(d);
  }
  function l(d, i, s) {
    const r = d.name;
    return r === i || s === !0 && r.length === i.length && r.toLowerCase() === i.toLowerCase();
  }
  function a(d) {
    let i = null;
    const s = t.parser(!0, {}), r = [];
    return s.onopentag = (o) => {
      const n = new h(o.name);
      if (n.attributes = o.attributes, i === null)
        i = n;
      else {
        const m = r[r.length - 1];
        m.elements == null && (m.elements = []), m.elements.push(n);
      }
      r.push(n);
    }, s.onclosetag = () => {
      r.pop();
    }, s.ontext = (o) => {
      r.length > 0 && (r[r.length - 1].value = o);
    }, s.oncdata = (o) => {
      const n = r[r.length - 1];
      n.value = o, n.isCData = !0;
    }, s.onerror = (o) => {
      throw o;
    }, s.write(d), i;
  }
  return Nt;
}
var Ro;
function Le() {
  return Ro || (Ro = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.CURRENT_APP_PACKAGE_FILE_NAME = t.CURRENT_APP_INSTALLER_FILE_NAME = t.XElement = t.parseXml = t.UUID = t.parseDn = t.retry = t.githubUrl = t.getS3LikeProviderBaseUrl = t.ProgressCallbackTransform = t.MemoLazy = t.safeStringifyJson = t.safeGetHeader = t.parseJson = t.HttpExecutor = t.HttpError = t.DigestTransform = t.createHttpError = t.configureRequestUrl = t.configureRequestOptionsFromUrl = t.configureRequestOptions = t.newError = t.CancellationToken = t.CancellationError = void 0, t.asArray = o;
    var c = ta();
    Object.defineProperty(t, "CancellationError", { enumerable: !0, get: function() {
      return c.CancellationError;
    } }), Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return c.CancellationToken;
    } });
    var h = Mr();
    Object.defineProperty(t, "newError", { enumerable: !0, get: function() {
      return h.newError;
    } });
    var u = kc();
    Object.defineProperty(t, "configureRequestOptions", { enumerable: !0, get: function() {
      return u.configureRequestOptions;
    } }), Object.defineProperty(t, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return u.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(t, "configureRequestUrl", { enumerable: !0, get: function() {
      return u.configureRequestUrl;
    } }), Object.defineProperty(t, "createHttpError", { enumerable: !0, get: function() {
      return u.createHttpError;
    } }), Object.defineProperty(t, "DigestTransform", { enumerable: !0, get: function() {
      return u.DigestTransform;
    } }), Object.defineProperty(t, "HttpError", { enumerable: !0, get: function() {
      return u.HttpError;
    } }), Object.defineProperty(t, "HttpExecutor", { enumerable: !0, get: function() {
      return u.HttpExecutor;
    } }), Object.defineProperty(t, "parseJson", { enumerable: !0, get: function() {
      return u.parseJson;
    } }), Object.defineProperty(t, "safeGetHeader", { enumerable: !0, get: function() {
      return u.safeGetHeader;
    } }), Object.defineProperty(t, "safeStringifyJson", { enumerable: !0, get: function() {
      return u.safeStringifyJson;
    } });
    var f = qc();
    Object.defineProperty(t, "MemoLazy", { enumerable: !0, get: function() {
      return f.MemoLazy;
    } });
    var l = xl();
    Object.defineProperty(t, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return l.ProgressCallbackTransform;
    } });
    var a = Mc();
    Object.defineProperty(t, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return a.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(t, "githubUrl", { enumerable: !0, get: function() {
      return a.githubUrl;
    } });
    var d = Bc();
    Object.defineProperty(t, "retry", { enumerable: !0, get: function() {
      return d.retry;
    } });
    var i = Hc();
    Object.defineProperty(t, "parseDn", { enumerable: !0, get: function() {
      return i.parseDn;
    } });
    var s = jc();
    Object.defineProperty(t, "UUID", { enumerable: !0, get: function() {
      return s.UUID;
    } });
    var r = Wc();
    Object.defineProperty(t, "parseXml", { enumerable: !0, get: function() {
      return r.parseXml;
    } }), Object.defineProperty(t, "XElement", { enumerable: !0, get: function() {
      return r.XElement;
    } }), t.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", t.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function o(n) {
      return n == null ? [] : Array.isArray(n) ? n : [n];
    }
  })(Pn)), Pn;
}
var ke = {}, Fr = {}, dt = {}, To;
function mr() {
  if (To) return dt;
  To = 1;
  function t(a) {
    return typeof a > "u" || a === null;
  }
  function c(a) {
    return typeof a == "object" && a !== null;
  }
  function h(a) {
    return Array.isArray(a) ? a : t(a) ? [] : [a];
  }
  function u(a, d) {
    var i, s, r, o;
    if (d)
      for (o = Object.keys(d), i = 0, s = o.length; i < s; i += 1)
        r = o[i], a[r] = d[r];
    return a;
  }
  function f(a, d) {
    var i = "", s;
    for (s = 0; s < d; s += 1)
      i += a;
    return i;
  }
  function l(a) {
    return a === 0 && Number.NEGATIVE_INFINITY === 1 / a;
  }
  return dt.isNothing = t, dt.isObject = c, dt.toArray = h, dt.repeat = f, dt.isNegativeZero = l, dt.extend = u, dt;
}
var xn, Co;
function gr() {
  if (Co) return xn;
  Co = 1;
  function t(h, u) {
    var f = "", l = h.reason || "(unknown reason)";
    return h.mark ? (h.mark.name && (f += 'in "' + h.mark.name + '" '), f += "(" + (h.mark.line + 1) + ":" + (h.mark.column + 1) + ")", !u && h.mark.snippet && (f += `

` + h.mark.snippet), l + " " + f) : l;
  }
  function c(h, u) {
    Error.call(this), this.name = "YAMLException", this.reason = h, this.mark = u, this.message = t(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return c.prototype = Object.create(Error.prototype), c.prototype.constructor = c, c.prototype.toString = function(u) {
    return this.name + ": " + t(this, u);
  }, xn = c, xn;
}
var Ln, bo;
function Vc() {
  if (bo) return Ln;
  bo = 1;
  var t = mr();
  function c(f, l, a, d, i) {
    var s = "", r = "", o = Math.floor(i / 2) - 1;
    return d - l > o && (s = " ... ", l = d - o + s.length), a - d > o && (r = " ...", a = d + o - r.length), {
      str: s + f.slice(l, a).replace(/\t/g, "→") + r,
      pos: d - l + s.length
      // relative position
    };
  }
  function h(f, l) {
    return t.repeat(" ", l - f.length) + f;
  }
  function u(f, l) {
    if (l = Object.create(l || null), !f.buffer) return null;
    l.maxLength || (l.maxLength = 79), typeof l.indent != "number" && (l.indent = 1), typeof l.linesBefore != "number" && (l.linesBefore = 3), typeof l.linesAfter != "number" && (l.linesAfter = 2);
    for (var a = /\r?\n|\r|\0/g, d = [0], i = [], s, r = -1; s = a.exec(f.buffer); )
      i.push(s.index), d.push(s.index + s[0].length), f.position <= s.index && r < 0 && (r = d.length - 2);
    r < 0 && (r = d.length - 1);
    var o = "", n, m, v = Math.min(f.line + l.linesAfter, i.length).toString().length, y = l.maxLength - (l.indent + v + 3);
    for (n = 1; n <= l.linesBefore && !(r - n < 0); n++)
      m = c(
        f.buffer,
        d[r - n],
        i[r - n],
        f.position - (d[r] - d[r - n]),
        y
      ), o = t.repeat(" ", l.indent) + h((f.line - n + 1).toString(), v) + " | " + m.str + `
` + o;
    for (m = c(f.buffer, d[r], i[r], f.position, y), o += t.repeat(" ", l.indent) + h((f.line + 1).toString(), v) + " | " + m.str + `
`, o += t.repeat("-", l.indent + v + 3 + m.pos) + `^
`, n = 1; n <= l.linesAfter && !(r + n >= i.length); n++)
      m = c(
        f.buffer,
        d[r + n],
        i[r + n],
        f.position - (d[r] - d[r + n]),
        y
      ), o += t.repeat(" ", l.indent) + h((f.line + n + 1).toString(), v) + " | " + m.str + `
`;
    return o.replace(/\n$/, "");
  }
  return Ln = u, Ln;
}
var Un, Po;
function Be() {
  if (Po) return Un;
  Po = 1;
  var t = gr(), c = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], h = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function u(l) {
    var a = {};
    return l !== null && Object.keys(l).forEach(function(d) {
      l[d].forEach(function(i) {
        a[String(i)] = d;
      });
    }), a;
  }
  function f(l, a) {
    if (a = a || {}, Object.keys(a).forEach(function(d) {
      if (c.indexOf(d) === -1)
        throw new t('Unknown option "' + d + '" is met in definition of "' + l + '" YAML type.');
    }), this.options = a, this.tag = l, this.kind = a.kind || null, this.resolve = a.resolve || function() {
      return !0;
    }, this.construct = a.construct || function(d) {
      return d;
    }, this.instanceOf = a.instanceOf || null, this.predicate = a.predicate || null, this.represent = a.represent || null, this.representName = a.representName || null, this.defaultStyle = a.defaultStyle || null, this.multi = a.multi || !1, this.styleAliases = u(a.styleAliases || null), h.indexOf(this.kind) === -1)
      throw new t('Unknown kind "' + this.kind + '" is specified for "' + l + '" YAML type.');
  }
  return Un = f, Un;
}
var $n, Oo;
function Ll() {
  if (Oo) return $n;
  Oo = 1;
  var t = gr(), c = Be();
  function h(l, a) {
    var d = [];
    return l[a].forEach(function(i) {
      var s = d.length;
      d.forEach(function(r, o) {
        r.tag === i.tag && r.kind === i.kind && r.multi === i.multi && (s = o);
      }), d[s] = i;
    }), d;
  }
  function u() {
    var l = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, a, d;
    function i(s) {
      s.multi ? (l.multi[s.kind].push(s), l.multi.fallback.push(s)) : l[s.kind][s.tag] = l.fallback[s.tag] = s;
    }
    for (a = 0, d = arguments.length; a < d; a += 1)
      arguments[a].forEach(i);
    return l;
  }
  function f(l) {
    return this.extend(l);
  }
  return f.prototype.extend = function(a) {
    var d = [], i = [];
    if (a instanceof c)
      i.push(a);
    else if (Array.isArray(a))
      i = i.concat(a);
    else if (a && (Array.isArray(a.implicit) || Array.isArray(a.explicit)))
      a.implicit && (d = d.concat(a.implicit)), a.explicit && (i = i.concat(a.explicit));
    else
      throw new t("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    d.forEach(function(r) {
      if (!(r instanceof c))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (r.loadKind && r.loadKind !== "scalar")
        throw new t("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (r.multi)
        throw new t("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), i.forEach(function(r) {
      if (!(r instanceof c))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var s = Object.create(f.prototype);
    return s.implicit = (this.implicit || []).concat(d), s.explicit = (this.explicit || []).concat(i), s.compiledImplicit = h(s, "implicit"), s.compiledExplicit = h(s, "explicit"), s.compiledTypeMap = u(s.compiledImplicit, s.compiledExplicit), s;
  }, $n = f, $n;
}
var kn, Io;
function Ul() {
  if (Io) return kn;
  Io = 1;
  var t = Be();
  return kn = new t("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(c) {
      return c !== null ? c : "";
    }
  }), kn;
}
var qn, Do;
function $l() {
  if (Do) return qn;
  Do = 1;
  var t = Be();
  return qn = new t("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(c) {
      return c !== null ? c : [];
    }
  }), qn;
}
var Mn, No;
function kl() {
  if (No) return Mn;
  No = 1;
  var t = Be();
  return Mn = new t("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(c) {
      return c !== null ? c : {};
    }
  }), Mn;
}
var Bn, Fo;
function ql() {
  if (Fo) return Bn;
  Fo = 1;
  var t = Ll();
  return Bn = new t({
    explicit: [
      Ul(),
      $l(),
      kl()
    ]
  }), Bn;
}
var Hn, xo;
function Ml() {
  if (xo) return Hn;
  xo = 1;
  var t = Be();
  function c(f) {
    if (f === null) return !0;
    var l = f.length;
    return l === 1 && f === "~" || l === 4 && (f === "null" || f === "Null" || f === "NULL");
  }
  function h() {
    return null;
  }
  function u(f) {
    return f === null;
  }
  return Hn = new t("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: c,
    construct: h,
    predicate: u,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), Hn;
}
var jn, Lo;
function Bl() {
  if (Lo) return jn;
  Lo = 1;
  var t = Be();
  function c(f) {
    if (f === null) return !1;
    var l = f.length;
    return l === 4 && (f === "true" || f === "True" || f === "TRUE") || l === 5 && (f === "false" || f === "False" || f === "FALSE");
  }
  function h(f) {
    return f === "true" || f === "True" || f === "TRUE";
  }
  function u(f) {
    return Object.prototype.toString.call(f) === "[object Boolean]";
  }
  return jn = new t("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: c,
    construct: h,
    predicate: u,
    represent: {
      lowercase: function(f) {
        return f ? "true" : "false";
      },
      uppercase: function(f) {
        return f ? "TRUE" : "FALSE";
      },
      camelcase: function(f) {
        return f ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), jn;
}
var Gn, Uo;
function Hl() {
  if (Uo) return Gn;
  Uo = 1;
  var t = mr(), c = Be();
  function h(i) {
    return 48 <= i && i <= 57 || 65 <= i && i <= 70 || 97 <= i && i <= 102;
  }
  function u(i) {
    return 48 <= i && i <= 55;
  }
  function f(i) {
    return 48 <= i && i <= 57;
  }
  function l(i) {
    if (i === null) return !1;
    var s = i.length, r = 0, o = !1, n;
    if (!s) return !1;
    if (n = i[r], (n === "-" || n === "+") && (n = i[++r]), n === "0") {
      if (r + 1 === s) return !0;
      if (n = i[++r], n === "b") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (n !== "0" && n !== "1") return !1;
            o = !0;
          }
        return o && n !== "_";
      }
      if (n === "x") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (!h(i.charCodeAt(r))) return !1;
            o = !0;
          }
        return o && n !== "_";
      }
      if (n === "o") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (!u(i.charCodeAt(r))) return !1;
            o = !0;
          }
        return o && n !== "_";
      }
    }
    if (n === "_") return !1;
    for (; r < s; r++)
      if (n = i[r], n !== "_") {
        if (!f(i.charCodeAt(r)))
          return !1;
        o = !0;
      }
    return !(!o || n === "_");
  }
  function a(i) {
    var s = i, r = 1, o;
    if (s.indexOf("_") !== -1 && (s = s.replace(/_/g, "")), o = s[0], (o === "-" || o === "+") && (o === "-" && (r = -1), s = s.slice(1), o = s[0]), s === "0") return 0;
    if (o === "0") {
      if (s[1] === "b") return r * parseInt(s.slice(2), 2);
      if (s[1] === "x") return r * parseInt(s.slice(2), 16);
      if (s[1] === "o") return r * parseInt(s.slice(2), 8);
    }
    return r * parseInt(s, 10);
  }
  function d(i) {
    return Object.prototype.toString.call(i) === "[object Number]" && i % 1 === 0 && !t.isNegativeZero(i);
  }
  return Gn = new c("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: l,
    construct: a,
    predicate: d,
    represent: {
      binary: function(i) {
        return i >= 0 ? "0b" + i.toString(2) : "-0b" + i.toString(2).slice(1);
      },
      octal: function(i) {
        return i >= 0 ? "0o" + i.toString(8) : "-0o" + i.toString(8).slice(1);
      },
      decimal: function(i) {
        return i.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(i) {
        return i >= 0 ? "0x" + i.toString(16).toUpperCase() : "-0x" + i.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), Gn;
}
var Wn, $o;
function jl() {
  if ($o) return Wn;
  $o = 1;
  var t = mr(), c = Be(), h = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function u(i) {
    return !(i === null || !h.test(i) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    i[i.length - 1] === "_");
  }
  function f(i) {
    var s, r;
    return s = i.replace(/_/g, "").toLowerCase(), r = s[0] === "-" ? -1 : 1, "+-".indexOf(s[0]) >= 0 && (s = s.slice(1)), s === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : s === ".nan" ? NaN : r * parseFloat(s, 10);
  }
  var l = /^[-+]?[0-9]+e/;
  function a(i, s) {
    var r;
    if (isNaN(i))
      switch (s) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === i)
      switch (s) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === i)
      switch (s) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (t.isNegativeZero(i))
      return "-0.0";
    return r = i.toString(10), l.test(r) ? r.replace("e", ".e") : r;
  }
  function d(i) {
    return Object.prototype.toString.call(i) === "[object Number]" && (i % 1 !== 0 || t.isNegativeZero(i));
  }
  return Wn = new c("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: u,
    construct: f,
    predicate: d,
    represent: a,
    defaultStyle: "lowercase"
  }), Wn;
}
var Vn, ko;
function Gl() {
  return ko || (ko = 1, Vn = ql().extend({
    implicit: [
      Ml(),
      Bl(),
      Hl(),
      jl()
    ]
  })), Vn;
}
var Yn, qo;
function Wl() {
  return qo || (qo = 1, Yn = Gl()), Yn;
}
var zn, Mo;
function Vl() {
  if (Mo) return zn;
  Mo = 1;
  var t = Be(), c = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), h = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function u(a) {
    return a === null ? !1 : c.exec(a) !== null || h.exec(a) !== null;
  }
  function f(a) {
    var d, i, s, r, o, n, m, v = 0, y = null, p, S, T;
    if (d = c.exec(a), d === null && (d = h.exec(a)), d === null) throw new Error("Date resolve error");
    if (i = +d[1], s = +d[2] - 1, r = +d[3], !d[4])
      return new Date(Date.UTC(i, s, r));
    if (o = +d[4], n = +d[5], m = +d[6], d[7]) {
      for (v = d[7].slice(0, 3); v.length < 3; )
        v += "0";
      v = +v;
    }
    return d[9] && (p = +d[10], S = +(d[11] || 0), y = (p * 60 + S) * 6e4, d[9] === "-" && (y = -y)), T = new Date(Date.UTC(i, s, r, o, n, m, v)), y && T.setTime(T.getTime() - y), T;
  }
  function l(a) {
    return a.toISOString();
  }
  return zn = new t("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: u,
    construct: f,
    instanceOf: Date,
    represent: l
  }), zn;
}
var Xn, Bo;
function Yl() {
  if (Bo) return Xn;
  Bo = 1;
  var t = Be();
  function c(h) {
    return h === "<<" || h === null;
  }
  return Xn = new t("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: c
  }), Xn;
}
var Kn, Ho;
function zl() {
  if (Ho) return Kn;
  Ho = 1;
  var t = Be(), c = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function h(a) {
    if (a === null) return !1;
    var d, i, s = 0, r = a.length, o = c;
    for (i = 0; i < r; i++)
      if (d = o.indexOf(a.charAt(i)), !(d > 64)) {
        if (d < 0) return !1;
        s += 6;
      }
    return s % 8 === 0;
  }
  function u(a) {
    var d, i, s = a.replace(/[\r\n=]/g, ""), r = s.length, o = c, n = 0, m = [];
    for (d = 0; d < r; d++)
      d % 4 === 0 && d && (m.push(n >> 16 & 255), m.push(n >> 8 & 255), m.push(n & 255)), n = n << 6 | o.indexOf(s.charAt(d));
    return i = r % 4 * 6, i === 0 ? (m.push(n >> 16 & 255), m.push(n >> 8 & 255), m.push(n & 255)) : i === 18 ? (m.push(n >> 10 & 255), m.push(n >> 2 & 255)) : i === 12 && m.push(n >> 4 & 255), new Uint8Array(m);
  }
  function f(a) {
    var d = "", i = 0, s, r, o = a.length, n = c;
    for (s = 0; s < o; s++)
      s % 3 === 0 && s && (d += n[i >> 18 & 63], d += n[i >> 12 & 63], d += n[i >> 6 & 63], d += n[i & 63]), i = (i << 8) + a[s];
    return r = o % 3, r === 0 ? (d += n[i >> 18 & 63], d += n[i >> 12 & 63], d += n[i >> 6 & 63], d += n[i & 63]) : r === 2 ? (d += n[i >> 10 & 63], d += n[i >> 4 & 63], d += n[i << 2 & 63], d += n[64]) : r === 1 && (d += n[i >> 2 & 63], d += n[i << 4 & 63], d += n[64], d += n[64]), d;
  }
  function l(a) {
    return Object.prototype.toString.call(a) === "[object Uint8Array]";
  }
  return Kn = new t("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: h,
    construct: u,
    predicate: l,
    represent: f
  }), Kn;
}
var Jn, jo;
function Xl() {
  if (jo) return Jn;
  jo = 1;
  var t = Be(), c = Object.prototype.hasOwnProperty, h = Object.prototype.toString;
  function u(l) {
    if (l === null) return !0;
    var a = [], d, i, s, r, o, n = l;
    for (d = 0, i = n.length; d < i; d += 1) {
      if (s = n[d], o = !1, h.call(s) !== "[object Object]") return !1;
      for (r in s)
        if (c.call(s, r))
          if (!o) o = !0;
          else return !1;
      if (!o) return !1;
      if (a.indexOf(r) === -1) a.push(r);
      else return !1;
    }
    return !0;
  }
  function f(l) {
    return l !== null ? l : [];
  }
  return Jn = new t("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: u,
    construct: f
  }), Jn;
}
var Qn, Go;
function Kl() {
  if (Go) return Qn;
  Go = 1;
  var t = Be(), c = Object.prototype.toString;
  function h(f) {
    if (f === null) return !0;
    var l, a, d, i, s, r = f;
    for (s = new Array(r.length), l = 0, a = r.length; l < a; l += 1) {
      if (d = r[l], c.call(d) !== "[object Object]" || (i = Object.keys(d), i.length !== 1)) return !1;
      s[l] = [i[0], d[i[0]]];
    }
    return !0;
  }
  function u(f) {
    if (f === null) return [];
    var l, a, d, i, s, r = f;
    for (s = new Array(r.length), l = 0, a = r.length; l < a; l += 1)
      d = r[l], i = Object.keys(d), s[l] = [i[0], d[i[0]]];
    return s;
  }
  return Qn = new t("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: h,
    construct: u
  }), Qn;
}
var Zn, Wo;
function Jl() {
  if (Wo) return Zn;
  Wo = 1;
  var t = Be(), c = Object.prototype.hasOwnProperty;
  function h(f) {
    if (f === null) return !0;
    var l, a = f;
    for (l in a)
      if (c.call(a, l) && a[l] !== null)
        return !1;
    return !0;
  }
  function u(f) {
    return f !== null ? f : {};
  }
  return Zn = new t("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: h,
    construct: u
  }), Zn;
}
var ei, Vo;
function ra() {
  return Vo || (Vo = 1, ei = Wl().extend({
    implicit: [
      Vl(),
      Yl()
    ],
    explicit: [
      zl(),
      Xl(),
      Kl(),
      Jl()
    ]
  })), ei;
}
var Yo;
function Yc() {
  if (Yo) return Fr;
  Yo = 1;
  var t = mr(), c = gr(), h = Vc(), u = ra(), f = Object.prototype.hasOwnProperty, l = 1, a = 2, d = 3, i = 4, s = 1, r = 2, o = 3, n = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, m = /[\x85\u2028\u2029]/, v = /[,\[\]\{\}]/, y = /^(?:!|!!|![a-z\-]+!)$/i, p = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function S(e) {
    return Object.prototype.toString.call(e);
  }
  function T(e) {
    return e === 10 || e === 13;
  }
  function P(e) {
    return e === 9 || e === 32;
  }
  function O(e) {
    return e === 9 || e === 32 || e === 10 || e === 13;
  }
  function M(e) {
    return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
  }
  function C(e) {
    var B;
    return 48 <= e && e <= 57 ? e - 48 : (B = e | 32, 97 <= B && B <= 102 ? B - 97 + 10 : -1);
  }
  function _(e) {
    return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
  }
  function A(e) {
    return 48 <= e && e <= 57 ? e - 48 : -1;
  }
  function E(e) {
    return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
  }
  function k(e) {
    return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
      (e - 65536 >> 10) + 55296,
      (e - 65536 & 1023) + 56320
    );
  }
  function U(e, B, G) {
    B === "__proto__" ? Object.defineProperty(e, B, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: G
    }) : e[B] = G;
  }
  for (var L = new Array(256), q = new Array(256), D = 0; D < 256; D++)
    L[D] = E(D) ? 1 : 0, q[D] = E(D);
  function F(e, B) {
    this.input = e, this.filename = B.filename || null, this.schema = B.schema || u, this.onWarning = B.onWarning || null, this.legacy = B.legacy || !1, this.json = B.json || !1, this.listener = B.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function j(e, B) {
    var G = {
      name: e.filename,
      buffer: e.input.slice(0, -1),
      // omit trailing \0
      position: e.position,
      line: e.line,
      column: e.position - e.lineStart
    };
    return G.snippet = h(G), new c(B, G);
  }
  function I(e, B) {
    throw j(e, B);
  }
  function Q(e, B) {
    e.onWarning && e.onWarning.call(null, j(e, B));
  }
  var Y = {
    YAML: function(B, G, re) {
      var W, te, Z;
      B.version !== null && I(B, "duplication of %YAML directive"), re.length !== 1 && I(B, "YAML directive accepts exactly one argument"), W = /^([0-9]+)\.([0-9]+)$/.exec(re[0]), W === null && I(B, "ill-formed argument of the YAML directive"), te = parseInt(W[1], 10), Z = parseInt(W[2], 10), te !== 1 && I(B, "unacceptable YAML version of the document"), B.version = re[0], B.checkLineBreaks = Z < 2, Z !== 1 && Z !== 2 && Q(B, "unsupported YAML version of the document");
    },
    TAG: function(B, G, re) {
      var W, te;
      re.length !== 2 && I(B, "TAG directive accepts exactly two arguments"), W = re[0], te = re[1], y.test(W) || I(B, "ill-formed tag handle (first argument) of the TAG directive"), f.call(B.tagMap, W) && I(B, 'there is a previously declared suffix for "' + W + '" tag handle'), p.test(te) || I(B, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        te = decodeURIComponent(te);
      } catch {
        I(B, "tag prefix is malformed: " + te);
      }
      B.tagMap[W] = te;
    }
  };
  function ne(e, B, G, re) {
    var W, te, Z, ae;
    if (B < G) {
      if (ae = e.input.slice(B, G), re)
        for (W = 0, te = ae.length; W < te; W += 1)
          Z = ae.charCodeAt(W), Z === 9 || 32 <= Z && Z <= 1114111 || I(e, "expected valid JSON character");
      else n.test(ae) && I(e, "the stream contains non-printable characters");
      e.result += ae;
    }
  }
  function de(e, B, G, re) {
    var W, te, Z, ae;
    for (t.isObject(G) || I(e, "cannot merge mappings; the provided source object is unacceptable"), W = Object.keys(G), Z = 0, ae = W.length; Z < ae; Z += 1)
      te = W[Z], f.call(B, te) || (U(B, te, G[te]), re[te] = !0);
  }
  function ce(e, B, G, re, W, te, Z, ae, le) {
    var Re, Te;
    if (Array.isArray(W))
      for (W = Array.prototype.slice.call(W), Re = 0, Te = W.length; Re < Te; Re += 1)
        Array.isArray(W[Re]) && I(e, "nested arrays are not supported inside keys"), typeof W == "object" && S(W[Re]) === "[object Object]" && (W[Re] = "[object Object]");
    if (typeof W == "object" && S(W) === "[object Object]" && (W = "[object Object]"), W = String(W), B === null && (B = {}), re === "tag:yaml.org,2002:merge")
      if (Array.isArray(te))
        for (Re = 0, Te = te.length; Re < Te; Re += 1)
          de(e, B, te[Re], G);
      else
        de(e, B, te, G);
    else
      !e.json && !f.call(G, W) && f.call(B, W) && (e.line = Z || e.line, e.lineStart = ae || e.lineStart, e.position = le || e.position, I(e, "duplicated mapping key")), U(B, W, te), delete G[W];
    return B;
  }
  function ge(e) {
    var B;
    B = e.input.charCodeAt(e.position), B === 10 ? e.position++ : B === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : I(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
  }
  function Ee(e, B, G) {
    for (var re = 0, W = e.input.charCodeAt(e.position); W !== 0; ) {
      for (; P(W); )
        W === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), W = e.input.charCodeAt(++e.position);
      if (B && W === 35)
        do
          W = e.input.charCodeAt(++e.position);
        while (W !== 10 && W !== 13 && W !== 0);
      if (T(W))
        for (ge(e), W = e.input.charCodeAt(e.position), re++, e.lineIndent = 0; W === 32; )
          e.lineIndent++, W = e.input.charCodeAt(++e.position);
      else
        break;
    }
    return G !== -1 && re !== 0 && e.lineIndent < G && Q(e, "deficient indentation"), re;
  }
  function J(e) {
    var B = e.position, G;
    return G = e.input.charCodeAt(B), !!((G === 45 || G === 46) && G === e.input.charCodeAt(B + 1) && G === e.input.charCodeAt(B + 2) && (B += 3, G = e.input.charCodeAt(B), G === 0 || O(G)));
  }
  function ve(e, B) {
    B === 1 ? e.result += " " : B > 1 && (e.result += t.repeat(`
`, B - 1));
  }
  function w(e, B, G) {
    var re, W, te, Z, ae, le, Re, Te, me = e.kind, R = e.result, $;
    if ($ = e.input.charCodeAt(e.position), O($) || M($) || $ === 35 || $ === 38 || $ === 42 || $ === 33 || $ === 124 || $ === 62 || $ === 39 || $ === 34 || $ === 37 || $ === 64 || $ === 96 || ($ === 63 || $ === 45) && (W = e.input.charCodeAt(e.position + 1), O(W) || G && M(W)))
      return !1;
    for (e.kind = "scalar", e.result = "", te = Z = e.position, ae = !1; $ !== 0; ) {
      if ($ === 58) {
        if (W = e.input.charCodeAt(e.position + 1), O(W) || G && M(W))
          break;
      } else if ($ === 35) {
        if (re = e.input.charCodeAt(e.position - 1), O(re))
          break;
      } else {
        if (e.position === e.lineStart && J(e) || G && M($))
          break;
        if (T($))
          if (le = e.line, Re = e.lineStart, Te = e.lineIndent, Ee(e, !1, -1), e.lineIndent >= B) {
            ae = !0, $ = e.input.charCodeAt(e.position);
            continue;
          } else {
            e.position = Z, e.line = le, e.lineStart = Re, e.lineIndent = Te;
            break;
          }
      }
      ae && (ne(e, te, Z, !1), ve(e, e.line - le), te = Z = e.position, ae = !1), P($) || (Z = e.position + 1), $ = e.input.charCodeAt(++e.position);
    }
    return ne(e, te, Z, !1), e.result ? !0 : (e.kind = me, e.result = R, !1);
  }
  function g(e, B) {
    var G, re, W;
    if (G = e.input.charCodeAt(e.position), G !== 39)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, re = W = e.position; (G = e.input.charCodeAt(e.position)) !== 0; )
      if (G === 39)
        if (ne(e, re, e.position, !0), G = e.input.charCodeAt(++e.position), G === 39)
          re = e.position, e.position++, W = e.position;
        else
          return !0;
      else T(G) ? (ne(e, re, W, !0), ve(e, Ee(e, !1, B)), re = W = e.position) : e.position === e.lineStart && J(e) ? I(e, "unexpected end of the document within a single quoted scalar") : (e.position++, W = e.position);
    I(e, "unexpected end of the stream within a single quoted scalar");
  }
  function H(e, B) {
    var G, re, W, te, Z, ae;
    if (ae = e.input.charCodeAt(e.position), ae !== 34)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, G = re = e.position; (ae = e.input.charCodeAt(e.position)) !== 0; ) {
      if (ae === 34)
        return ne(e, G, e.position, !0), e.position++, !0;
      if (ae === 92) {
        if (ne(e, G, e.position, !0), ae = e.input.charCodeAt(++e.position), T(ae))
          Ee(e, !1, B);
        else if (ae < 256 && L[ae])
          e.result += q[ae], e.position++;
        else if ((Z = _(ae)) > 0) {
          for (W = Z, te = 0; W > 0; W--)
            ae = e.input.charCodeAt(++e.position), (Z = C(ae)) >= 0 ? te = (te << 4) + Z : I(e, "expected hexadecimal character");
          e.result += k(te), e.position++;
        } else
          I(e, "unknown escape sequence");
        G = re = e.position;
      } else T(ae) ? (ne(e, G, re, !0), ve(e, Ee(e, !1, B)), G = re = e.position) : e.position === e.lineStart && J(e) ? I(e, "unexpected end of the document within a double quoted scalar") : (e.position++, re = e.position);
    }
    I(e, "unexpected end of the stream within a double quoted scalar");
  }
  function N(e, B) {
    var G = !0, re, W, te, Z = e.tag, ae, le = e.anchor, Re, Te, me, R, $, V = /* @__PURE__ */ Object.create(null), z, X, ie, ee;
    if (ee = e.input.charCodeAt(e.position), ee === 91)
      Te = 93, $ = !1, ae = [];
    else if (ee === 123)
      Te = 125, $ = !0, ae = {};
    else
      return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = ae), ee = e.input.charCodeAt(++e.position); ee !== 0; ) {
      if (Ee(e, !0, B), ee = e.input.charCodeAt(e.position), ee === Te)
        return e.position++, e.tag = Z, e.anchor = le, e.kind = $ ? "mapping" : "sequence", e.result = ae, !0;
      G ? ee === 44 && I(e, "expected the node content, but found ','") : I(e, "missed comma between flow collection entries"), X = z = ie = null, me = R = !1, ee === 63 && (Re = e.input.charCodeAt(e.position + 1), O(Re) && (me = R = !0, e.position++, Ee(e, !0, B))), re = e.line, W = e.lineStart, te = e.position, Ae(e, B, l, !1, !0), X = e.tag, z = e.result, Ee(e, !0, B), ee = e.input.charCodeAt(e.position), (R || e.line === re) && ee === 58 && (me = !0, ee = e.input.charCodeAt(++e.position), Ee(e, !0, B), Ae(e, B, l, !1, !0), ie = e.result), $ ? ce(e, ae, V, X, z, ie, re, W, te) : me ? ae.push(ce(e, null, V, X, z, ie, re, W, te)) : ae.push(z), Ee(e, !0, B), ee = e.input.charCodeAt(e.position), ee === 44 ? (G = !0, ee = e.input.charCodeAt(++e.position)) : G = !1;
    }
    I(e, "unexpected end of the stream within a flow collection");
  }
  function ue(e, B) {
    var G, re, W = s, te = !1, Z = !1, ae = B, le = 0, Re = !1, Te, me;
    if (me = e.input.charCodeAt(e.position), me === 124)
      re = !1;
    else if (me === 62)
      re = !0;
    else
      return !1;
    for (e.kind = "scalar", e.result = ""; me !== 0; )
      if (me = e.input.charCodeAt(++e.position), me === 43 || me === 45)
        s === W ? W = me === 43 ? o : r : I(e, "repeat of a chomping mode identifier");
      else if ((Te = A(me)) >= 0)
        Te === 0 ? I(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : Z ? I(e, "repeat of an indentation width identifier") : (ae = B + Te - 1, Z = !0);
      else
        break;
    if (P(me)) {
      do
        me = e.input.charCodeAt(++e.position);
      while (P(me));
      if (me === 35)
        do
          me = e.input.charCodeAt(++e.position);
        while (!T(me) && me !== 0);
    }
    for (; me !== 0; ) {
      for (ge(e), e.lineIndent = 0, me = e.input.charCodeAt(e.position); (!Z || e.lineIndent < ae) && me === 32; )
        e.lineIndent++, me = e.input.charCodeAt(++e.position);
      if (!Z && e.lineIndent > ae && (ae = e.lineIndent), T(me)) {
        le++;
        continue;
      }
      if (e.lineIndent < ae) {
        W === o ? e.result += t.repeat(`
`, te ? 1 + le : le) : W === s && te && (e.result += `
`);
        break;
      }
      for (re ? P(me) ? (Re = !0, e.result += t.repeat(`
`, te ? 1 + le : le)) : Re ? (Re = !1, e.result += t.repeat(`
`, le + 1)) : le === 0 ? te && (e.result += " ") : e.result += t.repeat(`
`, le) : e.result += t.repeat(`
`, te ? 1 + le : le), te = !0, Z = !0, le = 0, G = e.position; !T(me) && me !== 0; )
        me = e.input.charCodeAt(++e.position);
      ne(e, G, e.position, !1);
    }
    return !0;
  }
  function he(e, B) {
    var G, re = e.tag, W = e.anchor, te = [], Z, ae = !1, le;
    if (e.firstTabInLine !== -1) return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = te), le = e.input.charCodeAt(e.position); le !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, I(e, "tab characters must not be used in indentation")), !(le !== 45 || (Z = e.input.charCodeAt(e.position + 1), !O(Z)))); ) {
      if (ae = !0, e.position++, Ee(e, !0, -1) && e.lineIndent <= B) {
        te.push(null), le = e.input.charCodeAt(e.position);
        continue;
      }
      if (G = e.line, Ae(e, B, d, !1, !0), te.push(e.result), Ee(e, !0, -1), le = e.input.charCodeAt(e.position), (e.line === G || e.lineIndent > B) && le !== 0)
        I(e, "bad indentation of a sequence entry");
      else if (e.lineIndent < B)
        break;
    }
    return ae ? (e.tag = re, e.anchor = W, e.kind = "sequence", e.result = te, !0) : !1;
  }
  function pe(e, B, G) {
    var re, W, te, Z, ae, le, Re = e.tag, Te = e.anchor, me = {}, R = /* @__PURE__ */ Object.create(null), $ = null, V = null, z = null, X = !1, ie = !1, ee;
    if (e.firstTabInLine !== -1) return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = me), ee = e.input.charCodeAt(e.position); ee !== 0; ) {
      if (!X && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, I(e, "tab characters must not be used in indentation")), re = e.input.charCodeAt(e.position + 1), te = e.line, (ee === 63 || ee === 58) && O(re))
        ee === 63 ? (X && (ce(e, me, R, $, V, null, Z, ae, le), $ = V = z = null), ie = !0, X = !0, W = !0) : X ? (X = !1, W = !0) : I(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, ee = re;
      else {
        if (Z = e.line, ae = e.lineStart, le = e.position, !Ae(e, G, a, !1, !0))
          break;
        if (e.line === te) {
          for (ee = e.input.charCodeAt(e.position); P(ee); )
            ee = e.input.charCodeAt(++e.position);
          if (ee === 58)
            ee = e.input.charCodeAt(++e.position), O(ee) || I(e, "a whitespace character is expected after the key-value separator within a block mapping"), X && (ce(e, me, R, $, V, null, Z, ae, le), $ = V = z = null), ie = !0, X = !1, W = !1, $ = e.tag, V = e.result;
          else if (ie)
            I(e, "can not read an implicit mapping pair; a colon is missed");
          else
            return e.tag = Re, e.anchor = Te, !0;
        } else if (ie)
          I(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return e.tag = Re, e.anchor = Te, !0;
      }
      if ((e.line === te || e.lineIndent > B) && (X && (Z = e.line, ae = e.lineStart, le = e.position), Ae(e, B, i, !0, W) && (X ? V = e.result : z = e.result), X || (ce(e, me, R, $, V, z, Z, ae, le), $ = V = z = null), Ee(e, !0, -1), ee = e.input.charCodeAt(e.position)), (e.line === te || e.lineIndent > B) && ee !== 0)
        I(e, "bad indentation of a mapping entry");
      else if (e.lineIndent < B)
        break;
    }
    return X && ce(e, me, R, $, V, null, Z, ae, le), ie && (e.tag = Re, e.anchor = Te, e.kind = "mapping", e.result = me), ie;
  }
  function _e(e) {
    var B, G = !1, re = !1, W, te, Z;
    if (Z = e.input.charCodeAt(e.position), Z !== 33) return !1;
    if (e.tag !== null && I(e, "duplication of a tag property"), Z = e.input.charCodeAt(++e.position), Z === 60 ? (G = !0, Z = e.input.charCodeAt(++e.position)) : Z === 33 ? (re = !0, W = "!!", Z = e.input.charCodeAt(++e.position)) : W = "!", B = e.position, G) {
      do
        Z = e.input.charCodeAt(++e.position);
      while (Z !== 0 && Z !== 62);
      e.position < e.length ? (te = e.input.slice(B, e.position), Z = e.input.charCodeAt(++e.position)) : I(e, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; Z !== 0 && !O(Z); )
        Z === 33 && (re ? I(e, "tag suffix cannot contain exclamation marks") : (W = e.input.slice(B - 1, e.position + 1), y.test(W) || I(e, "named tag handle cannot contain such characters"), re = !0, B = e.position + 1)), Z = e.input.charCodeAt(++e.position);
      te = e.input.slice(B, e.position), v.test(te) && I(e, "tag suffix cannot contain flow indicator characters");
    }
    te && !p.test(te) && I(e, "tag name cannot contain such characters: " + te);
    try {
      te = decodeURIComponent(te);
    } catch {
      I(e, "tag name is malformed: " + te);
    }
    return G ? e.tag = te : f.call(e.tagMap, W) ? e.tag = e.tagMap[W] + te : W === "!" ? e.tag = "!" + te : W === "!!" ? e.tag = "tag:yaml.org,2002:" + te : I(e, 'undeclared tag handle "' + W + '"'), !0;
  }
  function ye(e) {
    var B, G;
    if (G = e.input.charCodeAt(e.position), G !== 38) return !1;
    for (e.anchor !== null && I(e, "duplication of an anchor property"), G = e.input.charCodeAt(++e.position), B = e.position; G !== 0 && !O(G) && !M(G); )
      G = e.input.charCodeAt(++e.position);
    return e.position === B && I(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(B, e.position), !0;
  }
  function je(e) {
    var B, G, re;
    if (re = e.input.charCodeAt(e.position), re !== 42) return !1;
    for (re = e.input.charCodeAt(++e.position), B = e.position; re !== 0 && !O(re) && !M(re); )
      re = e.input.charCodeAt(++e.position);
    return e.position === B && I(e, "name of an alias node must contain at least one character"), G = e.input.slice(B, e.position), f.call(e.anchorMap, G) || I(e, 'unidentified alias "' + G + '"'), e.result = e.anchorMap[G], Ee(e, !0, -1), !0;
  }
  function Ae(e, B, G, re, W) {
    var te, Z, ae, le = 1, Re = !1, Te = !1, me, R, $, V, z, X;
    if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, te = Z = ae = i === G || d === G, re && Ee(e, !0, -1) && (Re = !0, e.lineIndent > B ? le = 1 : e.lineIndent === B ? le = 0 : e.lineIndent < B && (le = -1)), le === 1)
      for (; _e(e) || ye(e); )
        Ee(e, !0, -1) ? (Re = !0, ae = te, e.lineIndent > B ? le = 1 : e.lineIndent === B ? le = 0 : e.lineIndent < B && (le = -1)) : ae = !1;
    if (ae && (ae = Re || W), (le === 1 || i === G) && (l === G || a === G ? z = B : z = B + 1, X = e.position - e.lineStart, le === 1 ? ae && (he(e, X) || pe(e, X, z)) || N(e, z) ? Te = !0 : (Z && ue(e, z) || g(e, z) || H(e, z) ? Te = !0 : je(e) ? (Te = !0, (e.tag !== null || e.anchor !== null) && I(e, "alias node should not have any properties")) : w(e, z, l === G) && (Te = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : le === 0 && (Te = ae && he(e, X))), e.tag === null)
      e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
    else if (e.tag === "?") {
      for (e.result !== null && e.kind !== "scalar" && I(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), me = 0, R = e.implicitTypes.length; me < R; me += 1)
        if (V = e.implicitTypes[me], V.resolve(e.result)) {
          e.result = V.construct(e.result), e.tag = V.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
          break;
        }
    } else if (e.tag !== "!") {
      if (f.call(e.typeMap[e.kind || "fallback"], e.tag))
        V = e.typeMap[e.kind || "fallback"][e.tag];
      else
        for (V = null, $ = e.typeMap.multi[e.kind || "fallback"], me = 0, R = $.length; me < R; me += 1)
          if (e.tag.slice(0, $[me].tag.length) === $[me].tag) {
            V = $[me];
            break;
          }
      V || I(e, "unknown tag !<" + e.tag + ">"), e.result !== null && V.kind !== e.kind && I(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + V.kind + '", not "' + e.kind + '"'), V.resolve(e.result, e.tag) ? (e.result = V.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : I(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
    }
    return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || Te;
  }
  function qe(e) {
    var B = e.position, G, re, W, te = !1, Z;
    for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (Z = e.input.charCodeAt(e.position)) !== 0 && (Ee(e, !0, -1), Z = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || Z !== 37)); ) {
      for (te = !0, Z = e.input.charCodeAt(++e.position), G = e.position; Z !== 0 && !O(Z); )
        Z = e.input.charCodeAt(++e.position);
      for (re = e.input.slice(G, e.position), W = [], re.length < 1 && I(e, "directive name must not be less than one character in length"); Z !== 0; ) {
        for (; P(Z); )
          Z = e.input.charCodeAt(++e.position);
        if (Z === 35) {
          do
            Z = e.input.charCodeAt(++e.position);
          while (Z !== 0 && !T(Z));
          break;
        }
        if (T(Z)) break;
        for (G = e.position; Z !== 0 && !O(Z); )
          Z = e.input.charCodeAt(++e.position);
        W.push(e.input.slice(G, e.position));
      }
      Z !== 0 && ge(e), f.call(Y, re) ? Y[re](e, re, W) : Q(e, 'unknown document directive "' + re + '"');
    }
    if (Ee(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, Ee(e, !0, -1)) : te && I(e, "directives end mark is expected"), Ae(e, e.lineIndent - 1, i, !1, !0), Ee(e, !0, -1), e.checkLineBreaks && m.test(e.input.slice(B, e.position)) && Q(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && J(e)) {
      e.input.charCodeAt(e.position) === 46 && (e.position += 3, Ee(e, !0, -1));
      return;
    }
    if (e.position < e.length - 1)
      I(e, "end of the stream or a document separator is expected");
    else
      return;
  }
  function lt(e, B) {
    e = String(e), B = B || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
    var G = new F(e, B), re = e.indexOf("\0");
    for (re !== -1 && (G.position = re, I(G, "null byte is not allowed in input")), G.input += "\0"; G.input.charCodeAt(G.position) === 32; )
      G.lineIndent += 1, G.position += 1;
    for (; G.position < G.length - 1; )
      qe(G);
    return G.documents;
  }
  function it(e, B, G) {
    B !== null && typeof B == "object" && typeof G > "u" && (G = B, B = null);
    var re = lt(e, G);
    if (typeof B != "function")
      return re;
    for (var W = 0, te = re.length; W < te; W += 1)
      B(re[W]);
  }
  function rt(e, B) {
    var G = lt(e, B);
    if (G.length !== 0) {
      if (G.length === 1)
        return G[0];
      throw new c("expected a single document in the stream, but found more");
    }
  }
  return Fr.loadAll = it, Fr.load = rt, Fr;
}
var ti = {}, zo;
function zc() {
  if (zo) return ti;
  zo = 1;
  var t = mr(), c = gr(), h = ra(), u = Object.prototype.toString, f = Object.prototype.hasOwnProperty, l = 65279, a = 9, d = 10, i = 13, s = 32, r = 33, o = 34, n = 35, m = 37, v = 38, y = 39, p = 42, S = 44, T = 45, P = 58, O = 61, M = 62, C = 63, _ = 64, A = 91, E = 93, k = 96, U = 123, L = 124, q = 125, D = {};
  D[0] = "\\0", D[7] = "\\a", D[8] = "\\b", D[9] = "\\t", D[10] = "\\n", D[11] = "\\v", D[12] = "\\f", D[13] = "\\r", D[27] = "\\e", D[34] = '\\"', D[92] = "\\\\", D[133] = "\\N", D[160] = "\\_", D[8232] = "\\L", D[8233] = "\\P";
  var F = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], j = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function I(R, $) {
    var V, z, X, ie, ee, oe, fe;
    if ($ === null) return {};
    for (V = {}, z = Object.keys($), X = 0, ie = z.length; X < ie; X += 1)
      ee = z[X], oe = String($[ee]), ee.slice(0, 2) === "!!" && (ee = "tag:yaml.org,2002:" + ee.slice(2)), fe = R.compiledTypeMap.fallback[ee], fe && f.call(fe.styleAliases, oe) && (oe = fe.styleAliases[oe]), V[ee] = oe;
    return V;
  }
  function Q(R) {
    var $, V, z;
    if ($ = R.toString(16).toUpperCase(), R <= 255)
      V = "x", z = 2;
    else if (R <= 65535)
      V = "u", z = 4;
    else if (R <= 4294967295)
      V = "U", z = 8;
    else
      throw new c("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + V + t.repeat("0", z - $.length) + $;
  }
  var Y = 1, ne = 2;
  function de(R) {
    this.schema = R.schema || h, this.indent = Math.max(1, R.indent || 2), this.noArrayIndent = R.noArrayIndent || !1, this.skipInvalid = R.skipInvalid || !1, this.flowLevel = t.isNothing(R.flowLevel) ? -1 : R.flowLevel, this.styleMap = I(this.schema, R.styles || null), this.sortKeys = R.sortKeys || !1, this.lineWidth = R.lineWidth || 80, this.noRefs = R.noRefs || !1, this.noCompatMode = R.noCompatMode || !1, this.condenseFlow = R.condenseFlow || !1, this.quotingType = R.quotingType === '"' ? ne : Y, this.forceQuotes = R.forceQuotes || !1, this.replacer = typeof R.replacer == "function" ? R.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function ce(R, $) {
    for (var V = t.repeat(" ", $), z = 0, X = -1, ie = "", ee, oe = R.length; z < oe; )
      X = R.indexOf(`
`, z), X === -1 ? (ee = R.slice(z), z = oe) : (ee = R.slice(z, X + 1), z = X + 1), ee.length && ee !== `
` && (ie += V), ie += ee;
    return ie;
  }
  function ge(R, $) {
    return `
` + t.repeat(" ", R.indent * $);
  }
  function Ee(R, $) {
    var V, z, X;
    for (V = 0, z = R.implicitTypes.length; V < z; V += 1)
      if (X = R.implicitTypes[V], X.resolve($))
        return !0;
    return !1;
  }
  function J(R) {
    return R === s || R === a;
  }
  function ve(R) {
    return 32 <= R && R <= 126 || 161 <= R && R <= 55295 && R !== 8232 && R !== 8233 || 57344 <= R && R <= 65533 && R !== l || 65536 <= R && R <= 1114111;
  }
  function w(R) {
    return ve(R) && R !== l && R !== i && R !== d;
  }
  function g(R, $, V) {
    var z = w(R), X = z && !J(R);
    return (
      // ns-plain-safe
      (V ? (
        // c = flow-in
        z
      ) : z && R !== S && R !== A && R !== E && R !== U && R !== q) && R !== n && !($ === P && !X) || w($) && !J($) && R === n || $ === P && X
    );
  }
  function H(R) {
    return ve(R) && R !== l && !J(R) && R !== T && R !== C && R !== P && R !== S && R !== A && R !== E && R !== U && R !== q && R !== n && R !== v && R !== p && R !== r && R !== L && R !== O && R !== M && R !== y && R !== o && R !== m && R !== _ && R !== k;
  }
  function N(R) {
    return !J(R) && R !== P;
  }
  function ue(R, $) {
    var V = R.charCodeAt($), z;
    return V >= 55296 && V <= 56319 && $ + 1 < R.length && (z = R.charCodeAt($ + 1), z >= 56320 && z <= 57343) ? (V - 55296) * 1024 + z - 56320 + 65536 : V;
  }
  function he(R) {
    var $ = /^\n* /;
    return $.test(R);
  }
  var pe = 1, _e = 2, ye = 3, je = 4, Ae = 5;
  function qe(R, $, V, z, X, ie, ee, oe) {
    var fe, we = 0, Pe = null, De = !1, Ce = !1, It = z !== -1, Ke = -1, gt = H(ue(R, 0)) && N(ue(R, R.length - 1));
    if ($ || ee)
      for (fe = 0; fe < R.length; we >= 65536 ? fe += 2 : fe++) {
        if (we = ue(R, fe), !ve(we))
          return Ae;
        gt = gt && g(we, Pe, oe), Pe = we;
      }
    else {
      for (fe = 0; fe < R.length; we >= 65536 ? fe += 2 : fe++) {
        if (we = ue(R, fe), we === d)
          De = !0, It && (Ce = Ce || // Foldable line = too long, and not more-indented.
          fe - Ke - 1 > z && R[Ke + 1] !== " ", Ke = fe);
        else if (!ve(we))
          return Ae;
        gt = gt && g(we, Pe, oe), Pe = we;
      }
      Ce = Ce || It && fe - Ke - 1 > z && R[Ke + 1] !== " ";
    }
    return !De && !Ce ? gt && !ee && !X(R) ? pe : ie === ne ? Ae : _e : V > 9 && he(R) ? Ae : ee ? ie === ne ? Ae : _e : Ce ? je : ye;
  }
  function lt(R, $, V, z, X) {
    R.dump = (function() {
      if ($.length === 0)
        return R.quotingType === ne ? '""' : "''";
      if (!R.noCompatMode && (F.indexOf($) !== -1 || j.test($)))
        return R.quotingType === ne ? '"' + $ + '"' : "'" + $ + "'";
      var ie = R.indent * Math.max(1, V), ee = R.lineWidth === -1 ? -1 : Math.max(Math.min(R.lineWidth, 40), R.lineWidth - ie), oe = z || R.flowLevel > -1 && V >= R.flowLevel;
      function fe(we) {
        return Ee(R, we);
      }
      switch (qe(
        $,
        oe,
        R.indent,
        ee,
        fe,
        R.quotingType,
        R.forceQuotes && !z,
        X
      )) {
        case pe:
          return $;
        case _e:
          return "'" + $.replace(/'/g, "''") + "'";
        case ye:
          return "|" + it($, R.indent) + rt(ce($, ie));
        case je:
          return ">" + it($, R.indent) + rt(ce(e($, ee), ie));
        case Ae:
          return '"' + G($) + '"';
        default:
          throw new c("impossible error: invalid scalar style");
      }
    })();
  }
  function it(R, $) {
    var V = he(R) ? String($) : "", z = R[R.length - 1] === `
`, X = z && (R[R.length - 2] === `
` || R === `
`), ie = X ? "+" : z ? "" : "-";
    return V + ie + `
`;
  }
  function rt(R) {
    return R[R.length - 1] === `
` ? R.slice(0, -1) : R;
  }
  function e(R, $) {
    for (var V = /(\n+)([^\n]*)/g, z = (function() {
      var we = R.indexOf(`
`);
      return we = we !== -1 ? we : R.length, V.lastIndex = we, B(R.slice(0, we), $);
    })(), X = R[0] === `
` || R[0] === " ", ie, ee; ee = V.exec(R); ) {
      var oe = ee[1], fe = ee[2];
      ie = fe[0] === " ", z += oe + (!X && !ie && fe !== "" ? `
` : "") + B(fe, $), X = ie;
    }
    return z;
  }
  function B(R, $) {
    if (R === "" || R[0] === " ") return R;
    for (var V = / [^ ]/g, z, X = 0, ie, ee = 0, oe = 0, fe = ""; z = V.exec(R); )
      oe = z.index, oe - X > $ && (ie = ee > X ? ee : oe, fe += `
` + R.slice(X, ie), X = ie + 1), ee = oe;
    return fe += `
`, R.length - X > $ && ee > X ? fe += R.slice(X, ee) + `
` + R.slice(ee + 1) : fe += R.slice(X), fe.slice(1);
  }
  function G(R) {
    for (var $ = "", V = 0, z, X = 0; X < R.length; V >= 65536 ? X += 2 : X++)
      V = ue(R, X), z = D[V], !z && ve(V) ? ($ += R[X], V >= 65536 && ($ += R[X + 1])) : $ += z || Q(V);
    return $;
  }
  function re(R, $, V) {
    var z = "", X = R.tag, ie, ee, oe;
    for (ie = 0, ee = V.length; ie < ee; ie += 1)
      oe = V[ie], R.replacer && (oe = R.replacer.call(V, String(ie), oe)), (le(R, $, oe, !1, !1) || typeof oe > "u" && le(R, $, null, !1, !1)) && (z !== "" && (z += "," + (R.condenseFlow ? "" : " ")), z += R.dump);
    R.tag = X, R.dump = "[" + z + "]";
  }
  function W(R, $, V, z) {
    var X = "", ie = R.tag, ee, oe, fe;
    for (ee = 0, oe = V.length; ee < oe; ee += 1)
      fe = V[ee], R.replacer && (fe = R.replacer.call(V, String(ee), fe)), (le(R, $ + 1, fe, !0, !0, !1, !0) || typeof fe > "u" && le(R, $ + 1, null, !0, !0, !1, !0)) && ((!z || X !== "") && (X += ge(R, $)), R.dump && d === R.dump.charCodeAt(0) ? X += "-" : X += "- ", X += R.dump);
    R.tag = ie, R.dump = X || "[]";
  }
  function te(R, $, V) {
    var z = "", X = R.tag, ie = Object.keys(V), ee, oe, fe, we, Pe;
    for (ee = 0, oe = ie.length; ee < oe; ee += 1)
      Pe = "", z !== "" && (Pe += ", "), R.condenseFlow && (Pe += '"'), fe = ie[ee], we = V[fe], R.replacer && (we = R.replacer.call(V, fe, we)), le(R, $, fe, !1, !1) && (R.dump.length > 1024 && (Pe += "? "), Pe += R.dump + (R.condenseFlow ? '"' : "") + ":" + (R.condenseFlow ? "" : " "), le(R, $, we, !1, !1) && (Pe += R.dump, z += Pe));
    R.tag = X, R.dump = "{" + z + "}";
  }
  function Z(R, $, V, z) {
    var X = "", ie = R.tag, ee = Object.keys(V), oe, fe, we, Pe, De, Ce;
    if (R.sortKeys === !0)
      ee.sort();
    else if (typeof R.sortKeys == "function")
      ee.sort(R.sortKeys);
    else if (R.sortKeys)
      throw new c("sortKeys must be a boolean or a function");
    for (oe = 0, fe = ee.length; oe < fe; oe += 1)
      Ce = "", (!z || X !== "") && (Ce += ge(R, $)), we = ee[oe], Pe = V[we], R.replacer && (Pe = R.replacer.call(V, we, Pe)), le(R, $ + 1, we, !0, !0, !0) && (De = R.tag !== null && R.tag !== "?" || R.dump && R.dump.length > 1024, De && (R.dump && d === R.dump.charCodeAt(0) ? Ce += "?" : Ce += "? "), Ce += R.dump, De && (Ce += ge(R, $)), le(R, $ + 1, Pe, !0, De) && (R.dump && d === R.dump.charCodeAt(0) ? Ce += ":" : Ce += ": ", Ce += R.dump, X += Ce));
    R.tag = ie, R.dump = X || "{}";
  }
  function ae(R, $, V) {
    var z, X, ie, ee, oe, fe;
    for (X = V ? R.explicitTypes : R.implicitTypes, ie = 0, ee = X.length; ie < ee; ie += 1)
      if (oe = X[ie], (oe.instanceOf || oe.predicate) && (!oe.instanceOf || typeof $ == "object" && $ instanceof oe.instanceOf) && (!oe.predicate || oe.predicate($))) {
        if (V ? oe.multi && oe.representName ? R.tag = oe.representName($) : R.tag = oe.tag : R.tag = "?", oe.represent) {
          if (fe = R.styleMap[oe.tag] || oe.defaultStyle, u.call(oe.represent) === "[object Function]")
            z = oe.represent($, fe);
          else if (f.call(oe.represent, fe))
            z = oe.represent[fe]($, fe);
          else
            throw new c("!<" + oe.tag + '> tag resolver accepts not "' + fe + '" style');
          R.dump = z;
        }
        return !0;
      }
    return !1;
  }
  function le(R, $, V, z, X, ie, ee) {
    R.tag = null, R.dump = V, ae(R, V, !1) || ae(R, V, !0);
    var oe = u.call(R.dump), fe = z, we;
    z && (z = R.flowLevel < 0 || R.flowLevel > $);
    var Pe = oe === "[object Object]" || oe === "[object Array]", De, Ce;
    if (Pe && (De = R.duplicates.indexOf(V), Ce = De !== -1), (R.tag !== null && R.tag !== "?" || Ce || R.indent !== 2 && $ > 0) && (X = !1), Ce && R.usedDuplicates[De])
      R.dump = "*ref_" + De;
    else {
      if (Pe && Ce && !R.usedDuplicates[De] && (R.usedDuplicates[De] = !0), oe === "[object Object]")
        z && Object.keys(R.dump).length !== 0 ? (Z(R, $, R.dump, X), Ce && (R.dump = "&ref_" + De + R.dump)) : (te(R, $, R.dump), Ce && (R.dump = "&ref_" + De + " " + R.dump));
      else if (oe === "[object Array]")
        z && R.dump.length !== 0 ? (R.noArrayIndent && !ee && $ > 0 ? W(R, $ - 1, R.dump, X) : W(R, $, R.dump, X), Ce && (R.dump = "&ref_" + De + R.dump)) : (re(R, $, R.dump), Ce && (R.dump = "&ref_" + De + " " + R.dump));
      else if (oe === "[object String]")
        R.tag !== "?" && lt(R, R.dump, $, ie, fe);
      else {
        if (oe === "[object Undefined]")
          return !1;
        if (R.skipInvalid) return !1;
        throw new c("unacceptable kind of an object to dump " + oe);
      }
      R.tag !== null && R.tag !== "?" && (we = encodeURI(
        R.tag[0] === "!" ? R.tag.slice(1) : R.tag
      ).replace(/!/g, "%21"), R.tag[0] === "!" ? we = "!" + we : we.slice(0, 18) === "tag:yaml.org,2002:" ? we = "!!" + we.slice(18) : we = "!<" + we + ">", R.dump = we + " " + R.dump);
    }
    return !0;
  }
  function Re(R, $) {
    var V = [], z = [], X, ie;
    for (Te(R, V, z), X = 0, ie = z.length; X < ie; X += 1)
      $.duplicates.push(V[z[X]]);
    $.usedDuplicates = new Array(ie);
  }
  function Te(R, $, V) {
    var z, X, ie;
    if (R !== null && typeof R == "object")
      if (X = $.indexOf(R), X !== -1)
        V.indexOf(X) === -1 && V.push(X);
      else if ($.push(R), Array.isArray(R))
        for (X = 0, ie = R.length; X < ie; X += 1)
          Te(R[X], $, V);
      else
        for (z = Object.keys(R), X = 0, ie = z.length; X < ie; X += 1)
          Te(R[z[X]], $, V);
  }
  function me(R, $) {
    $ = $ || {};
    var V = new de($);
    V.noRefs || Re(R, V);
    var z = R;
    return V.replacer && (z = V.replacer.call({ "": z }, "", z)), le(V, 0, z, !0, !0) ? V.dump + `
` : "";
  }
  return ti.dump = me, ti;
}
var Xo;
function na() {
  if (Xo) return ke;
  Xo = 1;
  var t = Yc(), c = zc();
  function h(u, f) {
    return function() {
      throw new Error("Function yaml." + u + " is removed in js-yaml 4. Use yaml." + f + " instead, which is now safe by default.");
    };
  }
  return ke.Type = Be(), ke.Schema = Ll(), ke.FAILSAFE_SCHEMA = ql(), ke.JSON_SCHEMA = Gl(), ke.CORE_SCHEMA = Wl(), ke.DEFAULT_SCHEMA = ra(), ke.load = t.load, ke.loadAll = t.loadAll, ke.dump = c.dump, ke.YAMLException = gr(), ke.types = {
    binary: zl(),
    float: jl(),
    map: kl(),
    null: Ml(),
    pairs: Kl(),
    set: Jl(),
    timestamp: Vl(),
    bool: Bl(),
    int: Hl(),
    merge: Yl(),
    omap: Xl(),
    seq: $l(),
    str: Ul()
  }, ke.safeLoad = h("safeLoad", "load"), ke.safeLoadAll = h("safeLoadAll", "loadAll"), ke.safeDump = h("safeDump", "dump"), ke;
}
var Yt = {}, Ko;
function Xc() {
  if (Ko) return Yt;
  Ko = 1, Object.defineProperty(Yt, "__esModule", { value: !0 }), Yt.Lazy = void 0;
  class t {
    constructor(h) {
      this._value = null, this.creator = h;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const h = this.creator();
      return this.value = h, h;
    }
    set value(h) {
      this._value = h, this.creator = null;
    }
  }
  return Yt.Lazy = t, Yt;
}
var xr = { exports: {} }, ri, Jo;
function Br() {
  if (Jo) return ri;
  Jo = 1;
  const t = "2.0.0", c = 256, h = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, u = 16, f = c - 6;
  return ri = {
    MAX_LENGTH: c,
    MAX_SAFE_COMPONENT_LENGTH: u,
    MAX_SAFE_BUILD_LENGTH: f,
    MAX_SAFE_INTEGER: h,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: t,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, ri;
}
var ni, Qo;
function Hr() {
  return Qo || (Qo = 1, ni = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...c) => console.error("SEMVER", ...c) : () => {
  }), ni;
}
var Zo;
function vr() {
  return Zo || (Zo = 1, (function(t, c) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: h,
      MAX_SAFE_BUILD_LENGTH: u,
      MAX_LENGTH: f
    } = Br(), l = Hr();
    c = t.exports = {};
    const a = c.re = [], d = c.safeRe = [], i = c.src = [], s = c.safeSrc = [], r = c.t = {};
    let o = 0;
    const n = "[a-zA-Z0-9-]", m = [
      ["\\s", 1],
      ["\\d", f],
      [n, u]
    ], v = (p) => {
      for (const [S, T] of m)
        p = p.split(`${S}*`).join(`${S}{0,${T}}`).split(`${S}+`).join(`${S}{1,${T}}`);
      return p;
    }, y = (p, S, T) => {
      const P = v(S), O = o++;
      l(p, O, S), r[p] = O, i[O] = S, s[O] = P, a[O] = new RegExp(S, T ? "g" : void 0), d[O] = new RegExp(P, T ? "g" : void 0);
    };
    y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${n}*`), y("MAINVERSION", `(${i[r.NUMERICIDENTIFIER]})\\.(${i[r.NUMERICIDENTIFIER]})\\.(${i[r.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${i[r.NUMERICIDENTIFIERLOOSE]})\\.(${i[r.NUMERICIDENTIFIERLOOSE]})\\.(${i[r.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${i[r.NONNUMERICIDENTIFIER]}|${i[r.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${i[r.NONNUMERICIDENTIFIER]}|${i[r.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${i[r.PRERELEASEIDENTIFIER]}(?:\\.${i[r.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${i[r.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${i[r.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${n}+`), y("BUILD", `(?:\\+(${i[r.BUILDIDENTIFIER]}(?:\\.${i[r.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${i[r.MAINVERSION]}${i[r.PRERELEASE]}?${i[r.BUILD]}?`), y("FULL", `^${i[r.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${i[r.MAINVERSIONLOOSE]}${i[r.PRERELEASELOOSE]}?${i[r.BUILD]}?`), y("LOOSE", `^${i[r.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${i[r.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${i[r.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${i[r.XRANGEIDENTIFIER]})(?:\\.(${i[r.XRANGEIDENTIFIER]})(?:\\.(${i[r.XRANGEIDENTIFIER]})(?:${i[r.PRERELEASE]})?${i[r.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${i[r.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[r.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[r.XRANGEIDENTIFIERLOOSE]})(?:${i[r.PRERELEASELOOSE]})?${i[r.BUILD]}?)?)?`), y("XRANGE", `^${i[r.GTLT]}\\s*${i[r.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${i[r.GTLT]}\\s*${i[r.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${h}})(?:\\.(\\d{1,${h}}))?(?:\\.(\\d{1,${h}}))?`), y("COERCE", `${i[r.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", i[r.COERCEPLAIN] + `(?:${i[r.PRERELEASE]})?(?:${i[r.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", i[r.COERCE], !0), y("COERCERTLFULL", i[r.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${i[r.LONETILDE]}\\s+`, !0), c.tildeTrimReplace = "$1~", y("TILDE", `^${i[r.LONETILDE]}${i[r.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${i[r.LONETILDE]}${i[r.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${i[r.LONECARET]}\\s+`, !0), c.caretTrimReplace = "$1^", y("CARET", `^${i[r.LONECARET]}${i[r.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${i[r.LONECARET]}${i[r.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${i[r.GTLT]}\\s*(${i[r.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${i[r.GTLT]}\\s*(${i[r.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${i[r.GTLT]}\\s*(${i[r.LOOSEPLAIN]}|${i[r.XRANGEPLAIN]})`, !0), c.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${i[r.XRANGEPLAIN]})\\s+-\\s+(${i[r.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${i[r.XRANGEPLAINLOOSE]})\\s+-\\s+(${i[r.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })(xr, xr.exports)), xr.exports;
}
var ii, es;
function ia() {
  if (es) return ii;
  es = 1;
  const t = Object.freeze({ loose: !0 }), c = Object.freeze({});
  return ii = (u) => u ? typeof u != "object" ? t : u : c, ii;
}
var ai, ts;
function Ql() {
  if (ts) return ai;
  ts = 1;
  const t = /^[0-9]+$/, c = (u, f) => {
    if (typeof u == "number" && typeof f == "number")
      return u === f ? 0 : u < f ? -1 : 1;
    const l = t.test(u), a = t.test(f);
    return l && a && (u = +u, f = +f), u === f ? 0 : l && !a ? -1 : a && !l ? 1 : u < f ? -1 : 1;
  };
  return ai = {
    compareIdentifiers: c,
    rcompareIdentifiers: (u, f) => c(f, u)
  }, ai;
}
var oi, rs;
function He() {
  if (rs) return oi;
  rs = 1;
  const t = Hr(), { MAX_LENGTH: c, MAX_SAFE_INTEGER: h } = Br(), { safeRe: u, t: f } = vr(), l = ia(), { compareIdentifiers: a } = Ql();
  class d {
    constructor(s, r) {
      if (r = l(r), s instanceof d) {
        if (s.loose === !!r.loose && s.includePrerelease === !!r.includePrerelease)
          return s;
        s = s.version;
      } else if (typeof s != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof s}".`);
      if (s.length > c)
        throw new TypeError(
          `version is longer than ${c} characters`
        );
      t("SemVer", s, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
      const o = s.trim().match(r.loose ? u[f.LOOSE] : u[f.FULL]);
      if (!o)
        throw new TypeError(`Invalid Version: ${s}`);
      if (this.raw = s, this.major = +o[1], this.minor = +o[2], this.patch = +o[3], this.major > h || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > h || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > h || this.patch < 0)
        throw new TypeError("Invalid patch version");
      o[4] ? this.prerelease = o[4].split(".").map((n) => {
        if (/^[0-9]+$/.test(n)) {
          const m = +n;
          if (m >= 0 && m < h)
            return m;
        }
        return n;
      }) : this.prerelease = [], this.build = o[5] ? o[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(s) {
      if (t("SemVer.compare", this.version, this.options, s), !(s instanceof d)) {
        if (typeof s == "string" && s === this.version)
          return 0;
        s = new d(s, this.options);
      }
      return s.version === this.version ? 0 : this.compareMain(s) || this.comparePre(s);
    }
    compareMain(s) {
      return s instanceof d || (s = new d(s, this.options)), this.major < s.major ? -1 : this.major > s.major ? 1 : this.minor < s.minor ? -1 : this.minor > s.minor ? 1 : this.patch < s.patch ? -1 : this.patch > s.patch ? 1 : 0;
    }
    comparePre(s) {
      if (s instanceof d || (s = new d(s, this.options)), this.prerelease.length && !s.prerelease.length)
        return -1;
      if (!this.prerelease.length && s.prerelease.length)
        return 1;
      if (!this.prerelease.length && !s.prerelease.length)
        return 0;
      let r = 0;
      do {
        const o = this.prerelease[r], n = s.prerelease[r];
        if (t("prerelease compare", r, o, n), o === void 0 && n === void 0)
          return 0;
        if (n === void 0)
          return 1;
        if (o === void 0)
          return -1;
        if (o === n)
          continue;
        return a(o, n);
      } while (++r);
    }
    compareBuild(s) {
      s instanceof d || (s = new d(s, this.options));
      let r = 0;
      do {
        const o = this.build[r], n = s.build[r];
        if (t("build compare", r, o, n), o === void 0 && n === void 0)
          return 0;
        if (n === void 0)
          return 1;
        if (o === void 0)
          return -1;
        if (o === n)
          continue;
        return a(o, n);
      } while (++r);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(s, r, o) {
      if (s.startsWith("pre")) {
        if (!r && o === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (r) {
          const n = `-${r}`.match(this.options.loose ? u[f.PRERELEASELOOSE] : u[f.PRERELEASE]);
          if (!n || n[1] !== r)
            throw new Error(`invalid identifier: ${r}`);
        }
      }
      switch (s) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, o);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, o);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", r, o), this.inc("pre", r, o);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", r, o), this.inc("pre", r, o);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const n = Number(o) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [n];
          else {
            let m = this.prerelease.length;
            for (; --m >= 0; )
              typeof this.prerelease[m] == "number" && (this.prerelease[m]++, m = -2);
            if (m === -1) {
              if (r === this.prerelease.join(".") && o === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(n);
            }
          }
          if (r) {
            let m = [r, n];
            o === !1 && (m = [r]), a(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = m) : this.prerelease = m;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${s}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return oi = d, oi;
}
var si, ns;
function qt() {
  if (ns) return si;
  ns = 1;
  const t = He();
  return si = (h, u, f = !1) => {
    if (h instanceof t)
      return h;
    try {
      return new t(h, u);
    } catch (l) {
      if (!f)
        return null;
      throw l;
    }
  }, si;
}
var li, is;
function Kc() {
  if (is) return li;
  is = 1;
  const t = qt();
  return li = (h, u) => {
    const f = t(h, u);
    return f ? f.version : null;
  }, li;
}
var ui, as;
function Jc() {
  if (as) return ui;
  as = 1;
  const t = qt();
  return ui = (h, u) => {
    const f = t(h.trim().replace(/^[=v]+/, ""), u);
    return f ? f.version : null;
  }, ui;
}
var ci, os;
function Qc() {
  if (os) return ci;
  os = 1;
  const t = He();
  return ci = (h, u, f, l, a) => {
    typeof f == "string" && (a = l, l = f, f = void 0);
    try {
      return new t(
        h instanceof t ? h.version : h,
        f
      ).inc(u, l, a).version;
    } catch {
      return null;
    }
  }, ci;
}
var fi, ss;
function Zc() {
  if (ss) return fi;
  ss = 1;
  const t = qt();
  return fi = (h, u) => {
    const f = t(h, null, !0), l = t(u, null, !0), a = f.compare(l);
    if (a === 0)
      return null;
    const d = a > 0, i = d ? f : l, s = d ? l : f, r = !!i.prerelease.length;
    if (!!s.prerelease.length && !r) {
      if (!s.patch && !s.minor)
        return "major";
      if (s.compareMain(i) === 0)
        return s.minor && !s.patch ? "minor" : "patch";
    }
    const n = r ? "pre" : "";
    return f.major !== l.major ? n + "major" : f.minor !== l.minor ? n + "minor" : f.patch !== l.patch ? n + "patch" : "prerelease";
  }, fi;
}
var di, ls;
function ef() {
  if (ls) return di;
  ls = 1;
  const t = He();
  return di = (h, u) => new t(h, u).major, di;
}
var hi, us;
function tf() {
  if (us) return hi;
  us = 1;
  const t = He();
  return hi = (h, u) => new t(h, u).minor, hi;
}
var pi, cs;
function rf() {
  if (cs) return pi;
  cs = 1;
  const t = He();
  return pi = (h, u) => new t(h, u).patch, pi;
}
var mi, fs;
function nf() {
  if (fs) return mi;
  fs = 1;
  const t = qt();
  return mi = (h, u) => {
    const f = t(h, u);
    return f && f.prerelease.length ? f.prerelease : null;
  }, mi;
}
var gi, ds;
function et() {
  if (ds) return gi;
  ds = 1;
  const t = He();
  return gi = (h, u, f) => new t(h, f).compare(new t(u, f)), gi;
}
var vi, hs;
function af() {
  if (hs) return vi;
  hs = 1;
  const t = et();
  return vi = (h, u, f) => t(u, h, f), vi;
}
var Ei, ps;
function of() {
  if (ps) return Ei;
  ps = 1;
  const t = et();
  return Ei = (h, u) => t(h, u, !0), Ei;
}
var yi, ms;
function aa() {
  if (ms) return yi;
  ms = 1;
  const t = He();
  return yi = (h, u, f) => {
    const l = new t(h, f), a = new t(u, f);
    return l.compare(a) || l.compareBuild(a);
  }, yi;
}
var wi, gs;
function sf() {
  if (gs) return wi;
  gs = 1;
  const t = aa();
  return wi = (h, u) => h.sort((f, l) => t(f, l, u)), wi;
}
var _i, vs;
function lf() {
  if (vs) return _i;
  vs = 1;
  const t = aa();
  return _i = (h, u) => h.sort((f, l) => t(l, f, u)), _i;
}
var Si, Es;
function jr() {
  if (Es) return Si;
  Es = 1;
  const t = et();
  return Si = (h, u, f) => t(h, u, f) > 0, Si;
}
var Ai, ys;
function oa() {
  if (ys) return Ai;
  ys = 1;
  const t = et();
  return Ai = (h, u, f) => t(h, u, f) < 0, Ai;
}
var Ri, ws;
function Zl() {
  if (ws) return Ri;
  ws = 1;
  const t = et();
  return Ri = (h, u, f) => t(h, u, f) === 0, Ri;
}
var Ti, _s;
function eu() {
  if (_s) return Ti;
  _s = 1;
  const t = et();
  return Ti = (h, u, f) => t(h, u, f) !== 0, Ti;
}
var Ci, Ss;
function sa() {
  if (Ss) return Ci;
  Ss = 1;
  const t = et();
  return Ci = (h, u, f) => t(h, u, f) >= 0, Ci;
}
var bi, As;
function la() {
  if (As) return bi;
  As = 1;
  const t = et();
  return bi = (h, u, f) => t(h, u, f) <= 0, bi;
}
var Pi, Rs;
function tu() {
  if (Rs) return Pi;
  Rs = 1;
  const t = Zl(), c = eu(), h = jr(), u = sa(), f = oa(), l = la();
  return Pi = (d, i, s, r) => {
    switch (i) {
      case "===":
        return typeof d == "object" && (d = d.version), typeof s == "object" && (s = s.version), d === s;
      case "!==":
        return typeof d == "object" && (d = d.version), typeof s == "object" && (s = s.version), d !== s;
      case "":
      case "=":
      case "==":
        return t(d, s, r);
      case "!=":
        return c(d, s, r);
      case ">":
        return h(d, s, r);
      case ">=":
        return u(d, s, r);
      case "<":
        return f(d, s, r);
      case "<=":
        return l(d, s, r);
      default:
        throw new TypeError(`Invalid operator: ${i}`);
    }
  }, Pi;
}
var Oi, Ts;
function uf() {
  if (Ts) return Oi;
  Ts = 1;
  const t = He(), c = qt(), { safeRe: h, t: u } = vr();
  return Oi = (l, a) => {
    if (l instanceof t)
      return l;
    if (typeof l == "number" && (l = String(l)), typeof l != "string")
      return null;
    a = a || {};
    let d = null;
    if (!a.rtl)
      d = l.match(a.includePrerelease ? h[u.COERCEFULL] : h[u.COERCE]);
    else {
      const m = a.includePrerelease ? h[u.COERCERTLFULL] : h[u.COERCERTL];
      let v;
      for (; (v = m.exec(l)) && (!d || d.index + d[0].length !== l.length); )
        (!d || v.index + v[0].length !== d.index + d[0].length) && (d = v), m.lastIndex = v.index + v[1].length + v[2].length;
      m.lastIndex = -1;
    }
    if (d === null)
      return null;
    const i = d[2], s = d[3] || "0", r = d[4] || "0", o = a.includePrerelease && d[5] ? `-${d[5]}` : "", n = a.includePrerelease && d[6] ? `+${d[6]}` : "";
    return c(`${i}.${s}.${r}${o}${n}`, a);
  }, Oi;
}
var Ii, Cs;
function cf() {
  if (Cs) return Ii;
  Cs = 1;
  class t {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(h) {
      const u = this.map.get(h);
      if (u !== void 0)
        return this.map.delete(h), this.map.set(h, u), u;
    }
    delete(h) {
      return this.map.delete(h);
    }
    set(h, u) {
      if (!this.delete(h) && u !== void 0) {
        if (this.map.size >= this.max) {
          const l = this.map.keys().next().value;
          this.delete(l);
        }
        this.map.set(h, u);
      }
      return this;
    }
  }
  return Ii = t, Ii;
}
var Di, bs;
function tt() {
  if (bs) return Di;
  bs = 1;
  const t = /\s+/g;
  class c {
    constructor(F, j) {
      if (j = f(j), F instanceof c)
        return F.loose === !!j.loose && F.includePrerelease === !!j.includePrerelease ? F : new c(F.raw, j);
      if (F instanceof l)
        return this.raw = F.value, this.set = [[F]], this.formatted = void 0, this;
      if (this.options = j, this.loose = !!j.loose, this.includePrerelease = !!j.includePrerelease, this.raw = F.trim().replace(t, " "), this.set = this.raw.split("||").map((I) => this.parseRange(I.trim())).filter((I) => I.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const I = this.set[0];
        if (this.set = this.set.filter((Q) => !y(Q[0])), this.set.length === 0)
          this.set = [I];
        else if (this.set.length > 1) {
          for (const Q of this.set)
            if (Q.length === 1 && p(Q[0])) {
              this.set = [Q];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let F = 0; F < this.set.length; F++) {
          F > 0 && (this.formatted += "||");
          const j = this.set[F];
          for (let I = 0; I < j.length; I++)
            I > 0 && (this.formatted += " "), this.formatted += j[I].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(F) {
      const I = ((this.options.includePrerelease && m) | (this.options.loose && v)) + ":" + F, Q = u.get(I);
      if (Q)
        return Q;
      const Y = this.options.loose, ne = Y ? i[s.HYPHENRANGELOOSE] : i[s.HYPHENRANGE];
      F = F.replace(ne, L(this.options.includePrerelease)), a("hyphen replace", F), F = F.replace(i[s.COMPARATORTRIM], r), a("comparator trim", F), F = F.replace(i[s.TILDETRIM], o), a("tilde trim", F), F = F.replace(i[s.CARETTRIM], n), a("caret trim", F);
      let de = F.split(" ").map((J) => T(J, this.options)).join(" ").split(/\s+/).map((J) => U(J, this.options));
      Y && (de = de.filter((J) => (a("loose invalid filter", J, this.options), !!J.match(i[s.COMPARATORLOOSE])))), a("range list", de);
      const ce = /* @__PURE__ */ new Map(), ge = de.map((J) => new l(J, this.options));
      for (const J of ge) {
        if (y(J))
          return [J];
        ce.set(J.value, J);
      }
      ce.size > 1 && ce.has("") && ce.delete("");
      const Ee = [...ce.values()];
      return u.set(I, Ee), Ee;
    }
    intersects(F, j) {
      if (!(F instanceof c))
        throw new TypeError("a Range is required");
      return this.set.some((I) => S(I, j) && F.set.some((Q) => S(Q, j) && I.every((Y) => Q.every((ne) => Y.intersects(ne, j)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(F) {
      if (!F)
        return !1;
      if (typeof F == "string")
        try {
          F = new d(F, this.options);
        } catch {
          return !1;
        }
      for (let j = 0; j < this.set.length; j++)
        if (q(this.set[j], F, this.options))
          return !0;
      return !1;
    }
  }
  Di = c;
  const h = cf(), u = new h(), f = ia(), l = Gr(), a = Hr(), d = He(), {
    safeRe: i,
    t: s,
    comparatorTrimReplace: r,
    tildeTrimReplace: o,
    caretTrimReplace: n
  } = vr(), { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: v } = Br(), y = (D) => D.value === "<0.0.0-0", p = (D) => D.value === "", S = (D, F) => {
    let j = !0;
    const I = D.slice();
    let Q = I.pop();
    for (; j && I.length; )
      j = I.every((Y) => Q.intersects(Y, F)), Q = I.pop();
    return j;
  }, T = (D, F) => (D = D.replace(i[s.BUILD], ""), a("comp", D, F), D = C(D, F), a("caret", D), D = O(D, F), a("tildes", D), D = A(D, F), a("xrange", D), D = k(D, F), a("stars", D), D), P = (D) => !D || D.toLowerCase() === "x" || D === "*", O = (D, F) => D.trim().split(/\s+/).map((j) => M(j, F)).join(" "), M = (D, F) => {
    const j = F.loose ? i[s.TILDELOOSE] : i[s.TILDE];
    return D.replace(j, (I, Q, Y, ne, de) => {
      a("tilde", D, I, Q, Y, ne, de);
      let ce;
      return P(Q) ? ce = "" : P(Y) ? ce = `>=${Q}.0.0 <${+Q + 1}.0.0-0` : P(ne) ? ce = `>=${Q}.${Y}.0 <${Q}.${+Y + 1}.0-0` : de ? (a("replaceTilde pr", de), ce = `>=${Q}.${Y}.${ne}-${de} <${Q}.${+Y + 1}.0-0`) : ce = `>=${Q}.${Y}.${ne} <${Q}.${+Y + 1}.0-0`, a("tilde return", ce), ce;
    });
  }, C = (D, F) => D.trim().split(/\s+/).map((j) => _(j, F)).join(" "), _ = (D, F) => {
    a("caret", D, F);
    const j = F.loose ? i[s.CARETLOOSE] : i[s.CARET], I = F.includePrerelease ? "-0" : "";
    return D.replace(j, (Q, Y, ne, de, ce) => {
      a("caret", D, Q, Y, ne, de, ce);
      let ge;
      return P(Y) ? ge = "" : P(ne) ? ge = `>=${Y}.0.0${I} <${+Y + 1}.0.0-0` : P(de) ? Y === "0" ? ge = `>=${Y}.${ne}.0${I} <${Y}.${+ne + 1}.0-0` : ge = `>=${Y}.${ne}.0${I} <${+Y + 1}.0.0-0` : ce ? (a("replaceCaret pr", ce), Y === "0" ? ne === "0" ? ge = `>=${Y}.${ne}.${de}-${ce} <${Y}.${ne}.${+de + 1}-0` : ge = `>=${Y}.${ne}.${de}-${ce} <${Y}.${+ne + 1}.0-0` : ge = `>=${Y}.${ne}.${de}-${ce} <${+Y + 1}.0.0-0`) : (a("no pr"), Y === "0" ? ne === "0" ? ge = `>=${Y}.${ne}.${de}${I} <${Y}.${ne}.${+de + 1}-0` : ge = `>=${Y}.${ne}.${de}${I} <${Y}.${+ne + 1}.0-0` : ge = `>=${Y}.${ne}.${de} <${+Y + 1}.0.0-0`), a("caret return", ge), ge;
    });
  }, A = (D, F) => (a("replaceXRanges", D, F), D.split(/\s+/).map((j) => E(j, F)).join(" ")), E = (D, F) => {
    D = D.trim();
    const j = F.loose ? i[s.XRANGELOOSE] : i[s.XRANGE];
    return D.replace(j, (I, Q, Y, ne, de, ce) => {
      a("xRange", D, I, Q, Y, ne, de, ce);
      const ge = P(Y), Ee = ge || P(ne), J = Ee || P(de), ve = J;
      return Q === "=" && ve && (Q = ""), ce = F.includePrerelease ? "-0" : "", ge ? Q === ">" || Q === "<" ? I = "<0.0.0-0" : I = "*" : Q && ve ? (Ee && (ne = 0), de = 0, Q === ">" ? (Q = ">=", Ee ? (Y = +Y + 1, ne = 0, de = 0) : (ne = +ne + 1, de = 0)) : Q === "<=" && (Q = "<", Ee ? Y = +Y + 1 : ne = +ne + 1), Q === "<" && (ce = "-0"), I = `${Q + Y}.${ne}.${de}${ce}`) : Ee ? I = `>=${Y}.0.0${ce} <${+Y + 1}.0.0-0` : J && (I = `>=${Y}.${ne}.0${ce} <${Y}.${+ne + 1}.0-0`), a("xRange return", I), I;
    });
  }, k = (D, F) => (a("replaceStars", D, F), D.trim().replace(i[s.STAR], "")), U = (D, F) => (a("replaceGTE0", D, F), D.trim().replace(i[F.includePrerelease ? s.GTE0PRE : s.GTE0], "")), L = (D) => (F, j, I, Q, Y, ne, de, ce, ge, Ee, J, ve) => (P(I) ? j = "" : P(Q) ? j = `>=${I}.0.0${D ? "-0" : ""}` : P(Y) ? j = `>=${I}.${Q}.0${D ? "-0" : ""}` : ne ? j = `>=${j}` : j = `>=${j}${D ? "-0" : ""}`, P(ge) ? ce = "" : P(Ee) ? ce = `<${+ge + 1}.0.0-0` : P(J) ? ce = `<${ge}.${+Ee + 1}.0-0` : ve ? ce = `<=${ge}.${Ee}.${J}-${ve}` : D ? ce = `<${ge}.${Ee}.${+J + 1}-0` : ce = `<=${ce}`, `${j} ${ce}`.trim()), q = (D, F, j) => {
    for (let I = 0; I < D.length; I++)
      if (!D[I].test(F))
        return !1;
    if (F.prerelease.length && !j.includePrerelease) {
      for (let I = 0; I < D.length; I++)
        if (a(D[I].semver), D[I].semver !== l.ANY && D[I].semver.prerelease.length > 0) {
          const Q = D[I].semver;
          if (Q.major === F.major && Q.minor === F.minor && Q.patch === F.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return Di;
}
var Ni, Ps;
function Gr() {
  if (Ps) return Ni;
  Ps = 1;
  const t = Symbol("SemVer ANY");
  class c {
    static get ANY() {
      return t;
    }
    constructor(r, o) {
      if (o = h(o), r instanceof c) {
        if (r.loose === !!o.loose)
          return r;
        r = r.value;
      }
      r = r.trim().split(/\s+/).join(" "), a("comparator", r, o), this.options = o, this.loose = !!o.loose, this.parse(r), this.semver === t ? this.value = "" : this.value = this.operator + this.semver.version, a("comp", this);
    }
    parse(r) {
      const o = this.options.loose ? u[f.COMPARATORLOOSE] : u[f.COMPARATOR], n = r.match(o);
      if (!n)
        throw new TypeError(`Invalid comparator: ${r}`);
      this.operator = n[1] !== void 0 ? n[1] : "", this.operator === "=" && (this.operator = ""), n[2] ? this.semver = new d(n[2], this.options.loose) : this.semver = t;
    }
    toString() {
      return this.value;
    }
    test(r) {
      if (a("Comparator.test", r, this.options.loose), this.semver === t || r === t)
        return !0;
      if (typeof r == "string")
        try {
          r = new d(r, this.options);
        } catch {
          return !1;
        }
      return l(r, this.operator, this.semver, this.options);
    }
    intersects(r, o) {
      if (!(r instanceof c))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new i(r.value, o).test(this.value) : r.operator === "" ? r.value === "" ? !0 : new i(this.value, o).test(r.semver) : (o = h(o), o.includePrerelease && (this.value === "<0.0.0-0" || r.value === "<0.0.0-0") || !o.includePrerelease && (this.value.startsWith("<0.0.0") || r.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && r.operator.startsWith(">") || this.operator.startsWith("<") && r.operator.startsWith("<") || this.semver.version === r.semver.version && this.operator.includes("=") && r.operator.includes("=") || l(this.semver, "<", r.semver, o) && this.operator.startsWith(">") && r.operator.startsWith("<") || l(this.semver, ">", r.semver, o) && this.operator.startsWith("<") && r.operator.startsWith(">")));
    }
  }
  Ni = c;
  const h = ia(), { safeRe: u, t: f } = vr(), l = tu(), a = Hr(), d = He(), i = tt();
  return Ni;
}
var Fi, Os;
function Wr() {
  if (Os) return Fi;
  Os = 1;
  const t = tt();
  return Fi = (h, u, f) => {
    try {
      u = new t(u, f);
    } catch {
      return !1;
    }
    return u.test(h);
  }, Fi;
}
var xi, Is;
function ff() {
  if (Is) return xi;
  Is = 1;
  const t = tt();
  return xi = (h, u) => new t(h, u).set.map((f) => f.map((l) => l.value).join(" ").trim().split(" ")), xi;
}
var Li, Ds;
function df() {
  if (Ds) return Li;
  Ds = 1;
  const t = He(), c = tt();
  return Li = (u, f, l) => {
    let a = null, d = null, i = null;
    try {
      i = new c(f, l);
    } catch {
      return null;
    }
    return u.forEach((s) => {
      i.test(s) && (!a || d.compare(s) === -1) && (a = s, d = new t(a, l));
    }), a;
  }, Li;
}
var Ui, Ns;
function hf() {
  if (Ns) return Ui;
  Ns = 1;
  const t = He(), c = tt();
  return Ui = (u, f, l) => {
    let a = null, d = null, i = null;
    try {
      i = new c(f, l);
    } catch {
      return null;
    }
    return u.forEach((s) => {
      i.test(s) && (!a || d.compare(s) === 1) && (a = s, d = new t(a, l));
    }), a;
  }, Ui;
}
var $i, Fs;
function pf() {
  if (Fs) return $i;
  Fs = 1;
  const t = He(), c = tt(), h = jr();
  return $i = (f, l) => {
    f = new c(f, l);
    let a = new t("0.0.0");
    if (f.test(a) || (a = new t("0.0.0-0"), f.test(a)))
      return a;
    a = null;
    for (let d = 0; d < f.set.length; ++d) {
      const i = f.set[d];
      let s = null;
      i.forEach((r) => {
        const o = new t(r.semver.version);
        switch (r.operator) {
          case ">":
            o.prerelease.length === 0 ? o.patch++ : o.prerelease.push(0), o.raw = o.format();
          /* fallthrough */
          case "":
          case ">=":
            (!s || h(o, s)) && (s = o);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${r.operator}`);
        }
      }), s && (!a || h(a, s)) && (a = s);
    }
    return a && f.test(a) ? a : null;
  }, $i;
}
var ki, xs;
function mf() {
  if (xs) return ki;
  xs = 1;
  const t = tt();
  return ki = (h, u) => {
    try {
      return new t(h, u).range || "*";
    } catch {
      return null;
    }
  }, ki;
}
var qi, Ls;
function ua() {
  if (Ls) return qi;
  Ls = 1;
  const t = He(), c = Gr(), { ANY: h } = c, u = tt(), f = Wr(), l = jr(), a = oa(), d = la(), i = sa();
  return qi = (r, o, n, m) => {
    r = new t(r, m), o = new u(o, m);
    let v, y, p, S, T;
    switch (n) {
      case ">":
        v = l, y = d, p = a, S = ">", T = ">=";
        break;
      case "<":
        v = a, y = i, p = l, S = "<", T = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (f(r, o, m))
      return !1;
    for (let P = 0; P < o.set.length; ++P) {
      const O = o.set[P];
      let M = null, C = null;
      if (O.forEach((_) => {
        _.semver === h && (_ = new c(">=0.0.0")), M = M || _, C = C || _, v(_.semver, M.semver, m) ? M = _ : p(_.semver, C.semver, m) && (C = _);
      }), M.operator === S || M.operator === T || (!C.operator || C.operator === S) && y(r, C.semver))
        return !1;
      if (C.operator === T && p(r, C.semver))
        return !1;
    }
    return !0;
  }, qi;
}
var Mi, Us;
function gf() {
  if (Us) return Mi;
  Us = 1;
  const t = ua();
  return Mi = (h, u, f) => t(h, u, ">", f), Mi;
}
var Bi, $s;
function vf() {
  if ($s) return Bi;
  $s = 1;
  const t = ua();
  return Bi = (h, u, f) => t(h, u, "<", f), Bi;
}
var Hi, ks;
function Ef() {
  if (ks) return Hi;
  ks = 1;
  const t = tt();
  return Hi = (h, u, f) => (h = new t(h, f), u = new t(u, f), h.intersects(u, f)), Hi;
}
var ji, qs;
function yf() {
  if (qs) return ji;
  qs = 1;
  const t = Wr(), c = et();
  return ji = (h, u, f) => {
    const l = [];
    let a = null, d = null;
    const i = h.sort((n, m) => c(n, m, f));
    for (const n of i)
      t(n, u, f) ? (d = n, a || (a = n)) : (d && l.push([a, d]), d = null, a = null);
    a && l.push([a, null]);
    const s = [];
    for (const [n, m] of l)
      n === m ? s.push(n) : !m && n === i[0] ? s.push("*") : m ? n === i[0] ? s.push(`<=${m}`) : s.push(`${n} - ${m}`) : s.push(`>=${n}`);
    const r = s.join(" || "), o = typeof u.raw == "string" ? u.raw : String(u);
    return r.length < o.length ? r : u;
  }, ji;
}
var Gi, Ms;
function wf() {
  if (Ms) return Gi;
  Ms = 1;
  const t = tt(), c = Gr(), { ANY: h } = c, u = Wr(), f = et(), l = (o, n, m = {}) => {
    if (o === n)
      return !0;
    o = new t(o, m), n = new t(n, m);
    let v = !1;
    e: for (const y of o.set) {
      for (const p of n.set) {
        const S = i(y, p, m);
        if (v = v || S !== null, S)
          continue e;
      }
      if (v)
        return !1;
    }
    return !0;
  }, a = [new c(">=0.0.0-0")], d = [new c(">=0.0.0")], i = (o, n, m) => {
    if (o === n)
      return !0;
    if (o.length === 1 && o[0].semver === h) {
      if (n.length === 1 && n[0].semver === h)
        return !0;
      m.includePrerelease ? o = a : o = d;
    }
    if (n.length === 1 && n[0].semver === h) {
      if (m.includePrerelease)
        return !0;
      n = d;
    }
    const v = /* @__PURE__ */ new Set();
    let y, p;
    for (const A of o)
      A.operator === ">" || A.operator === ">=" ? y = s(y, A, m) : A.operator === "<" || A.operator === "<=" ? p = r(p, A, m) : v.add(A.semver);
    if (v.size > 1)
      return null;
    let S;
    if (y && p) {
      if (S = f(y.semver, p.semver, m), S > 0)
        return null;
      if (S === 0 && (y.operator !== ">=" || p.operator !== "<="))
        return null;
    }
    for (const A of v) {
      if (y && !u(A, String(y), m) || p && !u(A, String(p), m))
        return null;
      for (const E of n)
        if (!u(A, String(E), m))
          return !1;
      return !0;
    }
    let T, P, O, M, C = p && !m.includePrerelease && p.semver.prerelease.length ? p.semver : !1, _ = y && !m.includePrerelease && y.semver.prerelease.length ? y.semver : !1;
    C && C.prerelease.length === 1 && p.operator === "<" && C.prerelease[0] === 0 && (C = !1);
    for (const A of n) {
      if (M = M || A.operator === ">" || A.operator === ">=", O = O || A.operator === "<" || A.operator === "<=", y) {
        if (_ && A.semver.prerelease && A.semver.prerelease.length && A.semver.major === _.major && A.semver.minor === _.minor && A.semver.patch === _.patch && (_ = !1), A.operator === ">" || A.operator === ">=") {
          if (T = s(y, A, m), T === A && T !== y)
            return !1;
        } else if (y.operator === ">=" && !u(y.semver, String(A), m))
          return !1;
      }
      if (p) {
        if (C && A.semver.prerelease && A.semver.prerelease.length && A.semver.major === C.major && A.semver.minor === C.minor && A.semver.patch === C.patch && (C = !1), A.operator === "<" || A.operator === "<=") {
          if (P = r(p, A, m), P === A && P !== p)
            return !1;
        } else if (p.operator === "<=" && !u(p.semver, String(A), m))
          return !1;
      }
      if (!A.operator && (p || y) && S !== 0)
        return !1;
    }
    return !(y && O && !p && S !== 0 || p && M && !y && S !== 0 || _ || C);
  }, s = (o, n, m) => {
    if (!o)
      return n;
    const v = f(o.semver, n.semver, m);
    return v > 0 ? o : v < 0 || n.operator === ">" && o.operator === ">=" ? n : o;
  }, r = (o, n, m) => {
    if (!o)
      return n;
    const v = f(o.semver, n.semver, m);
    return v < 0 ? o : v > 0 || n.operator === "<" && o.operator === "<=" ? n : o;
  };
  return Gi = l, Gi;
}
var Wi, Bs;
function ru() {
  if (Bs) return Wi;
  Bs = 1;
  const t = vr(), c = Br(), h = He(), u = Ql(), f = qt(), l = Kc(), a = Jc(), d = Qc(), i = Zc(), s = ef(), r = tf(), o = rf(), n = nf(), m = et(), v = af(), y = of(), p = aa(), S = sf(), T = lf(), P = jr(), O = oa(), M = Zl(), C = eu(), _ = sa(), A = la(), E = tu(), k = uf(), U = Gr(), L = tt(), q = Wr(), D = ff(), F = df(), j = hf(), I = pf(), Q = mf(), Y = ua(), ne = gf(), de = vf(), ce = Ef(), ge = yf(), Ee = wf();
  return Wi = {
    parse: f,
    valid: l,
    clean: a,
    inc: d,
    diff: i,
    major: s,
    minor: r,
    patch: o,
    prerelease: n,
    compare: m,
    rcompare: v,
    compareLoose: y,
    compareBuild: p,
    sort: S,
    rsort: T,
    gt: P,
    lt: O,
    eq: M,
    neq: C,
    gte: _,
    lte: A,
    cmp: E,
    coerce: k,
    Comparator: U,
    Range: L,
    satisfies: q,
    toComparators: D,
    maxSatisfying: F,
    minSatisfying: j,
    minVersion: I,
    validRange: Q,
    outside: Y,
    gtr: ne,
    ltr: de,
    intersects: ce,
    simplifyRange: ge,
    subset: Ee,
    SemVer: h,
    re: t.re,
    src: t.src,
    tokens: t.t,
    SEMVER_SPEC_VERSION: c.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: c.RELEASE_TYPES,
    compareIdentifiers: u.compareIdentifiers,
    rcompareIdentifiers: u.rcompareIdentifiers
  }, Wi;
}
var Ft = {}, fr = { exports: {} };
fr.exports;
var Hs;
function _f() {
  return Hs || (Hs = 1, (function(t, c) {
    var h = 200, u = "__lodash_hash_undefined__", f = 1, l = 2, a = 9007199254740991, d = "[object Arguments]", i = "[object Array]", s = "[object AsyncFunction]", r = "[object Boolean]", o = "[object Date]", n = "[object Error]", m = "[object Function]", v = "[object GeneratorFunction]", y = "[object Map]", p = "[object Number]", S = "[object Null]", T = "[object Object]", P = "[object Promise]", O = "[object Proxy]", M = "[object RegExp]", C = "[object Set]", _ = "[object String]", A = "[object Symbol]", E = "[object Undefined]", k = "[object WeakMap]", U = "[object ArrayBuffer]", L = "[object DataView]", q = "[object Float32Array]", D = "[object Float64Array]", F = "[object Int8Array]", j = "[object Int16Array]", I = "[object Int32Array]", Q = "[object Uint8Array]", Y = "[object Uint8ClampedArray]", ne = "[object Uint16Array]", de = "[object Uint32Array]", ce = /[\\^$.*+?()[\]{}|]/g, ge = /^\[object .+?Constructor\]$/, Ee = /^(?:0|[1-9]\d*)$/, J = {};
    J[q] = J[D] = J[F] = J[j] = J[I] = J[Q] = J[Y] = J[ne] = J[de] = !0, J[d] = J[i] = J[U] = J[r] = J[L] = J[o] = J[n] = J[m] = J[y] = J[p] = J[T] = J[M] = J[C] = J[_] = J[k] = !1;
    var ve = typeof Ze == "object" && Ze && Ze.Object === Object && Ze, w = typeof self == "object" && self && self.Object === Object && self, g = ve || w || Function("return this")(), H = c && !c.nodeType && c, N = H && !0 && t && !t.nodeType && t, ue = N && N.exports === H, he = ue && ve.process, pe = (function() {
      try {
        return he && he.binding && he.binding("util");
      } catch {
      }
    })(), _e = pe && pe.isTypedArray;
    function ye(b, x) {
      for (var K = -1, se = b == null ? 0 : b.length, Oe = 0, Se = []; ++K < se; ) {
        var Ne = b[K];
        x(Ne, K, b) && (Se[Oe++] = Ne);
      }
      return Se;
    }
    function je(b, x) {
      for (var K = -1, se = x.length, Oe = b.length; ++K < se; )
        b[Oe + K] = x[K];
      return b;
    }
    function Ae(b, x) {
      for (var K = -1, se = b == null ? 0 : b.length; ++K < se; )
        if (x(b[K], K, b))
          return !0;
      return !1;
    }
    function qe(b, x) {
      for (var K = -1, se = Array(b); ++K < b; )
        se[K] = x(K);
      return se;
    }
    function lt(b) {
      return function(x) {
        return b(x);
      };
    }
    function it(b, x) {
      return b.has(x);
    }
    function rt(b, x) {
      return b?.[x];
    }
    function e(b) {
      var x = -1, K = Array(b.size);
      return b.forEach(function(se, Oe) {
        K[++x] = [Oe, se];
      }), K;
    }
    function B(b, x) {
      return function(K) {
        return b(x(K));
      };
    }
    function G(b) {
      var x = -1, K = Array(b.size);
      return b.forEach(function(se) {
        K[++x] = se;
      }), K;
    }
    var re = Array.prototype, W = Function.prototype, te = Object.prototype, Z = g["__core-js_shared__"], ae = W.toString, le = te.hasOwnProperty, Re = (function() {
      var b = /[^.]+$/.exec(Z && Z.keys && Z.keys.IE_PROTO || "");
      return b ? "Symbol(src)_1." + b : "";
    })(), Te = te.toString, me = RegExp(
      "^" + ae.call(le).replace(ce, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), R = ue ? g.Buffer : void 0, $ = g.Symbol, V = g.Uint8Array, z = te.propertyIsEnumerable, X = re.splice, ie = $ ? $.toStringTag : void 0, ee = Object.getOwnPropertySymbols, oe = R ? R.isBuffer : void 0, fe = B(Object.keys, Object), we = Dt(g, "DataView"), Pe = Dt(g, "Map"), De = Dt(g, "Promise"), Ce = Dt(g, "Set"), It = Dt(g, "WeakMap"), Ke = Dt(Object, "create"), gt = yt(we), uu = yt(Pe), cu = yt(De), fu = yt(Ce), du = yt(It), da = $ ? $.prototype : void 0, Vr = da ? da.valueOf : void 0;
    function vt(b) {
      var x = -1, K = b == null ? 0 : b.length;
      for (this.clear(); ++x < K; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function hu() {
      this.__data__ = Ke ? Ke(null) : {}, this.size = 0;
    }
    function pu(b) {
      var x = this.has(b) && delete this.__data__[b];
      return this.size -= x ? 1 : 0, x;
    }
    function mu(b) {
      var x = this.__data__;
      if (Ke) {
        var K = x[b];
        return K === u ? void 0 : K;
      }
      return le.call(x, b) ? x[b] : void 0;
    }
    function gu(b) {
      var x = this.__data__;
      return Ke ? x[b] !== void 0 : le.call(x, b);
    }
    function vu(b, x) {
      var K = this.__data__;
      return this.size += this.has(b) ? 0 : 1, K[b] = Ke && x === void 0 ? u : x, this;
    }
    vt.prototype.clear = hu, vt.prototype.delete = pu, vt.prototype.get = mu, vt.prototype.has = gu, vt.prototype.set = vu;
    function at(b) {
      var x = -1, K = b == null ? 0 : b.length;
      for (this.clear(); ++x < K; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function Eu() {
      this.__data__ = [], this.size = 0;
    }
    function yu(b) {
      var x = this.__data__, K = yr(x, b);
      if (K < 0)
        return !1;
      var se = x.length - 1;
      return K == se ? x.pop() : X.call(x, K, 1), --this.size, !0;
    }
    function wu(b) {
      var x = this.__data__, K = yr(x, b);
      return K < 0 ? void 0 : x[K][1];
    }
    function _u(b) {
      return yr(this.__data__, b) > -1;
    }
    function Su(b, x) {
      var K = this.__data__, se = yr(K, b);
      return se < 0 ? (++this.size, K.push([b, x])) : K[se][1] = x, this;
    }
    at.prototype.clear = Eu, at.prototype.delete = yu, at.prototype.get = wu, at.prototype.has = _u, at.prototype.set = Su;
    function Et(b) {
      var x = -1, K = b == null ? 0 : b.length;
      for (this.clear(); ++x < K; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function Au() {
      this.size = 0, this.__data__ = {
        hash: new vt(),
        map: new (Pe || at)(),
        string: new vt()
      };
    }
    function Ru(b) {
      var x = wr(this, b).delete(b);
      return this.size -= x ? 1 : 0, x;
    }
    function Tu(b) {
      return wr(this, b).get(b);
    }
    function Cu(b) {
      return wr(this, b).has(b);
    }
    function bu(b, x) {
      var K = wr(this, b), se = K.size;
      return K.set(b, x), this.size += K.size == se ? 0 : 1, this;
    }
    Et.prototype.clear = Au, Et.prototype.delete = Ru, Et.prototype.get = Tu, Et.prototype.has = Cu, Et.prototype.set = bu;
    function Er(b) {
      var x = -1, K = b == null ? 0 : b.length;
      for (this.__data__ = new Et(); ++x < K; )
        this.add(b[x]);
    }
    function Pu(b) {
      return this.__data__.set(b, u), this;
    }
    function Ou(b) {
      return this.__data__.has(b);
    }
    Er.prototype.add = Er.prototype.push = Pu, Er.prototype.has = Ou;
    function ut(b) {
      var x = this.__data__ = new at(b);
      this.size = x.size;
    }
    function Iu() {
      this.__data__ = new at(), this.size = 0;
    }
    function Du(b) {
      var x = this.__data__, K = x.delete(b);
      return this.size = x.size, K;
    }
    function Nu(b) {
      return this.__data__.get(b);
    }
    function Fu(b) {
      return this.__data__.has(b);
    }
    function xu(b, x) {
      var K = this.__data__;
      if (K instanceof at) {
        var se = K.__data__;
        if (!Pe || se.length < h - 1)
          return se.push([b, x]), this.size = ++K.size, this;
        K = this.__data__ = new Et(se);
      }
      return K.set(b, x), this.size = K.size, this;
    }
    ut.prototype.clear = Iu, ut.prototype.delete = Du, ut.prototype.get = Nu, ut.prototype.has = Fu, ut.prototype.set = xu;
    function Lu(b, x) {
      var K = _r(b), se = !K && Ku(b), Oe = !K && !se && Yr(b), Se = !K && !se && !Oe && _a(b), Ne = K || se || Oe || Se, Fe = Ne ? qe(b.length, String) : [], xe = Fe.length;
      for (var Ie in b)
        le.call(b, Ie) && !(Ne && // Safari 9 has enumerable `arguments.length` in strict mode.
        (Ie == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        Oe && (Ie == "offset" || Ie == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        Se && (Ie == "buffer" || Ie == "byteLength" || Ie == "byteOffset") || // Skip index properties.
        Wu(Ie, xe))) && Fe.push(Ie);
      return Fe;
    }
    function yr(b, x) {
      for (var K = b.length; K--; )
        if (va(b[K][0], x))
          return K;
      return -1;
    }
    function Uu(b, x, K) {
      var se = x(b);
      return _r(b) ? se : je(se, K(b));
    }
    function Bt(b) {
      return b == null ? b === void 0 ? E : S : ie && ie in Object(b) ? ju(b) : Xu(b);
    }
    function ha(b) {
      return Ht(b) && Bt(b) == d;
    }
    function pa(b, x, K, se, Oe) {
      return b === x ? !0 : b == null || x == null || !Ht(b) && !Ht(x) ? b !== b && x !== x : $u(b, x, K, se, pa, Oe);
    }
    function $u(b, x, K, se, Oe, Se) {
      var Ne = _r(b), Fe = _r(x), xe = Ne ? i : ct(b), Ie = Fe ? i : ct(x);
      xe = xe == d ? T : xe, Ie = Ie == d ? T : Ie;
      var We = xe == T, Je = Ie == T, Ue = xe == Ie;
      if (Ue && Yr(b)) {
        if (!Yr(x))
          return !1;
        Ne = !0, We = !1;
      }
      if (Ue && !We)
        return Se || (Se = new ut()), Ne || _a(b) ? ma(b, x, K, se, Oe, Se) : Bu(b, x, xe, K, se, Oe, Se);
      if (!(K & f)) {
        var Ye = We && le.call(b, "__wrapped__"), ze = Je && le.call(x, "__wrapped__");
        if (Ye || ze) {
          var ft = Ye ? b.value() : b, ot = ze ? x.value() : x;
          return Se || (Se = new ut()), Oe(ft, ot, K, se, Se);
        }
      }
      return Ue ? (Se || (Se = new ut()), Hu(b, x, K, se, Oe, Se)) : !1;
    }
    function ku(b) {
      if (!wa(b) || Yu(b))
        return !1;
      var x = Ea(b) ? me : ge;
      return x.test(yt(b));
    }
    function qu(b) {
      return Ht(b) && ya(b.length) && !!J[Bt(b)];
    }
    function Mu(b) {
      if (!zu(b))
        return fe(b);
      var x = [];
      for (var K in Object(b))
        le.call(b, K) && K != "constructor" && x.push(K);
      return x;
    }
    function ma(b, x, K, se, Oe, Se) {
      var Ne = K & f, Fe = b.length, xe = x.length;
      if (Fe != xe && !(Ne && xe > Fe))
        return !1;
      var Ie = Se.get(b);
      if (Ie && Se.get(x))
        return Ie == x;
      var We = -1, Je = !0, Ue = K & l ? new Er() : void 0;
      for (Se.set(b, x), Se.set(x, b); ++We < Fe; ) {
        var Ye = b[We], ze = x[We];
        if (se)
          var ft = Ne ? se(ze, Ye, We, x, b, Se) : se(Ye, ze, We, b, x, Se);
        if (ft !== void 0) {
          if (ft)
            continue;
          Je = !1;
          break;
        }
        if (Ue) {
          if (!Ae(x, function(ot, wt) {
            if (!it(Ue, wt) && (Ye === ot || Oe(Ye, ot, K, se, Se)))
              return Ue.push(wt);
          })) {
            Je = !1;
            break;
          }
        } else if (!(Ye === ze || Oe(Ye, ze, K, se, Se))) {
          Je = !1;
          break;
        }
      }
      return Se.delete(b), Se.delete(x), Je;
    }
    function Bu(b, x, K, se, Oe, Se, Ne) {
      switch (K) {
        case L:
          if (b.byteLength != x.byteLength || b.byteOffset != x.byteOffset)
            return !1;
          b = b.buffer, x = x.buffer;
        case U:
          return !(b.byteLength != x.byteLength || !Se(new V(b), new V(x)));
        case r:
        case o:
        case p:
          return va(+b, +x);
        case n:
          return b.name == x.name && b.message == x.message;
        case M:
        case _:
          return b == x + "";
        case y:
          var Fe = e;
        case C:
          var xe = se & f;
          if (Fe || (Fe = G), b.size != x.size && !xe)
            return !1;
          var Ie = Ne.get(b);
          if (Ie)
            return Ie == x;
          se |= l, Ne.set(b, x);
          var We = ma(Fe(b), Fe(x), se, Oe, Se, Ne);
          return Ne.delete(b), We;
        case A:
          if (Vr)
            return Vr.call(b) == Vr.call(x);
      }
      return !1;
    }
    function Hu(b, x, K, se, Oe, Se) {
      var Ne = K & f, Fe = ga(b), xe = Fe.length, Ie = ga(x), We = Ie.length;
      if (xe != We && !Ne)
        return !1;
      for (var Je = xe; Je--; ) {
        var Ue = Fe[Je];
        if (!(Ne ? Ue in x : le.call(x, Ue)))
          return !1;
      }
      var Ye = Se.get(b);
      if (Ye && Se.get(x))
        return Ye == x;
      var ze = !0;
      Se.set(b, x), Se.set(x, b);
      for (var ft = Ne; ++Je < xe; ) {
        Ue = Fe[Je];
        var ot = b[Ue], wt = x[Ue];
        if (se)
          var Sa = Ne ? se(wt, ot, Ue, x, b, Se) : se(ot, wt, Ue, b, x, Se);
        if (!(Sa === void 0 ? ot === wt || Oe(ot, wt, K, se, Se) : Sa)) {
          ze = !1;
          break;
        }
        ft || (ft = Ue == "constructor");
      }
      if (ze && !ft) {
        var Sr = b.constructor, Ar = x.constructor;
        Sr != Ar && "constructor" in b && "constructor" in x && !(typeof Sr == "function" && Sr instanceof Sr && typeof Ar == "function" && Ar instanceof Ar) && (ze = !1);
      }
      return Se.delete(b), Se.delete(x), ze;
    }
    function ga(b) {
      return Uu(b, Zu, Gu);
    }
    function wr(b, x) {
      var K = b.__data__;
      return Vu(x) ? K[typeof x == "string" ? "string" : "hash"] : K.map;
    }
    function Dt(b, x) {
      var K = rt(b, x);
      return ku(K) ? K : void 0;
    }
    function ju(b) {
      var x = le.call(b, ie), K = b[ie];
      try {
        b[ie] = void 0;
        var se = !0;
      } catch {
      }
      var Oe = Te.call(b);
      return se && (x ? b[ie] = K : delete b[ie]), Oe;
    }
    var Gu = ee ? function(b) {
      return b == null ? [] : (b = Object(b), ye(ee(b), function(x) {
        return z.call(b, x);
      }));
    } : ec, ct = Bt;
    (we && ct(new we(new ArrayBuffer(1))) != L || Pe && ct(new Pe()) != y || De && ct(De.resolve()) != P || Ce && ct(new Ce()) != C || It && ct(new It()) != k) && (ct = function(b) {
      var x = Bt(b), K = x == T ? b.constructor : void 0, se = K ? yt(K) : "";
      if (se)
        switch (se) {
          case gt:
            return L;
          case uu:
            return y;
          case cu:
            return P;
          case fu:
            return C;
          case du:
            return k;
        }
      return x;
    });
    function Wu(b, x) {
      return x = x ?? a, !!x && (typeof b == "number" || Ee.test(b)) && b > -1 && b % 1 == 0 && b < x;
    }
    function Vu(b) {
      var x = typeof b;
      return x == "string" || x == "number" || x == "symbol" || x == "boolean" ? b !== "__proto__" : b === null;
    }
    function Yu(b) {
      return !!Re && Re in b;
    }
    function zu(b) {
      var x = b && b.constructor, K = typeof x == "function" && x.prototype || te;
      return b === K;
    }
    function Xu(b) {
      return Te.call(b);
    }
    function yt(b) {
      if (b != null) {
        try {
          return ae.call(b);
        } catch {
        }
        try {
          return b + "";
        } catch {
        }
      }
      return "";
    }
    function va(b, x) {
      return b === x || b !== b && x !== x;
    }
    var Ku = ha(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? ha : function(b) {
      return Ht(b) && le.call(b, "callee") && !z.call(b, "callee");
    }, _r = Array.isArray;
    function Ju(b) {
      return b != null && ya(b.length) && !Ea(b);
    }
    var Yr = oe || tc;
    function Qu(b, x) {
      return pa(b, x);
    }
    function Ea(b) {
      if (!wa(b))
        return !1;
      var x = Bt(b);
      return x == m || x == v || x == s || x == O;
    }
    function ya(b) {
      return typeof b == "number" && b > -1 && b % 1 == 0 && b <= a;
    }
    function wa(b) {
      var x = typeof b;
      return b != null && (x == "object" || x == "function");
    }
    function Ht(b) {
      return b != null && typeof b == "object";
    }
    var _a = _e ? lt(_e) : qu;
    function Zu(b) {
      return Ju(b) ? Lu(b) : Mu(b);
    }
    function ec() {
      return [];
    }
    function tc() {
      return !1;
    }
    t.exports = Qu;
  })(fr, fr.exports)), fr.exports;
}
var js;
function Sf() {
  if (js) return Ft;
  js = 1, Object.defineProperty(Ft, "__esModule", { value: !0 }), Ft.DownloadedUpdateHelper = void 0, Ft.createTempUpdateFile = d;
  const t = pr, c = pt, h = _f(), u = /* @__PURE__ */ mt(), f = be;
  let l = class {
    constructor(s) {
      this.cacheDir = s, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
      return this._downloadedFileInfo;
    }
    get file() {
      return this._file;
    }
    get packageFile() {
      return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
      return f.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(s, r, o, n) {
      if (this.versionInfo != null && this.file === s && this.fileInfo != null)
        return h(this.versionInfo, r) && h(this.fileInfo.info, o.info) && await (0, u.pathExists)(s) ? s : null;
      const m = await this.getValidCachedUpdateFile(o, n);
      return m === null ? null : (n.info(`Update has already been downloaded to ${s}).`), this._file = m, m);
    }
    async setDownloadedFile(s, r, o, n, m, v) {
      this._file = s, this._packageFile = r, this.versionInfo = o, this.fileInfo = n, this._downloadedFileInfo = {
        fileName: m,
        sha512: n.info.sha512,
        isAdminRightsRequired: n.info.isAdminRightsRequired === !0
      }, v && await (0, u.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, u.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(s, r) {
      const o = this.getUpdateInfoFile();
      if (!await (0, u.pathExists)(o))
        return null;
      let m;
      try {
        m = await (0, u.readJson)(o);
      } catch (S) {
        let T = "No cached update info available";
        return S.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), T += ` (error on read: ${S.message})`), r.info(T), null;
      }
      if (!(m?.fileName !== null))
        return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (s.info.sha512 !== m.sha512)
        return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${m.sha512}, expected: ${s.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const y = f.join(this.cacheDirForPendingUpdate, m.fileName);
      if (!await (0, u.pathExists)(y))
        return r.info("Cached update file doesn't exist"), null;
      const p = await a(y);
      return s.info.sha512 !== p ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${p}, expected: ${s.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = m, y);
    }
    getUpdateInfoFile() {
      return f.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Ft.DownloadedUpdateHelper = l;
  function a(i, s = "sha512", r = "base64", o) {
    return new Promise((n, m) => {
      const v = (0, t.createHash)(s);
      v.on("error", m).setEncoding(r), (0, c.createReadStream)(i, {
        ...o,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", m).on("end", () => {
        v.end(), n(v.read());
      }).pipe(v, { end: !1 });
    });
  }
  async function d(i, s, r) {
    let o = 0, n = f.join(s, i);
    for (let m = 0; m < 3; m++)
      try {
        return await (0, u.unlink)(n), n;
      } catch (v) {
        if (v.code === "ENOENT")
          return n;
        r.warn(`Error on remove temp update file: ${v}`), n = f.join(s, `${o++}-${i}`);
      }
    return n;
  }
  return Ft;
}
var zt = {}, Lr = {}, Gs;
function Af() {
  if (Gs) return Lr;
  Gs = 1, Object.defineProperty(Lr, "__esModule", { value: !0 }), Lr.getAppCacheDir = h;
  const t = be, c = kr;
  function h() {
    const u = (0, c.homedir)();
    let f;
    return process.platform === "win32" ? f = process.env.LOCALAPPDATA || t.join(u, "AppData", "Local") : process.platform === "darwin" ? f = t.join(u, "Library", "Caches") : f = process.env.XDG_CACHE_HOME || t.join(u, ".cache"), f;
  }
  return Lr;
}
var Ws;
function Rf() {
  if (Ws) return zt;
  Ws = 1, Object.defineProperty(zt, "__esModule", { value: !0 }), zt.ElectronAppAdapter = void 0;
  const t = be, c = Af();
  let h = class {
    constructor(f = Ct.app) {
      this.app = f;
    }
    whenReady() {
      return this.app.whenReady();
    }
    get version() {
      return this.app.getVersion();
    }
    get name() {
      return this.app.getName();
    }
    get isPackaged() {
      return this.app.isPackaged === !0;
    }
    get appUpdateConfigPath() {
      return this.isPackaged ? t.join(process.resourcesPath, "app-update.yml") : t.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
      return this.app.getPath("userData");
    }
    get baseCachePath() {
      return (0, c.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(f) {
      this.app.once("quit", (l, a) => f(a));
    }
  };
  return zt.ElectronAppAdapter = h, zt;
}
var Vi = {}, Vs;
function Tf() {
  return Vs || (Vs = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.ElectronHttpExecutor = t.NET_SESSION_NAME = void 0, t.getNetSession = h;
    const c = Le();
    t.NET_SESSION_NAME = "electron-updater";
    function h() {
      return Ct.session.fromPartition(t.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class u extends c.HttpExecutor {
      constructor(l) {
        super(), this.proxyLoginCallback = l, this.cachedSession = null;
      }
      async download(l, a, d) {
        return await d.cancellationToken.createPromise((i, s, r) => {
          const o = {
            headers: d.headers || void 0,
            redirect: "manual"
          };
          (0, c.configureRequestUrl)(l, o), (0, c.configureRequestOptions)(o), this.doDownload(o, {
            destination: a,
            options: d,
            onCancel: r,
            callback: (n) => {
              n == null ? i(a) : s(n);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(l, a) {
        l.headers && l.headers.Host && (l.host = l.headers.Host, delete l.headers.Host), this.cachedSession == null && (this.cachedSession = h());
        const d = Ct.net.request({
          ...l,
          session: this.cachedSession
        });
        return d.on("response", a), this.proxyLoginCallback != null && d.on("login", this.proxyLoginCallback), d;
      }
      addRedirectHandlers(l, a, d, i, s) {
        l.on("redirect", (r, o, n) => {
          l.abort(), i > this.maxRedirects ? d(this.createMaxRedirectError()) : s(c.HttpExecutor.prepareRedirectUrlOptions(n, a));
        });
      }
    }
    t.ElectronHttpExecutor = u;
  })(Vi)), Vi;
}
var Xt = {}, Tt = {}, Yi, Ys;
function Cf() {
  if (Ys) return Yi;
  Ys = 1;
  var t = "[object Symbol]", c = /[\\^$.*+?()[\]{}|]/g, h = RegExp(c.source), u = typeof Ze == "object" && Ze && Ze.Object === Object && Ze, f = typeof self == "object" && self && self.Object === Object && self, l = u || f || Function("return this")(), a = Object.prototype, d = a.toString, i = l.Symbol, s = i ? i.prototype : void 0, r = s ? s.toString : void 0;
  function o(p) {
    if (typeof p == "string")
      return p;
    if (m(p))
      return r ? r.call(p) : "";
    var S = p + "";
    return S == "0" && 1 / p == -1 / 0 ? "-0" : S;
  }
  function n(p) {
    return !!p && typeof p == "object";
  }
  function m(p) {
    return typeof p == "symbol" || n(p) && d.call(p) == t;
  }
  function v(p) {
    return p == null ? "" : o(p);
  }
  function y(p) {
    return p = v(p), p && h.test(p) ? p.replace(c, "\\$&") : p;
  }
  return Yi = y, Yi;
}
var zs;
function Pt() {
  if (zs) return Tt;
  zs = 1, Object.defineProperty(Tt, "__esModule", { value: !0 }), Tt.newBaseUrl = h, Tt.newUrlFromBase = u, Tt.getChannelFilename = f, Tt.blockmapFiles = l;
  const t = Ut, c = Cf();
  function h(a) {
    const d = new t.URL(a);
    return d.pathname.endsWith("/") || (d.pathname += "/"), d;
  }
  function u(a, d, i = !1) {
    const s = new t.URL(a, d), r = d.search;
    return r != null && r.length !== 0 ? s.search = r : i && (s.search = `noCache=${Date.now().toString(32)}`), s;
  }
  function f(a) {
    return `${a}.yml`;
  }
  function l(a, d, i) {
    const s = u(`${a.pathname}.blockmap`, a);
    return [u(`${a.pathname.replace(new RegExp(c(i), "g"), d)}.blockmap`, a), s];
  }
  return Tt;
}
var st = {}, Xs;
function Xe() {
  if (Xs) return st;
  Xs = 1, Object.defineProperty(st, "__esModule", { value: !0 }), st.Provider = void 0, st.findFile = f, st.parseUpdateInfo = l, st.getFileList = a, st.resolveFiles = d;
  const t = Le(), c = na(), h = Pt();
  let u = class {
    constructor(s) {
      this.runtimeOptions = s, this.requestHeaders = null, this.executor = s.executor;
    }
    get isUseMultipleRangeRequest() {
      return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
    }
    getChannelFilePrefix() {
      if (this.runtimeOptions.platform === "linux") {
        const s = process.env.TEST_UPDATER_ARCH || process.arch;
        return "-linux" + (s === "x64" ? "" : `-${s}`);
      } else
        return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
      return this.getCustomChannelName("latest");
    }
    getCustomChannelName(s) {
      return `${s}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
      return null;
    }
    setRequestHeaders(s) {
      this.requestHeaders = s;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(s, r, o) {
      return this.executor.request(this.createRequestOptions(s, r), o);
    }
    createRequestOptions(s, r) {
      const o = {};
      return this.requestHeaders == null ? r != null && (o.headers = r) : o.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, t.configureRequestUrl)(s, o), o;
    }
  };
  st.Provider = u;
  function f(i, s, r) {
    if (i.length === 0)
      throw (0, t.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const o = i.find((n) => n.url.pathname.toLowerCase().endsWith(`.${s}`));
    return o ?? (r == null ? i[0] : i.find((n) => !r.some((m) => n.url.pathname.toLowerCase().endsWith(`.${m}`))));
  }
  function l(i, s, r) {
    if (i == null)
      throw (0, t.newError)(`Cannot parse update info from ${s} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let o;
    try {
      o = (0, c.load)(i);
    } catch (n) {
      throw (0, t.newError)(`Cannot parse update info from ${s} in the latest release artifacts (${r}): ${n.stack || n.message}, rawData: ${i}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return o;
  }
  function a(i) {
    const s = i.files;
    if (s != null && s.length > 0)
      return s;
    if (i.path != null)
      return [
        {
          url: i.path,
          sha2: i.sha2,
          sha512: i.sha512
        }
      ];
    throw (0, t.newError)(`No files provided: ${(0, t.safeStringifyJson)(i)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  function d(i, s, r = (o) => o) {
    const n = a(i).map((y) => {
      if (y.sha2 == null && y.sha512 == null)
        throw (0, t.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, t.safeStringifyJson)(y)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, h.newUrlFromBase)(r(y.url), s),
        info: y
      };
    }), m = i.packages, v = m == null ? null : m[process.arch] || m.ia32;
    return v != null && (n[0].packageInfo = {
      ...v,
      path: (0, h.newUrlFromBase)(r(v.path), s).href
    }), n;
  }
  return st;
}
var Ks;
function nu() {
  if (Ks) return Xt;
  Ks = 1, Object.defineProperty(Xt, "__esModule", { value: !0 }), Xt.GenericProvider = void 0;
  const t = Le(), c = Pt(), h = Xe();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super(d), this.configuration = l, this.updater = a, this.baseUrl = (0, c.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const l = this.updater.channel || this.configuration.channel;
      return l == null ? this.getDefaultChannelName() : this.getCustomChannelName(l);
    }
    async getLatestVersion() {
      const l = (0, c.getChannelFilename)(this.channel), a = (0, c.newUrlFromBase)(l, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let d = 0; ; d++)
        try {
          return (0, h.parseUpdateInfo)(await this.httpRequest(a), l, a);
        } catch (i) {
          if (i instanceof t.HttpError && i.statusCode === 404)
            throw (0, t.newError)(`Cannot find channel "${l}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (i.code === "ECONNREFUSED" && d < 3) {
            await new Promise((s, r) => {
              try {
                setTimeout(s, 1e3 * d);
              } catch (o) {
                r(o);
              }
            });
            continue;
          }
          throw i;
        }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
  };
  return Xt.GenericProvider = u, Xt;
}
var Kt = {}, Jt = {}, Js;
function bf() {
  if (Js) return Jt;
  Js = 1, Object.defineProperty(Jt, "__esModule", { value: !0 }), Jt.BitbucketProvider = void 0;
  const t = Le(), c = Pt(), h = Xe();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = a;
      const { owner: i, slug: s } = l;
      this.baseUrl = (0, c.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${s}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), a = (0, c.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, c.newUrlFromBase)(a, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const i = await this.httpRequest(d, void 0, l);
        return (0, h.parseUpdateInfo)(i, a, d);
      } catch (i) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { owner: l, slug: a } = this.configuration;
      return `Bitbucket (owner: ${l}, slug: ${a}, channel: ${this.channel})`;
    }
  };
  return Jt.BitbucketProvider = u, Jt;
}
var ht = {}, Qs;
function iu() {
  if (Qs) return ht;
  Qs = 1, Object.defineProperty(ht, "__esModule", { value: !0 }), ht.GitHubProvider = ht.BaseGitHubProvider = void 0, ht.computeReleaseNotes = s;
  const t = Le(), c = ru(), h = Ut, u = Pt(), f = Xe(), l = /\/tag\/([^/]+)$/;
  class a extends f.Provider {
    constructor(o, n, m) {
      super({
        ...m,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = o, this.baseUrl = (0, u.newBaseUrl)((0, t.githubUrl)(o, n));
      const v = n === "github.com" ? "api.github.com" : n;
      this.baseApiUrl = (0, u.newBaseUrl)((0, t.githubUrl)(o, v));
    }
    computeGithubBasePath(o) {
      const n = this.options.host;
      return n && !["github.com", "api.github.com"].includes(n) ? `/api/v3${o}` : o;
    }
  }
  ht.BaseGitHubProvider = a;
  let d = class extends a {
    constructor(o, n, m) {
      super(o, "github.com", m), this.options = o, this.updater = n;
    }
    get channel() {
      const o = this.updater.channel || this.options.channel;
      return o == null ? this.getDefaultChannelName() : this.getCustomChannelName(o);
    }
    async getLatestVersion() {
      var o, n, m, v, y;
      const p = new t.CancellationToken(), S = await this.httpRequest((0, u.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, p), T = (0, t.parseXml)(S);
      let P = T.element("entry", !1, "No published versions on GitHub"), O = null;
      try {
        if (this.updater.allowPrerelease) {
          const k = ((o = this.updater) === null || o === void 0 ? void 0 : o.channel) || ((n = c.prerelease(this.updater.currentVersion)) === null || n === void 0 ? void 0 : n[0]) || null;
          if (k === null)
            O = l.exec(P.element("link").attribute("href"))[1];
          else
            for (const U of T.getElements("entry")) {
              const L = l.exec(U.element("link").attribute("href"));
              if (L === null)
                continue;
              const q = L[1], D = ((m = c.prerelease(q)) === null || m === void 0 ? void 0 : m[0]) || null, F = !k || ["alpha", "beta"].includes(k), j = D !== null && !["alpha", "beta"].includes(String(D));
              if (F && !j && !(k === "beta" && D === "alpha")) {
                O = q;
                break;
              }
              if (D && D === k) {
                O = q;
                break;
              }
            }
        } else {
          O = await this.getLatestTagName(p);
          for (const k of T.getElements("entry"))
            if (l.exec(k.element("link").attribute("href"))[1] === O) {
              P = k;
              break;
            }
        }
      } catch (k) {
        throw (0, t.newError)(`Cannot parse releases feed: ${k.stack || k.message},
XML:
${S}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (O == null)
        throw (0, t.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let M, C = "", _ = "";
      const A = async (k) => {
        C = (0, u.getChannelFilename)(k), _ = (0, u.newUrlFromBase)(this.getBaseDownloadPath(String(O), C), this.baseUrl);
        const U = this.createRequestOptions(_);
        try {
          return await this.executor.request(U, p);
        } catch (L) {
          throw L instanceof t.HttpError && L.statusCode === 404 ? (0, t.newError)(`Cannot find ${C} in the latest release artifacts (${_}): ${L.stack || L.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : L;
        }
      };
      try {
        let k = this.channel;
        this.updater.allowPrerelease && (!((v = c.prerelease(O)) === null || v === void 0) && v[0]) && (k = this.getCustomChannelName(String((y = c.prerelease(O)) === null || y === void 0 ? void 0 : y[0]))), M = await A(k);
      } catch (k) {
        if (this.updater.allowPrerelease)
          M = await A(this.getDefaultChannelName());
        else
          throw k;
      }
      const E = (0, f.parseUpdateInfo)(M, C, _);
      return E.releaseName == null && (E.releaseName = P.elementValueOrEmpty("title")), E.releaseNotes == null && (E.releaseNotes = s(this.updater.currentVersion, this.updater.fullChangelog, T, P)), {
        tag: O,
        ...E
      };
    }
    async getLatestTagName(o) {
      const n = this.options, m = n.host == null || n.host === "github.com" ? (0, u.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new h.URL(`${this.computeGithubBasePath(`/repos/${n.owner}/${n.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const v = await this.httpRequest(m, { Accept: "application/json" }, o);
        return v == null ? null : JSON.parse(v).tag_name;
      } catch (v) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${m}), please ensure a production release exists: ${v.stack || v.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(o) {
      return (0, f.resolveFiles)(o, this.baseUrl, (n) => this.getBaseDownloadPath(o.tag, n.replace(/ /g, "-")));
    }
    getBaseDownloadPath(o, n) {
      return `${this.basePath}/download/${o}/${n}`;
    }
  };
  ht.GitHubProvider = d;
  function i(r) {
    const o = r.elementValueOrEmpty("content");
    return o === "No content." ? "" : o;
  }
  function s(r, o, n, m) {
    if (!o)
      return i(m);
    const v = [];
    for (const y of n.getElements("entry")) {
      const p = /\/tag\/v?([^/]+)$/.exec(y.element("link").attribute("href"))[1];
      c.lt(r, p) && v.push({
        version: p,
        note: i(y)
      });
    }
    return v.sort((y, p) => c.rcompare(y.version, p.version));
  }
  return ht;
}
var Qt = {}, Zs;
function Pf() {
  if (Zs) return Qt;
  Zs = 1, Object.defineProperty(Qt, "__esModule", { value: !0 }), Qt.KeygenProvider = void 0;
  const t = Le(), c = Pt(), h = Xe();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = a, this.defaultHostname = "api.keygen.sh";
      const i = this.configuration.host || this.defaultHostname;
      this.baseUrl = (0, c.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), a = (0, c.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, c.newUrlFromBase)(a, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const i = await this.httpRequest(d, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, l);
        return (0, h.parseUpdateInfo)(i, a, d);
      } catch (i) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { account: l, product: a, platform: d } = this.configuration;
      return `Keygen (account: ${l}, product: ${a}, platform: ${d}, channel: ${this.channel})`;
    }
  };
  return Qt.KeygenProvider = u, Qt;
}
var Zt = {}, el;
function Of() {
  if (el) return Zt;
  el = 1, Object.defineProperty(Zt, "__esModule", { value: !0 }), Zt.PrivateGitHubProvider = void 0;
  const t = Le(), c = na(), h = be, u = Ut, f = Pt(), l = iu(), a = Xe();
  let d = class extends l.BaseGitHubProvider {
    constructor(s, r, o, n) {
      super(s, "api.github.com", n), this.updater = r, this.token = o;
    }
    createRequestOptions(s, r) {
      const o = super.createRequestOptions(s, r);
      return o.redirect = "manual", o;
    }
    async getLatestVersion() {
      const s = new t.CancellationToken(), r = (0, f.getChannelFilename)(this.getDefaultChannelName()), o = await this.getLatestVersionInfo(s), n = o.assets.find((y) => y.name === r);
      if (n == null)
        throw (0, t.newError)(`Cannot find ${r} in the release ${o.html_url || o.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const m = new u.URL(n.url);
      let v;
      try {
        v = (0, c.load)(await this.httpRequest(m, this.configureHeaders("application/octet-stream"), s));
      } catch (y) {
        throw y instanceof t.HttpError && y.statusCode === 404 ? (0, t.newError)(`Cannot find ${r} in the latest release artifacts (${m}): ${y.stack || y.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : y;
      }
      return v.assets = o.assets, v;
    }
    get fileExtraDownloadHeaders() {
      return this.configureHeaders("application/octet-stream");
    }
    configureHeaders(s) {
      return {
        accept: s,
        authorization: `token ${this.token}`
      };
    }
    async getLatestVersionInfo(s) {
      const r = this.updater.allowPrerelease;
      let o = this.basePath;
      r || (o = `${o}/latest`);
      const n = (0, f.newUrlFromBase)(o, this.baseUrl);
      try {
        const m = JSON.parse(await this.httpRequest(n, this.configureHeaders("application/vnd.github.v3+json"), s));
        return r ? m.find((v) => v.prerelease) || m[0] : m;
      } catch (m) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${m.stack || m.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(s) {
      return (0, a.getFileList)(s).map((r) => {
        const o = h.posix.basename(r.url).replace(/ /g, "-"), n = s.assets.find((m) => m != null && m.name === o);
        if (n == null)
          throw (0, t.newError)(`Cannot find asset "${o}" in: ${JSON.stringify(s.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new u.URL(n.url),
          info: r
        };
      });
    }
  };
  return Zt.PrivateGitHubProvider = d, Zt;
}
var tl;
function If() {
  if (tl) return Kt;
  tl = 1, Object.defineProperty(Kt, "__esModule", { value: !0 }), Kt.isUrlProbablySupportMultiRangeRequests = a, Kt.createClient = d;
  const t = Le(), c = bf(), h = nu(), u = iu(), f = Pf(), l = Of();
  function a(i) {
    return !i.includes("s3.amazonaws.com");
  }
  function d(i, s, r) {
    if (typeof i == "string")
      throw (0, t.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const o = i.provider;
    switch (o) {
      case "github": {
        const n = i, m = (n.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || n.token;
        return m == null ? new u.GitHubProvider(n, s, r) : new l.PrivateGitHubProvider(n, s, m, r);
      }
      case "bitbucket":
        return new c.BitbucketProvider(i, s, r);
      case "keygen":
        return new f.KeygenProvider(i, s, r);
      case "s3":
      case "spaces":
        return new h.GenericProvider({
          provider: "generic",
          url: (0, t.getS3LikeProviderBaseUrl)(i),
          channel: i.channel || null
        }, s, {
          ...r,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const n = i;
        return new h.GenericProvider(n, s, {
          ...r,
          isUseMultipleRangeRequest: n.useMultipleRangeRequest !== !1 && a(n.url)
        });
      }
      case "custom": {
        const n = i, m = n.updateProvider;
        if (!m)
          throw (0, t.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new m(n, s, r);
      }
      default:
        throw (0, t.newError)(`Unsupported provider: ${o}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return Kt;
}
var er = {}, tr = {}, xt = {}, Lt = {}, rl;
function ca() {
  if (rl) return Lt;
  rl = 1, Object.defineProperty(Lt, "__esModule", { value: !0 }), Lt.OperationKind = void 0, Lt.computeOperations = c;
  var t;
  (function(a) {
    a[a.COPY = 0] = "COPY", a[a.DOWNLOAD = 1] = "DOWNLOAD";
  })(t || (Lt.OperationKind = t = {}));
  function c(a, d, i) {
    const s = l(a.files), r = l(d.files);
    let o = null;
    const n = d.files[0], m = [], v = n.name, y = s.get(v);
    if (y == null)
      throw new Error(`no file ${v} in old blockmap`);
    const p = r.get(v);
    let S = 0;
    const { checksumToOffset: T, checksumToOldSize: P } = f(s.get(v), y.offset, i);
    let O = n.offset;
    for (let M = 0; M < p.checksums.length; O += p.sizes[M], M++) {
      const C = p.sizes[M], _ = p.checksums[M];
      let A = T.get(_);
      A != null && P.get(_) !== C && (i.warn(`Checksum ("${_}") matches, but size differs (old: ${P.get(_)}, new: ${C})`), A = void 0), A === void 0 ? (S++, o != null && o.kind === t.DOWNLOAD && o.end === O ? o.end += C : (o = {
        kind: t.DOWNLOAD,
        start: O,
        end: O + C
        // oldBlocks: null,
      }, u(o, m, _, M))) : o != null && o.kind === t.COPY && o.end === A ? o.end += C : (o = {
        kind: t.COPY,
        start: A,
        end: A + C
        // oldBlocks: [checksum]
      }, u(o, m, _, M));
    }
    return S > 0 && i.info(`File${n.name === "file" ? "" : " " + n.name} has ${S} changed blocks`), m;
  }
  const h = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function u(a, d, i, s) {
    if (h && d.length !== 0) {
      const r = d[d.length - 1];
      if (r.kind === a.kind && a.start < r.end && a.start > r.start) {
        const o = [r.start, r.end, a.start, a.end].reduce((n, m) => n < m ? n : m);
        throw new Error(`operation (block index: ${s}, checksum: ${i}, kind: ${t[a.kind]}) overlaps previous operation (checksum: ${i}):
abs: ${r.start} until ${r.end} and ${a.start} until ${a.end}
rel: ${r.start - o} until ${r.end - o} and ${a.start - o} until ${a.end - o}`);
      }
    }
    d.push(a);
  }
  function f(a, d, i) {
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
    let o = d;
    for (let n = 0; n < a.checksums.length; n++) {
      const m = a.checksums[n], v = a.sizes[n], y = r.get(m);
      if (y === void 0)
        s.set(m, o), r.set(m, v);
      else if (i.debug != null) {
        const p = y === v ? "(same size)" : `(size: ${y}, this size: ${v})`;
        i.debug(`${m} duplicated in blockmap ${p}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      o += v;
    }
    return { checksumToOffset: s, checksumToOldSize: r };
  }
  function l(a) {
    const d = /* @__PURE__ */ new Map();
    for (const i of a)
      d.set(i.name, i);
    return d;
  }
  return Lt;
}
var nl;
function au() {
  if (nl) return xt;
  nl = 1, Object.defineProperty(xt, "__esModule", { value: !0 }), xt.DataSplitter = void 0, xt.copyData = a;
  const t = Le(), c = pt, h = hr, u = ca(), f = Buffer.from(`\r
\r
`);
  var l;
  (function(i) {
    i[i.INIT = 0] = "INIT", i[i.HEADER = 1] = "HEADER", i[i.BODY = 2] = "BODY";
  })(l || (l = {}));
  function a(i, s, r, o, n) {
    const m = (0, c.createReadStream)("", {
      fd: r,
      autoClose: !1,
      start: i.start,
      // end is inclusive
      end: i.end - 1
    });
    m.on("error", o), m.once("end", n), m.pipe(s, {
      end: !1
    });
  }
  let d = class extends h.Writable {
    constructor(s, r, o, n, m, v) {
      super(), this.out = s, this.options = r, this.partIndexToTaskIndex = o, this.partIndexToLength = m, this.finishHandler = v, this.partIndex = -1, this.headerListBuffer = null, this.readState = l.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = n.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(s, r, o) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${s.length} bytes`);
        return;
      }
      this.handleData(s).then(o).catch(o);
    }
    async handleData(s) {
      let r = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, t.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const o = Math.min(this.ignoreByteCount, s.length);
        this.ignoreByteCount -= o, r = o;
      } else if (this.remainingPartDataCount > 0) {
        const o = Math.min(this.remainingPartDataCount, s.length);
        this.remainingPartDataCount -= o, await this.processPartData(s, 0, o), r = o;
      }
      if (r !== s.length) {
        if (this.readState === l.HEADER) {
          const o = this.searchHeaderListEnd(s, r);
          if (o === -1)
            return;
          r = o, this.readState = l.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === l.BODY)
            this.readState = l.INIT;
          else {
            this.partIndex++;
            let v = this.partIndexToTaskIndex.get(this.partIndex);
            if (v == null)
              if (this.isFinished)
                v = this.options.end;
              else
                throw (0, t.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const y = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (y < v)
              await this.copyExistingData(y, v);
            else if (y > v)
              throw (0, t.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (r = this.searchHeaderListEnd(s, r), r === -1) {
              this.readState = l.HEADER;
              return;
            }
          }
          const o = this.partIndexToLength[this.partIndex], n = r + o, m = Math.min(n, s.length);
          if (await this.processPartStarted(s, r, m), this.remainingPartDataCount = o - (m - r), this.remainingPartDataCount > 0)
            return;
          if (r = n + this.boundaryLength, r >= s.length) {
            this.ignoreByteCount = this.boundaryLength - (s.length - n);
            return;
          }
        }
      }
    }
    copyExistingData(s, r) {
      return new Promise((o, n) => {
        const m = () => {
          if (s === r) {
            o();
            return;
          }
          const v = this.options.tasks[s];
          if (v.kind !== u.OperationKind.COPY) {
            n(new Error("Task kind must be COPY"));
            return;
          }
          a(v, this.out, this.options.oldFileFd, n, () => {
            s++, m();
          });
        };
        m();
      });
    }
    searchHeaderListEnd(s, r) {
      const o = s.indexOf(f, r);
      if (o !== -1)
        return o + f.length;
      const n = r === 0 ? s : s.slice(r);
      return this.headerListBuffer == null ? this.headerListBuffer = n : this.headerListBuffer = Buffer.concat([this.headerListBuffer, n]), -1;
    }
    onPartEnd() {
      const s = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== s)
        throw (0, t.newError)(`Expected length: ${s} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(s, r, o) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(s, r, o);
    }
    processPartData(s, r, o) {
      this.actualPartLength += o - r;
      const n = this.out;
      return n.write(r === 0 && s.length === o ? s : s.slice(r, o)) ? Promise.resolve() : new Promise((m, v) => {
        n.on("error", v), n.once("drain", () => {
          n.removeListener("error", v), m();
        });
      });
    }
  };
  return xt.DataSplitter = d, xt;
}
var rr = {}, il;
function Df() {
  if (il) return rr;
  il = 1, Object.defineProperty(rr, "__esModule", { value: !0 }), rr.executeTasksUsingMultipleRangeRequests = u, rr.checkIsRangesSupported = l;
  const t = Le(), c = au(), h = ca();
  function u(a, d, i, s, r) {
    const o = (n) => {
      if (n >= d.length) {
        a.fileMetadataBuffer != null && i.write(a.fileMetadataBuffer), i.end();
        return;
      }
      const m = n + 1e3;
      f(a, {
        tasks: d,
        start: n,
        end: Math.min(d.length, m),
        oldFileFd: s
      }, i, () => o(m), r);
    };
    return o;
  }
  function f(a, d, i, s, r) {
    let o = "bytes=", n = 0;
    const m = /* @__PURE__ */ new Map(), v = [];
    for (let S = d.start; S < d.end; S++) {
      const T = d.tasks[S];
      T.kind === h.OperationKind.DOWNLOAD && (o += `${T.start}-${T.end - 1}, `, m.set(n, S), n++, v.push(T.end - T.start));
    }
    if (n <= 1) {
      const S = (T) => {
        if (T >= d.end) {
          s();
          return;
        }
        const P = d.tasks[T++];
        if (P.kind === h.OperationKind.COPY)
          (0, c.copyData)(P, i, d.oldFileFd, r, () => S(T));
        else {
          const O = a.createRequestOptions();
          O.headers.Range = `bytes=${P.start}-${P.end - 1}`;
          const M = a.httpExecutor.createRequest(O, (C) => {
            l(C, r) && (C.pipe(i, {
              end: !1
            }), C.once("end", () => S(T)));
          });
          a.httpExecutor.addErrorAndTimeoutHandlers(M, r), M.end();
        }
      };
      S(d.start);
      return;
    }
    const y = a.createRequestOptions();
    y.headers.Range = o.substring(0, o.length - 2);
    const p = a.httpExecutor.createRequest(y, (S) => {
      if (!l(S, r))
        return;
      const T = (0, t.safeGetHeader)(S, "content-type"), P = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(T);
      if (P == null) {
        r(new Error(`Content-Type "multipart/byteranges" is expected, but got "${T}"`));
        return;
      }
      const O = new c.DataSplitter(i, d, m, P[1] || P[2], v, s);
      O.on("error", r), S.pipe(O), S.on("end", () => {
        setTimeout(() => {
          p.abort(), r(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    a.httpExecutor.addErrorAndTimeoutHandlers(p, r), p.end();
  }
  function l(a, d) {
    if (a.statusCode >= 400)
      return d((0, t.createHttpError)(a)), !1;
    if (a.statusCode !== 206) {
      const i = (0, t.safeGetHeader)(a, "accept-ranges");
      if (i == null || i === "none")
        return d(new Error(`Server doesn't support Accept-Ranges (response code ${a.statusCode})`)), !1;
    }
    return !0;
  }
  return rr;
}
var nr = {}, al;
function Nf() {
  if (al) return nr;
  al = 1, Object.defineProperty(nr, "__esModule", { value: !0 }), nr.ProgressDifferentialDownloadCallbackTransform = void 0;
  const t = hr;
  var c;
  (function(u) {
    u[u.COPY = 0] = "COPY", u[u.DOWNLOAD = 1] = "DOWNLOAD";
  })(c || (c = {}));
  let h = class extends t.Transform {
    constructor(f, l, a) {
      super(), this.progressDifferentialDownloadInfo = f, this.cancellationToken = l, this.onProgress = a, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = c.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(f, l, a) {
      if (this.cancellationToken.cancelled) {
        a(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == c.COPY) {
        a(null, f);
        return;
      }
      this.transferred += f.length, this.delta += f.length;
      const d = Date.now();
      d >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = d + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((d - this.start) / 1e3))
      }), this.delta = 0), a(null, f);
    }
    beginFileCopy() {
      this.operationType = c.COPY;
    }
    beginRangeDownload() {
      this.operationType = c.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
      this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
    // Called when we are 100% done with the connection/download
    _flush(f) {
      if (this.cancellationToken.cancelled) {
        f(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, f(null);
    }
  };
  return nr.ProgressDifferentialDownloadCallbackTransform = h, nr;
}
var ol;
function ou() {
  if (ol) return tr;
  ol = 1, Object.defineProperty(tr, "__esModule", { value: !0 }), tr.DifferentialDownloader = void 0;
  const t = Le(), c = /* @__PURE__ */ mt(), h = pt, u = au(), f = Ut, l = ca(), a = Df(), d = Nf();
  let i = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(n, m, v) {
      this.blockAwareFileInfo = n, this.httpExecutor = m, this.options = v, this.fileMetadataBuffer = null, this.logger = v.logger;
    }
    createRequestOptions() {
      const n = {
        headers: {
          ...this.options.requestHeaders,
          accept: "*/*"
        }
      };
      return (0, t.configureRequestUrl)(this.options.newUrl, n), (0, t.configureRequestOptions)(n), n;
    }
    doDownload(n, m) {
      if (n.version !== m.version)
        throw new Error(`version is different (${n.version} - ${m.version}), full download is required`);
      const v = this.logger, y = (0, l.computeOperations)(n, m, v);
      v.debug != null && v.debug(JSON.stringify(y, null, 2));
      let p = 0, S = 0;
      for (const P of y) {
        const O = P.end - P.start;
        P.kind === l.OperationKind.DOWNLOAD ? p += O : S += O;
      }
      const T = this.blockAwareFileInfo.size;
      if (p + S + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== T)
        throw new Error(`Internal error, size mismatch: downloadSize: ${p}, copySize: ${S}, newSize: ${T}`);
      return v.info(`Full: ${s(T)}, To download: ${s(p)} (${Math.round(p / (T / 100))}%)`), this.downloadFile(y);
    }
    downloadFile(n) {
      const m = [], v = () => Promise.all(m.map((y) => (0, c.close)(y.descriptor).catch((p) => {
        this.logger.error(`cannot close file "${y.path}": ${p}`);
      })));
      return this.doDownloadFile(n, m).then(v).catch((y) => v().catch((p) => {
        try {
          this.logger.error(`cannot close files: ${p}`);
        } catch (S) {
          try {
            console.error(S);
          } catch {
          }
        }
        throw y;
      }).then(() => {
        throw y;
      }));
    }
    async doDownloadFile(n, m) {
      const v = await (0, c.open)(this.options.oldFile, "r");
      m.push({ descriptor: v, path: this.options.oldFile });
      const y = await (0, c.open)(this.options.newFile, "w");
      m.push({ descriptor: y, path: this.options.newFile });
      const p = (0, h.createWriteStream)(this.options.newFile, { fd: y });
      await new Promise((S, T) => {
        const P = [];
        let O;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const L = [];
          let q = 0;
          for (const F of n)
            F.kind === l.OperationKind.DOWNLOAD && (L.push(F.end - F.start), q += F.end - F.start);
          const D = {
            expectedByteCounts: L,
            grandTotal: q
          };
          O = new d.ProgressDifferentialDownloadCallbackTransform(D, this.options.cancellationToken, this.options.onProgress), P.push(O);
        }
        const M = new t.DigestTransform(this.blockAwareFileInfo.sha512);
        M.isValidateOnEnd = !1, P.push(M), p.on("finish", () => {
          p.close(() => {
            m.splice(1, 1);
            try {
              M.validate();
            } catch (L) {
              T(L);
              return;
            }
            S(void 0);
          });
        }), P.push(p);
        let C = null;
        for (const L of P)
          L.on("error", T), C == null ? C = L : C = C.pipe(L);
        const _ = P[0];
        let A;
        if (this.options.isUseMultipleRangeRequest) {
          A = (0, a.executeTasksUsingMultipleRangeRequests)(this, n, _, v, T), A(0);
          return;
        }
        let E = 0, k = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const U = this.createRequestOptions();
        U.redirect = "manual", A = (L) => {
          var q, D;
          if (L >= n.length) {
            this.fileMetadataBuffer != null && _.write(this.fileMetadataBuffer), _.end();
            return;
          }
          const F = n[L++];
          if (F.kind === l.OperationKind.COPY) {
            O && O.beginFileCopy(), (0, u.copyData)(F, _, v, T, () => A(L));
            return;
          }
          const j = `bytes=${F.start}-${F.end - 1}`;
          U.headers.range = j, (D = (q = this.logger) === null || q === void 0 ? void 0 : q.debug) === null || D === void 0 || D.call(q, `download range: ${j}`), O && O.beginRangeDownload();
          const I = this.httpExecutor.createRequest(U, (Q) => {
            Q.on("error", T), Q.on("aborted", () => {
              T(new Error("response has been aborted by the server"));
            }), Q.statusCode >= 400 && T((0, t.createHttpError)(Q)), Q.pipe(_, {
              end: !1
            }), Q.once("end", () => {
              O && O.endRangeDownload(), ++E === 100 ? (E = 0, setTimeout(() => A(L), 1e3)) : A(L);
            });
          });
          I.on("redirect", (Q, Y, ne) => {
            this.logger.info(`Redirect to ${r(ne)}`), k = ne, (0, t.configureRequestUrl)(new f.URL(k), U), I.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers(I, T), I.end();
        }, A(0);
      });
    }
    async readRemoteBytes(n, m) {
      const v = Buffer.allocUnsafe(m + 1 - n), y = this.createRequestOptions();
      y.headers.range = `bytes=${n}-${m}`;
      let p = 0;
      if (await this.request(y, (S) => {
        S.copy(v, p), p += S.length;
      }), p !== v.length)
        throw new Error(`Received data length ${p} is not equal to expected ${v.length}`);
      return v;
    }
    request(n, m) {
      return new Promise((v, y) => {
        const p = this.httpExecutor.createRequest(n, (S) => {
          (0, a.checkIsRangesSupported)(S, y) && (S.on("error", y), S.on("aborted", () => {
            y(new Error("response has been aborted by the server"));
          }), S.on("data", m), S.on("end", () => v()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(p, y), p.end();
      });
    }
  };
  tr.DifferentialDownloader = i;
  function s(o, n = " KB") {
    return new Intl.NumberFormat("en").format((o / 1024).toFixed(2)) + n;
  }
  function r(o) {
    const n = o.indexOf("?");
    return n < 0 ? o : o.substring(0, n);
  }
  return tr;
}
var sl;
function Ff() {
  if (sl) return er;
  sl = 1, Object.defineProperty(er, "__esModule", { value: !0 }), er.GenericDifferentialDownloader = void 0;
  const t = ou();
  let c = class extends t.DifferentialDownloader {
    download(u, f) {
      return this.doDownload(u, f);
    }
  };
  return er.GenericDifferentialDownloader = c, er;
}
var zi = {}, ll;
function Ot() {
  return ll || (ll = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.UpdaterSignal = t.UPDATE_DOWNLOADED = t.DOWNLOAD_PROGRESS = t.CancellationToken = void 0, t.addHandler = u;
    const c = Le();
    Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return c.CancellationToken;
    } }), t.DOWNLOAD_PROGRESS = "download-progress", t.UPDATE_DOWNLOADED = "update-downloaded";
    class h {
      constructor(l) {
        this.emitter = l;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(l) {
        u(this.emitter, "login", l);
      }
      progress(l) {
        u(this.emitter, t.DOWNLOAD_PROGRESS, l);
      }
      updateDownloaded(l) {
        u(this.emitter, t.UPDATE_DOWNLOADED, l);
      }
      updateCancelled(l) {
        u(this.emitter, "update-cancelled", l);
      }
    }
    t.UpdaterSignal = h;
    function u(f, l, a) {
      f.on(l, a);
    }
  })(zi)), zi;
}
var ul;
function fa() {
  if (ul) return St;
  ul = 1, Object.defineProperty(St, "__esModule", { value: !0 }), St.NoOpLogger = St.AppUpdater = void 0;
  const t = Le(), c = pr, h = kr, u = Ol, f = /* @__PURE__ */ mt(), l = na(), a = Xc(), d = be, i = ru(), s = Sf(), r = Rf(), o = Tf(), n = nu(), m = If(), v = Dl, y = Pt(), p = Ff(), S = Ot();
  let T = class su extends u.EventEmitter {
    /**
     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
     */
    get channel() {
      return this._channel;
    }
    /**
     * Set the update channel. Overrides `channel` in the update configuration.
     *
     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
     */
    set channel(C) {
      if (this._channel != null) {
        if (typeof C != "string")
          throw (0, t.newError)(`Channel must be a string, but got: ${C}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (C.length === 0)
          throw (0, t.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = C, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(C) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: C
      });
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    get netSession() {
      return (0, o.getNetSession)();
    }
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    get logger() {
      return this._logger;
    }
    set logger(C) {
      this._logger = C ?? new O();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(C) {
      this.clientPromise = null, this._appUpdateConfigPath = C, this.configOnDisk = new a.Lazy(() => this.loadUpdateConfig());
    }
    /**
     * Allows developer to override default logic for determining if an update is supported.
     * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
     */
    get isUpdateSupported() {
      return this._isUpdateSupported;
    }
    set isUpdateSupported(C) {
      C && (this._isUpdateSupported = C);
    }
    constructor(C, _) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new S.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (k) => this.checkIfUpdateSupported(k), this.clientPromise = null, this.stagingUserIdPromise = new a.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new a.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (k) => {
        this._logger.error(`Error: ${k.stack || k.message}`);
      }), _ == null ? (this.app = new r.ElectronAppAdapter(), this.httpExecutor = new o.ElectronHttpExecutor((k, U) => this.emit("login", k, U))) : (this.app = _, this.httpExecutor = null);
      const A = this.app.version, E = (0, i.parse)(A);
      if (E == null)
        throw (0, t.newError)(`App version is not a valid semver version: "${A}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = E, this.allowPrerelease = P(E), C != null && (this.setFeedURL(C), typeof C != "string" && C.requestHeaders && (this.requestHeaders = C.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(C) {
      const _ = this.createProviderRuntimeOptions();
      let A;
      typeof C == "string" ? A = new n.GenericProvider({ provider: "generic", url: C }, this, {
        ..._,
        isUseMultipleRangeRequest: (0, m.isUrlProbablySupportMultiRangeRequests)(C)
      }) : A = (0, m.createClient)(C, this, _), this.clientPromise = Promise.resolve(A);
    }
    /**
     * Asks the server whether there is an update.
     * @returns null if the updater is disabled, otherwise info about the latest version
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let C = this.checkForUpdatesPromise;
      if (C != null)
        return this._logger.info("Checking for update (already in progress)"), C;
      const _ = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), C = this.doCheckForUpdates().then((A) => (_(), A)).catch((A) => {
        throw _(), this.emit("error", A, `Cannot check for updates: ${(A.stack || A).toString()}`), A;
      }), this.checkForUpdatesPromise = C, C;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(C) {
      return this.checkForUpdates().then((_) => _?.downloadPromise ? (_.downloadPromise.then(() => {
        const A = su.formatDownloadNotification(_.updateInfo.version, this.app.name, C);
        new Ct.Notification(A).show();
      }), _) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), _));
    }
    static formatDownloadNotification(C, _, A) {
      return A == null && (A = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), A = {
        title: A.title.replace("{appName}", _).replace("{version}", C),
        body: A.body.replace("{appName}", _).replace("{version}", C)
      }, A;
    }
    async isStagingMatch(C) {
      const _ = C.stagingPercentage;
      let A = _;
      if (A == null)
        return !0;
      if (A = parseInt(A, 10), isNaN(A))
        return this._logger.warn(`Staging percentage is NaN: ${_}`), !0;
      A = A / 100;
      const E = await this.stagingUserIdPromise.value, U = t.UUID.parse(E).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${A}, percentage: ${U}, user id: ${E}`), U < A;
    }
    computeFinalHeaders(C) {
      return this.requestHeaders != null && Object.assign(C, this.requestHeaders), C;
    }
    async isUpdateAvailable(C) {
      const _ = (0, i.parse)(C.version);
      if (_ == null)
        throw (0, t.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${C.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const A = this.currentVersion;
      if ((0, i.eq)(_, A) || !await Promise.resolve(this.isUpdateSupported(C)) || !await this.isStagingMatch(C))
        return !1;
      const k = (0, i.gt)(_, A), U = (0, i.lt)(_, A);
      return k ? !0 : this.allowDowngrade && U;
    }
    checkIfUpdateSupported(C) {
      const _ = C?.minimumSystemVersion, A = (0, h.release)();
      if (_)
        try {
          if ((0, i.lt)(A, _))
            return this._logger.info(`Current OS version ${A} is less than the minimum OS version required ${_} for version ${A}`), !1;
        } catch (E) {
          this._logger.warn(`Failed to compare current OS version(${A}) with minimum OS version(${_}): ${(E.message || E).toString()}`);
        }
      return !0;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((A) => (0, m.createClient)(A, this, this.createProviderRuntimeOptions())));
      const C = await this.clientPromise, _ = await this.stagingUserIdPromise.value;
      return C.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": _ })), {
        info: await C.getLatestVersion(),
        provider: C
      };
    }
    createProviderRuntimeOptions() {
      return {
        isUseMultipleRangeRequest: !0,
        platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
        executor: this.httpExecutor
      };
    }
    async doCheckForUpdates() {
      this.emit("checking-for-update");
      const C = await this.getUpdateInfoAndProvider(), _ = C.info;
      if (!await this.isUpdateAvailable(_))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${_.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", _), {
          isUpdateAvailable: !1,
          versionInfo: _,
          updateInfo: _
        };
      this.updateInfoAndProvider = C, this.onUpdateAvailable(_);
      const A = new t.CancellationToken();
      return {
        isUpdateAvailable: !0,
        versionInfo: _,
        updateInfo: _,
        cancellationToken: A,
        downloadPromise: this.autoDownload ? this.downloadUpdate(A) : null
      };
    }
    onUpdateAvailable(C) {
      this._logger.info(`Found version ${C.version} (url: ${(0, t.asArray)(C.files).map((_) => _.url).join(", ")})`), this.emit("update-available", C);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(C = new t.CancellationToken()) {
      const _ = this.updateInfoAndProvider;
      if (_ == null) {
        const E = new Error("Please check update first");
        return this.dispatchError(E), Promise.reject(E);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, t.asArray)(_.info.files).map((E) => E.url).join(", ")}`);
      const A = (E) => {
        if (!(E instanceof t.CancellationError))
          try {
            this.dispatchError(E);
          } catch (k) {
            this._logger.warn(`Cannot dispatch error event: ${k.stack || k}`);
          }
        return E;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: _,
        requestHeaders: this.computeRequestHeaders(_.provider),
        cancellationToken: C,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((E) => {
        throw A(E);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(C) {
      this.emit("error", C, (C.stack || C).toString());
    }
    dispatchUpdateDownloaded(C) {
      this.emit(S.UPDATE_DOWNLOADED, C);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, l.load)(await (0, f.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(C) {
      const _ = C.fileExtraDownloadHeaders;
      if (_ != null) {
        const A = this.requestHeaders;
        return A == null ? _ : {
          ..._,
          ...A
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const C = d.join(this.app.userDataPath, ".updaterId");
      try {
        const A = await (0, f.readFile)(C, "utf-8");
        if (t.UUID.check(A))
          return A;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${A}`);
      } catch (A) {
        A.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${A}`);
      }
      const _ = t.UUID.v5((0, c.randomBytes)(4096), t.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${_}`);
      try {
        await (0, f.outputFile)(C, _);
      } catch (A) {
        this._logger.warn(`Couldn't write out staging user ID: ${A}`);
      }
      return _;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const C = this.requestHeaders;
      if (C == null)
        return !0;
      for (const _ of Object.keys(C)) {
        const A = _.toLowerCase();
        if (A === "authorization" || A === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let C = this.downloadedUpdateHelper;
      if (C == null) {
        const _ = (await this.configOnDisk.value).updaterCacheDirName, A = this._logger;
        _ == null && A.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const E = d.join(this.app.baseCachePath, _ || this.app.name);
        A.debug != null && A.debug(`updater cache dir: ${E}`), C = new s.DownloadedUpdateHelper(E), this.downloadedUpdateHelper = C;
      }
      return C;
    }
    async executeDownload(C) {
      const _ = C.fileInfo, A = {
        headers: C.downloadUpdateOptions.requestHeaders,
        cancellationToken: C.downloadUpdateOptions.cancellationToken,
        sha2: _.info.sha2,
        sha512: _.info.sha512
      };
      this.listenerCount(S.DOWNLOAD_PROGRESS) > 0 && (A.onProgress = (ge) => this.emit(S.DOWNLOAD_PROGRESS, ge));
      const E = C.downloadUpdateOptions.updateInfoAndProvider.info, k = E.version, U = _.packageInfo;
      function L() {
        const ge = decodeURIComponent(C.fileInfo.url.pathname);
        return ge.endsWith(`.${C.fileExtension}`) ? d.basename(ge) : C.fileInfo.info.url;
      }
      const q = await this.getOrCreateDownloadHelper(), D = q.cacheDirForPendingUpdate;
      await (0, f.mkdir)(D, { recursive: !0 });
      const F = L();
      let j = d.join(D, F);
      const I = U == null ? null : d.join(D, `package-${k}${d.extname(U.path) || ".7z"}`), Q = async (ge) => (await q.setDownloadedFile(j, I, E, _, F, ge), await C.done({
        ...E,
        downloadedFile: j
      }), I == null ? [j] : [j, I]), Y = this._logger, ne = await q.validateDownloadedPath(j, E, _, Y);
      if (ne != null)
        return j = ne, await Q(!1);
      const de = async () => (await q.clear().catch(() => {
      }), await (0, f.unlink)(j).catch(() => {
      })), ce = await (0, s.createTempUpdateFile)(`temp-${F}`, D, Y);
      try {
        await C.task(ce, A, I, de), await (0, t.retry)(() => (0, f.rename)(ce, j), 60, 500, 0, 0, (ge) => ge instanceof Error && /^EBUSY:/.test(ge.message));
      } catch (ge) {
        throw await de(), ge instanceof t.CancellationError && (Y.info("cancelled"), this.emit("update-cancelled", E)), ge;
      }
      return Y.info(`New version ${k} has been downloaded to ${j}`), await Q(!0);
    }
    async differentialDownloadInstaller(C, _, A, E, k) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const U = (0, y.blockmapFiles)(C.url, this.app.version, _.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${U[0]}", new: ${U[1]})`);
        const L = async (F) => {
          const j = await this.httpExecutor.downloadToBuffer(F, {
            headers: _.requestHeaders,
            cancellationToken: _.cancellationToken
          });
          if (j == null || j.length === 0)
            throw new Error(`Blockmap "${F.href}" is empty`);
          try {
            return JSON.parse((0, v.gunzipSync)(j).toString());
          } catch (I) {
            throw new Error(`Cannot parse blockmap "${F.href}", error: ${I}`);
          }
        }, q = {
          newUrl: C.url,
          oldFile: d.join(this.downloadedUpdateHelper.cacheDir, k),
          logger: this._logger,
          newFile: A,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          requestHeaders: _.requestHeaders,
          cancellationToken: _.cancellationToken
        };
        this.listenerCount(S.DOWNLOAD_PROGRESS) > 0 && (q.onProgress = (F) => this.emit(S.DOWNLOAD_PROGRESS, F));
        const D = await Promise.all(U.map((F) => L(F)));
        return await new p.GenericDifferentialDownloader(C.info, this.httpExecutor, q).download(D[0], D[1]), !1;
      } catch (U) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${U.stack || U}`), this._testOnlyOptions != null)
          throw U;
        return !0;
      }
    }
  };
  St.AppUpdater = T;
  function P(M) {
    const C = (0, i.prerelease)(M);
    return C != null && C.length > 0;
  }
  class O {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(C) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(C) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(C) {
    }
  }
  return St.NoOpLogger = O, St;
}
var cl;
function Mt() {
  if (cl) return jt;
  cl = 1, Object.defineProperty(jt, "__esModule", { value: !0 }), jt.BaseUpdater = void 0;
  const t = $r, c = fa();
  let h = class extends c.AppUpdater {
    constructor(f, l) {
      super(f, l), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(f = !1, l = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(f, f ? l : this.autoRunAppAfterInstall) ? setImmediate(() => {
        Ct.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(f) {
      return super.executeDownload({
        ...f,
        done: (l) => (this.dispatchUpdateDownloaded(l), this.addQuitHandler(), Promise.resolve())
      });
    }
    get installerPath() {
      return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
    }
    // must be sync (because quit even handler is not async)
    install(f = !1, l = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const a = this.downloadedUpdateHelper, d = this.installerPath, i = a == null ? null : a.downloadedFileInfo;
      if (d == null || i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${f}, isForceRunAfter: ${l}`), this.doInstall({
          isSilent: f,
          isForceRunAfter: l,
          isAdminRightsRequired: i.isAdminRightsRequired
        });
      } catch (s) {
        return this.dispatchError(s), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((f) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (f !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${f}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: f } = this.app, l = `"${f} would like to update"`, a = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), d = [a];
      return /kdesudo/i.test(a) ? (d.push("--comment", l), d.push("-c")) : /gksudo/i.test(a) ? d.push("--message", l) : /pkexec/i.test(a) && d.push("--disable-internal-agent"), d.join(" ");
    }
    spawnSyncLog(f, l = [], a = {}) {
      this._logger.info(`Executing: ${f} with args: ${l}`);
      const d = (0, t.spawnSync)(f, l, {
        env: { ...process.env, ...a },
        encoding: "utf-8",
        shell: !0
      }), { error: i, status: s, stdout: r, stderr: o } = d;
      if (i != null)
        throw this._logger.error(o), i;
      if (s != null && s !== 0)
        throw this._logger.error(o), new Error(`Command ${f} exited with code ${s}`);
      return r.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(f, l = [], a = void 0, d = "ignore") {
      return this._logger.info(`Executing: ${f} with args: ${l}`), new Promise((i, s) => {
        try {
          const r = { stdio: d, env: a, detached: !0 }, o = (0, t.spawn)(f, l, r);
          o.on("error", (n) => {
            s(n);
          }), o.unref(), o.pid !== void 0 && i(!0);
        } catch (r) {
          s(r);
        }
      });
    }
  };
  return jt.BaseUpdater = h, jt;
}
var ir = {}, ar = {}, fl;
function lu() {
  if (fl) return ar;
  fl = 1, Object.defineProperty(ar, "__esModule", { value: !0 }), ar.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const t = /* @__PURE__ */ mt(), c = ou(), h = Dl;
  let u = class extends c.DifferentialDownloader {
    async download() {
      const d = this.blockAwareFileInfo, i = d.size, s = i - (d.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(s, i - 1);
      const r = f(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await l(this.options.oldFile), r);
    }
  };
  ar.FileWithEmbeddedBlockMapDifferentialDownloader = u;
  function f(a) {
    return JSON.parse((0, h.inflateRawSync)(a).toString());
  }
  async function l(a) {
    const d = await (0, t.open)(a, "r");
    try {
      const i = (await (0, t.fstat)(d)).size, s = Buffer.allocUnsafe(4);
      await (0, t.read)(d, s, 0, s.length, i - s.length);
      const r = Buffer.allocUnsafe(s.readUInt32BE(0));
      return await (0, t.read)(d, r, 0, r.length, i - s.length - r.length), await (0, t.close)(d), f(r);
    } catch (i) {
      throw await (0, t.close)(d), i;
    }
  }
  return ar;
}
var dl;
function hl() {
  if (dl) return ir;
  dl = 1, Object.defineProperty(ir, "__esModule", { value: !0 }), ir.AppImageUpdater = void 0;
  const t = Le(), c = $r, h = /* @__PURE__ */ mt(), u = pt, f = be, l = Mt(), a = lu(), d = Xe(), i = Ot();
  let s = class extends l.BaseUpdater {
    constructor(o, n) {
      super(o, n);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(o) {
      const n = o.updateInfoAndProvider.provider, m = (0, d.findFile)(n.resolveFiles(o.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: m,
        downloadUpdateOptions: o,
        task: async (v, y) => {
          const p = process.env.APPIMAGE;
          if (p == null)
            throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          (o.disableDifferentialDownload || await this.downloadDifferential(m, p, v, n, o)) && await this.httpExecutor.download(m.url, v, y), await (0, h.chmod)(v, 493);
        }
      });
    }
    async downloadDifferential(o, n, m, v, y) {
      try {
        const p = {
          newUrl: o.url,
          oldFile: n,
          logger: this._logger,
          newFile: m,
          isUseMultipleRangeRequest: v.isUseMultipleRangeRequest,
          requestHeaders: y.requestHeaders,
          cancellationToken: y.cancellationToken
        };
        return this.listenerCount(i.DOWNLOAD_PROGRESS) > 0 && (p.onProgress = (S) => this.emit(i.DOWNLOAD_PROGRESS, S)), await new a.FileWithEmbeddedBlockMapDifferentialDownloader(o.info, this.httpExecutor, p).download(), !1;
      } catch (p) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${p.stack || p}`), process.platform === "linux";
      }
    }
    doInstall(o) {
      const n = process.env.APPIMAGE;
      if (n == null)
        throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, u.unlinkSync)(n);
      let m;
      const v = f.basename(n), y = this.installerPath;
      if (y == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      f.basename(y) === v || !/\d+\.\d+\.\d+/.test(v) ? m = n : m = f.join(f.dirname(n), f.basename(y)), (0, c.execFileSync)("mv", ["-f", y, m]), m !== n && this.emit("appimage-filename-updated", m);
      const p = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return o.isForceRunAfter ? this.spawnLog(m, [], p) : (p.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, c.execFileSync)(m, [], { env: p })), !0;
    }
  };
  return ir.AppImageUpdater = s, ir;
}
var or = {}, pl;
function ml() {
  if (pl) return or;
  pl = 1, Object.defineProperty(or, "__esModule", { value: !0 }), or.DebUpdater = void 0;
  const t = Mt(), c = Xe(), h = Ot();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, c.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(h.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(h.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.installerPath;
      if (i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const s = ["dpkg", "-i", i, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${s.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return or.DebUpdater = u, or;
}
var sr = {}, gl;
function vl() {
  if (gl) return sr;
  gl = 1, Object.defineProperty(sr, "__esModule", { value: !0 }), sr.PacmanUpdater = void 0;
  const t = Mt(), c = Ot(), h = Xe();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, h.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
      return this.executeDownload({
        fileExtension: "pacman",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(c.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(c.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.installerPath;
      if (i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const s = ["pacman", "-U", "--noconfirm", i];
      return this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${s.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return sr.PacmanUpdater = u, sr;
}
var lr = {}, El;
function yl() {
  if (El) return lr;
  El = 1, Object.defineProperty(lr, "__esModule", { value: !0 }), lr.RpmUpdater = void 0;
  const t = Mt(), c = Ot(), h = Xe();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, h.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(c.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(c.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.spawnSyncLog("which zypper"), s = this.installerPath;
      if (s == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      let r;
      return i ? r = [i, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", s] : r = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", s], this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${r.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return lr.RpmUpdater = u, lr;
}
var ur = {}, wl;
function _l() {
  if (wl) return ur;
  wl = 1, Object.defineProperty(ur, "__esModule", { value: !0 }), ur.MacUpdater = void 0;
  const t = Le(), c = /* @__PURE__ */ mt(), h = pt, u = be, f = lc, l = fa(), a = Xe(), d = $r, i = pr;
  let s = class extends l.AppUpdater {
    constructor(o, n) {
      super(o, n), this.nativeUpdater = Ct.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (m) => {
        this._logger.warn(m), this.emit("error", m);
      }), this.nativeUpdater.on("update-downloaded", () => {
        this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
      });
    }
    debug(o) {
      this._logger.debug != null && this._logger.debug(o);
    }
    closeServerIfExists() {
      this.server && (this.debug("Closing proxy server"), this.server.close((o) => {
        o && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
      }));
    }
    async doDownloadUpdate(o) {
      let n = o.updateInfoAndProvider.provider.resolveFiles(o.updateInfoAndProvider.info);
      const m = this._logger, v = "sysctl.proc_translated";
      let y = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), y = (0, d.execFileSync)("sysctl", [v], { encoding: "utf8" }).includes(`${v}: 1`), m.info(`Checked for macOS Rosetta environment (isRosetta=${y})`);
      } catch (M) {
        m.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${M}`);
      }
      let p = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const C = (0, d.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        m.info(`Checked 'uname -a': arm64=${C}`), p = p || C;
      } catch (M) {
        m.warn(`uname shell command to check for arm64 failed: ${M}`);
      }
      p = p || process.arch === "arm64" || y;
      const S = (M) => {
        var C;
        return M.url.pathname.includes("arm64") || ((C = M.info.url) === null || C === void 0 ? void 0 : C.includes("arm64"));
      };
      p && n.some(S) ? n = n.filter((M) => p === S(M)) : n = n.filter((M) => !S(M));
      const T = (0, a.findFile)(n, "zip", ["pkg", "dmg"]);
      if (T == null)
        throw (0, t.newError)(`ZIP file not provided: ${(0, t.safeStringifyJson)(n)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const P = o.updateInfoAndProvider.provider, O = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: T,
        downloadUpdateOptions: o,
        task: async (M, C) => {
          const _ = u.join(this.downloadedUpdateHelper.cacheDir, O), A = () => (0, c.pathExistsSync)(_) ? !o.disableDifferentialDownload : (m.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let E = !0;
          A() && (E = await this.differentialDownloadInstaller(T, o, M, P, O)), E && await this.httpExecutor.download(T.url, M, C);
        },
        done: async (M) => {
          if (!o.disableDifferentialDownload)
            try {
              const C = u.join(this.downloadedUpdateHelper.cacheDir, O);
              await (0, c.copyFile)(M.downloadedFile, C);
            } catch (C) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${C.message}`);
            }
          return this.updateDownloaded(T, M);
        }
      });
    }
    async updateDownloaded(o, n) {
      var m;
      const v = n.downloadedFile, y = (m = o.info.size) !== null && m !== void 0 ? m : (await (0, c.stat)(v)).size, p = this._logger, S = `fileToProxy=${o.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${S})`), this.server = (0, f.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${S})`), this.server.on("close", () => {
        p.info(`Proxy server for native Squirrel.Mac is closed (${S})`);
      });
      const T = (P) => {
        const O = P.address();
        return typeof O == "string" ? O : `http://127.0.0.1:${O?.port}`;
      };
      return await new Promise((P, O) => {
        const M = (0, i.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), C = Buffer.from(`autoupdater:${M}`, "ascii"), _ = `/${(0, i.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (A, E) => {
          const k = A.url;
          if (p.info(`${k} requested`), k === "/") {
            if (!A.headers.authorization || A.headers.authorization.indexOf("Basic ") === -1) {
              E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), p.warn("No authenthication info");
              return;
            }
            const q = A.headers.authorization.split(" ")[1], D = Buffer.from(q, "base64").toString("ascii"), [F, j] = D.split(":");
            if (F !== "autoupdater" || j !== M) {
              E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), p.warn("Invalid authenthication credentials");
              return;
            }
            const I = Buffer.from(`{ "url": "${T(this.server)}${_}" }`);
            E.writeHead(200, { "Content-Type": "application/json", "Content-Length": I.length }), E.end(I);
            return;
          }
          if (!k.startsWith(_)) {
            p.warn(`${k} requested, but not supported`), E.writeHead(404), E.end();
            return;
          }
          p.info(`${_} requested by Squirrel.Mac, pipe ${v}`);
          let U = !1;
          E.on("finish", () => {
            U || (this.nativeUpdater.removeListener("error", O), P([]));
          });
          const L = (0, h.createReadStream)(v);
          L.on("error", (q) => {
            try {
              E.end();
            } catch (D) {
              p.warn(`cannot end response: ${D}`);
            }
            U = !0, this.nativeUpdater.removeListener("error", O), O(new Error(`Cannot pipe "${v}": ${q}`));
          }), E.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": y
          }), L.pipe(E);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${S})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${T(this.server)}, ${S})`), this.nativeUpdater.setFeedURL({
            url: T(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${C.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(n), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", O), this.nativeUpdater.checkForUpdates()) : P([]);
        });
      });
    }
    handleUpdateDownloaded() {
      this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
    }
    quitAndInstall() {
      this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
    }
  };
  return ur.MacUpdater = s, ur;
}
var cr = {}, Ur = {}, Sl;
function xf() {
  if (Sl) return Ur;
  Sl = 1, Object.defineProperty(Ur, "__esModule", { value: !0 }), Ur.verifySignature = f;
  const t = Le(), c = $r, h = kr, u = be;
  function f(i, s, r) {
    return new Promise((o, n) => {
      const m = s.replace(/'/g, "''");
      r.info(`Verifying signature ${m}`), (0, c.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${m}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (v, y, p) => {
        var S;
        try {
          if (v != null || p) {
            a(r, v, p, n), o(null);
            return;
          }
          const T = l(y);
          if (T.Status === 0) {
            try {
              const C = u.normalize(T.Path), _ = u.normalize(s);
              if (r.info(`LiteralPath: ${C}. Update Path: ${_}`), C !== _) {
                a(r, new Error(`LiteralPath of ${C} is different than ${_}`), p, n), o(null);
                return;
              }
            } catch (C) {
              r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(S = C.message) !== null && S !== void 0 ? S : C.stack}`);
            }
            const O = (0, t.parseDn)(T.SignerCertificate.Subject);
            let M = !1;
            for (const C of i) {
              const _ = (0, t.parseDn)(C);
              if (_.size ? M = Array.from(_.keys()).every((E) => _.get(E) === O.get(E)) : C === O.get("CN") && (r.warn(`Signature validated using only CN ${C}. Please add your full Distinguished Name (DN) to publisherNames configuration`), M = !0), M) {
                o(null);
                return;
              }
            }
          }
          const P = `publisherNames: ${i.join(" | ")}, raw info: ` + JSON.stringify(T, (O, M) => O === "RawData" ? void 0 : M, 2);
          r.warn(`Sign verification failed, installer signed with incorrect certificate: ${P}`), o(P);
        } catch (T) {
          a(r, T, null, n), o(null);
          return;
        }
      });
    });
  }
  function l(i) {
    const s = JSON.parse(i);
    delete s.PrivateKey, delete s.IsOSBinary, delete s.SignatureType;
    const r = s.SignerCertificate;
    return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), s;
  }
  function a(i, s, r, o) {
    if (d()) {
      i.warn(`Cannot execute Get-AuthenticodeSignature: ${s || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, c.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (n) {
      i.warn(`Cannot execute ConvertTo-Json: ${n.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    s != null && o(s), r && o(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
  }
  function d() {
    const i = h.release();
    return i.startsWith("6.") && !i.startsWith("6.3");
  }
  return Ur;
}
var Al;
function Rl() {
  if (Al) return cr;
  Al = 1, Object.defineProperty(cr, "__esModule", { value: !0 }), cr.NsisUpdater = void 0;
  const t = Le(), c = be, h = Mt(), u = lu(), f = Ot(), l = Xe(), a = /* @__PURE__ */ mt(), d = xf(), i = Ut;
  let s = class extends h.BaseUpdater {
    constructor(o, n) {
      super(o, n), this._verifyUpdateCodeSignature = (m, v) => (0, d.verifySignature)(m, v, this._logger);
    }
    /**
     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
     */
    get verifyUpdateCodeSignature() {
      return this._verifyUpdateCodeSignature;
    }
    set verifyUpdateCodeSignature(o) {
      o && (this._verifyUpdateCodeSignature = o);
    }
    /*** @private */
    doDownloadUpdate(o) {
      const n = o.updateInfoAndProvider.provider, m = (0, l.findFile)(n.resolveFiles(o.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: o,
        fileInfo: m,
        task: async (v, y, p, S) => {
          const T = m.packageInfo, P = T != null && p != null;
          if (P && o.disableWebInstaller)
            throw (0, t.newError)(`Unable to download new version ${o.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !P && !o.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (P || o.disableDifferentialDownload || await this.differentialDownloadInstaller(m, o, v, n, t.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(m.url, v, y);
          const O = await this.verifySignature(v);
          if (O != null)
            throw await S(), (0, t.newError)(`New version ${o.updateInfoAndProvider.info.version} is not signed by the application owner: ${O}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (P && await this.differentialDownloadWebPackage(o, T, p, n))
            try {
              await this.httpExecutor.download(new i.URL(T.path), p, {
                headers: o.requestHeaders,
                cancellationToken: o.cancellationToken,
                sha512: T.sha512
              });
            } catch (M) {
              try {
                await (0, a.unlink)(p);
              } catch {
              }
              throw M;
            }
        }
      });
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    async verifySignature(o) {
      let n;
      try {
        if (n = (await this.configOnDisk.value).publisherName, n == null)
          return null;
      } catch (m) {
        if (m.code === "ENOENT")
          return null;
        throw m;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(n) ? n : [n], o);
    }
    doInstall(o) {
      const n = this.installerPath;
      if (n == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const m = ["--updated"];
      o.isSilent && m.push("/S"), o.isForceRunAfter && m.push("--force-run"), this.installDirectory && m.push(`/D=${this.installDirectory}`);
      const v = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      v != null && m.push(`--package-file=${v}`);
      const y = () => {
        this.spawnLog(c.join(process.resourcesPath, "elevate.exe"), [n].concat(m)).catch((p) => this.dispatchError(p));
      };
      return o.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), y(), !0) : (this.spawnLog(n, m).catch((p) => {
        const S = p.code;
        this._logger.info(`Cannot run installer: error code: ${S}, error message: "${p.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), S === "UNKNOWN" || S === "EACCES" ? y() : S === "ENOENT" ? Ct.shell.openPath(n).catch((T) => this.dispatchError(T)) : this.dispatchError(p);
      }), !0);
    }
    async differentialDownloadWebPackage(o, n, m, v) {
      if (n.blockMapSize == null)
        return !0;
      try {
        const y = {
          newUrl: new i.URL(n.path),
          oldFile: c.join(this.downloadedUpdateHelper.cacheDir, t.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: m,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: v.isUseMultipleRangeRequest,
          cancellationToken: o.cancellationToken
        };
        this.listenerCount(f.DOWNLOAD_PROGRESS) > 0 && (y.onProgress = (p) => this.emit(f.DOWNLOAD_PROGRESS, p)), await new u.FileWithEmbeddedBlockMapDifferentialDownloader(n, this.httpExecutor, y).download();
      } catch (y) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${y.stack || y}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return cr.NsisUpdater = s, cr;
}
var Tl;
function Lf() {
  return Tl || (Tl = 1, (function(t) {
    var c = _t && _t.__createBinding || (Object.create ? (function(p, S, T, P) {
      P === void 0 && (P = T);
      var O = Object.getOwnPropertyDescriptor(S, T);
      (!O || ("get" in O ? !S.__esModule : O.writable || O.configurable)) && (O = { enumerable: !0, get: function() {
        return S[T];
      } }), Object.defineProperty(p, P, O);
    }) : (function(p, S, T, P) {
      P === void 0 && (P = T), p[P] = S[T];
    })), h = _t && _t.__exportStar || function(p, S) {
      for (var T in p) T !== "default" && !Object.prototype.hasOwnProperty.call(S, T) && c(S, p, T);
    };
    Object.defineProperty(t, "__esModule", { value: !0 }), t.NsisUpdater = t.MacUpdater = t.RpmUpdater = t.PacmanUpdater = t.DebUpdater = t.AppImageUpdater = t.Provider = t.NoOpLogger = t.AppUpdater = t.BaseUpdater = void 0;
    const u = /* @__PURE__ */ mt(), f = be;
    var l = Mt();
    Object.defineProperty(t, "BaseUpdater", { enumerable: !0, get: function() {
      return l.BaseUpdater;
    } });
    var a = fa();
    Object.defineProperty(t, "AppUpdater", { enumerable: !0, get: function() {
      return a.AppUpdater;
    } }), Object.defineProperty(t, "NoOpLogger", { enumerable: !0, get: function() {
      return a.NoOpLogger;
    } });
    var d = Xe();
    Object.defineProperty(t, "Provider", { enumerable: !0, get: function() {
      return d.Provider;
    } });
    var i = hl();
    Object.defineProperty(t, "AppImageUpdater", { enumerable: !0, get: function() {
      return i.AppImageUpdater;
    } });
    var s = ml();
    Object.defineProperty(t, "DebUpdater", { enumerable: !0, get: function() {
      return s.DebUpdater;
    } });
    var r = vl();
    Object.defineProperty(t, "PacmanUpdater", { enumerable: !0, get: function() {
      return r.PacmanUpdater;
    } });
    var o = yl();
    Object.defineProperty(t, "RpmUpdater", { enumerable: !0, get: function() {
      return o.RpmUpdater;
    } });
    var n = _l();
    Object.defineProperty(t, "MacUpdater", { enumerable: !0, get: function() {
      return n.MacUpdater;
    } });
    var m = Rl();
    Object.defineProperty(t, "NsisUpdater", { enumerable: !0, get: function() {
      return m.NsisUpdater;
    } }), h(Ot(), t);
    let v;
    function y() {
      if (process.platform === "win32")
        v = new (Rl()).NsisUpdater();
      else if (process.platform === "darwin")
        v = new (_l()).MacUpdater();
      else {
        v = new (hl()).AppImageUpdater();
        try {
          const p = f.join(process.resourcesPath, "package-type");
          if (!(0, u.existsSync)(p))
            return v;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const S = (0, u.readFileSync)(p).toString().trim();
          switch (console.info("Found package-type:", S), S) {
            case "deb":
              v = new (ml()).DebUpdater();
              break;
            case "rpm":
              v = new (yl()).RpmUpdater();
              break;
            case "pacman":
              v = new (vl()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (p) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", p.message);
        }
      }
      return v;
    }
    Object.defineProperty(t, "autoUpdater", {
      enumerable: !0,
      get: () => v || y()
    });
  })(_t)), _t;
}
var Qe = Lf();
const Uf = ac(import.meta.url), Xi = be.dirname(Uf), Ki = process.env.VITE_DEV_SERVER_URL !== void 0;
Cl.registerSchemesAsPrivileged([
  { scheme: "engage", privileges: { secure: !0, standard: !0, supportFetchAPI: !0, stream: !0 } }
]);
let Me;
function $f() {
  if (Me = new nc({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: be.join(Xi, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      webSecurity: !1,
      sandbox: !1
    }
  }), zr.handle("save-project-file", async (t, c, h, u) => {
    if (!Me) return { success: !1 };
    let f = h;
    if (!f)
      try {
        const l = u ? `${u}.engage` : "New Project.engage", { canceled: a, filePath: d } = await dr.showSaveDialog(Me, {
          title: "EngageKit プロジェクトを保存",
          defaultPath: be.join(bl.getPath("documents"), l),
          filters: [
            { name: "EngageKit Project", extensions: ["engage"] }
          ]
        });
        if (a || !d)
          return { success: !1 };
        f = d;
      } catch (l) {
        return console.error("保存ダイアログエラー:", l), { success: !1, error: String(l) };
      }
    try {
      return await Aa.writeFile(f, c, "utf-8"), { success: !0, filePath: f };
    } catch (l) {
      return console.error("ファイル保存エラー:", l), { success: !1, error: String(l) };
    }
  }), zr.handle("open-project-file", async (t) => {
    if (!Me) return null;
    try {
      const { canceled: c, filePaths: h } = await dr.showOpenDialog(Me, {
        title: "EngageKit プロジェクトを開く",
        properties: ["openFile"],
        filters: [
          { name: "EngageKit Project", extensions: ["engage"] }
        ]
      });
      if (c || h.length === 0)
        return null;
      const u = h[0];
      return { data: await Aa.readFile(u, "utf-8"), filePath: u };
    } catch (c) {
      return console.error("ファイル読込エラー:", c), null;
    }
  }), zr.handle("select-image-file", async () => {
    if (!Me) return null;
    const { canceled: t, filePaths: c } = await dr.showOpenDialog(Me, {
      title: "画像を選択",
      filters: [{ name: "Images", extensions: ["jpg", "png", "gif", "webp", "svg"] }],
      properties: ["openFile"]
    });
    return t || c.length === 0 ? null : c[0];
  }), Ki)
    console.log("[Main] 開発モード: Dev Serverから読み込みます"), Me.loadURL(process.env.VITE_DEV_SERVER_URL), Me.webContents.openDevTools();
  else {
    console.log("[Main] 本番モード: ビルド済みファイルから読み込みます");
    const t = be.join(Xi, "../dist/index.html");
    console.log("[Main] __dirname:", Xi), console.log("[Main] index.htmlのパス:", t), Me.loadFile(t);
  }
  Me.webContents.on("did-finish-load", () => {
    console.log("[Main] ページの読み込みが完了しました");
  }), Me.webContents.on("did-fail-load", (t, c, h) => {
    console.error("[Main] ページの読み込みに失敗:", c, h);
  }), Me.webContents.on("console-message", (t, c, h, u, f) => {
    console.log(`[Renderer Console] ${h}`);
  });
}
bl.whenReady().then(() => {
  Cl.handle("engage", (t) => {
    const c = t.url.slice(9);
    return rc.fetch(oc(decodeURIComponent(c)).toString());
  }), $f(), !Ki && process.platform === "win32" ? (console.log("[AutoUpdater] 自動アップデート機能を初期化します"), Qe.autoUpdater.autoDownload = !1, Qe.autoUpdater.autoInstallOnAppQuit = !0, Qe.autoUpdater.on("checking-for-update", () => {
    console.log("[AutoUpdater] アップデートを確認中...");
  }), Qe.autoUpdater.on("update-available", (t) => {
    console.log("[AutoUpdater] 新しいバージョンが見つかりました:", t.version), dr.showMessageBox(Me, {
      type: "info",
      title: "アップデート利用可能",
      message: `新しいバージョン ${t.version} が利用可能です。`,
      buttons: ["ダウンロード", "後で"],
      defaultId: 0
    }).then((c) => {
      c.response === 0 && Qe.autoUpdater.downloadUpdate();
    });
  }), Qe.autoUpdater.on("update-not-available", () => {
    console.log("[AutoUpdater] 最新版を使用しています");
  }), Qe.autoUpdater.on("error", (t) => {
    console.error("[AutoUpdater] エラーが発生しました:", t);
  }), Qe.autoUpdater.on("download-progress", (t) => {
    console.log(`[AutoUpdater] ダウンロード中: ${t.percent.toFixed(2)}%`);
  }), Qe.autoUpdater.on("update-downloaded", (t) => {
    console.log("[AutoUpdater] アップデートのダウンロードが完了しました:", t.version), dr.showMessageBox(Me, {
      type: "info",
      title: "アップデート準備完了",
      message: `バージョン ${t.version} のダウンロードが完了しました。アプリを再起動してインストールしますか？`,
      buttons: ["今すぐ再起動", "次回起動時"],
      defaultId: 0
    }).then((c) => {
      c.response === 0 && Qe.autoUpdater.quitAndInstall();
    });
  }), setTimeout(() => {
    Qe.autoUpdater.checkForUpdates();
  }, 3e3)) : console.log(Ki ? "[AutoUpdater] 開発モードのため、アップデートチェックをスキップします" : "[AutoUpdater] このプラットフォームでは自動アップデートはサポートされていません");
});
