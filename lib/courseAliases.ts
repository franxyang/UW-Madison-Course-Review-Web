/**
 * UW-Madison Course Code Alias Mapping
 * 
 * Students may search using abbreviations (CS), official codes (COMP SCI),
 * or full names (Computer Sciences). This maps all known variations.
 * 
 * Format: { alias → [actual codes stored in DB] }
 */

// Bidirectional alias groups - each group contains all known variations
const ALIAS_GROUPS: string[][] = [
  // Computer Sciences
  ['CS', 'COMP SCI', 'COMPUTER SCIENCES', 'COMPSCI'],
  // Mathematics
  ['MATH', 'MATHEMATICS'],
  // Statistics
  ['STAT', 'STATISTICS', 'STATS'],
  // Economics  
  ['ECON', 'ECONOMICS'],
  // Electrical & Computer Engineering
  ['ECE', 'E C E', 'ELEC ENGR', 'ELECTRICAL ENGINEERING'],
  // Mechanical Engineering
  ['ME', 'M E', 'MECH ENGR', 'MECHANICAL ENGINEERING'],
  // Civil Engineering
  ['CIV ENGR', 'CIVIL ENGINEERING', 'CEE'],
  // Chemical Engineering
  ['CBE', 'CHEM ENGR', 'CHEMICAL ENGINEERING'],
  // Biomedical Engineering
  ['BME', 'B M E', 'BIOMED ENGR', 'BIOMEDICAL ENGINEERING'],
  // Industrial Engineering  
  ['I SY E', 'INDUSTRIAL ENGINEERING', 'ISyE', 'ISYE'],
  // Materials Science
  ['M S & E', 'MATERIALS SCIENCE', 'MSE'],
  // Engineering Physics
  ['E P', 'ENGR PHYSICS', 'ENGINEERING PHYSICS'],
  // Nuclear Engineering
  ['N E', 'NUCLEAR ENGR', 'NUCLEAR ENGINEERING'],
  // Psychology
  ['PSYCH', 'PSYCHOLOGY'],
  // Philosophy
  ['PHIL', 'PHILOSOPHY', 'PHILOS'],
  // Political Science
  ['POLI SCI', 'POLITICAL SCIENCE', 'POLISCI'],
  // Chemistry
  ['CHEM', 'CHEMISTRY'],
  // Physics
  ['PHYSICS', 'PHYS'],
  // Biology
  ['BIOLOGY', 'BIO', 'BIOL'],
  // Sociology
  ['SOC', 'SOCIOLOGY'],
  // Anthropology
  ['ANTHRO', 'ANTHROPOLOGY'],
  // Communication Arts
  ['COM ARTS', 'COMMUNICATION ARTS', 'COMM ARTS'],
  // English
  ['ENGL', 'ENGLISH'],
  // History
  ['HISTORY', 'HIST'],
  // Geography
  ['GEOG', 'GEOGRAPHY'],
  // Art History
  ['ART HIST', 'ART HISTORY'],
  // Gender & Women's Studies
  ['GEN&WS', 'GENDER STUDIES', 'WOMENS STUDIES'],
  // Environmental Studies
  ['ENVIR ST', 'ENVIRONMENTAL STUDIES', 'ENV ST'],
  // African American Studies
  ['AFROAMER', 'AFRO-AMERICAN STUDIES', 'AFRO AMERICAN'],
  // East Asian Studies
  ['E ASIAN', 'EAST ASIAN', 'EAST ASIAN STUDIES'],
  // Curriculum & Instruction
  ['CURRIC', 'CURRICULUM', 'C&I'],
  // Accounting
  ['ACCT', 'ACCT I S', 'ACCOUNTING'],
  // Finance
  ['FINANCE', 'FIN'],
  // Agricultural & Applied Economics
  ['AAE', 'A A E', 'AG ECON'],
  // Astronomy
  ['ASTRON', 'ASTRONOMY'],
  // Atmospheric & Oceanic Sciences
  ['ATM OCN', 'ATMOSPHERIC SCIENCES'],
  // Biochemistry
  ['BIOCHEM', 'BIOCHEMISTRY'],
  // Botany
  ['BOTANY', 'BOT'],
  // Genetics
  ['GENETICS', 'GEN'],
  // Journalism
  ['JOURN', 'JOURNALISM', 'J&MC'],
  // Nursing
  ['NURSING', 'NURS'],
  // Pharmacy
  ['PHARMACY', 'PHARM'],
  // Social Work
  ['SOC WORK', 'SOCIAL WORK', 'SW'],
  // Law
  ['LAW'],
  // Music
  ['MUSIC', 'MUS'],
  // Dance
  ['DANCE'],
  // Theatre
  ['THEATRE', 'THEATER'],
  // Actuarial Science
  ['ACT SCI', 'ACTUARIAL SCIENCE'],
  // Biostatistics
  ['BIOST', 'BIOSTATISTICS', 'BIOSTAT'],
  // Data Science
  ['DS', 'DATA SCIENCE'],
  // Information School
  ['I SCHOOL', 'LIS', 'LIBRARY SCIENCE'],
  // Landscape Architecture
  ['LAND ARC', 'LANDSCAPE ARCHITECTURE'],
  // Food Science
  ['FOOD SCI', 'FOOD SCIENCE'],
  // Animal Sciences
  ['AN SCI', 'ANIMAL SCIENCES'],
  // Dairy Science
  ['DY SCI', 'DAIRY SCIENCE'],
  // Agronomy
  ['AGRONOMY', 'AGRON'],
  // Forestry & Wildlife Ecology
  ['F&W ECOL', 'FOREST ECOLOGY', 'WILDLIFE ECOLOGY'],
  // Entomology
  ['ENTOM', 'ENTOMOLOGY'],
  // Soil Science
  ['SOIL SCI', 'SOIL SCIENCE'],
  // Horticulture
  ['HORT', 'HORTICULTURE'],
  // Kinesiology
  ['KINES', 'KINESIOLOGY'],
  // Counseling Psychology
  ['COUN PSY', 'COUNSELING PSYCHOLOGY'],
  // Educational Psychology
  ['ED PSYCH', 'EDUCATIONAL PSYCHOLOGY'],
  // Geoscience
  ['GEOSCI', 'GEOSCIENCE', 'GEOLOGY'],
]

// Build lookup map: alias (uppercase) → all codes in its group
const aliasMap = new Map<string, string[]>()

for (const group of ALIAS_GROUPS) {
  const upperGroup = group.map(g => g.toUpperCase().trim())
  for (const alias of upperGroup) {
    aliasMap.set(alias, upperGroup)
  }
}

/**
 * Given a search term, expand it to all possible course code aliases.
 * 
 * Example: "CS 577" → searches for "CS 577", "COMP SCI 577", etc.
 * Example: "computer science" → searches for "CS", "COMP SCI", etc.
 */
export function expandSearchAliases(searchTerm: string): string[] {
  const upper = searchTerm.toUpperCase().trim()
  
  // Try to split into dept + number
  // Handle formats: "CS577", "CS 577", "COMP SCI 577", "COMPSCI577"
  const match = upper.match(/^(.+?)\s*(\d+)$/)
  
  if (match) {
    const deptPart = match[1].trim()
    const numPart = match[2]
    
    // Find aliases for the dept part
    const aliases = aliasMap.get(deptPart)
    if (aliases) {
      return aliases.map(a => `${a} ${numPart}`)
    }
    
    // Try without spaces: "COMPSCI" → "COMP SCI"
    for (const [key, group] of aliasMap.entries()) {
      if (key.replace(/\s+/g, '') === deptPart.replace(/\s+/g, '')) {
        return group.map(a => `${a} ${numPart}`)
      }
    }
    
    return [upper]
  }
  
  // No number - just a department name
  const aliases = aliasMap.get(upper)
  if (aliases) return aliases
  
  // Try without spaces
  for (const [key, group] of aliasMap.entries()) {
    if (key.replace(/\s+/g, '') === upper.replace(/\s+/g, '')) {
      return group
    }
  }
  
  return [upper]
}

/**
 * Build SQL OR conditions for all aliases of a search term.
 */
export function buildAliasSearchConditions(searchTerm: string): string[] {
  return expandSearchAliases(searchTerm)
}
