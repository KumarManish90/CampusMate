const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {Swipe, Match, Message} = require('../models/Social');
const {Notification} = require('../models/Campus');

// Run a two-user REST journey against the actual matching and messaging routers.
test('discover, reciprocal swipe, persistent match and message history', async () => {
  const secret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'integration-test-key-not-for-deployment';
  const ids = ['507f191e810c19729de860ea','507f191e810c19729de860eb'];
  const people = ids.map((_id,i)=>({_id,name:i?'Priya':'Manish',isActive:true,isSuspended:false,toPublicJSON(){return {_id,name:this.name}}}));
  const swipes = [], matches = [], messages = [], original=[];
  function mock(obj,key,value){original.push([obj,key,obj[key]]);obj[key]=value}
  mock(User,'findById',async id=>people.find(p=>String(p._id)===String(id)));
  mock(User,'find',filter=>({limit:async()=>people.filter(p=>p._id!==filter._id.$ne && !filter._id.$nin.includes(p._id))}));
  mock(User,'exists',async filter=>people.some(p=>p._id===filter._id));
  mock(Swipe,'find',filter=>({select:async()=>swipes.filter(s=>s.from===filter.from)}));
  mock(Swipe,'findOneAndUpdate',async(filter,update)=>{const old=swipes.find(s=>s.from===filter.from&&s.to===filter.to);if(old) old.action=update.$set.action;else swipes.push({...filter,action:update.$set.action})});
  mock(Swipe,'findOne',async filter=>swipes.find(s=>s.from===filter.from&&s.to===filter.to&&filter.action.$in.includes(s.action))||null);
  mock(Match,'findOne',async filter=>matches.find(m=>m.pairKey===filter.$or[0].pairKey)||null);
  mock(Match,'create',async item=>{const m={_id:'507f191e810c19729de860ec',...item,isActive:true,async save(){}};matches.push(m);return m});
  mock(Match,'find',filter=>({sort:()=>({populate:async()=>matches.filter(m=>m.isActive&&m.users.includes(filter.users)).map(m=>({...m,users:m.users.map(id=>people.find(p=>p._id===id))}))})}));
  mock(Match,'findById',async id=>matches.find(m=>m._id===id)||null);
  mock(Message,'create',async item=>{const m={_id:'507f191e810c19729de860ed',createdAt:new Date(),...item};messages.push(m);return m});
  mock(Message,'find',filter=>({sort:()=>({skip:()=>({limit:async()=>messages.filter(m=>m.match===filter.match)})})}));
  mock(Notification,'create',async()=>({}));
  const app=express();app.use(express.json());app.use('/api',require('../routes/matchRoutes'));app.use('/api/messages',require('../routes/messageRoutes'));app.use((err,req,res,next)=>res.status(err.status||500).json({message:err.message}));
  const server=http.createServer(app);
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const request=(id,path,method='GET',body)=>fetch(base+path,{method,headers:{Authorization:'Bearer '+jwt.sign({sub:id},process.env.JWT_SECRET),'Content-Type':'application/json'},body:body&&JSON.stringify(body)}).then(async r=>({status:r.status,...await r.json()}));
    const discover=await request(ids[0],'/api/discover');assert.equal(discover.candidates.length,1);
    assert.equal((await request(ids[0],'/api/swipes','POST',{to:ids[1],action:'like'})).matched,false);
    const reciprocal=await request(ids[1],'/api/swipes','POST',{to:ids[0],action:'connect'});assert.equal(reciprocal.matched,true);assert.equal(matches.length,1);
    const restored=await request(ids[0],'/api/matches');assert.equal(restored.matches.length,1);assert.equal(restored.matches[0].user.name,'Priya');
    const message=await request(ids[0],'/api/messages','POST',{matchId:matches[0]._id,text:'Hello'});assert.equal(message.status,201);
    const history=await request(ids[1],'/api/messages/'+matches[0]._id);assert.equal(history.messages[0].text,'Hello');
  }finally{
    await new Promise(resolve=>server.close(resolve));
    original.reverse().forEach(([obj,key,value])=>obj[key]=value);
    if(secret===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=secret;
  }
});
