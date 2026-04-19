-- RecruitAI — initiële schema + profiles + RLS
-- Voer uit in Supabase SQL Editor of via CLI.

-- BUREAUS
CREATE TABLE IF NOT EXISTS bureaus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefoon TEXT,
  logo_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'trial',
  credits_resterend INTEGER DEFAULT 50,
  telnyx_nummer TEXT,
  whatsapp_nummer TEXT,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (koppeling auth.users ↔ bureau)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bureau_id UUID NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  volledige_naam TEXT,
  rol TEXT DEFAULT 'recruiter',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_bureau ON profiles(bureau_id);

-- KANDIDATEN
CREATE TABLE IF NOT EXISTS kandidaten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  telefoon TEXT NOT NULL,
  email TEXT,
  rijbewijs BOOLEAN DEFAULT FALSE,
  beschikbaar_per DATE,
  salariswens_min INTEGER,
  salariswens_max INTEGER,
  sectoren TEXT[],
  skills TEXT[],
  status TEXT DEFAULT 'actief',
  notities TEXT,
  laatste_contact TIMESTAMPTZ,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kandidaten_bureau ON kandidaten(bureau_id);

-- OPDRACHTGEVERS
CREATE TABLE IF NOT EXISTS opdrachtgevers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  naam TEXT NOT NULL,
  contactpersoon TEXT,
  email TEXT,
  telefoon TEXT,
  adres TEXT,
  sector TEXT,
  notities TEXT,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- VACATURES
CREATE TABLE IF NOT EXISTS vacatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  opdrachtgever_id UUID REFERENCES opdrachtgevers(id),
  titel TEXT NOT NULL,
  omschrijving TEXT,
  locatie TEXT,
  sector TEXT,
  uren_per_week INTEGER,
  salaris_min INTEGER,
  salaris_max INTEGER,
  startdatum DATE,
  einddatum DATE,
  aantal_gezocht INTEGER DEFAULT 1,
  eisen TEXT[],
  status TEXT DEFAULT 'open',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAGNES
CREATE TABLE IF NOT EXISTS campagnes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id) ON DELETE CASCADE,
  vacature_id UUID REFERENCES vacatures(id),
  naam TEXT NOT NULL,
  type TEXT DEFAULT 'screening',
  status TEXT DEFAULT 'concept',
  script TEXT,
  screening_vragen JSONB DEFAULT '[]',
  rapport_email TEXT,
  totaal_kandidaten INTEGER DEFAULT 0,
  gebeld INTEGER DEFAULT 0,
  geschikt INTEGER DEFAULT 0,
  niet_geschikt INTEGER DEFAULT 0,
  twijfel INTEGER DEFAULT 0,
  geen_gehoor INTEGER DEFAULT 0,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPAGNE_KANDIDATEN
CREATE TABLE IF NOT EXISTS campagne_kandidaten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id UUID REFERENCES campagnes(id) ON DELETE CASCADE,
  kandidaat_id UUID REFERENCES kandidaten(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'wacht',
  bel_pogingen INTEGER DEFAULT 0,
  volgende_bel_poging TIMESTAMPTZ,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ck_campagne ON campagne_kandidaten(campagne_id);
CREATE INDEX IF NOT EXISTS idx_ck_kandidaat ON campagne_kandidaten(kandidaat_id);

-- GESPREKKEN
CREATE TABLE IF NOT EXISTS gesprekken (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campagne_id UUID REFERENCES campagnes(id),
  kandidaat_id UUID REFERENCES kandidaten(id),
  bureau_id UUID REFERENCES bureaus(id),
  telnyx_call_id TEXT,
  status TEXT DEFAULT 'gepland',
  duur_seconden INTEGER,
  transcript TEXT,
  opname_url TEXT,
  score INTEGER,
  aanbeveling TEXT,
  samenvatting TEXT,
  antwoorden JSONB DEFAULT '{}',
  positieve_punten TEXT[],
  negatieve_punten TEXT[],
  bel_poging INTEGER DEFAULT 1,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gesprekken_bureau ON gesprekken(bureau_id);
CREATE INDEX IF NOT EXISTS idx_gesprekken_campagne ON gesprekken(campagne_id);

-- PLAATSINGEN
CREATE TABLE IF NOT EXISTS plaatsingen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id),
  vacature_id UUID REFERENCES vacatures(id),
  kandidaat_id UUID REFERENCES kandidaten(id),
  opdrachtgever_id UUID REFERENCES opdrachtgevers(id),
  startdatum DATE,
  einddatum DATE,
  uurtarief_kandidaat DECIMAL,
  uurtarief_opdrachtgever DECIMAL,
  status TEXT DEFAULT 'bevestigd',
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- BERICHTEN
CREATE TABLE IF NOT EXISTS berichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id UUID REFERENCES bureaus(id),
  kandidaat_id UUID REFERENCES kandidaten(id),
  kanaal TEXT DEFAULT 'whatsapp',
  richting TEXT DEFAULT 'outbound',
  inhoud TEXT NOT NULL,
  status TEXT DEFAULT 'verzonden',
  telnyx_message_id TEXT,
  aangemaakt_op TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kandidaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE opdrachtgevers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagne_kandidaten ENABLE ROW LEVEL SECURITY;
ALTER TABLE gesprekken ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaatsingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE berichten ENABLE ROW LEVEL SECURITY;

-- Helper: bureau van huidige gebruiker
CREATE OR REPLACE FUNCTION public.current_user_bureau_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT bureau_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Policies bureaus
CREATE POLICY bureaus_select ON bureaus FOR SELECT
  USING (id = public.current_user_bureau_id());
CREATE POLICY bureaus_update ON bureaus FOR UPDATE
  USING (id = public.current_user_bureau_id());

-- Policies profiles
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (bureau_id = public.current_user_bureau_id());
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Kandidaten
CREATE POLICY kandidaten_all ON kandidaten FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Opdrachtgevers
CREATE POLICY opdrachtgevers_all ON opdrachtgevers FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Vacatures
CREATE POLICY vacatures_all ON vacatures FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Campagnes
CREATE POLICY campagnes_all ON campagnes FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Campagne_kandidaten via campagne
CREATE POLICY campagne_kandidaten_all ON campagne_kandidaten FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM campagnes c
      WHERE c.id = campagne_kandidaten.campagne_id
        AND c.bureau_id = public.current_user_bureau_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campagnes c
      WHERE c.id = campagne_kandidaten.campagne_id
        AND c.bureau_id = public.current_user_bureau_id()
    )
  );

-- Gesprekken
CREATE POLICY gesprekken_all ON gesprekken FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Plaatsingen
CREATE POLICY plaatsingen_all ON plaatsingen FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Berichten
CREATE POLICY berichten_all ON berichten FOR ALL
  USING (bureau_id = public.current_user_bureau_id())
  WITH CHECK (bureau_id = public.current_user_bureau_id());

-- Realtime (Supabase): voeg tabellen toe aan publication indien nodig:
-- ALTER PUBLICATION supabase_realtime ADD TABLE campagnes;
-- ALTER PUBLICATION supabase_realtime ADD TABLE gesprekken;
