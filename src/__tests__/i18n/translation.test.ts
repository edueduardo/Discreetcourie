import { t, getLocaleFromHeader, getAllTranslations, LOCALES } from '@/lib/i18n'

describe('i18n Translation System', () => {
  describe('t() function', () => {
    it('should translate keys in English', () => {
      expect(t('common.loading', 'en')).toBe('Loading...')
      expect(t('common.save', 'en')).toBe('Save')
      expect(t('landing.hero.title1', 'en')).toBe('Your Package Delivered.')
    })

    it('should translate keys in Portuguese', () => {
      expect(t('common.loading', 'pt')).toBe('Carregando...')
      expect(t('common.save', 'pt')).toBe('Salvar')
      expect(t('landing.hero.title1', 'pt')).toBe('Seu Pacote Entregue.')
    })

    it('should translate keys in Spanish', () => {
      expect(t('common.loading', 'es')).toBe('Cargando...')
      expect(t('common.save', 'es')).toBe('Guardar')
      expect(t('landing.hero.title1', 'es')).toBe('Tu Paquete Entregado.')
    })

    it('should fallback to English for missing translations', () => {
      expect(t('nonexistent.key', 'pt')).toBe('nonexistent.key')
    })

    it('should replace parameters in translations', () => {
      const result = t('common.loading', 'en', { test: 'value' })
      expect(result).toBeDefined()
    })
  })

  describe('getLocaleFromHeader()', () => {
    it('should detect English from Accept-Language header', () => {
      expect(getLocaleFromHeader('en-US,en;q=0.9')).toBe('en')
    })

    it('should detect Portuguese from Accept-Language header', () => {
      expect(getLocaleFromHeader('pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt')
    })

    it('should detect Spanish from Accept-Language header', () => {
      expect(getLocaleFromHeader('es-ES,es;q=0.9')).toBe('es')
    })

    it('should fallback to English for unsupported languages', () => {
      expect(getLocaleFromHeader('fr-FR,fr;q=0.9')).toBe('en')
    })

    it('should return default locale for null header', () => {
      expect(getLocaleFromHeader(null)).toBe('en')
    })
  })

  describe('getAllTranslations()', () => {
    it('should return all English translations', () => {
      const translations = getAllTranslations('en')
      expect(translations['common.loading']).toBe('Loading...')
      expect(translations['landing.hero.title1']).toBe('Your Package Delivered.')
    })

    it('should return all Portuguese translations', () => {
      const translations = getAllTranslations('pt')
      expect(translations['common.loading']).toBe('Carregando...')
      expect(translations['landing.hero.title1']).toBe('Seu Pacote Entregue.')
    })

    it('should return all Spanish translations', () => {
      const translations = getAllTranslations('es')
      expect(translations['common.loading']).toBe('Cargando...')
      expect(translations['landing.hero.title1']).toBe('Tu Paquete Entregado.')
    })
  })

  describe('LOCALES constant', () => {
    it('should have all three supported locales', () => {
      expect(Object.keys(LOCALES)).toHaveLength(3)
      expect(LOCALES.en).toBe('English')
      expect(LOCALES.pt).toBe('Português')
      expect(LOCALES.es).toBe('Español')
    })
  })

  describe('Landing Page Translations', () => {
    it('should have all landing page keys in all languages', () => {
      const keys = [
        'landing.hero.badge',
        'landing.hero.title1',
        'landing.hero.title2',
        'landing.hero.subtitle',
        'landing.hero.description',
        'landing.hero.cta.call',
        'landing.hero.cta.book',
        'landing.services.title',
        'landing.pricing.title',
        'landing.howitworks.title',
        'landing.footer.tagline'
      ]

      keys.forEach(key => {
        expect(t(key, 'en')).not.toBe(key) // Not fallback
        expect(t(key, 'pt')).not.toBe(key)
        expect(t(key, 'es')).not.toBe(key)
      })
    })
  })
})
