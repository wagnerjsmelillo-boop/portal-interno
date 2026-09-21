/* ------------------------------------------------------------------
   Componente que permite instalar o portal como aplicativo no celular.

   ESTRATEGIA: rede primeiro, cache so como reserva.
   - Com internet, SEMPRE usa a versao do servidor. Nunca serve codigo
     velho, mesmo depois de uma atualizacao.
   - Sem internet, serve a ultima copia que funcionou, para o app abrir.
   - Assume o controle imediatamente quando uma versao nova chega.

   NAO guarda mensagens, fotos, senhas nem o desenho: nada disso passa
   por aqui. O conteudo das conversas nunca vira requisicao HTTP.
   ------------------------------------------------------------------ */
var CACHE = "portal-interno-v1";
var BASICOS = ["./", "./index.html", "./config.js", "./manifest.json",
               "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(BASICOS); }).catch(function(){})
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); }).catch(function(){})
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(req).then(function(resp){
      if(resp && resp.status === 200 && resp.type === "basic"){
        var copia = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copia); }).catch(function(){});
      }
      return resp;
    }).catch(function(){
      return caches.match(req).then(function(m){
        return m || caches.match("./index.html");
      });
    })
  );
});
