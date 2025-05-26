// Demo product data for POS system
export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stockQty: number;
  category?: string;
  description?: string;
}

export const demoPosProducts: Product[] = [
  // Electronics
  {
    id: "1",
    name: "iPhone 15 Pro",
    code: "IPH15PRO",
    price: 999.99,
    stockQty: 25,
    category: "Electronics",
    description: "Latest iPhone with Pro features",
  },
  {
    id: "2",
    name: "Samsung Galaxy S24",
    code: "SGS24",
    price: 899.99,
    stockQty: 30,
    category: "Electronics",
    description: "Flagship Android smartphone",
  },
  {
    id: "3",
    name: "iPad Air",
    code: "IPADAIR",
    price: 599.99,
    stockQty: 15,
    category: "Electronics",
    description: "Powerful tablet for productivity",
  },
  {
    id: "4",
    name: "MacBook Air M3",
    code: "MBAM3",
    price: 1299.99,
    stockQty: 8,
    category: "Electronics",
    description: "Ultra-thin laptop with M3 chip",
  },
  {
    id: "5",
    name: "AirPods Pro",
    code: "APPRO",
    price: 249.99,
    stockQty: 50,
    category: "Electronics",
    description: "Wireless earbuds with noise cancellation",
  },
  {
    id: "6",
    name: "Apple Watch Series 9",
    code: "AWS9",
    price: 399.99,
    stockQty: 20,
    category: "Electronics",
    description: "Smart watch with health monitoring",
  },
  {
    id: "7",
    name: "Sony WH-1000XM5",
    code: "SONY1000",
    price: 349.99,
    stockQty: 12,
    category: "Electronics",
    description: "Premium noise-canceling headphones",
  },
  {
    id: "8",
    name: "Nintendo Switch",
    code: "NSWITCH",
    price: 299.99,
    stockQty: 18,
    category: "Electronics",
    description: "Portable gaming console",
  },

  // Clothing
  {
    id: "9",
    name: "Levi's 501 Jeans",
    code: "LEV501",
    price: 89.99,
    stockQty: 35,
    category: "Clothing",
    description: "Classic straight-leg denim jeans",
  },
  {
    id: "10",
    name: "Nike Air Max 90",
    code: "NAM90",
    price: 129.99,
    stockQty: 42,
    category: "Clothing",
    description: "Iconic running sneakers",
  },
  {
    id: "11",
    name: "Adidas Hoodie",
    code: "ADHOODIE",
    price: 79.99,
    stockQty: 28,
    category: "Clothing",
    description: "Comfortable cotton blend hoodie",
  },
  {
    id: "12",
    name: "Ray-Ban Aviators",
    code: "RBAV",
    price: 199.99,
    stockQty: 22,
    category: "Clothing",
    description: "Classic aviator sunglasses",
  },
  {
    id: "13",
    name: "Polo Ralph Lauren Shirt",
    code: "PRLSHIRT",
    price: 119.99,
    stockQty: 31,
    category: "Clothing",
    description: "Premium cotton polo shirt",
  },
  {
    id: "14",
    name: "Converse Chuck Taylor",
    code: "CONVCT",
    price: 65.99,
    stockQty: 38,
    category: "Clothing",
    description: "Classic canvas sneakers",
  },

  // Home & Garden
  {
    id: "15",
    name: "Dyson V15 Vacuum",
    code: "DYV15",
    price: 749.99,
    stockQty: 6,
    category: "Home & Garden",
    description: "Cordless stick vacuum with laser detection",
  },
  {
    id: "16",
    name: "KitchenAid Stand Mixer",
    code: "KASM",
    price: 449.99,
    stockQty: 9,
    category: "Home & Garden",
    description: "Professional-grade stand mixer",
  },
  {
    id: "17",
    name: "Instant Pot Duo",
    code: "IPDUO",
    price: 99.99,
    stockQty: 24,
    category: "Home & Garden",
    description: "7-in-1 electric pressure cooker",
  },
  {
    id: "18",
    name: "Philips Hue Bulbs (4-pack)",
    code: "PHB4",
    price: 199.99,
    stockQty: 16,
    category: "Home & Garden",
    description: "Smart LED light bulbs",
  },
  {
    id: "19",
    name: "Roomba i7+",
    code: "ROOMI7",
    price: 799.99,
    stockQty: 4,
    category: "Home & Garden",
    description: "Robot vacuum with self-emptying base",
  },

  // Books & Media
  {
    id: "20",
    name: "The Seven Husbands of Evelyn Hugo",
    code: "SHEH",
    price: 17.99,
    stockQty: 45,
    category: "Books & Media",
    description: "Bestselling fiction novel",
  },
  {
    id: "21",
    name: "Atomic Habits",
    code: "ATHAB",
    price: 19.99,
    stockQty: 52,
    category: "Books & Media",
    description: "Self-help book on building good habits",
  },
  {
    id: "22",
    name: "The Thursday Murder Club",
    code: "TTMC",
    price: 16.99,
    stockQty: 33,
    category: "Books & Media",
    description: "Mystery novel series",
  },
  {
    id: "23",
    name: "Dune: Part Two Blu-ray",
    code: "DUNE2BR",
    price: 24.99,
    stockQty: 19,
    category: "Books & Media",
    description: "Epic sci-fi movie on Blu-ray",
  },

  // Food & Beverages
  {
    id: "24",
    name: "Starbucks Pike Place Coffee",
    code: "SBPP",
    price: 12.99,
    stockQty: 67,
    category: "Food & Beverages",
    description: "Medium roast ground coffee",
  },
  {
    id: "25",
    name: "Organic Honey",
    code: "OHONEY",
    price: 8.99,
    stockQty: 41,
    category: "Food & Beverages",
    description: "Pure organic wildflower honey",
  },
  {
    id: "26",
    name: "Ghirardelli Dark Chocolate",
    code: "GHDC",
    price: 6.99,
    stockQty: 58,
    category: "Food & Beverages",
    description: "Premium dark chocolate squares",
  },
  {
    id: "27",
    name: "Fiji Water (24-pack)",
    code: "FIJI24",
    price: 34.99,
    stockQty: 23,
    category: "Food & Beverages",
    description: "Natural artesian water bottles",
  },

  // Sports & Outdoors
  {
    id: "28",
    name: "Yeti Rambler Tumbler",
    code: "YRAM",
    price: 39.99,
    stockQty: 37,
    category: "Sports & Outdoors",
    description: "Insulated stainless steel tumbler",
  },
  {
    id: "29",
    name: "Patagonia Fleece Jacket",
    code: "PATFJ",
    price: 179.99,
    stockQty: 14,
    category: "Sports & Outdoors",
    description: "Outdoor fleece jacket",
  },
  {
    id: "30",
    name: "Coleman Camping Chair",
    code: "COLCC",
    price: 49.99,
    stockQty: 26,
    category: "Sports & Outdoors",
    description: "Portable folding camping chair",
  },

  // Low Stock Items
  {
    id: "31",
    name: "Limited Edition Watch",
    code: "LEW01",
    price: 1299.99,
    stockQty: 3,
    category: "Electronics",
    description: "Exclusive timepiece with limited availability",
  },
  {
    id: "32",
    name: "Designer Handbag",
    code: "DHB01",
    price: 899.99,
    stockQty: 5,
    category: "Clothing",
    description: "Luxury leather handbag",
  },
  {
    id: "33",
    name: "Vintage Wine",
    code: "VW1999",
    price: 299.99,
    stockQty: 2,
    category: "Food & Beverages",
    description: "Rare vintage wine from 1999",
  },

  // Out of Stock Items
  {
    id: "34",
    name: "Sold Out Gaming Console",
    code: "SOGC",
    price: 499.99,
    stockQty: 0,
    category: "Electronics",
    description: "Popular gaming console - currently out of stock",
  },
  {
    id: "35",
    name: "Popular Sneakers",
    code: "PSNEAK",
    price: 199.99,
    stockQty: 0,
    category: "Clothing",
    description: "Trendy sneakers - restocking soon",
  },

  // Additional items to test pagination
  {
    id: "36",
    name: "Wireless Keyboard",
    code: "WKBD",
    price: 79.99,
    stockQty: 29,
    category: "Electronics",
    description: "Bluetooth mechanical keyboard",
  },
  {
    id: "37",
    name: "Coffee Mug Set",
    code: "CMS01",
    price: 24.99,
    stockQty: 44,
    category: "Home & Garden",
    description: "Set of 4 ceramic coffee mugs",
  },
  {
    id: "38",
    name: "Yoga Mat",
    code: "YOGA01",
    price: 34.99,
    stockQty: 31,
    category: "Sports & Outdoors",
    description: "Non-slip exercise yoga mat",
  },
  {
    id: "39",
    name: "Bluetooth Speaker",
    code: "BTSPK",
    price: 89.99,
    stockQty: 17,
    category: "Electronics",
    description: "Portable waterproof speaker",
  },
  {
    id: "40",
    name: "Essential Oils Set",
    code: "EOS01",
    price: 49.99,
    stockQty: 22,
    category: "Home & Garden",
    description: "Aromatherapy essential oils collection",
  },
];

// Categories for filtering
export const categories = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Books & Media",
  "Food & Beverages",
  "Sports & Outdoors",
];

// Utility functions for demo data
export const getProductsByCategory = (category: string): Product[] => {
  return demoPosProducts.filter((product) => product.category === category);
};

export const searchProducts = (query: string): Product[] => {
  const searchTerm = query.toLowerCase().trim();
  return demoPosProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.code.toLowerCase().includes(searchTerm) ||
      (product.category &&
        product.category.toLowerCase().includes(searchTerm)) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm))
  );
};

export const getPaginatedProducts = (
  products: Product[],
  page: number,
  itemsPerPage: number
) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  return {
    products: products.slice(startIndex, endIndex),
    totalPages: Math.ceil(products.length / itemsPerPage),
    totalItems: products.length,
    currentPage: page,
    hasNextPage: endIndex < products.length,
    hasPrevPage: page > 1,
  };
};
