import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const real=readFileSync(new URL('../src/RealScreens.jsx',import.meta.url),'utf8');
const client=readFileSync(new URL('../src/services/api.js',import.meta.url),'utf8');
test('fixed mobile navigation and Home matching entry',()=>{
  assert.match(app,/\['\/home','Home',Home\],\['\/explore','Explore',Compass\],\['create','Create',Plus\],\['\/messages','Messages',MessageCircle\],\['\/profile','Profile',User\]/);
  assert.match(real,/matching-banner.*to="\/matching"/);
});
test('mutual matching opens persistent messages',()=>{
  assert.match(real,/api\('\/swipes'.*r\.matched.*r\.match\?\._id.*navigate\('\/messages\/'.*r\.match\._id/);
  assert.match(real,/api\('\/messages\/'.*setMessages/);
});
test('OTP onboarding and session restoration are wired',()=>{
  assert.match(app,/auth\/otp\/start/);assert.match(app,/auth\/otp\/verify/);
  assert.match(app,/d\.isNewAccount\?'\/onboarding':'\/home'/);
  assert.match(app,/api\('\/auth\/me'\)/);
  assert.match(client,/localStorage\.getItem\(TOKEN_KEY\)/);
  assert.match(client,/localhost:5000\/api/);
});
test('seeded data remains in the real feed and matching list',()=>{
  assert.doesNotMatch(client,/demo:!![a-z]\.isDemo/);
  assert.match(real,/app\.live\.candidates,person=people\[index\]/);
  assert.doesNotMatch(real,/>Sample preview</);
});
