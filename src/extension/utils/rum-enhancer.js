/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { sampleRUM } = window.hlx.rum;

const fflags = {
  has: (flag) => fflags[flag].indexOf(Array.from(window.origin)
    .map((a) => a.charCodeAt(0))
    .reduce((a, b) => a + b, 1) % 1371) !== -1,
  enabled: (flag, callback) => fflags.has(flag) && callback(),
  disabled: (flag, callback) => !fflags.has(flag) && callback(),
  onetrust: [543, 770, 1136],
  ads: [1339],
  email: [1339],
};

sampleRUM.baseURL = sampleRUM.baseURL || new URL('https://rum.hlx.page');

sampleRUM.blockobserver = (window.IntersectionObserver) ? new IntersectionObserver((entries) => {
  entries
    .filter((entry) => entry.isIntersecting)
    .forEach((entry) => {
      sampleRUM.blockobserver.unobserve(entry.target); // observe only once
      const target = sampleRUM.targetselector(entry.target);
      const source = sampleRUM.sourceselector(entry.target);
      sampleRUM('viewblock', { target, source });
    });
}, { threshold: 0.25 }) : { observe: () => { } };

sampleRUM.mediaobserver = (window.IntersectionObserver) ? new IntersectionObserver((entries) => {
  entries
    .filter((entry) => entry.isIntersecting)
    .forEach((entry) => {
      sampleRUM.mediaobserver.unobserve(entry.target); // observe only once
      const target = sampleRUM.targetselector(entry.target);
      const source = sampleRUM.sourceselector(entry.target);
      sampleRUM('viewmedia', { target, source });
    });
}, { threshold: 0.25 }) : { observe: () => { } };

sampleRUM.drain('observe', ((elements) => {
  elements.forEach((element) => {
    if (element.tagName.toLowerCase() === 'img'
      || element.tagName.toLowerCase() === 'video'
      || element.tagName.toLowerCase() === 'audio'
      || element.tagName.toLowerCase() === 'iframe') {
      sampleRUM.mediaobserver.observe(element);
    } else {
      sampleRUM.blockobserver.observe(element);
    }
  });
}));

const navigate = (source, type) => {
  const payload = { source, target: document.visibilityState };
  // reload: same page, navigate: same origin, enter: everything else
  if (type === 'reload' || source === window.location.href) {
    sampleRUM('reload', payload);
  } else if (type && type !== 'navigate') {
    sampleRUM(type, payload); // back, forward, prerender, etc.
  } else if (source && window.location.origin === new URL(source).origin) {
    sampleRUM('navigate', payload); // internal navigation
  } else {
    sampleRUM('enter', payload); // enter site
  }
};

new PerformanceObserver((list) => list
  // @ts-ignore
  .getEntries().map((entry) => navigate(document.referrer, entry.type)))
  .observe({ type: 'navigation', buffered: true });

sampleRUM.targetselector = (element) => {
  if (!element) return undefined;
  const getTargetValue = (el) => el.getAttribute('data-rum-target') || el.getAttribute('href')
    || el.currentSrc || el.getAttribute('src')
    || el.dataset.action || el.action;

  let value = getTargetValue(element);
  if (!value && element.tagName !== 'A' && element.closest('a')) {
    value = getTargetValue(element.closest('a'));
  }

  if (value && !value.startsWith('https://')) {
    // resolve relative links
    // @ts-ignore
    value = new URL(value, window.location).href;
  }
  return value;
};

sampleRUM.drain('cwv', (() => {
  const cwvScript = new URL('.rum/web-vitals/dist/web-vitals.iife.js', sampleRUM.baseURL).href;
  if (document.querySelector(`script[src="${cwvScript}"]`)) {
    // web vitals script has been loaded already
    return;
  }
  // use classic script to avoid CORS issues
  const script = document.createElement('script');
  script.src = cwvScript;
  script.onload = () => {
    const storeCWV = (measurement) => {
      const data = { cwv: {} };
      data.cwv[measurement.name] = measurement.value;

      if (measurement.name === 'LCP' && measurement.entries.length > 0) {
        const { element: el } = measurement.entries.pop();
        data.target = sampleRUM.targetselector(el);
        data.source = sampleRUM.sourceselector(el) || (el && el.outerHTML.slice(0, 30));
      }

      sampleRUM('cwv', data);
    };

    const isEager = (metric) => ['CLS', 'LCP'].includes(metric);

    // When loading `web-vitals` using a classic script, all the public
    // methods can be found on the `webVitals` global namespace.
    ['FID', 'INP', 'TTFB', 'CLS', 'LCP'].forEach((metric) => {
      // @ts-ignore
      const metricFn = window.webVitals[`on${metric}`];
      if (typeof metricFn === 'function') {
        const opts = isEager(metric) ? { reportAllChanges: true } : undefined;
        metricFn(storeCWV, opts);
      }
    });
  };
  document.head.appendChild(script);
}));

sampleRUM.drain('leave', ((event = {}) => {
  if (sampleRUM.left || (event.type === 'visibilitychange' && document.visibilityState !== 'hidden')) {
    return;
  }
  sampleRUM.left = true;
  sampleRUM('leave');
}));

sampleRUM.sourceselector = (element) => {
  if (element === document.body || element === document.documentElement || !element) {
    return undefined;
  }
  if (element.getAttribute('data-rum-source')) {
    return element.getAttribute('data-rum-source');
  }
  const form = element.closest('form');
  let formElementSelector = '';
  if (form && Array.from(form.elements).includes(element)) {
    formElementSelector = element.tagName === 'INPUT' ? `form input[type='${element.getAttribute('type')}']` : `form ${element.tagName.toLowerCase()}`;
  }

  const blockName = element.closest('.block') ? element.closest('.block').getAttribute('data-block-name') : '';
  if (element.id || formElementSelector) {
    const id = element.id ? `#${element.id}` : '';
    return blockName ? `.${blockName} ${formElementSelector}${id}` : `${formElementSelector}${id}`;
  }

  if (element.getAttribute('data-block-name')) {
    return `.${element.getAttribute('data-block-name')}`;
  }

  if (Array.from(element.classList).some((className) => className.match(/button|cta/))) {
    return blockName ? `.${blockName} .button` : '.button';
  }
  return sampleRUM.sourceselector(element.parentElement);
};

document.addEventListener('click', (event) => {
  sampleRUM('click', { target: sampleRUM.targetselector(event.target), source: sampleRUM.sourceselector(event.target) });
});

// Track form submissions
document.querySelectorAll('form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    sampleRUM('formsubmit', { target: sampleRUM.targetselector(event.target), source: sampleRUM.sourceselector(event.target) });
  });
});

window.addEventListener('visibilitychange', ((event) => sampleRUM.leave(event)));
window.addEventListener('pagehide', ((event) => sampleRUM.leave(event)));

new PerformanceObserver((list) => {
  list.getEntries()
    // @ts-ignore
    .filter((entry) => !entry.responseStatus || entry.responseStatus < 400)
    .filter((entry) => window.location.hostname === new URL(entry.name).hostname)
    .filter((entry) => new URL(entry.name).pathname.match('.*(\\.plain\\.html|\\.json)$'))
    .forEach((entry) => {
      sampleRUM('loadresource', { source: entry.name, target: Math.round(entry.duration) });
    });
  list.getEntries()
    // @ts-ignore
    .filter((entry) => entry.responseStatus === 404)
    .forEach((entry) => {
      // @ts-ignore
      sampleRUM('missingresource', { source: entry.name, target: entry.hostname });
    });
}).observe({ type: 'resource', buffered: true });

[...new URLSearchParams(window.location.search).entries()]
  .filter(([key]) => key.startsWith('utm_'))
  .filter(([key]) => key !== 'utm_id')
  .filter(([key]) => key !== 'utm_term')
  .forEach(([key, value]) => {
    sampleRUM('utm', { source: key, target: value });
  });

fflags.enabled('onetrust', () => {
  const cmpCookie = document.cookie.split(';')
    .map((c) => c.trim())
    .find((cookie) => cookie.startsWith('OptanonAlertBoxClosed='));

  if (cmpCookie) {
    sampleRUM('consent', { source: 'onetrust', target: 'hidden' });
  } else {
    let consentMutationObserver;
    const trackShowConsent = () => {
      if (document.querySelector('body > div#onetrust-consent-sdk')) {
        sampleRUM('consent', { source: 'onetrust', target: 'show' });
        if (consentMutationObserver) {
          consentMutationObserver.disconnect();
        }
        return true;
      }
      return false;
    };

    if (!trackShowConsent()) {
      // eslint-disable-next-line max-len
      consentMutationObserver = window.MutationObserver ? new MutationObserver(trackShowConsent) : null;
      if (consentMutationObserver) {
        consentMutationObserver.observe(
          document.body,
          // eslint-disable-next-line object-curly-newline
          { attributes: false, childList: true, subtree: false },
        );
      }
    }
  }
});

fflags.enabled('ads', () => {
  const networks = {
    google: /gclid|gclsrc|wbraid|gbraid/,
    doubleclick: /dclid/,
    microsoft: /msclkid/,
    facebook: /fb(cl|ad_|pxl_)id/,
    twitter: /tw(clid|src|term)/,
    linkedin: /li_fat_id/,
    pinterest: /epik/,
    tiktok: /ttclid/,
  };
  const params = Array.from(new URLSearchParams(window.location.search).keys());
  Object.entries(networks).forEach(([network, regex]) => {
    params.filter((param) => regex.test(param)).forEach((param) => sampleRUM('paid', { source: network, target: param }));
  });
});

fflags.enabled('email', () => {
  const networks = {
    mailchimp: /mc_(c|e)id/,
    marketo: /mkt_tok/,

  };
  const params = Array.from(new URLSearchParams(window.location.search).keys());
  Object.entries(networks).forEach(([network, regex]) => {
    params.filter((param) => regex.test(param)).forEach((param) => sampleRUM('email', { source: network, target: param }));
  });
});
