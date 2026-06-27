-- 0005_seed_sunday_menu.sql
-- Sunday's food experience (depends on 0004 — daily_offerings + menu_items.offering_day).
-- A12 idempotent: re-runnable.

-- Activate Sunday (price/time inherit the daily_offerings defaults; editable in admin).
update public.daily_offerings
   set is_active = true
 where day = 'sunday';

insert into public.menu_items (name, description, category, price, sort_order, is_available, offering_day)
select v.name, v.description, v.category, 0, v.sort_order, true, 'sunday'
from (values
  ('Fish Tinapa Okoy',
   'Originated in Laguna, this dish features light, rice-flour battered fritters packed with native green papaya, sweet potato, and carrots. It is topped with smoky salted fish flakes and traditionally served with a sweet, spicy, and tangy palm vinegar dipping sauce.',
   'Starter', 1),
  ('Adobong Manok sa Latik at Lato',
   'A classic Filipino dish with many regional variations across the Philippines. Simmered chicken in soy sauce, vinegar, and aromatics, then finished with rich, creamy coconut milk. It is served with pandan rice and ensaladang lato with a tangy and savory fermented shrimp paste dressing.',
   'Main Course', 2),
  ('Turones',
   'Ripe saba bananas and strips of sweet jackfruit (langka) rolled in brown sugar, wrapped tightly in a lumpia wrapper, and deep-fried until the sugar melts into a hard, sticky caramel.',
   'Dessert', 3),
  ('Sago at Gulaman',
   'A nostalgic, deeply refreshing Filipino beverage packed with texture. Tender tapioca pearls and cubes of local grass jelly served ice-cold in a fragrant, pandan-infused caramelized brown sugar syrup.',
   'Drink', 4)
) as v(name, description, category, sort_order)
where not exists (
  select 1 from public.menu_items m
  where m.name = v.name and m.offering_day = 'sunday'
);
