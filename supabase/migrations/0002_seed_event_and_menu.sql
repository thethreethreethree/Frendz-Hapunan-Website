-- 0002_seed_event_and_menu.sql
-- Adds event_settings (the admin-editable price/time/location) and seeds the real
-- set menu + a DRAFT trivia bank. A12 idempotent: re-runnable against partial state.
--
-- Trivia questions are AGENT-DRAFTED (tied to the actual menu) and flagged for founder
-- review (A20 — surfaced, editable in admin, not presented as final truth).

-- ── Event settings (singleton row) ──────────────────────────────────────────
create table if not exists public.event_settings (
  id                     smallint primary key default 1 check (id = 1),
  event_name             text not null default 'Frendz Hapunan',
  event_subtitle         text not null default 'Filipino Dinner & Social Night',
  tagline                text not null default 'Delicious Authentic Filipino Food + Making New Friends',
  location               text not null default 'Frendz Hostel El Nido',
  event_time             text not null default '7:30 PM',
  price_per_pax          numeric(10,2) not null default 499 check (price_per_pax >= 0),
  currency               text not null default '₱',
  reception_instructions text not null default
    'Please proceed to the Frendz Hostel reception to complete your payment and confirm your seat. Once payment is received, your booking will be marked Confirmed here.',
  updated_at             timestamptz not null default now()
);

insert into public.event_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists trg_event_settings_updated_at on public.event_settings;
create trigger trg_event_settings_updated_at
  before update on public.event_settings
  for each row execute function public.set_updated_at();

alter table public.event_settings enable row level security;

drop policy if exists event_settings_public_read on public.event_settings;
create policy event_settings_public_read on public.event_settings
  for select using (true);

drop policy if exists event_settings_admin_update on public.event_settings;
create policy event_settings_admin_update on public.event_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ── Seed menu (idempotent by name) ──────────────────────────────────────────
insert into public.menu_items (name, description, category, price, sort_order, is_available)
select v.name, v.description, v.category, 0, v.sort_order, true
from (values
  ('Lumpiang Isda',
   'Golden fried spring rolls filled with flaky white fish, fresh herbs, and Filipino aromatics. A traditional Pinoy fiesta appetizer served with sweet and tangy vinegar dip.',
   'Starter', 1),
  ('Chicken Inasal at Talong Ensalada',
   'A definitive Visayan char-grilled chicken infused with wild lemongrass, calamansi, ginger and garlic, and glazed with atsuete oil. Served with Pandan steamed rice and a side of eggplant salad with fermented fish dressing and pickled papaya.',
   'Main Course', 2),
  ('Suman at Latik',
   'A timeless dessert celebrating the sweet, slow rhythms of the provincial hearth. High-grade heirloom glutinous rice simmered in rich coconut milk and sea salt.',
   'Dessert', 3),
  ('Sago at Gulaman',
   'A nostalgic, deeply refreshing Filipino beverage packed with texture. Tender tapioca pearls and cubes of local grass jelly served ice-cold in a fragrant, pandan-infused caramelized brown sugar syrup.',
   'Drink', 4)
) as v(name, description, category, sort_order)
where not exists (select 1 from public.menu_items m where m.name = v.name);

-- ── Seed DRAFT trivia (idempotent by question text) ─────────────────────────
insert into public.trivia_questions (question, choices, correct_index, fun_fact, sort_order, is_active)
select v.question, v.choices::jsonb, v.correct_index, v.fun_fact, v.sort_order, true
from (values
  ('Lumpiang Isda is a Filipino spring roll mainly filled with what?',
   '["Pork","Flaky white fish","Banana","Cheese"]', 1,
   'Lumpiang isda swaps the usual pork for white fish — lighter, and a coastal favorite.', 1),
  ('Chicken Inasal is the signature grilled chicken of which Philippine region?',
   '["Ilocos","Bacolod (Visayas)","Bicol","Davao"]', 1,
   'Bacolod City in Negros Occidental is famous for its inasal stalls.', 2),
  ('What gives Chicken Inasal its golden-orange color?',
   '["Turmeric","Atsuete (annatto) oil","Paprika","Soy sauce"]', 1,
   'Atsuete (annatto) seeds are steeped in oil to brush over the grilling chicken.', 3),
  ('In "Sago at Gulaman," what is the gulaman?',
   '["Tapioca pearls","Grass jelly / agar","Coconut strips","Brown sugar"]', 1,
   'Gulaman is a firm jelly from seaweed agar; sago are the chewy tapioca pearls.', 4),
  ('Suman at Latik is made primarily from which rice?',
   '["Jasmine rice","Glutinous (malagkit) rice","Brown rice","Basmati"]', 1,
   'Malagkit (sticky rice) is what gives suman its signature chew.', 5),
  ('What is "latik" in Suman at Latik?',
   '["Caramelized coconut-milk curds","Melted chocolate","Peanut brittle","Palm sugar candy"]', 0,
   'Latik is made by simmering coconut milk until rich golden curds form.', 6),
  ('Calamansi, used in the inasal marinade, is a Filipino what?',
   '["Chili pepper","Citrus","Leafy herb","Root crop"]', 1,
   'Calamansi is a small, fragrant Philippine citrus — tart and floral.', 7),
  ('The word "Hapunan" in Filipino refers to which meal?',
   '["Breakfast","Lunch","Dinner","Midnight snack"]', 2,
   'Hapunan means the evening meal — fitting for a dinner and social night.', 8),
  ('"Talong" in Talong Ensalada is the Filipino word for what vegetable?',
   '["Tomato","Eggplant","Okra","Bitter gourd"]', 1,
   'Talong (eggplant) is often grilled or charred for Filipino ensaladas.', 9),
  ('Bagoong, the dressing paired with the eggplant salad, is made from fermented what?',
   '["Rice","Fish or shrimp","Soybeans","Coconut"]', 1,
   'Bagoong is a pungent fermented fish or shrimp paste — a Filipino umami staple.', 10)
) as v(question, choices, correct_index, fun_fact, sort_order)
where not exists (select 1 from public.trivia_questions t where t.question = v.question);
