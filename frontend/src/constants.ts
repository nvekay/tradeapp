export const PSYCHOLOGY_OPTIONS = [
  'По системе ✅',
  'FOMO / открылся на эмоциях',
  'Вышел раньше времени',
  'Передержал убыток',
  'Нарушил правила входа',
  'Донабор не по плану',
  'Боялся упустить прибыль',
  'Мстительная торговля',
  'Торговал усталым',
  'Игнорировал новости',
]

export const SYMBOLS = [
  // Indices
  'GER40', 'US30', 'US500', 'NAS100', 'UK100', 'FR40', 'EU50', 'JP225', 'AUS200', 'HK50', 'ES35', 'CHINA50',
  // FX Majors
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  // FX Crosses (EUR)
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD',
  // FX Crosses (GBP / JPY)
  'GBPJPY', 'GBPAUD', 'GBPCAD', 'GBPCHF', 'GBPNZD',
  'AUDJPY', 'CHFJPY', 'CADJPY', 'NZDJPY',
  // FX Crosses (other)
  'AUDCAD', 'AUDCHF', 'AUDNZD', 'NZDCAD', 'NZDCHF', 'CADCHF',
  // Metals
  'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD',
  // Energy
  'USOIL', 'UKOIL', 'NATGAS',
  // Crypto
  'BTCUSD', 'ETHUSD', 'LTCUSD', 'XRPUSD', 'BCHUSD', 'ADAUSD', 'DOTUSD', 'SOLUSD',
]

export const SESSION_LABELS: Record<string, string> = {
  london: 'London',
  new_york: 'New York',
  asian: 'Asian',
  overlap: 'Overlap',
}
