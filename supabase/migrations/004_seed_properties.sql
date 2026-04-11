-- Seed properties from the actual standard repo schemas
-- Scotland, UK England & Wales, Ireland

-- ============================================================
-- Property groups for UK England & Wales
-- ============================================================
INSERT INTO property_groups (extension_id, coverage_area, name, description, display_order) VALUES
  ('uk-england-wales', 'succession', 'Inheritance Tax', 'Nil-rate bands, transferable allowances, and IHT rates', 1),
  ('uk-england-wales', 'succession', 'Intestacy & Family Provision', 'Statutory legacy, intestacy rules, IFPA 1975 claims', 2),
  ('uk-england-wales', 'succession', 'Property & Tenure', 'Local property types, tenure types, and grant types', 3),
  ('uk-england-wales', 'succession', 'Cohabitation', 'Rights and eligibility for unmarried partners', 4),
  ('uk-england-wales', 'succession', 'Legislative Changes', 'Tracked changes to succession legislation', 5),
  ('uk-england-wales', 'tax', 'Inheritance Tax', 'IHT nil-rate band, RNRB, transferable NRB, main rate', 1);

-- Property groups for Ireland
INSERT INTO property_groups (extension_id, coverage_area, name, description, display_order) VALUES
  ('ireland', 'succession', 'Spousal Rights', 'Legal right share and civil partnership provisions', 1),
  ('ireland', 'succession', 'Children & Dependants', 'Section 117 moral duty, section 56 advancement', 2),
  ('ireland', 'succession', 'Intestacy', 'Distribution under Part VI of the Succession Act 1965', 3),
  ('ireland', 'succession', 'Probate & Administration', 'Probate Office, enduring power of attorney', 4),
  ('ireland', 'succession', 'Legislative Changes', 'Tracked changes to Irish succession legislation', 5),
  ('ireland', 'tax', 'Capital Acquisitions Tax', 'CAT thresholds, dwelling house exemption', 1);

-- Scotland tax group
INSERT INTO property_groups (extension_id, coverage_area, name, description, display_order) VALUES
  ('scotland', 'tax', 'Land & Buildings Transaction Tax', 'LBTT succession exemption and related provisions', 1);

-- ============================================================
-- Scotland succession properties (11 properties)
-- ============================================================
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'scotland', pg.id, 'succession', v.name, v.description, v.schema_type, v.schema_def::jsonb
FROM (VALUES
  ('Legal Rights & Entitlements', 'priorRights', 'Surviving spouse/civil partner rights — dwellinghouse, furniture, financial provision (ss.8-9)', 'object', '{"type":"object","properties":{"dwellinghouse":{"type":"object"},"furniture":{"type":"object"},"financialProvision":{"type":"object"}},"additionalProperties":false}'),
  ('Legal Rights & Entitlements', 'legalRights', 'Jus relictae/relicti (spouse) and legitim (children) — fixed fractions of moveable estate', 'object', '{"type":"object","properties":{"jusRelictae":{"type":"object"},"legitim":{"type":"object"},"dischargeStatus":{"type":"string"}},"additionalProperties":false}'),
  ('Legal Rights & Entitlements', 'cohabitationClaim', 'Claims by cohabitants under Family Law (Scotland) Act 2006 s.29 — 12-month deadline', 'object', '{"type":"object","properties":{"eligible":{"type":"boolean"},"claimDeadlineMonths":{"type":"integer"},"courtDiscretion":{"type":"boolean"}},"additionalProperties":false}'),
  ('Legal Rights & Entitlements', 'forcedHeirship', 'Whether the will attempts to defeat legal rights — discharge status', 'object', '{"type":"object","properties":{"applies":{"type":"boolean"},"scope":{"type":"string"},"defeatable":{"type":"boolean"}},"additionalProperties":false}'),
  ('Intestacy', 'intestacy', 'Full calculation — prior rights, legal rights, free estate distribution. Pre/post 2024 Act.', 'object', '{"type":"object","properties":{"priorRightsClaimed":{"type":"boolean"},"legalRightsClaimed":{"type":"boolean"},"freeEstateDistribution":{"type":"object"},"applicableAct":{"type":"string","enum":["1964_act","2024_act"]},"rankingOrder":{"type":"array"},"partialIntestacy":{"type":"boolean"},"freeEstateOrder":{"type":"array"},"deadsBenefitExclusions":{"type":"array"}},"additionalProperties":false}'),
  ('Property Classification', 'heritableMoveableClassifications', 'Each asset classified as heritable or moveable — legal rights apply only to moveables', 'array', '{"type":"array","items":{"type":"object","properties":{"assetId":{"type":"string"},"classification":{"type":"string","enum":["heritable","moveable"]}}},"maxItems":500}'),
  ('Property Classification', 'survivorshipDestinations', 'Properties with special destinations — pass outside the estate', 'array', '{"type":"array","items":{"type":"object","properties":{"propertyId":{"type":"string"},"destination":{"type":"string"},"evacuable":{"type":"boolean"}}},"maxItems":50}'),
  ('Administration', 'confirmation', 'Scottish equivalent of probate — granted by the Sheriff Court', 'object', '{"type":"object","properties":{"sheriffCourt":{"type":"string"},"confirmationType":{"type":"string","enum":["confirmation","small_estate_certificate","eik_confirmation"]},"inventoryValue":{"$ref":"../../common/money.json"},"smallEstateThreshold":{"$ref":"../../common/temporal-rule.json"}},"additionalProperties":false}'),
  ('Administration', 'executryAppointments', 'Executor types — nominate, dative, creditor. Bond of caution details.', 'array', '{"type":"array","items":{"type":"object","properties":{"type":{"type":"string","enum":["nominate","dative","creditor"]},"name":{"type":"string"},"bondOfCaution":{"type":"boolean"}}},"maxItems":20}'),
  ('Will & Testamentary', 'willFormalities', 'Attested, holograph, or notarial execution. One witness. Marriage does not revoke.', 'object', '{"type":"object","properties":{"executionType":{"type":"string","enum":["attested","holograph","notarial"]},"witnessesRequired":{"type":"integer"},"marriageRevokes":{"type":"boolean"}},"additionalProperties":false}'),
  ('Special Succession', 'croftingSuccession', 'Crofting tenancy succession — landlord notification, Crofting Commission approval', 'object', '{"type":"object","properties":{"isCroft":{"type":"boolean"},"tenancyType":{"type":"string"},"bequeathable":{"type":"boolean"},"nomineeRequired":{"type":"boolean"},"landlordNotification":{"type":"boolean"},"croftingCommissionApproval":{"type":"boolean"},"deadlineMonths":{"type":"integer"}},"additionalProperties":false}')
) AS v(group_name, name, description, schema_type, schema_def)
JOIN property_groups pg ON pg.extension_id = 'scotland' AND pg.coverage_area = 'succession' AND pg.name = v.group_name;

-- Scotland tax property (1)
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'scotland', pg.id, 'tax', 'lbttExemption', 'LBTT succession exemption under LBTT(S) Act 2013 — estate transfers exempt', 'object', '{"type":"object","properties":{"exempt":{"type":"boolean"},"additionalDwellingSupplement":{"type":"boolean"},"exemptionBasis":{"type":"string"}},"additionalProperties":false}'::jsonb
FROM property_groups pg WHERE pg.extension_id = 'scotland' AND pg.coverage_area = 'tax' AND pg.name = 'Land & Buildings Transaction Tax';

-- ============================================================
-- UK England & Wales succession properties (7)
-- ============================================================
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'uk-england-wales', pg.id, 'succession', v.name, v.description, v.schema_type, v.schema_def::jsonb
FROM (VALUES
  ('Intestacy & Family Provision', 'intestacyStatutoryLegacy', 'Statutory legacy under AEA 1925. As of 2023: £322,000', '$ref', '{"$ref":"../../common/temporal-rule.json","description":"Statutory legacy amount"}'),
  ('Intestacy & Family Provision', 'ifpa1975Eligible', 'Persons eligible to claim under IFPA 1975', 'array', '{"type":"array","items":{"type":"object","properties":{"category":{"type":"string"},"relationship":{"type":"string"}}},"maxItems":20}'),
  ('Cohabitation', 'cohabitantRights', 'Cohabitant rights eligibility and statute reference', 'object', '{"type":"object","properties":{"eligible":{"type":"boolean"},"statute":{"type":"string"},"claimBasis":{"type":"string"}},"additionalProperties":false}'),
  ('Property & Tenure', 'localPropertyTypes', 'Maps each property to its local E&W property type', 'array', '{"type":"array","items":{"type":"object","properties":{"propertyId":{"type":"string"},"localType":{"type":"string"}}},"maxItems":500}'),
  ('Property & Tenure', 'localTenureTypes', 'Maps each property to its local E&W tenure type', 'array', '{"type":"array","items":{"type":"object","properties":{"propertyId":{"type":"string"},"tenureType":{"type":"string","enum":["freehold","leasehold","commonhold"]}}},"maxItems":500}'),
  ('Property & Tenure', 'localGrantTypes', 'Maps each executor to the local E&W grant type', 'array', '{"type":"array","items":{"type":"object","properties":{"executorId":{"type":"string"},"grantType":{"type":"string","enum":["probate","letters_of_administration","letters_of_administration_with_will"]}}},"maxItems":20}'),
  ('Legislative Changes', 'legislativeChanges', 'Tracked changes to E&W succession legislation', 'array', '{"type":"array","items":{"type":"object","properties":{"name":{"type":"string"},"status":{"type":"string","enum":["enacted","proposed","repealed"]},"effectiveDate":{"type":"string","format":"date"}}}}')
) AS v(group_name, name, description, schema_type, schema_def)
JOIN property_groups pg ON pg.extension_id = 'uk-england-wales' AND pg.coverage_area = 'succession' AND pg.name = v.group_name;

-- UK E&W tax properties (4)
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'uk-england-wales', pg.id, 'tax', v.name, v.description, v.schema_type, v.schema_def::jsonb
FROM (VALUES
  ('Inheritance Tax', 'nilRateBand', 'IHT nil-rate band — frozen at £325,000 since 2009', '$ref', '{"$ref":"../../common/temporal-rule.json","description":"IHT nil-rate band"}'),
  ('Inheritance Tax', 'residenceNilRateBand', 'RNRB (main residence) — currently £175,000', '$ref', '{"$ref":"../../common/temporal-rule.json","description":"Residence nil-rate band"}'),
  ('Inheritance Tax', 'transferableNilRateBand', 'Whether unused NRB of predeceased spouse is available for transfer', 'boolean', '{"type":"boolean","description":"Transferable nil-rate band available"}'),
  ('Inheritance Tax', 'inheritanceTaxRate', 'Main IHT rate — currently 40%', '$ref', '{"$ref":"../../common/temporal-rule.json","description":"Main IHT rate"}')
) AS v(group_name, name, description, schema_type, schema_def)
JOIN property_groups pg ON pg.extension_id = 'uk-england-wales' AND pg.coverage_area = 'tax' AND pg.name = v.group_name;

-- ============================================================
-- Ireland succession properties (7)
-- ============================================================
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'ireland', pg.id, 'succession', v.name, v.description, v.schema_type, v.schema_def::jsonb
FROM (VALUES
  ('Spousal Rights', 'spouseLegalRightShare', 'Spouse legal right share under Succession Act 1965 s.111 — 1/3 with children, 1/2 without', 'object', '{"type":"object","properties":{"withChildren":{"type":"string"},"withoutChildren":{"type":"string"},"civilPartnerIncluded":{"type":"boolean"}},"additionalProperties":false}'),
  ('Spousal Rights', 'civilPartnershipProvisions', 'Civil Partnership Act 2010 provisions for cohabitants', 'object', '{"type":"object","properties":{"civilPartnerRights":{"type":"boolean"},"cohabitantRedressScheme":{"type":"boolean"}},"additionalProperties":false}'),
  ('Children & Dependants', 'section117Claim', 'Section 117 moral duty — court can order provision if testator failed in moral duty', 'object', '{"type":"object","properties":{"applicable":{"type":"boolean"},"moralDutyTest":{"type":"string"},"courtDiscretion":{"type":"boolean"}},"additionalProperties":false}'),
  ('Children & Dependants', 'section56Advancement', 'Lifetime gifts to children brought into account on intestacy', 'object', '{"type":"object","properties":{"advancementMade":{"type":"boolean"},"amount":{"$ref":"../../common/money.json"}},"additionalProperties":false}'),
  ('Intestacy', 'intestacyRules', 'Distribution under Part VI of the Succession Act 1965', 'object', '{"type":"object","properties":{"distributionOrder":{"type":"array"},"spouseShare":{"type":"string"},"childrenShare":{"type":"string"}},"additionalProperties":false}'),
  ('Probate & Administration', 'probateProcess', 'Irish probate — Probate Office or District Probate Registry', 'object', '{"type":"object","properties":{"grantType":{"type":"string","enum":["probate","administration","administration_with_will"]},"office":{"type":"string"}},"additionalProperties":false}'),
  ('Probate & Administration', 'enduringPowerOfAttorney', 'Irish EPA — must be registered with the court before use', 'object', '{"type":"object","properties":{"registered":{"type":"boolean"},"registrationDate":{"type":"string","format":"date"}},"additionalProperties":false}')
) AS v(group_name, name, description, schema_type, schema_def)
JOIN property_groups pg ON pg.extension_id = 'ireland' AND pg.coverage_area = 'succession' AND pg.name = v.group_name;

-- Ireland tax properties (2)
INSERT INTO properties (extension_id, group_id, coverage_area, name, description, schema_type, schema_definition)
SELECT 'ireland', pg.id, 'tax', v.name, v.description, v.schema_type, v.schema_def::jsonb
FROM (VALUES
  ('Capital Acquisitions Tax', 'capitalAcquisitionsTax', 'CAT thresholds — Group A (child) €335,000, Group B (sibling) €32,500, Group C (other) €16,250', 'object', '{"type":"object","properties":{"groupAThreshold":{"$ref":"../../common/money.json"},"groupBThreshold":{"$ref":"../../common/money.json"},"groupCThreshold":{"$ref":"../../common/money.json"},"rate":{"type":"number"}},"additionalProperties":false}'),
  ('Capital Acquisitions Tax', 'dwellingHouseExemption', 'CAT s.86 dwelling house exemption — inherited home exempt if beneficiary lived there 3+ years', 'object', '{"type":"object","properties":{"eligible":{"type":"boolean"},"residenceRequirementYears":{"type":"integer"},"ownershipRestriction":{"type":"boolean"}},"additionalProperties":false}')
) AS v(group_name, name, description, schema_type, schema_def)
JOIN property_groups pg ON pg.extension_id = 'ireland' AND pg.coverage_area = 'tax' AND pg.name = v.group_name;
