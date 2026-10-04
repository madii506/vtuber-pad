// What a VTuber says. An AI model writes the line in the launcher's personality (POST /api/say);
// when that is slow, rate-limited or offline, these house lines keep the stream talking.
import { post } from './util.js';

const BASE = {
  hello: ['hiii chat, {name} is live!', 'ok we are live. welcome to the {sym} stream', 'good morning chat. it is always morning on stream', 'mic check... one two... hi chat!'],
  buy: ['thank you for the {s} sol!! welcome in', 'new holder spotted. hi hi hi', '{s} sol? you are too kind', 'ding! another one joins the stream', 'that buy just made my whole day'],
  big: ['WAIT. {s} SOL?! chat did you see that', 'big buy alert!! {s} sol!!', 'ok who did that. {s} sol. iconic.'],
  sell: ['aw, someone sold. it is ok, i am still here', 'a sell? i will pretend i did not see that', 'noted. emotionally.', 'bye bye, come back for the next stream'],
  idle: ['chat is quiet... i will just vibe', 'if you are lurking, hi lurker', 'someone say something, i am getting lonely', 'i never sleep. it is a stream thing', 'practicing my wave right now. hello!'],
  coin: ['new coin: ${t2}! hi little guy', '${t2} just launched. good luck out there', 'fresh one: ${t2}. i would stream that', '${t2} has entered the chat', 'another coin! ${t2}. so many coins, so little time', 'ooh, ${t2}. cute name'],
  milestone: ['we just passed {mc}! chat we are famous', '{mc} market cap. putting that on my resume'],
  pump: ['the chart is running! chat, are you seeing this', 'green candles! i am vibing so hard right now', 'ok the chart woke up. hi chart!'],
  dump: ['red candles... it is fine, i brought snacks', 'the chart is taking a nap. we stay cozy', 'little dip. deep breaths, chat'],
};
const FLAVOR = {
  cute: { buy: ['eee thank you!! {s} sol, you are the best ✨'], idle: ['sending tiny hearts to everyone in chat'], hello: ['hiiii it is me, {name}! hehe'] },
  chaotic: { buy: ['{s} SOL WHO DID THAT. I AM SCREAMING'], idle: ['what if the chart was a snake. just saying'], sell: ['A SELL?? i am flipping my desk (gently)'] },
  sleepy: { buy: ['*yawn* oh, {s} sol... thank you... zzz'], idle: ['five more minutes... then i stream properly'], hello: ['mm... hi chat... i am awake... mostly'] },
  tsundere: { buy: ['i-it is not like i wanted your {s} sol or anything!'], sell: ['fine, leave! see if i care... (come back)'], hello: ['oh. you came. i guess that is fine.'] },
  hype: { buy: ['LET\'S GOOO {s} SOL!!!'], big: ['{s} SOL?!?! CHAT WE ARE SO BACK'], hello: ['WE ARE LIVE LET\'S GOOO'] },
  deadpan: { buy: ['{s} sol. wow. i am thrilled. truly.'], idle: ['i am a vtuber. this is my life now.'], sell: ['someone sold. shocking. anyway.'] },
  gremlin: { buy: ['hehehe {s} sol, mine now'], idle: ['i am chewing on the stream cables. do not tell anyone'], sell: ['who sold. i just want to talk.'] },
  elegant: { buy: ['how gracious, darling. {s} sol, merci'], idle: ['a moment of silence, how refined'], hello: ['good evening, darlings. do come in'] },
  nerdy: { buy: ['{s} sol detected. holder count: incremented'], idle: ['fun fact: solana blocks are about 400 milliseconds'], hello: ['booting up... stream online. hi chat!'] },
  savage: { buy: ['{s} sol? cute. thanks i guess'], sell: ['sold already? weak hands detected'], idle: ['chat is so quiet i can hear you lurking'] },
};
const pick = a => a[Math.floor(Math.random() * a.length)];
export function houseLine(kind, ctx = {}) {
  let pool = (BASE[kind] || BASE.idle).slice();
  for (const t of ctx.persona || []) { const f = FLAVOR[t] && FLAVOR[t][kind]; if (f) pool = pool.concat(f, f); }
  if (kind === 'hello' && ctx.catchphrase) pool.push(ctx.catchphrase);
  return pick(pool).replace(/\{name\}/g, ctx.name || 'your vtuber').replace(/\{sym\}/g, '$' + String(ctx.symbol || '').toUpperCase()).replace(/\{s\}/g, ctx.s || '').replace(/\{t2\}/g, String(ctx.t2 || '').toUpperCase()).replace(/\{mc\}/g, ctx.mc || '');
}
let lastAI = 0;
// one line for this moment: AI when allowed (at most every 7s per viewer), house line otherwise
export async function line(kind, ctx = {}, useAI = true) {
  if (useAI && Date.now() - lastAI > 7000) {
    lastAI = Date.now();
    const j = await post('/api/say', { kind, name: ctx.name, symbol: ctx.symbol, bio: ctx.bio, persona: ctx.persona, catchphrase: ctx.catchphrase, sol: ctx.sol, ticker2: ctx.t2, name2: ctx.n2 }, 9000);
    if (j && j.ok && j.line) return j.line;
  }
  return houseLine(kind, ctx);
}
