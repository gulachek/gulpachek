const { StaticPath } = require('../lib/pathTargets');
const { CppObjectGroup } = require('./objectGroup');

class CppExecutable extends StaticPath {
	#objects;
	#libs;
	#toolchain;

	constructor(sys, args) {
		const ext = args.toolchain.executableExt;
		const out = ext ? `${args.name}.${ext}` : args.name;
		super(sys, sys.dest(out));
		this.#toolchain = args.toolchain;
		this.#objects = new CppObjectGroup(sys, {
			toolchain: args.toolchain
        });
		this.#libs = [];
	}

	add_src(src) {
		this.#objects.add_src(src);
	}

	link(lib) {
		this.#libs.push(lib);
		this.#objects.link(lib);
	}

	include(dir) {
		this.#objects.include(dir);
	}

	deps() {
		const deps = [this.#objects];

		for (const lib of this.#libs) {
			for (const bin of lib.binaries()) {
				deps.push(bin);
			}
		}

		return deps;
	}

	build(cb) {
		console.log(`linking executable ${this.path()}`);

		const args = {
			gulpCallback: cb,
			outputPath: this.abs(),
			isDebug: this.sys().isDebugBuild(),
			objects: []
		};

		for (const obj of this.#objects) {
			args.objects.push(obj.abs());
		}

		for (const lib of this.#libs) {
			for (const bin of lib.binaries()) {
				args.objects.push(bin.abs());
			}
		}

		return this.#toolchain.linkExecutable(args);
	}
}

module.exports = { CppExecutable };
