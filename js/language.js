// language.js - Multi-language support with jQuery
// Works with both embedded translations (translations.js) and external JSON files

class LanguageManager {
	static localeMap = {
	    'en': 'en_US',
	    'es': 'es_ES',
	    'fr': 'fr_FR',
	    'ml': 'ml_IN',
	    'hi': 'hi_IN',
	    'ar': 'ar_AE'
   };

  constructor(defaultLang = 'en', useEmbedded = false) {
    this.currentLang = this.getSavedLanguage() || defaultLang;
    this.translations = {};
    this.availableLanguages = ['en', 'es', 'fr', 'hi','ar','ml'];
    this.useEmbedded = useEmbedded; // Toggle between embedded and JSON files
  }

  // Get saved language from localStorage
  getSavedLanguage() {
    return localStorage.getItem('selectedLanguage');
  }

  // Save language preference
  saveLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
  }

  // Load language from embedded translations object
  loadEmbeddedLanguage(lang) {
    if (typeof translations !== 'undefined' && translations[lang]) {
      this.translations = translations[lang];
      this.currentLang = lang;
      this.saveLanguage(lang);
      return true;
    }
    console.error(`Embedded translation not found for language: ${lang}`);
    return false;
  }

  // Load translation file from JSON
  async loadLanguageFromJSON(lang) {
    try {
      const response = await fetch(`lang/${lang}.json`);
      if (!response.ok) throw new Error(`Language file not found: ${lang}`);
      this.translations = await response.json();
      this.currentLang = lang;
      this.saveLanguage(lang);
      return true;
    } catch (error) {
      console.error('Error loading language:', error);
      return false;
    }
  }

  // Universal load method - uses embedded or JSON based on configuration
  async loadLanguage(lang) {
    if (this.useEmbedded) {
      return this.loadEmbeddedLanguage(lang);
    } else {
      return await this.loadLanguageFromJSON(lang);
    }
  }

  // Get translation for a key
  translate(key) {
    return this.translations[key] || key;
  }

  // Apply translations to the page
  applyTranslations() {
    // Translate elements with data-i18n attribute
    $('[data-i18n]').each((index, element) => {
      const $el = $(element);
      const key = $el.attr('data-i18n');
      const translation = this.translate(key);

      // Check if it's a placeholder, value, or text content
      if ($el.attr('placeholder') !== undefined) {
        $el.attr('placeholder', translation);
      } else if ($el.is('input') && $el.attr('value') !== undefined) {
        $el.val(translation);
      } else {
        $el.html(translation);
      }
    });

    // Update page title if it has data-i18n
    const titleKey = $('title').attr('data-i18n');
    if (titleKey) {
      document.title = this.translate(titleKey);
    }

    this.updateMetaTags(this.currentLang);
    this.updateOGLocale(this.currentLang);
    this.updateStructuredData(this.currentLang);

    // Update lang attribute
    $('html').attr('lang', this.currentLang);

    // Update dropdown value
    $('#language-selector').val(this.currentLang);

    // Handle RTL languages
    if (this.isRTL()) {
      $('body').attr('dir', 'rtl');
    } else {
      $('body').attr('dir', 'ltr');
    }
  }


updateStructuredData(lang) {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "BWStays",
        "description": this.translate('page.description'),
        "url": "https://www.bwstays.com",
        "inLanguage": lang,
        "publisher": {
            "@type": "Organization",
            "name": "BWStays",
            "url": "https://www.bwstays.com",
            "logo": "https://www.bwstays.com/assets/img/icons/bw.svg"
        }
    };

    $('script[type="application/ld+json"]').text(JSON.stringify(structuredData, null, 2));
}

updateMetaTags(lang) {
    document.title = this.translate('page.title');
    $('meta[name="description"]').attr('content', this.translate('page.description'));
    $('meta[name="keywords"]').attr('content', this.translate('page.keywords'));
    $('meta[property="og:title"]').attr('content', this.translate('page.title'));
    $('meta[property="og:description"]').attr('content', this.translate('page.description'));
    $('meta[name="twitter:title"]').attr('content', this.translate('page.title'));
    $('meta[name="twitter:description"]').attr('content', this.translate('page.description'));
}

updateOGLocale(lang) {
	  lan=this.localeMap[lang];
     $('meta[property="og:locale"]').attr('content',  lan || 'en_US');
}

  // Initialize language system
  async init() {
    const success = await this.loadLanguage(this.currentLang);
    if (success) {
      this.applyTranslations();
      this.setupLanguageSwitcher();
    } else {
      // Fallback to English if selected language fails
      if (this.currentLang !== 'en') {
        console.warn(`Falling back to English`);
        await this.loadLanguage('en');
        this.applyTranslations();
      }
    }
  }

  // Setup language switcher event handlers
  setupLanguageSwitcher() {
    const self = this;

    // Handle dropdown change
    $('#language-selector').on('change', async function(e) {
     const lang = $(this).val();

      if (lang !== self.currentLang) {
        // Add loading state
        $('body').addClass('loading-language');

        const success = await self.loadLanguage(lang);
        if (success) {
          self.applyTranslations();

          // Optional: Fade effect during language change
          $('[data-i18n]').addClass('lang-transition');
          setTimeout(() => {
            $('[data-i18n]').removeClass('lang-transition');
          }, 300);

          // Trigger custom event for language change
          $(document).trigger('languageChanged', [lang]);
        }

        $('body').removeClass('loading-language');
      }
    });
    // Set initial dropdown value
    $('#language-selector').val(this.currentLang);

  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLang;
  }

  // Check if RTL language (for Arabic, Hebrew, etc.)
  isRTL() {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(this.currentLang);
  }

  // Add new translation at runtime
  addTranslation(lang, key, value) {
    if (!translations[lang]) {
      translations[lang] = {};
    }
    translations[lang][key] = value;

    // Refresh if it's the current language
    if (lang === this.currentLang) {
      this.applyTranslations();
    }
  }
}

// Initialize on document ready
$(document).ready(function() {
  // Detect browser language as default
  const browserLang = navigator.language.split('-')[0];

  // Create language manager instance
  // Set useEmbedded to true to use translations.js, false to use JSON files
  const langManager = new LanguageManager(browserLang, false);

  // Make it globally accessible
  window.langManager = langManager;

  // Initialize
  langManager.init();

  // Optional: Listen for language change events
 $(document).on('languageChanged', function(e, lang) {
    //console.log('Language changed to:', lang);
    // You can add custom logic here when language changes
  });

});