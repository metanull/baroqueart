import { createViewer } from '@metanull/viewer-core'
import '@metanull/viewer-layout/style.css'
import '../theme/tokens.css'
import '../theme/overrides.css'
import './styles/site.css'
import config from './dataset.config.js'

// Every locales/<lang>.json becomes the messages of that language.
const localeFiles = import.meta.glob('../locales/*.json', { eager: true })
const messages = {}
for (const [path, module] of Object.entries(localeFiles)) {
  const lang = path.split('/').pop().replace(/\.json$/, '')
  messages[lang] = module.default
}

createViewer({ ...config, messages }).mount('#app')
