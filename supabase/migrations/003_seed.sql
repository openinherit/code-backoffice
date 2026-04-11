-- ============================================================
-- 003_seed.sql — Seed data
-- 21 extensions, 7 shared definitions, Scotland property groups
-- ============================================================

-- ----------------------------------------------------------
-- Extensions (from extensions-registry.json)
-- ----------------------------------------------------------

INSERT INTO extensions (slug, name, legal_tradition, extension_type, key_features, maturity, schema_path, metadata) VALUES

-- Core — Stable
('uk-england-wales', 'UK England & Wales', 'Common law', 'geographic',
 'IHT nil-rate band, residence nil-rate band, probate registry integration, deed of variation',
 'stable', 'v3/extensions/uk-england-wales/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "comprehensive", "applicableJurisdictions": ["GB-ENG", "GB-WLS"]}'::jsonb),

-- Core — Candidate
('us-estate', 'US Estate', 'Common law', 'geographic',
 'Federal estate tax, state estate/inheritance tax, community property, elective share, SECURE Act retirement rules, probate variation (UPC), trust features (QTIP/dynasty), ancillary probate, advance directives',
 'candidate', 'v3/extensions/us-estate/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "comprehensive", "applicableJurisdictions": ["US"]}'::jsonb),

('australia-nz', 'Australia & New Zealand', 'Common law', 'geographic',
 'State/territory variation, family provision claims, superannuation death benefits',
 'candidate', 'v3/extensions/australia-nz/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["AU", "NZ"]}'::jsonb),

('brazil', 'Brazil', 'Civil law', 'geographic',
 'Legítima (forced heirship 50%), meação (spousal share), ITCMD state tax, inventário/arrolamento',
 'candidate', 'v3/extensions/brazil/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["BR"]}'::jsonb),

('eu-succession', 'EU Succession', 'Mixed civil law', 'geographic',
 'EU Regulation 650/2012, European Certificate of Succession, habitual residence rule, choice-of-law',
 'candidate', 'v3/extensions/eu-succession/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]}'::jsonb),

('israel', 'Israel', 'Mixed statutory', 'geographic',
 'Inheritance Law 1965, religious court jurisdiction, mutual wills, inheritance tax (abolished/reinstated)',
 'candidate', 'v3/extensions/israel/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["IL"]}'::jsonb),

('japan', 'Japan', 'Civil law', 'geographic',
 'Forced heirship (iryubun), family court mediation, inheritance tax brackets, agricultural succession',
 'candidate', 'v3/extensions/japan/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["JP"]}'::jsonb),

('scotland', 'Scotland', 'Mixed civil / common', 'geographic',
 'Legal rights (jus relictae/relicti), confirmation, intestacy (2024 Act), heritable/moveable classification, executry, survivorship destinations, crofting succession, LBTT, cohabitation claims',
 'candidate', 'v3/extensions/scotland/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "partial", "applicableJurisdictions": ["GB-SCT"]}'::jsonb),

('africa-customary', 'Africa Customary Succession', 'Customary / statutory', 'tradition',
 'Customary law succession, statutory overlay, communal land tenure, widow/widower protection reforms',
 'candidate', 'v3/extensions/africa-customary/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "outline", "applicableJurisdictions": ["ZA", "NG", "GH", "KE", "TZ", "UG"]}'::jsonb),

('islamic-succession', 'Islamic Succession', 'Islamic (Sharia)', 'tradition',
 'Fixed-share inheritance (fara''id), wasiyyah (bequest limit 1/3), awl/radd calculation, madhab variation',
 'candidate', 'v3/extensions/islamic-succession/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "outline", "applicableJurisdictions": ["SG", "MY", "ID", "AE", "SA", "PK", "BD", "GB", "US", "AU", "CA"]}'::jsonb),

-- Core — Draft
('hindu-succession', 'Hindu Succession', 'Hindu customary', 'tradition',
 'Mitakshara coparcenary, Dayabhaga principles, 2005 amendment equal daughter rights, HUF property',
 'draft', 'v3/extensions/hindu-succession/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "outline", "applicableJurisdictions": ["IN", "NP", "LK", "MY", "SG", "GB", "US", "AU", "CA"]}'::jsonb),

('jewish-succession', 'Jewish Succession', 'Jewish (Halakha)', 'tradition',
 'Bechor (firstborn) share, matanah (gift) structures, halachic will mechanisms, beit din jurisdiction',
 'draft', 'v3/extensions/jewish-succession/',
 '{"tier": "core", "successionCoverage": "comprehensive", "taxCoverage": "outline", "applicableJurisdictions": ["IL", "GB", "US", "CA", "AU", "FR"]}'::jsonb),

('canada', 'Canada', 'Common / civil (QC)', 'geographic',
 'Provincial probate fees, deemed disposition on death, Quebec civil code forced heirship',
 'draft', 'v3/extensions/canada/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["CA"]}'::jsonb),

('hong-kong', 'Hong Kong', 'Common law', 'geographic',
 'Intestacy ordinance, no estate duty (abolished 2006), MPF death benefit nomination',
 'draft', 'v3/extensions/hong-kong/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["HK"]}'::jsonb),

('india', 'India', 'Mixed statutory', 'geographic',
 'Hindu Succession Act coparcenary, Muslim personal law, Indian Succession Act, stamp duty variation',
 'draft', 'v3/extensions/india/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["IN"]}'::jsonb),

('ireland', 'Ireland', 'Common law', 'geographic',
 'Legal right share, CAT thresholds, Probate Office requirements, dwelling house exemption',
 'draft', 'v3/extensions/ireland/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["IE"]}'::jsonb),

('latin-america', 'Latin America', 'Civil law', 'geographic',
 'Forced heirship (legítima), mejora (improvement share), notarial succession, country-specific variation',
 'draft', 'v3/extensions/latin-america/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["BR", "AR", "MX", "CO", "CL", "PE"]}'::jsonb),

('prc-china', 'PRC China', 'Civil law (socialist)', 'geographic',
 'Civil Code Book 6, statutory succession order, notarised wills, rural land use rights',
 'draft', 'v3/extensions/prc-china/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["CN"]}'::jsonb),

('singapore-malaysia', 'Singapore & Malaysia', 'Common law / Islamic', 'hybrid',
 'Intestate Succession Act, Syariah court for Muslim estates, CPF nomination, distribution certificates',
 'draft', 'v3/extensions/singapore-malaysia/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["SG", "MY"]}'::jsonb),

('switzerland', 'Switzerland', 'Civil law', 'geographic',
 '2023 revised forced heirship rules, cantonal succession tax variation, usufruct rights',
 'draft', 'v3/extensions/switzerland/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["CH"]}'::jsonb),

('uae', 'UAE', 'Islamic / common (DIFC)', 'geographic',
 'Sharia default rules, DIFC Wills Service Centre, free zone asset treatment, non-Muslim will registration',
 'draft', 'v3/extensions/uae/',
 '{"tier": "core", "successionCoverage": "partial", "taxCoverage": "outline", "applicableJurisdictions": ["AE"]}'::jsonb);


-- ----------------------------------------------------------
-- Shared definitions (from v3/common/)
-- ----------------------------------------------------------

INSERT INTO shared_definitions (name, description, schema_definition, field_summary) VALUES

('money.json', 'Monetary amount with currency code',
 '{"type": "object", "properties": {"amount": {"type": "number"}, "currency": {"type": "string", "pattern": "^[A-Z]{3}$"}}, "required": ["amount", "currency"], "additionalProperties": false}'::jsonb,
 'amount (number), currency (ISO 4217 3-letter code)'),

('temporal-rule.json', 'A rule or threshold that changes over time — captures effective dates and values',
 '{"type": "object", "properties": {"effectiveFrom": {"type": "string", "format": "date"}, "effectiveTo": {"type": "string", "format": "date"}, "value": {}, "description": {"type": "string"}, "legislativeReference": {"type": "string"}}, "required": ["effectiveFrom"], "additionalProperties": false}'::jsonb,
 'effectiveFrom (date), effectiveTo (date, optional), value (any), description (string), legislativeReference (string)'),

('date-range.json', 'A date range with optional start and end',
 '{"type": "object", "properties": {"start": {"type": "string", "format": "date"}, "end": {"type": "string", "format": "date"}}, "additionalProperties": false}'::jsonb,
 'start (date, optional), end (date, optional)'),

('percentage.json', 'A percentage value (0–100)',
 '{"type": "object", "properties": {"value": {"type": "number", "minimum": 0, "maximum": 100}}, "required": ["value"], "additionalProperties": false}'::jsonb,
 'value (number, 0–100)'),

('address.json', 'Postal address with country code',
 '{"type": "object", "properties": {"line1": {"type": "string"}, "line2": {"type": "string"}, "city": {"type": "string"}, "region": {"type": "string"}, "postalCode": {"type": "string"}, "country": {"type": "string", "pattern": "^[A-Z]{2}$"}}, "required": ["country"], "additionalProperties": false}'::jsonb,
 'line1, line2, city, region, postalCode, country (ISO 3166-1 alpha-2)'),

('identifier.json', 'A typed identifier (e.g. tax reference, case number)',
 '{"type": "object", "properties": {"type": {"type": "string"}, "value": {"type": "string"}, "issuingAuthority": {"type": "string"}, "issuedDate": {"type": "string", "format": "date"}}, "required": ["type", "value"], "additionalProperties": false}'::jsonb,
 'type (string), value (string), issuingAuthority (string, optional), issuedDate (date, optional)'),

('provenance.json', 'Data provenance — who provided this data and when',
 '{"type": "object", "properties": {"source": {"type": "string"}, "providedBy": {"type": "string"}, "providedAt": {"type": "string", "format": "date-time"}, "confidence": {"type": "string", "enum": ["verified", "stated", "estimated", "unknown"]}, "notes": {"type": "string"}}, "required": ["source"], "additionalProperties": false}'::jsonb,
 'source (string), providedBy (string), providedAt (datetime), confidence (enum), notes (string)');


-- ----------------------------------------------------------
-- Property groups for Scotland (succession coverage areas)
-- ----------------------------------------------------------

INSERT INTO property_groups (extension_id, coverage_area, name, description, display_order) VALUES

('scotland', 'succession', 'Legal Rights & Entitlements', 'Prior rights (dwelling, furniture, financial provision) and legal rights (jus relictae/relicti, legitim) under the Succession (Scotland) Act 1964', 1),

('scotland', 'succession', 'Intestacy', 'Intestacy rules under the Succession (Scotland) Act 1964 as amended by the Trusts and Succession (Scotland) Act 2024 — ranking order, partial intestacy, free estate distribution', 2),

('scotland', 'succession', 'Property Classification', 'Heritable vs moveable classification of estate items — legal rights apply only to moveables; survivorship destinations and their evacuation', 3),

('scotland', 'succession', 'Administration', 'Confirmation (Scottish probate), executry appointments (nominate, dative, creditor), bond of caution, Sheriff Court jurisdiction, small estate procedure', 4),

('scotland', 'succession', 'Will & Testamentary', 'Scottish will formalities under Requirements of Writing (Scotland) Act 1995 — attestation, holograph wills, notarial execution, registration with Register of Deeds', 5),

('scotland', 'succession', 'Special Succession', 'Crofting succession under Crofters (Scotland) Act 1993, cohabitation claims under Family Law (Scotland) Act 2006 s.29, LBTT implications, forced heirship position', 6);
