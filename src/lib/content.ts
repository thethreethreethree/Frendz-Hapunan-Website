// Canonical default content + shared types.
// Used as the BUILD-TIME / DB-unavailable fallback for public pages, and mirrored by
// supabase/migrations/0002_seed_event_and_menu.sql as the initial DB seed.
// The DB is the editable source of truth at runtime; this is the safe default.

export type EventSettings = {
  event_name: string;
  event_subtitle: string;
  tagline: string;
  location: string;
  event_time: string;
  price_per_pax: number;
  currency: string;
  reception_instructions: string;
  show_attendee_flags?: boolean;
  featured_day?: string;
};

export type MenuItem = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  sort_order: number;
  is_available?: boolean;
  image_url?: string;
};

// Dish → photo. Used when a menu row has no image_url of its own (e.g. the live
// DB rows seeded before the image_url column existed), so photos appear without a
// schema change. A row's own image_url always takes precedence (admin-editable).
const IMAGE_BY_NAME: Record<string, string> = {
  // Friday
  "Lumpiang Isda": "/menu/lumpiang-isda.png",
  "Chicken Inasal at Talong Ensalada": "/menu/chicken-inasal.png",
  "Suman at Latik": "/menu/suman-at-latik.png",
  "Sago at Gulaman": "/menu/sago-at-gulaman.png",
  // Sunday
  "Fish Tinapa Okoy": "/menu/fish-tinapa-okoy.jpg",
  "Adobong Manok sa Latik at Lato": "/menu/adobong-manok.jpg",
  "Turones": "/menu/turones.jpg",
};

export function imageForMenuItem(item: {
  name: string;
  image_url?: string;
}): string {
  return item.image_url || IMAGE_BY_NAME[item.name] || "";
}

export const DEFAULT_EVENT: EventSettings = {
  event_name: "Frendz Hapunan",
  event_subtitle: "Filipino Dinner & Social Night",
  tagline: "Delicious Authentic Filipino Food + Making New Friends",
  location: "Frendz Hostel El Nido",
  event_time: "7:30 PM",
  price_per_pax: 499,
  currency: "₱",
  reception_instructions:
    "Please proceed to the Frendz Hostel reception to complete your payment and confirm your seat. Once payment is received, your booking will be marked Confirmed here.",
  show_attendee_flags: true,
  featured_day: "friday",
};

export const DEFAULT_MENU: MenuItem[] = [
  {
    name: "Lumpiang Isda",
    category: "Starter",
    sort_order: 1,
    price: 0,
    description:
      "Golden fried spring rolls filled with flaky white fish, fresh herbs, and Filipino aromatics. A traditional Pinoy fiesta appetizer served with sweet and tangy vinegar dip.",
  },
  {
    name: "Chicken Inasal at Talong Ensalada",
    category: "Main Course",
    sort_order: 2,
    price: 0,
    description:
      "A definitive Visayan char-grilled chicken infused with wild lemongrass, calamansi, ginger and garlic, and glazed with atsuete oil. Served with Pandan steamed rice and a side of eggplant salad with fermented fish dressing and pickled papaya.",
  },
  {
    name: "Suman at Latik",
    category: "Dessert",
    sort_order: 3,
    price: 0,
    description:
      "A timeless dessert celebrating the sweet, slow rhythms of the provincial hearth. High-grade heirloom glutinous rice simmered in rich coconut milk and sea salt.",
  },
  {
    name: "Sago at Gulaman",
    category: "Drink",
    sort_order: 4,
    price: 0,
    description:
      "A nostalgic, deeply refreshing Filipino beverage packed with texture. Tender tapioca pearls and cubes of local grass jelly served ice-cold in a fragrant, pandan-infused caramelized brown sugar syrup.",
  },
];

export type TriviaQuestion = {
  id?: string;
  question: string;
  choices: string[];
  correct_index: number;
  fun_fact: string;
  sort_order: number;
};

// DRAFT trivia (agent-authored, tied to the menu; founder-reviewable + admin-editable).
// Mirrors supabase/migrations/0002 seed.
export const DEFAULT_TRIVIA: TriviaQuestion[] = [
  {
    question: "Lumpiang Isda is a Filipino spring roll mainly filled with what?",
    choices: ["Pork", "Flaky white fish", "Banana", "Cheese"],
    correct_index: 1,
    fun_fact:
      "Lumpiang isda swaps the usual pork for white fish — lighter, and a coastal favorite.",
    sort_order: 1,
  },
  {
    question:
      "Chicken Inasal is the signature grilled chicken of which Philippine region?",
    choices: ["Ilocos", "Bacolod (Visayas)", "Bicol", "Davao"],
    correct_index: 1,
    fun_fact:
      "Bacolod City in Negros Occidental is famous for its inasal stalls.",
    sort_order: 2,
  },
  {
    question: "What gives Chicken Inasal its golden-orange color?",
    choices: ["Turmeric", "Atsuete (annatto) oil", "Paprika", "Soy sauce"],
    correct_index: 1,
    fun_fact:
      "Atsuete (annatto) seeds are steeped in oil to brush over the grilling chicken.",
    sort_order: 3,
  },
  {
    question: "In “Sago at Gulaman,” what is the gulaman?",
    choices: ["Tapioca pearls", "Grass jelly / agar", "Coconut strips", "Brown sugar"],
    correct_index: 1,
    fun_fact:
      "Gulaman is a firm jelly from seaweed agar; sago are the chewy tapioca pearls.",
    sort_order: 4,
  },
  {
    question: "Suman at Latik is made primarily from which rice?",
    choices: ["Jasmine rice", "Glutinous (malagkit) rice", "Brown rice", "Basmati"],
    correct_index: 1,
    fun_fact: "Malagkit (sticky rice) is what gives suman its signature chew.",
    sort_order: 5,
  },
  {
    question: "What is “latik” in Suman at Latik?",
    choices: [
      "Caramelized coconut-milk curds",
      "Melted chocolate",
      "Peanut brittle",
      "Palm sugar candy",
    ],
    correct_index: 0,
    fun_fact:
      "Latik is made by simmering coconut milk until rich golden curds form.",
    sort_order: 6,
  },
  {
    question: "Calamansi, used in the inasal marinade, is a Filipino what?",
    choices: ["Chili pepper", "Citrus", "Leafy herb", "Root crop"],
    correct_index: 1,
    fun_fact: "Calamansi is a small, fragrant Philippine citrus — tart and floral.",
    sort_order: 7,
  },
  {
    question: "The word “Hapunan” in Filipino refers to which meal?",
    choices: ["Breakfast", "Lunch", "Dinner", "Midnight snack"],
    correct_index: 2,
    fun_fact:
      "Hapunan means the evening meal — fitting for a dinner and social night.",
    sort_order: 8,
  },
  {
    question: "“Talong” in Talong Ensalada is the Filipino word for what vegetable?",
    choices: ["Tomato", "Eggplant", "Okra", "Bitter gourd"],
    correct_index: 1,
    fun_fact: "Talong (eggplant) is often grilled or charred for Filipino ensaladas.",
    sort_order: 9,
  },
  {
    question:
      "Bagoong, the dressing paired with the eggplant salad, is made from fermented what?",
    choices: ["Rice", "Fish or shrimp", "Soybeans", "Coconut"],
    correct_index: 1,
    fun_fact:
      "Bagoong is a pungent fermented fish or shrimp paste — a Filipino umami staple.",
    sort_order: 10,
  },
];
