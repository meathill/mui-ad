import { Hono } from 'hono';
import type { HonoEnv } from '../env';

const app = new Hono<HonoEnv>();

const WIDGET_SCRIPT = String.raw`(function () {
  var d = document,
    slots = d.querySelectorAll('[data-muiad]'),
    base = (d.currentScript && d.currentScript.src || '').replace(/\/widget\.js.*$/, '');
  for (var i = 0; i < slots.length; i++) {
    (function (el) {
      var zone = el.getAttribute('data-muiad');
      if (!zone) return;
      fetch(base + '/serve?zone=' + encodeURIComponent(zone), { credentials: 'omit' })
        .then(function (r) { return r.status === 200 ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.ad) return;
          var ad = data.ad;
          el.innerHTML =
            '<a href="' + ad.clickUrl + '" target="_blank" rel="noopener sponsored" ' +
              'style="display:flex;flex-direction:column;justify-content:center;gap:8px;' +
              'width:100%;height:100%;padding:12px;box-sizing:border-box;' +
              'border:1px solid #e5e0d0;border-radius:8px;text-decoration:none;color:inherit;' +
              'font-family:system-ui,sans-serif;background:#fff;">' +
              '<div style="display:flex;align-items:center;gap:10px">' +
                (ad.imageUrl ? '<img src="' + ad.imageUrl + '" style="width:140px;height:70px;flex:none;object-fit:cover;border-radius:6px" alt="">' : '') +
                '<strong style="flex:1;min-width:0;font-size:15px;line-height:1.25;overflow-wrap:anywhere">' + ad.title + '</strong>' +
              '</div>' +
              (ad.content ? '<span style="font-size:12px;line-height:1.4;color:#666">' + ad.content + '</span>' : '') +
            '</a>';
        })
        .catch(function () {});
    })(slots[i]);
  }
})();
`;

app.get('/', (c) => {
  return new Response(WIDGET_SCRIPT, {
    status: 200,
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
});

export default app;
