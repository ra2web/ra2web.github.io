;(function () {
    const actual = "0.87.0-ra650aef-dbe734612";
    const url = new URL(import.meta.url);
    const requested = url.searchParams.get('v');
    const page = typeof window !== 'undefined' && window.__ra2webStartupDiagnostic?.snapshot().assetVersion;
    if (requested !== actual || (page && page !== actual)) {
      const detail = { expected: page || requested, actual, url: url.href };
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('ra2web:runtime-build-mismatch', { detail }));
      const error = new Error('客户端构建不一致，请重新加载');
      error.name = 'ClientBuildMismatchError';
      Object.assign(error, detail);
      throw error;
    }
  })();
(function(){try{var t=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},e=new t.Error().stack;e&&(t._sentryDebugIds=t._sentryDebugIds||{},t._sentryDebugIds[e]="875cdaf5-f695-4e28-85aa-e6de9c9dffd0",t._sentryDebugIdIdentifier="sentry-dbid-875cdaf5-f695-4e28-85aa-e6de9c9dffd0")}catch{}})();const l=1e3;let i=!1,d=!1,o=8e3,a=0,s,n={buildVersion:""};function f(t){const e={type:"hangReported",lastBeatMs:a,durationMs:t};self.postMessage(e)}function c(t){return{...n,kind:"hang",durationMs:t,lastBeatMs:a}}async function p(t){if(!s)return;const e=c(t),r=JSON.stringify({eventType:"main_thread_hang",reportedPlayer:e.playerName,buildVersion:e.buildVersion,screen:e.screen,gameId:e.gameId,pageUrl:e.pageUrl,visibilityState:"visible",message:"Main thread hang",context:e});r.length>16*1024||await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:r,credentials:"omit",keepalive:!0})}function u(){if(!i||d)return;const t=Date.now()-a;t<o||(d=!0,f(t),p(t).catch(()=>{}))}self.addEventListener("message",t=>{const e=t.data;if(!(!e||typeof e!="object")){if(e.type==="start"){d=!1,o=e.hangThresholdMs,s=e.incidentUrl,n=e.payload,a=Date.now();return}if(e.type==="arm"){i=!0,a=Date.now();return}if(e.type==="beat"){a=e.lastBeatMs,e.payload&&(n={...n,...e.payload});return}if(e.type==="updateContext"){n={...n,...e.payload};return}e.type==="disarm"&&(i=!1)}});setInterval(u,l);
