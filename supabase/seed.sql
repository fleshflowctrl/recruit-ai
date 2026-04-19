-- Demo-seed voor RecruitAI (na migraties).
-- Voer uit in Supabase SQL Editor. Daarna: koppel auth-gebruiker aan bureau (zie onderaan).

BEGIN;

DELETE FROM berichten WHERE bureau_id = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM gesprekken WHERE bureau_id = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM plaatsingen WHERE bureau_id = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM campagne_kandidaten WHERE campagne_id = 'a0000001-0000-4000-8000-000000000004';
DELETE FROM campagnes WHERE id = 'a0000001-0000-4000-8000-000000000004';
DELETE FROM vacatures WHERE id = 'a0000001-0000-4000-8000-000000000003';
DELETE FROM kandidaten WHERE bureau_id = 'a0000001-0000-4000-8000-000000000001';
DELETE FROM opdrachtgevers WHERE id = 'a0000001-0000-4000-8000-000000000002';

INSERT INTO bureaus (id, naam, email, plan, credits_resterend, telefoon, telnyx_nummer)
VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Demo Uitzendbureau Amsterdam',
  'demo@recruitai.nl',
  'professional',
  150,
  '+31612345678',
  '+31850835335'
)
ON CONFLICT (id) DO UPDATE SET
  naam = EXCLUDED.naam,
  email = EXCLUDED.email,
  plan = EXCLUDED.plan,
  credits_resterend = EXCLUDED.credits_resterend,
  telefoon = EXCLUDED.telefoon,
  telnyx_nummer = EXCLUDED.telnyx_nummer;

INSERT INTO opdrachtgevers (id, bureau_id, naam, contactpersoon, sector, adres, telefoon, email)
VALUES (
  'a0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  'Metaalunie Rotterdam BV',
  'Jan de Vries',
  'Industrie',
  'Havenstraat 12, 3011 AA Rotterdam',
  '+31102345678',
  'contact@metaalunie-demo.nl'
);

INSERT INTO vacatures (
  id, bureau_id, opdrachtgever_id, titel, locatie,
  salaris_min, salaris_max, eisen, status, startdatum
)
VALUES (
  'a0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000002',
  'Lasser MIG/MAG Rotterdam',
  'Rotterdam',
  2800,
  3400,
  ARRAY['MIG/MAG diploma', 'Rijbewijs B']::text[],
  'open',
  CURRENT_DATE + 14
);

INSERT INTO kandidaten (id, bureau_id, naam, telefoon, email, status, sectoren, skills)
VALUES
  ('b0000001-0000-4000-8000-000000000001', 'a0000001-0000-4000-8000-000000000001', 'Jan de Vries', '+31611110001', 'jan@demo.nl', 'actief', ARRAY['Industrie'], ARRAY['Lassen']),
  ('b0000001-0000-4000-8000-000000000002', 'a0000001-0000-4000-8000-000000000001', 'Ahmed Yilmaz', '+31611110002', 'ahmed@demo.nl', 'geplaatst', ARRAY['Industrie'], ARRAY['Lassen']),
  ('b0000001-0000-4000-8000-000000000003', 'a0000001-0000-4000-8000-000000000001', 'Peter Bakker', '+31611110003', NULL, 'actief', ARRAY['Industrie'], ARRAY['MIG']),
  ('b0000001-0000-4000-8000-000000000004', 'a0000001-0000-4000-8000-000000000001', 'Maria Santos', '+31611110004', NULL, 'actief', ARRAY['Bouw'], ARRAY['TIG']),
  ('b0000001-0000-4000-8000-000000000005', 'a0000001-0000-4000-8000-000000000001', 'Tom van den Berg', '+31611110005', NULL, 'actief', ARRAY['Industrie'], ARRAY['Constructie']),
  ('b0000001-0000-4000-8000-000000000006', 'a0000001-0000-4000-8000-000000000001', 'Lisa Smit', '+31611110006', NULL, 'actief', ARRAY['Logistiek'], ARRAY['Heftruck']),
  ('b0000001-0000-4000-8000-000000000007', 'a0000001-0000-4000-8000-000000000001', 'Mohammed El Amin', '+31611110007', NULL, 'actief', ARRAY['Industrie'], ARRAY['Lassen']),
  ('b0000001-0000-4000-8000-000000000008', 'a0000001-0000-4000-8000-000000000001', 'Sandra Jansen', '+31611110008', NULL, 'actief', ARRAY['Metaal'], ARRAY['Constructie']),
  ('b0000001-0000-4000-8000-000000000009', 'a0000001-0000-4000-8000-000000000001', 'Remi Dubois', '+31611110009', NULL, 'actief', ARRAY['Industrie'], ARRAY['Lassen']),
  ('b0000001-0000-4000-8000-000000000010', 'a0000001-0000-4000-8000-000000000001', 'Erik Hofman', '+31611110010', NULL, 'actief', ARRAY['Productie'], ARRAY['CNC']);

INSERT INTO campagnes (
  id, bureau_id, vacature_id, naam, type, status,
  totaal_kandidaten, gebeld, geschikt, niet_geschikt, twijfel, geen_gehoor,
  screening_vragen
)
VALUES (
  'a0000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000003',
  'Screening Lasser Q2',
  'prescreening',
  'actief',
  5,
  5,
  2,
  1,
  1,
  1,
  '["Heeft u ervaring met MIG/MAG?","Bent u direct beschikbaar?"]'::jsonb
);

INSERT INTO campagne_kandidaten (campagne_id, kandidaat_id, status, bel_pogingen)
VALUES
  ('a0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000001', 'geschikt', 1),
  ('a0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000002', 'geschikt', 1),
  ('a0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000003', 'twijfel', 2),
  ('a0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000004', 'niet_geschikt', 1),
  ('a0000001-0000-4000-8000-000000000004', 'b0000001-0000-4000-8000-000000000005', 'geen_gehoor', 3);

INSERT INTO gesprekken (
  id, campagne_id, kandidaat_id, bureau_id, status, duur_seconden,
  score, aanbeveling, samenvatting, transcript,
  positieve_punten, negatieve_punten,
  antwoorden
) VALUES
(
  'c0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  'voltooid', 420, 9, 'GESCHIKT',
  'Ervaren lasser, direct beschikbaar, salaris past binnen range.',
  E'AI: Goedemiddag, mag ik uw ervaring met MIG/MAG kort horen?\nKandidaat: Ja, ik las twaalf jaar bij scheepsbouw, vooral dik plaatmateriaal.\nAI: Bent u per direct beschikbaar?\nKandidaat: Ja, mijn contract eindigde vorige week.\nAI: Hartelijk dank.',
  ARRAY['12 jaar ervaring', 'Certificaat aanwezig', 'Salaris realistisch'],
  ARRAY[]::text[],
  '{"Ervaring MIG/MAG":"12 jaar scheepsbouw","Beschikbaarheid":"Per direct","Salaris":"€3000 gewenst"}'::jsonb
),
(
  'c0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  'voltooid', 380, 8, 'GESCHIKT',
  'Goede technische basis, wil bijleren TIG.',
  E'AI: Heeft u MIG/MAG ervaring?\nKandidaat: Zeker, vijf jaar werkplaats Rotterdam.\nAI: Rijbewijs B?\nKandidaat: Ja, geldig.\nAI: Dank u wel.',
  ARRAY['Vijf jaar ervaring', 'Rijbewijs B'],
  ARRAY[]::text[],
  '{"MIG/MAG":"5 jaar","Rijbewijs":"B"}'::jsonb
),
(
  'c0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  'voltooid', 310, 6, 'TWIJFEL',
  'Technisch oké, twijfel over reisafstand (>45 km).',
  E'AI: Woont u in de buurt van Rotterdam?\nKandidaat: Ik woon in Zeeland, maar kan verhuizen over 3 maanden.\nAI: Dat is een aandachtspunt voor planning.\nKandidaat: Begrijp ik.',
  ARRAY['Technische kennis goed'],
  ARRAY['Reisafstand / verhuizing later'],
  '{"Woon-werk":">45 km"}'::jsonb
),
(
  'c0000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000001',
  'voltooid', 240, 4, 'NIET_GESCHIKT',
  'Geen MIG/MAG certificaat; alleen TIG ervaring.',
  E'AI: Welk lasproces beheerst u?\nKandidaat: Vooral TIG op dun plaat, geen MIG/MAG certificaat.\nAI: Voor deze rol is MIG/MAG verplicht.\nKandidaat: Oké, helaas.',
  ARRAY[]::text[],
  ARRAY['Geen MIG/MAG diploma'],
  '{"Certificaat":"Geen MIG/MAG"}'::jsonb
),
(
  'c0000001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000004',
  'b0000001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000001',
  'voltooid', 15, 0, 'NIET_GESCHIKT',
  'Kandidaat nam niet op na meerdere pogingen — laatste poging kort antwoordrobot.',
  E'AI: Hallo, u spreekt met...\n[verbinding verbroken]',
  ARRAY[]::text[],
  ARRAY['Geen gehoor / korte verbinding'],
  '{}'::jsonb
);

INSERT INTO plaatsingen (
  id, bureau_id, vacature_id, kandidaat_id, opdrachtgever_id,
  startdatum, einddatum, uurtarief_kandidaat, uurtarief_opdrachtgever, status
)
VALUES
(
  'p0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000003',
  'b0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000002',
  CURRENT_DATE + 10,
  CURRENT_DATE + 120,
  28.50,
  42.00,
  'bevestigd'
),
(
  'p0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000003',
  'b0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000002',
  CURRENT_DATE + 17,
  CURRENT_DATE + 180,
  27.00,
  41.00,
  'bevestigd_door_kandidaat'
);

INSERT INTO berichten (id, bureau_id, kandidaat_id, kanaal, richting, inhoud, status, gelezen)
VALUES
(
  'm0000001-0000-4000-8000-000000000001',
  'a0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  'whatsapp', 'outbound',
  E'Goedemiddag Jan! We hebben uw screening ontvangen — kunnen we morgen terugbellen?',
  'verzonden', true
),
(
  'm0000001-0000-4000-8000-000000000002',
  'a0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  'whatsapp', 'inbound',
  'Ja dat is goed, ik ben beschikbaar na 14:00.',
  'ontvangen', true
),
(
  'm0000001-0000-4000-8000-000000000003',
  'a0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  'whatsapp', 'outbound',
  'Top, we bellen u dan rond 14:30. Groet RecruitAI.',
  'verzonden', true
),
(
  'm0000001-0000-4000-8000-000000000004',
  'a0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  'whatsapp', 'inbound',
  'Kunt u ook de locatie van de werkplaats sturen?',
  'ontvangen', false
),
(
  'm0000001-0000-4000-8000-000000000005',
  'a0000001-0000-4000-8000-000000000001',
  'b0000001-0000-4000-8000-000000000001',
  'whatsapp', 'outbound',
  'Zeker — Havenstraat 12, Rotterdam. Fijne dag!',
  'verzonden', true
);

COMMIT;

-- Koppel profiel aan demo-bureau (vervang USER_ID door auth.users.id):
-- INSERT INTO profiles (id, bureau_id, volledige_naam)
-- VALUES ('USER_ID', 'a0000001-0000-4000-8000-000000000001', 'Demo recruiter')
-- ON CONFLICT (id) DO UPDATE SET bureau_id = EXCLUDED.bureau_id;
