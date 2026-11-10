// Uses Vite's own env parsing/precedence; never sources .env as shell code.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import readline from 'node:readline/promises';
const [root, action='check', mode='development'] = process.argv.slice(2);
function fail(message) { console.error(message); process.exit(1); }
if (!root || !['check','configure'].includes(action) || !['development','production'].includes(mode)) fail('잘못된 환경 검사 인자');
const {loadEnv} = await import(pathToFileURL(path.join(root,'node_modules/vite/dist/node/index.js')).href);
let env = loadEnv(mode,root,'VITE_');
for (const [key,value] of Object.entries(env)) {
  if (value && /VITE_.*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY)/i.test(key)) fail('브라우저용 VITE_ 변수에 서버 전용 키가 있습니다. 서버 키는 프론트엔드 환경 파일에서 분리하세요. 값은 출력하지 않았습니다.');
}
function validUrl(v) {
  try { const u=new URL(v); return ['http:','https:'].includes(u.protocol) && !u.username && !u.password && !/placeholder|your[-_]|<|>/i.test(v); } catch {return false;}
}
function validKey(v) {
  if (!v || /placeholder|your[-_]|<|>|\s/i.test(v)) return false;
  if (v.startsWith('sb_secret_')) fail('서버 비밀키는 사용할 수 없습니다. anon/public 또는 publishable 키를 사용하세요.');
  if (v.startsWith('sb_publishable_')) return true;
  try {
    const payload=JSON.parse(Buffer.from(v.split('.')[1],'base64url').toString());
    if (payload.role==='service_role') fail('service_role 키는 프론트엔드에서 사용할 수 없습니다.');
    return payload.role==='anon';
  } catch { return false; }
}
const fields=[['VITE_SUPABASE_URL',validUrl,'Supabase Project URL'],['VITE_SUPABASE_ANON_KEY',validKey,'Supabase anon/public 또는 publishable 키']];
const missing=fields.filter(([key,valid])=>!valid(env[key]));
if(missing.length) {
  if(action==='check'||!process.stdin.isTTY) fail('Supabase 설정이 필요합니다: '+missing.map(x=>x[0]).join(', ')+'. 프로젝트 .env.local을 작성하거나 터미널에서 --setup을 실행하세요.');
  console.log('첫 실행 설정: Supabase 프로젝트의 공개 연결 정보만 입력합니다. 기존 파일은 보존합니다.');
  const rl=readline.createInterface({input:process.stdin,output:process.stdout});
  const entries=[];
  try {
    for(const [key,valid,label] of missing) {
      const value=(await rl.question(label+': ')).trim();
      if(!valid(value)) fail(label+' 형식이 올바르지 않습니다.');
      entries.push(key+'='+JSON.stringify(value));
    }
  } finally {rl.close();}
  fs.appendFileSync(path.join(root,'.env.local'),'\n# Local tutorial configuration\n'+entries.join('\n')+'\n',{mode:0o600});
  env=loadEnv(mode,root,'VITE_');
  if(fields.some(([key,valid])=>!valid(env[key]))) fail('모드별 .env 또는 셸 환경변수가 .env.local보다 우선합니다. 중복 설정을 확인하세요.');
}
console.log('Supabase 공개 설정 형식 확인 완료 (값·키는 출력하지 않음).');
