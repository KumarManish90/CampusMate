import {io} from 'socket.io-client';
import {API_ORIGIN,getToken} from './api';
let socket;
export function getChatSocket(){
  const token=getToken();
  if(!token)return null;
  if(!socket){socket=io(import.meta.env.VITE_SOCKET_URL||API_ORIGIN,{auth:{token},transports:['websocket','polling'],reconnection:true});}
  else if(socket.auth?.token!==token){socket.auth={token};socket.disconnect().connect()}
  return socket;
}
export function disconnectChatSocket(){socket?.disconnect();socket=undefined}
