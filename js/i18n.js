class I18n {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['ko','en','ja','es','pt','zh','id','tr','de','fr','hi','ru'];
        this.currentLang = this.detectLanguage();
    }
    detectLanguage() {
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang && this.supportedLanguages.includes(urlLang)) return urlLang;
        const saved = localStorage.getItem('app_language');
        if (saved && this.supportedLanguages.includes(saved)) return saved;
        const browser = (navigator.language || navigator.userLanguage).split('-')[0];
        if (this.supportedLanguages.includes(browser)) return browser;
        return 'en';
    }
    async loadTranslations(lang) {
        try {
            const r = await fetch(`js/locales/${lang}.json`);
            if (!r.ok) throw new Error('Not found');
            this.translations[lang] = await r.json();
            return true;
        } catch (e) {
            if (lang !== 'en') return this.loadTranslations('en');
            return false;
        }
    }
    t(key) {
        const keys = key.split('.');
        let v = this.translations[this.currentLang];
        for (const k of keys) { if (v && v[k] !== undefined) v = v[k]; else return key; }
        return v;
    }
    getSeoHref(lang) {
        const links = document.querySelectorAll('link[rel="alternate"][hreflang]');
        const hrefMap = {};
        links.forEach(link => {
            const hreflang = link.getAttribute('hreflang');
            if (hreflang) hrefMap[hreflang] = link.href;
        });
        return hrefMap[lang] || hrefMap['x-default'] || (document.querySelector('link[rel="canonical"]') || {}).href || window.location.href;
    }
    syncSeoState(lang, updateHistory = false) {
        const currentUrl = new URL(window.location.href);
        const currentHasLangParam = currentUrl.searchParams.has('lang');
        const targetHref = this.getSeoHref(updateHistory || currentHasLangParam ? lang : 'x-default');
        if (targetHref) {
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) canonical.href = targetHref;
            const ogUrl = document.querySelector('meta[property="og:url"]');
            if (ogUrl) ogUrl.content = targetHref;
            const twitterUrl = document.querySelector('meta[name="twitter:url"]');
            if (twitterUrl) twitterUrl.content = targetHref;
        }
        if (updateHistory && targetHref) {
            const nextUrl = new URL(targetHref);
            nextUrl.hash = currentUrl.hash;
            if (currentUrl.pathname !== nextUrl.pathname || currentUrl.search !== nextUrl.search || currentUrl.hash !== nextUrl.hash) {
                window.history.replaceState({}, '', nextUrl.pathname + nextUrl.search + nextUrl.hash);
            }
        }
    }
    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) return false;
        if (!this.translations[lang]) await this.loadTranslations(lang);
        this.currentLang = lang;
        localStorage.setItem('app_language', lang);
        document.documentElement.lang = lang;
        this.updateUI();
        this.syncSeoState(lang, true);
        return true;
    }
    updateUI() {
        document.documentElement.lang = this.currentLang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const val = this.t(el.getAttribute('data-i18n'));
            if (val !== el.getAttribute('data-i18n')) {
                if (el.hasAttribute('data-i18n-attr')) {
                    el.setAttribute(el.getAttribute('data-i18n-attr'), val);
                } else {
                    el.textContent = val;
                }
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
        });
        const titleKey = this.t('meta.title');
        if (titleKey !== 'meta.title') document.title = titleKey;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) { const d = this.t('meta.description'); if (d !== 'meta.description') meta.content = d; }
        this.syncSeoState(this.currentLang);
    }
    getCurrentLanguage() { return this.currentLang; }
}
try { window.i18n = new I18n(); } catch(e) { console.warn('i18n init failed:', e); }
