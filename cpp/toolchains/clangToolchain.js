const { Toolchain } = require('../toolchain');
const { spawn } = require('child_process');
const fs = require('fs');

class ClangToolchain extends Toolchain {
	compile(opts) {
		const args = [
			'-fvisibility=hidden',
			'-MD', '-MF', opts.depfilePath,
			'-o', opts.outputPath,
			'-c', opts.srcPath
		];

		switch (opts.cppVersion) {
			case 20:
			case 17:
			case 14:
			case 11:
			case 98:
				args.push(`-std=c++${opts.cppVersion}`);
				break;
			default:
				throw new Error(`clang doesn't support c++${opts.cppVersion}`);
				break;
		}

		if (opts.isDebug) {
			args.push('-g');
			args.push('-Og');
		} else {
			args.push('-O3');
			args.push('-DNDEBUG');
		}

		for (const i of opts.includes) {
			args.push('-I');
			args.push(i);
		}

		return spawn('c++', args, { stdio: 'inherit' });
	}

	archive(opts) {
		const args = [
			'-static',
			'-o', opts.outputPath,
			...opts.objects
		];
		return spawn('libtool', args, { stdio: 'inherit' });
	}

	linkExecutable(opts) {
		const args = [
			'-o', opts.outputPath,
			...opts.objects
		];
		return spawn('c++', args, { stdio: 'inherit' });
	}

// testing with clang, generates invalid makefile w/ ':' in src file name
// based on that, assume ':' clearly delimits end of target name,
// no escaping necessary.
//
// based on section 3.8 https://www.gnu.org/software/make/manual/make.html,
// make parses logical lines which has backslash/newline converted to space
//
// then each dependency is separated by a space. testing with clang, if an
// included file contains a space, it will escape it. make handles this
// correctly, so need to account for "\ " in file names.
//
// it looks like the c/c++ standards don't like #include w/ backslash in
// name (take that, windows). assume that we don't have to worry about
// escaping '\' in generated depfile. Make treats this weird anyway with
// seemingly complex rules instead of '\' always being an escape character.
// Sigh.
//
	*depfileEntries(path) {
		let contents = fs.readFileSync(path, { encoding: 'utf8' });

		// handle escaped new lines for logical line
		contents = contents.replace("\\\n", " ");

		let index = contents.indexOf(': ');
		if (index === -1) {
			throw new Error(`expected target to end with ': ' in depfile '${path}'`);
		}

		index += 2; // due to ': '

		for (let fstart = NaN; index < contents.length; ++index) {
			if (contents[index].match(/\s/)) {
				if (fstart) {
					yield contents.slice(fstart, index)
						.replace("\\ ", " ");
					fstart = NaN;
				}
			}
			// let's just assume all \ is escape. make is weird about this
			// so technically wrong but who cares
			else if (contents[index] === '\\') {
				++index;
			}
			else if (!fstart) {
				fstart = index;
			}
		}
	}
}

module.exports = {
    ClangToolchain
};
