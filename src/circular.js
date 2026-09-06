var has = Object.prototype.hasOwnProperty;

function find(iter, tar, key) {
	for (key of iter.keys()) {
		if (dequal(key, tar)) return key;
	}
}

function compare(foo, bar, ctor, stackA, stackB) {
	var len, tmp;

	if (ctor === Array) {
		if ((len=foo.length) === bar.length) {
			while (len-- && walk(foo[len], bar[len], stackA, stackB));
		}
		return len === -1;
	}

	if (ctor === Set) {
		if (foo.size !== bar.size) {
			return false;
		}
		for (len of foo) {
			tmp = len;
			if (tmp && typeof tmp === 'object') {
				tmp = find(bar, tmp);
				if (!tmp) return false;
			}
			if (!bar.has(tmp)) return false;
		}
		return true;
	}

	if (ctor === Map) {
		if (foo.size !== bar.size) {
			return false;
		}
		for (len of foo) {
			tmp = len[0];
			if (tmp && typeof tmp === 'object') {
				tmp = find(bar, tmp);
				if (!tmp) return false;
			}
			if (!walk(len[1], bar.get(tmp), stackA, stackB)) {
				return false;
			}
		}
		return true;
	}

	if (ctor === ArrayBuffer) {
		foo = new Uint8Array(foo);
		bar = new Uint8Array(bar);
	} else if (ctor === DataView) {
		if ((len=foo.byteLength) === bar.byteLength) {
			while (len-- && foo.getInt8(len) === bar.getInt8(len));
		}
		return len === -1;
	}

	if (ArrayBuffer.isView(foo)) {
		if ((len=foo.byteLength) === bar.byteLength) {
			while (len-- && foo[len] === bar[len]);
		}
		return len === -1;
	}

	if (!ctor || typeof foo === 'object') {
		len = 0;
		for (ctor in foo) {
			if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
			if (!(ctor in bar) || !walk(foo[ctor], bar[ctor], stackA, stackB)) return false;
		}
		return Object.keys(bar).length === len;
	}
}

function walk(foo, bar, stackA, stackB) {
	var ctor, idx;
	if (foo === bar) return true;

	if (foo && bar && (ctor=foo.constructor) === bar.constructor) {
		if (ctor === Date) return foo.getTime() === bar.getTime();
		if (ctor === RegExp) return foo.toString() === bar.toString();

		if (typeof foo === 'object') {
			// `foo` may already be in the middle of being compared to `bar`
			// further up the call stack (a circular reference). Treat that
			// as equal rather than recursing forever.
			idx = stackA.length;
			while (idx--) {
				if (stackA[idx] === foo) return stackB[idx] === bar;
			}

			stackA.push(foo);
			stackB.push(bar);
			try {
				return compare(foo, bar, ctor, stackA, stackB);
			} finally {
				stackA.pop();
				stackB.pop();
			}
		}
	}

	return foo !== foo && bar !== bar;
}

export function dequal(foo, bar) {
	return walk(foo, bar, [], []);
}
