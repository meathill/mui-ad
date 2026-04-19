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
              'style="display:flex;flex-direction:column;align-items:center;justify-content:center;' +
              'width:100%;height:100%;padding:12px;box-sizing:border-box;' +
              'border:1px solid #e5e0d0;border-radius:8px;text-decoration:none;color:inherit;' +
              'font-family:system-ui,sans-serif;gap:8px;background:#fff;">' +
              (ad.imageUrl ? '<img src="' + ad.imageUrl + '" style="max-width:100%;max-height:60%;object-fit:contain" alt="">' : '') +
              '<strong style="font-size:14px;line-height:1.2">' + ad.title + '</strong>' +
              (ad.content ? '<span style="font-size:12px;line-height:1.35;color:#666;text-align:center">' + ad.content + '</span>' : '') +
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
