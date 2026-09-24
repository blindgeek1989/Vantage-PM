'use strict';
(function(){
  const DB='vantagepm',VER=1,STORE='keyval';
  function open(){
    return new Promise((res,rej)=>{
      const r=indexedDB.open(DB,VER);
      r.onupgradeneeded=e=>e.target.result.createObjectStore(STORE);
      r.onsuccess=e=>res(e.target.result);
      r.onerror=e=>rej(e.target.error);
    });
  }
  async function idbGet(key){
    const db=await open();
    return new Promise((res,rej)=>{
      const r=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
      r.onsuccess=e=>res(e.target.result??null);
      r.onerror=e=>rej(e.target.error);
    });
  }
  async function idbSet(key,val){
    const db=await open();
    return new Promise((res,rej)=>{
      const r=db.transaction(STORE,'readwrite').objectStore(STORE).put(val,key);
      r.onsuccess=()=>res();
      r.onerror=e=>rej(e.target.error);
    });
  }
  window.AppStorage={
    loadSettings:()=>idbGet('settings'),
    saveSettings:async(updates)=>{
      const cur=await idbGet('settings')||{};
      await idbSet('settings',Object.assign({},cur,updates));
    },
    loadData:()=>idbGet('data'),
    saveData:(payload)=>idbSet('data',payload),
  };
})();
