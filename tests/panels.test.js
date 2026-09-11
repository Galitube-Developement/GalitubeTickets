const { test } = require('node:test');
const assert = require('node:assert/strict');
const Fastify = require('fastify');
const { Collection } = require('discord.js');
const routes = require('../src/routes/api/admin/guilds/[guild]/panels');
const guildId='100000000000000001', channelId='100000000000000002', messageId='100000000000000003';
async function fixture(t, options={}) {
	let sends=0,edits=0,payload;
	const message={id:messageId,channelId,author:{id:options.foreign?'other':'bot'},embeds:[{title:'Existing'}],components:[{components:[{customId:'{"action":"create","target":1}'}]}],url:'https://discord.com/channels/'+guildId+'/'+channelId+'/'+messageId,edit:async data=>{edits++;payload=data;return message;}};
	const channel={id:channelId,guildId:options.otherGuild?'other':guildId,type:0,messages:{fetch:async id=>typeof id==='string'?message:new Collection([[messageId,message]])},send:async data=>{sends++;payload=data;return message;},toString:()=>'<#'+channelId+'>'};
	const guild={id:guildId,iconURL:()=>null,channels:{fetch:async()=>channel},members:{fetch:async()=>({user:{id:'admin',tag:'admin'}})}};
	const settings={categories:Array.from({length:25},(_,i)=>({id:i+1,name:'Category '+(i+1),description:'Help',emoji:'ticket'})),locale:'en-GB',primaryColour:'#5865f2',footer:'Galitube Hosting',logChannel:null};
	const client={user:{id:'bot'},guilds:{cache:new Map([[guildId,guild]])},prisma:{guild:{findUnique:async()=>settings}},i18n:{getLocale:()=>key=>key.endsWith('emoji')?'🎫':key},log:{info:{settings(){}},error(){}}};
	const app=Fastify(); app.decorate('authenticate',async(req,res)=>{if(options.denied)return res.code(401).send({error:'Unauthorized'});req.user={id:'admin'};});app.decorate('isAdmin',async()=>{});
	for(const method of ['get','post','patch'])app.route({method:method.toUpperCase(),url:'/api/admin/guilds/:guild/panels',config:{client},...routes[method](app)});
	t.after(()=>app.close());
	return {app,message,get sends(){return sends;},get edits(){return edits;},get payload(){return payload;},url:'/api/admin/guilds/'+guildId+'/panels'};
}
const body={type:'BUTTON',categories:[1],channel:channelId,title:'Updated',description:'Support'};
test('existing panel discovery reads Discord messages without a new database record',async t=>{const f=await fixture(t);const r=await f.app.inject(f.url+'?channel='+channelId);assert.equal(r.statusCode,200);assert.equal(r.json().panels[0].message,messageId);});
test('PATCH edits the same message and never sends a replacement',async t=>{const f=await fixture(t);const r=await f.app.inject({method:'PATCH',url:f.url,payload:{...body,message:messageId,image:'',thumbnail:''}});assert.equal(r.statusCode,200,r.body);assert.equal(f.edits,1);assert.equal(f.sends,0);assert.equal(r.json().message,messageId);assert.equal(f.payload.embeds[0].data.title,'Updated');assert.equal(f.payload.embeds[0].data.image,undefined);});
test('POST creates new panels and splits 25 buttons into five rows',async t=>{const f=await fixture(t);const r=await f.app.inject({method:'POST',url:f.url,payload:{...body,categories:Array.from({length:25},(_,i)=>i+1)}});assert.equal(r.statusCode,200,r.body);assert.equal(f.sends,1);assert.equal(f.payload.components.length,5);assert.ok(f.payload.components.every(row=>row.components.length===5));});
test('single-category MENU stays a select menu',async t=>{const f=await fixture(t);const r=await f.app.inject({method:'POST',url:f.url,payload:{...body,type:'MENU'}});assert.equal(r.statusCode,200,r.body);assert.equal(f.payload.components[0].components[0].data.type,3);});
test('reject messages belonging to another bot',async t=>{const f=await fixture(t,{foreign:true});const r=await f.app.inject({method:'PATCH',url:f.url,payload:{...body,message:messageId}});assert.equal(r.statusCode,400);assert.equal(f.edits,0);});
test('reject cross-guild channels',async t=>{const f=await fixture(t,{otherGuild:true});const r=await f.app.inject({method:'POST',url:f.url,payload:body});assert.equal(r.statusCode,400);assert.equal(f.sends,0);});
test('validate invalid and duplicate categories before sending',async t=>{const f=await fixture(t);for(const categories of [[],[999],[1,1]]){const r=await f.app.inject({method:'POST',url:f.url,payload:{...body,categories}});assert.equal(r.statusCode,400,r.body);}assert.equal(f.sends,0);});
test('unauthenticated requests cannot read or modify panels',async t=>{const f=await fixture(t,{denied:true});for(const method of ['GET','PATCH','POST']){const r=await f.app.inject({method,url:f.url+'?channel='+channelId,...(method==='GET'?{}:{payload:body})});assert.equal(r.statusCode,401);}assert.equal(f.sends,0);assert.equal(f.edits,0);});
