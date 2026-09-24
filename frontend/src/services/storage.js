import {useState,useEffect} from 'react';
export function useLocal(key,fallback){const [value,set]=useState(()=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}});useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}},[key,value]);return [value,set]}
