/**
 * IBAN country specifications from the SWIFT IBAN Registry.
 *
 * GENERATED FILE — do not edit by hand.
 * Source: data/iban-registry.tsv
 * Regenerate: node scripts/generate-iban-registry.mjs
 * (The generator verifies every entry against the registry's own
 * example IBANs — length, structure and mod-97 checksum.)
 */

export interface IbanFieldRange {
  /** 1-indexed inclusive positions within the BBAN. */
  start: number;
  end: number;
}

export interface IbanSpec {
  name: string;
  /** Full IBAN length, including country code and check digits. */
  ibanLength: number;
  /** Regex source matching the entire BBAN (anchor it when using). */
  bbanRegex: string;
  sepa: boolean;
  bank: IbanFieldRange | null;
  branch: IbanFieldRange | null;
  example: string;
}

export const IBAN_REGISTRY: Record<string, IbanSpec> = {
  AD: { name: "Andorra", ibanLength: 24, bbanRegex: "[0-9]{4}[0-9]{4}[A-Z0-9]{12}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "AD1200012030200359100100" },
  AE: { name: "United Arab Emirates (The)", ibanLength: 23, bbanRegex: "[0-9]{3}[0-9]{16}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "AE070331234567890123456" },
  AL: { name: "Albania", ibanLength: 28, bbanRegex: "[0-9]{8}[A-Z0-9]{16}", sepa: false, bank: { start: 1, end: 3 }, branch: { start: 4, end: 8 }, example: "AL47212110090000000235698741" },
  AT: { name: "Austria", ibanLength: 20, bbanRegex: "[0-9]{5}[0-9]{11}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "AT611904300234573201" },
  AZ: { name: "Azerbaijan", ibanLength: 28, bbanRegex: "[A-Z]{4}[A-Z0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "AZ21NABZ00000000137010001944" },
  BA: { name: "Bosnia and Herzegovina", ibanLength: 20, bbanRegex: "[0-9]{3}[0-9]{3}[0-9]{8}[0-9]{2}", sepa: false, bank: { start: 1, end: 3 }, branch: { start: 4, end: 6 }, example: "BA391290079401028494" },
  BE: { name: "Belgium", ibanLength: 16, bbanRegex: "[0-9]{3}[0-9]{7}[0-9]{2}", sepa: true, bank: { start: 1, end: 3 }, branch: null, example: "BE68539007547034" },
  BG: { name: "Bulgaria", ibanLength: 22, bbanRegex: "[A-Z]{4}[0-9]{4}[0-9]{2}[A-Z0-9]{8}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "BG80BNBG96611020345678" },
  BH: { name: "Bahrain", ibanLength: 22, bbanRegex: "[A-Z]{4}[A-Z0-9]{14}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "BH67BMAG00001299123456" },
  BI: { name: "Burundi", ibanLength: 27, bbanRegex: "[0-9]{5}[0-9]{5}[0-9]{11}[0-9]{2}", sepa: false, bank: { start: 1, end: 5 }, branch: { start: 6, end: 10 }, example: "BI4210000100010000332045181" },
  BR: { name: "Brazil", ibanLength: 29, bbanRegex: "[0-9]{8}[0-9]{5}[0-9]{10}[A-Z]{1}[A-Z0-9]{1}", sepa: false, bank: { start: 1, end: 8 }, branch: { start: 9, end: 13 }, example: "BR1800360305000010009795493C1" },
  BY: { name: "Belarus", ibanLength: 28, bbanRegex: "[A-Z0-9]{4}[0-9]{4}[A-Z0-9]{16}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "BY13NBRB3600900000002Z00AB00" },
  CH: { name: "Switzerland", ibanLength: 21, bbanRegex: "[0-9]{5}[A-Z0-9]{12}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "CH9300762011623852957" },
  CR: { name: "Costa Rica", ibanLength: 22, bbanRegex: "[0-9]{4}[0-9]{14}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "CR05015202001026284066" },
  CY: { name: "Cyprus", ibanLength: 28, bbanRegex: "[0-9]{3}[0-9]{5}[A-Z0-9]{16}", sepa: true, bank: { start: 1, end: 3 }, branch: { start: 4, end: 8 }, example: "CY17002001280000001200527600" },
  CZ: { name: "Czechia", ibanLength: 24, bbanRegex: "[0-9]{4}[0-9]{16}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "CZ6508000000192000145399" },
  DE: { name: "Germany", ibanLength: 22, bbanRegex: "[0-9]{8}[0-9]{10}", sepa: true, bank: { start: 1, end: 8 }, branch: null, example: "DE89370400440532013000" },
  DJ: { name: "Djibouti", ibanLength: 27, bbanRegex: "[0-9]{5}[0-9]{5}[0-9]{11}[0-9]{2}", sepa: false, bank: { start: 1, end: 5 }, branch: { start: 6, end: 10 }, example: "DJ2100010000000154000100186" },
  DK: { name: "Denmark", ibanLength: 18, bbanRegex: "[0-9]{4}[0-9]{9}[0-9]{1}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "DK5000400440116243" },
  DO: { name: "Dominican Republic", ibanLength: 28, bbanRegex: "[A-Z0-9]{4}[0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "DO28BAGR00000001212453611324" },
  EE: { name: "Estonia", ibanLength: 20, bbanRegex: "[0-9]{2}[0-9]{14}", sepa: true, bank: { start: 1, end: 2 }, branch: null, example: "EE382200221020145685" },
  EG: { name: "Egypt", ibanLength: 29, bbanRegex: "[0-9]{4}[0-9]{4}[0-9]{17}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "EG380019000500000000263180002" },
  ES: { name: "Spain", ibanLength: 24, bbanRegex: "[0-9]{4}[0-9]{4}[0-9]{1}[0-9]{1}[0-9]{10}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "ES9121000418450200051332" },
  FI: { name: "Finland", ibanLength: 18, bbanRegex: "[0-9]{3}[0-9]{11}", sepa: true, bank: { start: 1, end: 3 }, branch: null, example: "FI2112345600000785" },
  FK: { name: "Falkland Islands (Malvinas)", ibanLength: 18, bbanRegex: "[A-Z]{2}[0-9]{12}", sepa: false, bank: { start: 1, end: 2 }, branch: null, example: "FK88SC123456789012" },
  FO: { name: "Faroe Islands", ibanLength: 18, bbanRegex: "[0-9]{4}[0-9]{9}[0-9]{1}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "FO6264600001631634" },
  FR: { name: "France", ibanLength: 27, bbanRegex: "[0-9]{5}[0-9]{5}[A-Z0-9]{11}[0-9]{2}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "FR1420041010050500013M02606" },
  GB: { name: "United Kingdom", ibanLength: 22, bbanRegex: "[A-Z]{4}[0-9]{6}[0-9]{8}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 10 }, example: "GB29NWBK60161331926819" },
  GE: { name: "Georgia", ibanLength: 22, bbanRegex: "[A-Z]{2}[0-9]{16}", sepa: false, bank: { start: 1, end: 2 }, branch: null, example: "GE29NB0000000101904917" },
  GI: { name: "Gibraltar", ibanLength: 23, bbanRegex: "[A-Z]{4}[A-Z0-9]{15}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "GI75NWBK000000007099453" },
  GL: { name: "Greenland", ibanLength: 18, bbanRegex: "[0-9]{4}[0-9]{9}[0-9]{1}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "GL8964710001000206" },
  GR: { name: "Greece", ibanLength: 27, bbanRegex: "[0-9]{3}[0-9]{4}[A-Z0-9]{16}", sepa: true, bank: { start: 1, end: 3 }, branch: { start: 4, end: 7 }, example: "GR1601101250000000012300695" },
  GT: { name: "Guatemala", ibanLength: 28, bbanRegex: "[A-Z0-9]{4}[A-Z0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "GT82TRAJ01020000001210029690" },
  HN: { name: "Honduras", ibanLength: 28, bbanRegex: "[A-Z]{4}[0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "HN88CABF00000000000250005469" },
  HR: { name: "Croatia", ibanLength: 21, bbanRegex: "[0-9]{7}[0-9]{10}", sepa: true, bank: { start: 1, end: 7 }, branch: null, example: "HR1210010051863000160" },
  HU: { name: "Hungary", ibanLength: 28, bbanRegex: "[0-9]{3}[0-9]{4}[0-9]{1}[0-9]{15}[0-9]{1}", sepa: true, bank: { start: 1, end: 3 }, branch: { start: 4, end: 7 }, example: "HU42117730161111101800000000" },
  IE: { name: "Ireland", ibanLength: 22, bbanRegex: "[A-Z]{4}[0-9]{6}[0-9]{8}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 10 }, example: "IE29AIBK93115212345678" },
  IL: { name: "Israel", ibanLength: 23, bbanRegex: "[0-9]{3}[0-9]{3}[0-9]{13}", sepa: false, bank: { start: 1, end: 3 }, branch: { start: 4, end: 6 }, example: "IL620108000000099999999" },
  IQ: { name: "Iraq", ibanLength: 23, bbanRegex: "[A-Z]{4}[0-9]{3}[0-9]{12}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 7 }, example: "IQ98NBIQ850123456789012" },
  IS: { name: "Iceland", ibanLength: 26, bbanRegex: "[0-9]{4}[0-9]{2}[0-9]{6}[0-9]{10}", sepa: true, bank: { start: 1, end: 2 }, branch: { start: 3, end: 4 }, example: "IS140159260076545510730339" },
  IT: { name: "Italy", ibanLength: 27, bbanRegex: "[A-Z]{1}[0-9]{5}[0-9]{5}[A-Z0-9]{12}", sepa: true, bank: { start: 2, end: 6 }, branch: { start: 7, end: 11 }, example: "IT60X0542811101000000123456" },
  JO: { name: "Jordan", ibanLength: 30, bbanRegex: "[A-Z]{4}[0-9]{4}[A-Z0-9]{18}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "JO94CBJO0010000000000131000302" },
  KW: { name: "Kuwait", ibanLength: 30, bbanRegex: "[A-Z]{4}[A-Z0-9]{22}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "KW81CBKU0000000000001234560101" },
  KZ: { name: "Kazakhstan", ibanLength: 20, bbanRegex: "[0-9]{3}[A-Z0-9]{13}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "KZ86125KZT5004100100" },
  LB: { name: "Lebanon", ibanLength: 28, bbanRegex: "[0-9]{4}[A-Z0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "LB62099900000001001901229114" },
  LC: { name: "Saint Lucia", ibanLength: 32, bbanRegex: "[A-Z]{4}[A-Z0-9]{24}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "LC55HEMM000100010012001200023015" },
  LI: { name: "Liechtenstein", ibanLength: 21, bbanRegex: "[0-9]{5}[A-Z0-9]{12}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "LI21088100002324013AA" },
  LT: { name: "Lithuania", ibanLength: 20, bbanRegex: "[0-9]{5}[0-9]{11}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "LT121000011101001000" },
  LU: { name: "Luxembourg", ibanLength: 20, bbanRegex: "[0-9]{3}[A-Z0-9]{13}", sepa: true, bank: { start: 1, end: 3 }, branch: null, example: "LU280019400644750000" },
  LV: { name: "Latvia", ibanLength: 21, bbanRegex: "[A-Z]{4}[A-Z0-9]{13}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "LV80BANK0000435195001" },
  LY: { name: "Libya", ibanLength: 25, bbanRegex: "[0-9]{3}[0-9]{3}[0-9]{15}", sepa: false, bank: { start: 1, end: 3 }, branch: { start: 4, end: 6 }, example: "LY83002048000020100120361" },
  MC: { name: "Monaco", ibanLength: 27, bbanRegex: "[0-9]{5}[0-9]{5}[A-Z0-9]{11}[0-9]{2}", sepa: true, bank: { start: 1, end: 5 }, branch: { start: 6, end: 10 }, example: "MC5811222000010123456789030" },
  MD: { name: "Moldova, Republic of", ibanLength: 24, bbanRegex: "[A-Z0-9]{2}[A-Z0-9]{18}", sepa: false, bank: { start: 1, end: 2 }, branch: null, example: "MD24AG000225100013104168" },
  ME: { name: "Montenegro", ibanLength: 22, bbanRegex: "[0-9]{3}[0-9]{13}[0-9]{2}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "ME25505000012345678951" },
  MK: { name: "North Macedonia", ibanLength: 19, bbanRegex: "[0-9]{3}[A-Z0-9]{10}[0-9]{2}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "MK07250120000058984" },
  MN: { name: "Mongolia", ibanLength: 20, bbanRegex: "[0-9]{4}[0-9]{12}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "MN121234123456789123" },
  MR: { name: "Mauritania", ibanLength: 27, bbanRegex: "[0-9]{5}[0-9]{5}[0-9]{11}[0-9]{2}", sepa: false, bank: { start: 1, end: 5 }, branch: { start: 6, end: 10 }, example: "MR1300020001010000123456753" },
  MT: { name: "Malta", ibanLength: 31, bbanRegex: "[A-Z]{4}[0-9]{5}[A-Z0-9]{18}", sepa: true, bank: { start: 1, end: 4 }, branch: { start: 5, end: 9 }, example: "MT84MALT011000012345MTLCAST001S" },
  MU: { name: "Mauritius", ibanLength: 30, bbanRegex: "[A-Z]{4}[0-9]{2}[0-9]{2}[0-9]{12}[0-9]{3}[A-Z]{3}", sepa: false, bank: { start: 1, end: 6 }, branch: { start: 7, end: 8 }, example: "MU17BOMM0101101030300200000MUR" },
  NI: { name: "Nicaragua", ibanLength: 28, bbanRegex: "[A-Z]{4}[0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "NI45BAPR00000013000003558124" },
  NL: { name: "Netherlands (The)", ibanLength: 18, bbanRegex: "[A-Z]{4}[0-9]{10}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "NL91ABNA0417164300" },
  NO: { name: "Norway", ibanLength: 15, bbanRegex: "[0-9]{4}[0-9]{6}[0-9]{1}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "NO9386011117947" },
  OM: { name: "Oman", ibanLength: 23, bbanRegex: "[0-9]{3}[A-Z0-9]{16}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "OM810180000001299123456" },
  PK: { name: "Pakistan", ibanLength: 24, bbanRegex: "[A-Z]{4}[A-Z0-9]{16}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "PK36SCBL0000001123456702" },
  PL: { name: "Poland", ibanLength: 28, bbanRegex: "[0-9]{8}[0-9]{16}", sepa: true, bank: { start: 1, end: 8 }, branch: null, example: "PL61109010140000071219812874" },
  PS: { name: "Palestine, State of", ibanLength: 29, bbanRegex: "[A-Z]{4}[A-Z0-9]{21}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "PS92PALS000000000400123456702" },
  PT: { name: "Portugal", ibanLength: 25, bbanRegex: "[0-9]{4}[0-9]{4}[0-9]{11}[0-9]{2}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "PT50000201231234567890154" },
  QA: { name: "Qatar", ibanLength: 29, bbanRegex: "[A-Z]{4}[A-Z0-9]{21}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "QA58DOHB00001234567890ABCDEFG" },
  RO: { name: "Romania", ibanLength: 24, bbanRegex: "[A-Z]{4}[A-Z0-9]{16}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "RO49AAAA1B31007593840000" },
  RS: { name: "Serbia", ibanLength: 22, bbanRegex: "[0-9]{3}[0-9]{13}[0-9]{2}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "RS35260005601001611379" },
  RU: { name: "Russian Federation", ibanLength: 33, bbanRegex: "[0-9]{9}[0-9]{5}[A-Z0-9]{15}", sepa: false, bank: { start: 1, end: 9 }, branch: { start: 10, end: 14 }, example: "RU0304452522540817810538091310419" },
  SA: { name: "Saudi Arabia", ibanLength: 24, bbanRegex: "[0-9]{2}[A-Z0-9]{18}", sepa: false, bank: { start: 1, end: 2 }, branch: null, example: "SA0380000000608010167519" },
  SC: { name: "Seychelles", ibanLength: 31, bbanRegex: "[A-Z]{4}[0-9]{2}[0-9]{2}[0-9]{16}[A-Z]{3}", sepa: false, bank: { start: 1, end: 6 }, branch: { start: 7, end: 8 }, example: "SC18SSCB11010000000000001497USD" },
  SD: { name: "Sudan", ibanLength: 18, bbanRegex: "[0-9]{2}[0-9]{12}", sepa: false, bank: { start: 1, end: 2 }, branch: null, example: "SD2129010501234001" },
  SE: { name: "Sweden", ibanLength: 24, bbanRegex: "[0-9]{3}[0-9]{16}[0-9]{1}", sepa: true, bank: { start: 1, end: 3 }, branch: null, example: "SE4550000000058398257466" },
  SI: { name: "Slovenia", ibanLength: 19, bbanRegex: "[0-9]{5}[0-9]{8}[0-9]{2}", sepa: true, bank: { start: 1, end: 5 }, branch: null, example: "SI56263300012039086" },
  SK: { name: "Slovakia", ibanLength: 24, bbanRegex: "[0-9]{4}[0-9]{6}[0-9]{10}", sepa: true, bank: { start: 1, end: 4 }, branch: null, example: "SK3112000000198742637541" },
  SM: { name: "San Marino", ibanLength: 27, bbanRegex: "[A-Z]{1}[0-9]{5}[0-9]{5}[A-Z0-9]{12}", sepa: true, bank: { start: 2, end: 6 }, branch: { start: 7, end: 11 }, example: "SM86U0322509800000000270100" },
  SO: { name: "Somalia", ibanLength: 23, bbanRegex: "[0-9]{4}[0-9]{3}[0-9]{12}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 7 }, example: "SO211000001001000100141" },
  ST: { name: "Sao Tome and Principe", ibanLength: 25, bbanRegex: "[0-9]{4}[0-9]{4}[0-9]{11}[0-9]{2}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "ST23000100010051845310146" },
  SV: { name: "El Salvador", ibanLength: 28, bbanRegex: "[A-Z]{4}[0-9]{20}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "SV62CENR00000000000000700025" },
  TL: { name: "Timor-Leste", ibanLength: 23, bbanRegex: "[0-9]{3}[0-9]{14}[0-9]{2}", sepa: false, bank: { start: 1, end: 3 }, branch: null, example: "TL380080012345678910157" },
  TN: { name: "Tunisia", ibanLength: 24, bbanRegex: "[0-9]{2}[0-9]{3}[0-9]{13}[0-9]{2}", sepa: false, bank: { start: 1, end: 2 }, branch: { start: 3, end: 5 }, example: "TN5910006035183598478831" },
  TR: { name: "Turkiye", ibanLength: 26, bbanRegex: "[0-9]{5}[0-9]{1}[A-Z0-9]{16}", sepa: false, bank: { start: 1, end: 5 }, branch: null, example: "TR330006100519786457841326" },
  UA: { name: "Ukraine", ibanLength: 29, bbanRegex: "[0-9]{6}[A-Z0-9]{19}", sepa: false, bank: { start: 1, end: 6 }, branch: null, example: "UA213223130000026007233566001" },
  VA: { name: "Holy See", ibanLength: 22, bbanRegex: "[0-9]{3}[0-9]{15}", sepa: true, bank: { start: 1, end: 3 }, branch: null, example: "VA59001123000012345678" },
  VG: { name: "Virgin Islands (British)", ibanLength: 24, bbanRegex: "[A-Z]{4}[0-9]{16}", sepa: false, bank: { start: 1, end: 4 }, branch: null, example: "VG96VPVG0000012345678901" },
  XK: { name: "Kosovo", ibanLength: 20, bbanRegex: "[0-9]{4}[0-9]{10}[0-9]{2}", sepa: false, bank: { start: 1, end: 2 }, branch: { start: 3, end: 4 }, example: "XK051212012345678906" },
  YE: { name: "Yemen", ibanLength: 30, bbanRegex: "[A-Z]{4}[0-9]{4}[A-Z0-9]{18}", sepa: false, bank: { start: 1, end: 4 }, branch: { start: 5, end: 8 }, example: "YE15CBYE0001018861234567891234" },
};
