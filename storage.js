/* MY LOOK - local IndexedDB storage */
const MYLOOK_DB = 'mylook-local-v1';
const MYLOOK_STORES = { clothes: 'clothes', outfits: 'outfits' };

const Storage = (() => {
  let dbPromise;
  function open(){
    if(dbPromise) return dbPromise;
    dbPromise = new Promise((resolve,reject)=>{
      const req = indexedDB.open(MYLOOK_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if(!db.objectStoreNames.contains('clothes')){
          const s = db.createObjectStore('clothes', {keyPath:'id'});
          s.createIndex('createdAt','createdAt');
        }
        if(!db.objectStoreNames.contains('outfits')){
          const s = db.createObjectStore('outfits', {keyPath:'id'});
          s.createIndex('createdAt','createdAt');
        }
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
    return dbPromise;
  }
  const uid = prefix => prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  async function all(store){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readonly'); const req=tx.objectStore(store).getAll();
      req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))));
      req.onerror=()=>reject(req.error);
    });
  }
  async function put(store,value){
    const db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readwrite'); tx.objectStore(store).put(value);
      tx.oncomplete=()=>resolve(value); tx.onerror=()=>reject(tx.error);
    });
  }
  async function get(store,id){
    const db=await open(); return new Promise((resolve,reject)=>{
      const req=db.transaction(store,'readonly').objectStore(store).get(id);
      req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
    });
  }
  async function remove(store,id){
    const db=await open(); return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readwrite'); tx.objectStore(store).delete(id);
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
    });
  }
  async function clear(store){
    const db=await open(); return new Promise((resolve,reject)=>{
      const tx=db.transaction(store,'readwrite'); tx.objectStore(store).clear();
      tx.oncomplete=()=>resolve(); tx.onerror=()=>reject(tx.error);
    });
  }
  return {
    init: open,
    allClothes:()=>all(MYLOOK_STORES.clothes),
    allOutfits:()=>all(MYLOOK_STORES.outfits),
    addCloth: async data => put('clothes',Object.assign({id:uid('cloth'),createdAt:new Date().toISOString()},data)),
    addOutfit: async data => put('outfits',Object.assign({id:uid('outfit'),createdAt:new Date().toISOString()},data)),
    getCloth:id=>get('clothes',id),
    deleteCloth:id=>remove('clothes',id),
    deleteOutfit:id=>remove('outfits',id),
    clearAll:async()=>{await clear('clothes');await clear('outfits');},
    estimate: async()=>{
      if(navigator.storage && navigator.storage.estimate) return navigator.storage.estimate();
      return null;
    }
  };
})();
