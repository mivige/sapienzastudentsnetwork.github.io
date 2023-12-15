// self.addEventListener('fetch', () => { });

// TODO: strategy
// - get from cache 
// - if has internet, update current cache (except for icons)
// - reload page if changed?

async function addResourcesToCache(resources) {
    const cache = await caches.open('v1');
    await cache.addAll(resources);
};

async function putInCache(request, response) {
    const cache = await caches.open('v1');
    await cache.put(request, response);
};

async function cacheFirst({ request, preloadResponsePromise, fallbackUrl }) {
    // First try to get the resource from the cache
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
        return responseFromCache;
    }

    // Next try to use (and cache) the preloaded response, if it's there
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
        // console.info('using preload response', preloadResponse);
        putInCache(request, preloadResponse.clone());
        return preloadResponse;
    }

    // Next try to get the resource from the network
    try {
        const responseFromNetwork = await fetch(request);
        // response may be used only once
        // we need to save clone to put one copy in cache
        // and serve second one
        putInCache(request, responseFromNetwork.clone());
        return responseFromNetwork;
    } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl);
        if (fallbackResponse) {
            return fallbackResponse;
        }
        // when even the fallback response is not available,
        // there is nothing we can do, but we must always
        // return a Response object
        return new Response('Errore di rete, verifica di essere collegato a internet...', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
};

// Enable navigation preload
async function enableNavigationPreload() {
    if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
    }
};

self.addEventListener('activate', (event) => {
    event.waitUntil(enableNavigationPreload());
});

self.addEventListener('install', (event) => {

    event.waitUntil(
        addResourcesToCache([
            '/',
            "{{ '/_assets/css/app.css?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/_assets/css/tailwind.css?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/_assets/css/gruvbox.css?v=' | append: site.github.build_revision | relative_url }}",
            "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
            // '/matricole',
            // '/percorso-formativo',
            // '/
            "{{ '/matricole?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/percorso-formativo?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/tirocinio?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/laurea?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/risorse?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/gruppi?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/orari?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/orari/acsai?v=' | append: site.github.build_revision | relative_url }}",
            "{{ '/orario?v=' | append: site.github.build_revision | relative_url }}",
            // '/',
            // '/index.html',
            // '/style.css',
            // '/app.js',
            // '/image-list.js',
            // '/star-wars-logo.jpg',
            // '/gallery/bountyHunters.jpg',
            // '/gallery/myLittleVader.jpg',
            // '/gallery/snowTroopers.jpg',
        ]),
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        cacheFirst({
            request: event.request,
            preloadResponsePromise: event.preloadResponse,
            fallbackUrl: '/404.html',
        }),
    );
});

