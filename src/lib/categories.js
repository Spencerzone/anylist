export const DEFAULT_CATEGORIES = [
  "Baby", "Bakery", "Beverages", "Bread", "Breakfast",
  "Bunnings", "Canned Goods", "Cleaning", "Condiments & Dressings",
  "Cooking & Baking", "Dairy", "Deli", "Frozen Foods",
  "Fruit & Vegetables", "Health & Beauty", "Meat",
  "Pantry", "Pet", "Seafood", "Snacks", "Other"
];

export const CAT_ICONS = {
  "Baby": "🍼", "Bakery": "🥐", "Beverages": "🥤", "Bread": "🍞",
  "Breakfast": "🥣", "Bunnings": "🏠", "Canned Goods": "🥫",
  "Cleaning": "🧹", "Condiments & Dressings": "🫙", "Cooking & Baking": "🥄",
  "Dairy": "🧀", "Deli": "🥩", "Frozen Foods": "❄️",
  "Fruit & Vegetables": "🥦", "Health & Beauty": "💊", "Meat": "🥩",
  "Pantry": "🏺", "Pet": "🐾", "Seafood": "🐟", "Snacks": "🍿", "Other": "📦"
};

export function guessCategory(name, learned = {}) {
  const n = name.toLowerCase();
  if (learned[n]) return learned[n];
  if (/milk|cheese|yogh|butter|cream|egg/.test(n)) return "Dairy";
  if (/bread|bun|roll|loaf/.test(n)) return "Bread";
  if (/chicken|beef|pork|lamb|mince|steak|sausage|ham/.test(n)) return "Meat";
  if (/salmon|tuna|fish|prawn|seafood/.test(n)) return "Seafood";
  if (/apple|banana|carrot|tomato|lettuce|potato|onion|spinach|broccoli|capsicum|avocado|lime|lemon/.test(n)) return "Fruit & Vegetables";
  if (/frozen|ice cream/.test(n)) return "Frozen Foods";
  if (/cereal|oats|muesli/.test(n)) return "Breakfast";
  if (/coffee|tea|juice|water|drink|beer|wine/.test(n)) return "Beverages";
  if (/nappy|wipe|baby/.test(n)) return "Baby";
  if (/shampoo|soap|toothpaste|deodorant/.test(n)) return "Health & Beauty";
  if (/sauce|salsa|mustard|mayo|dressing|vinegar|oil/.test(n)) return "Condiments & Dressings";
  if (/flour|sugar|baking|yeast|cocoa|vanilla/.test(n)) return "Cooking & Baking";
  if (/chip|biscuit|cracker|snack|chocolate|lolly|nut/.test(n)) return "Snacks";
  if (/pasta|rice|noodle|grain/.test(n)) return "Pantry";
  return "Other";
}
