import {images} from '../data';

// Set VITE_API_URL on Vercel; local Vite uses the local Express server.
const BASE=(import.meta.env.VITE_API_URL||(import.meta.env.DEV?'http://localhost:5000/api':'https://campusmate-87k6.onrender.com/api')).replace(/\/$/,'');
export const API_ORIGIN=BASE.replace(/\/api$/,'');
const TOKEN_KEY='campusmate_real_session';
export const getToken=()=>localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY);
export const setToken=token=>{sessionStorage.removeItem(TOKEN_KEY);token?localStorage.setItem(TOKEN_KEY,token):localStorage.removeItem(TOKEN_KEY)};
export async function api(path,{method='GET',body,signal}={}){
  const headers={};const token=getToken();if(token)headers.Authorization=`Bearer ${token}`;
  if(body&&!(body instanceof FormData))headers['Content-Type']='application/json';
  let response;
  try{response=await fetch(BASE+path,{method,headers,body:body instanceof FormData?body:body?JSON.stringify(body):undefined,signal})}
  catch{throw new Error('CampusMate service is unreachable. Please try again later.')}
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(result.message||`Request failed (${response.status}).`);
  return result;
}
export const mediaUrl=url=>url?.startsWith('/')?API_ORIGIN+url:url;
export function adaptStudent(u){return {id:String(u._id),name:u.name||'Student',initials:(u.name||'S').split(' ').map(s=>s[0]).slice(0,2).join(''),course:[u.branch||u.course,u.year].filter(Boolean).join(' · '),college:u.collegeName||'CampusMate',bio:u.bio||'New to CampusMate.',skills:u.skills?.length?u.skills:u.interests?.length?u.interests:['Campus Life'],match:85,color:'#725e9a',photo:mediaUrl(u.profilePhoto?.url),demo:false,real:true}}
export function adaptPost(p){return {id:String(p._id),author:String(p.author?._id||p.author),person:p.author?.name?adaptStudent(p.author):null,caption:p.caption||'',image:mediaUrl(p.media?.[0]?.url),likes:p.likesCount??p.likes?.length??0,liked:false,time:new Date(p.createdAt).toLocaleDateString(),type:'Posts',demo:false,real:true}}
export function adaptEvent(e){return {id:String(e._id),title:e.title,type:'Events',date:new Date(e.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),venue:e.venue||e.college,count:String(e.participantsCount??e.participants?.length??0),image:mediaUrl(e.image?.url)||images.concert,description:e.description||'',time:new Date(e.date).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),demo:false,real:true}}
export function adaptClub(c){return {id:String(c._id),name:c.name,category:'Campus',tagline:c.description||'Find your people.',members:String(c.membersCount??c.members?.length??0),image:mediaUrl(c.logo?.url)||images.team,description:c.description||'',demo:false,real:true}}
export function adaptMessage(m,me){return {id:String(m._id),text:m.text||'',attachment:m.media?.url?{url:mediaUrl(m.media.url),type:m.media.mimeType,name:m.media.originalName}:null,time:new Date(m.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}),mine:String(m.sender)===String(me)}}
export function adaptMatch(m){return {id:String(m._id),name:m.user?.name||'Student',person:adaptStudent(m.user||{}),last:'Open conversation',time:m.lastMessageAt?new Date(m.lastMessageAt).toLocaleDateString():'New',unread:0,real:true}}

export function adaptStory(s){return {id:String(s._id),author:adaptStudent(s.author||{}),image:mediaUrl(s.mediaUrl),type:s.type,text:s.textOverlay||'',demo:false}}
export function adaptReel(r){return {id:String(r._id),author:String(r.author?._id||r.author),person:r.author?.name?adaptStudent(r.author):null,caption:r.caption||'',video:mediaUrl(r.videoUrl),image:mediaUrl(r.thumbnailUrl),likes:r.likes?.length||0,time:new Date(r.createdAt).toLocaleDateString(),type:'Reels',demo:false,real:true}}
