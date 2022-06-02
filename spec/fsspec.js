import 'jasmine-core';
import { FileSystem } from '../lib/fs.js';

describe('FileSystem', () => {
	let fsMod;
	let path;

	let fs;

	beforeEach(() => {
		path = jasmine.createSpyObj('path', [
			'resolve',
			'join'
		]);

		fsMod = jasmine.createSpyObj('fs', [
			'mkdirSync'
		]);

		path.resolve.and.callFake((...args) => {
			const p = args.join('/');
			return p.startsWith('/') ? p : `/resolved/${p}`;
		});

		path.join.and.callFake((...args) => {
			return args.join('/');
		});

		fs = new FileSystem({
			build: 'src/build',
			src: 'src',
			path: path,
			fs: fsMod
		});
	});

	it('makes a build path', () => {
		const p = fs.dest('my/path');
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/my/path');
	});

	it('throws if non-path is given to abs', () => {
		const go = () => {
			fs.abs({ components: ['my', 'path'], base: 'build' });
		};

		expect(go).toThrow();
	});

	it('makes a src path', () => {
		const p = fs.src('my/path');
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/my/path');
	});

	it('returns a path if already constructed', () => {
		const p = fs.dest('my/path');
		const p2 = fs.src(p);
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/my/path');
	});

	it('dest makes a new dir', () => {
		fs.dest('my/path');
		expect(fsMod.mkdirSync).toHaveBeenCalledWith('/resolved/src/build/my');
	});

	it('makes a cache path from a build path', () => {
		const b = fs.dest('my/path.ext');
		const p = fs.cache(b, {
			namespace: 'com.gulachek.test'
		});
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/my/__com.gulachek.test__/path.ext');
	});

	it('adds an extension in cache path', () => {
		const b = fs.dest('my/path.ext');
		const p = fs.cache(b, {
			namespace: 'com.gulachek.test',
			ext: 'ext2'
		});
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/my/__com.gulachek.test__/path.ext.ext2');
	});

	it('adds an md5 hash dir for input params', () => {

		const b = fs.dest('my/path.ext');
		const p = fs.cache(b, {
			namespace: 'com.gulachek.test',
			params: { hello: 'world' }
		});
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/my/__com.gulachek.test__/-8JLzHoXlHWPwTJ_z-va9g/path.ext');
	});

	it('caches a src path into build dir', () => {

		const b = fs.src('my/path.ext');
		const p = fs.cache(b, {
			namespace: 'com.gulachek.test'
		});
		const abs = fs.abs(p);
		expect(abs).toEqual('/resolved/src/build/__src__/my/__com.gulachek.test__/path.ext');
	});

	it('nests cache dirs', () => {

		const b = fs.dest('my/path.ext');
		const p = fs.cache(b, {
			namespace: 't.one'
		});

		const p2 = fs.cache(p, {
			namespace: 't.two'
		});

		const abs = fs.abs(p2);
		expect(abs).toEqual('/resolved/src/build/my/__t.one__/__t.two__/path.ext');
	});
});
