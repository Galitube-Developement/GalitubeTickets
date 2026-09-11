const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { bootUpdate, REPOSITORY_URL } = require('../src/lib/boot-update');
function fixture(overrides = {}) {
	const root=fs.mkdtempSync(path.join(os.tmpdir(),'galitube-update-test-'));
	const calls=[];
	const git=args=>{calls.push(args); const key=args.join(' '); if(overrides[key] instanceof Error) throw overrides[key]; return overrides[key] ?? ({'rev-parse --git-path galitube-update-pending':'pending','status --porcelain --untracked-files=all':'','branch --show-current':'main','rev-parse HEAD':'a'.repeat(40),'rev-parse FETCH_HEAD':'b'.repeat(40)}[key] || '');};
	let installs=0;
	return {root,calls,git,install:()=>{installs++;},log:{info(){},warn(){}},get installs(){return installs;}};
}
test('boot fetches the exact fork and installs before returning',()=>{const f=fixture(); assert.equal(bootUpdate(f.root,f),true);assert.equal(f.installs,1);assert.ok(f.calls.some(a=>a.join(' ')===`fetch --no-tags ${REPOSITORY_URL} main`));assert.ok(f.calls.some(a=>a[0]==='merge'&&a[1]==='--ff-only'));assert.equal(fs.existsSync(path.join(f.root,'pending')),false);});
test('dirty checkout and feature branches are preserved',()=>{for(const overrides of [{'status --porcelain --untracked-files=all':' M src/index.js'},{'branch --show-current':'feature'}]){const f=fixture(overrides);assert.equal(bootUpdate(f.root,f),false);assert.equal(f.installs,0);assert.ok(!f.calls.some(a=>a[0]==='merge'));}});
test('up-to-date checkout does not reinstall',()=>{const f=fixture({'rev-parse FETCH_HEAD':'a'.repeat(40)});assert.equal(bootUpdate(f.root,f),false);assert.equal(f.installs,0);});
test('network failure keeps existing installation',()=>{const f=fixture({[`fetch --no-tags ${REPOSITORY_URL} main`]:new Error('offline')});assert.equal(bootUpdate(f.root,f),false);assert.equal(f.installs,0);});
test('divergence never resets local history',()=>{const f=fixture({[`merge-base --is-ancestor ${'a'.repeat(40)} ${'b'.repeat(40)}`]:new Error('diverged')});assert.equal(bootUpdate(f.root,f),false);assert.ok(!f.calls.some(a=>a[0]==='merge'||a[0]==='reset'));});
test('failed install blocks startup and retries on next boot',()=>{const f=fixture();assert.throws(()=>bootUpdate(f.root,{...f,install(){throw new Error('build failed');}}),/build failed/);assert.equal(fs.existsSync(path.join(f.root,'pending')),true);assert.equal(bootUpdate(f.root,f),true);assert.equal(f.installs,1);});
