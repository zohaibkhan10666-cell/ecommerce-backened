import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
import connectDB from './db.js';

dotenv.config({ path: '../.env' });

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'Latest iPhone with A17 Pro chip, titanium design, 48MP camera',
    price: 1299,
    originalPrice: 1499,
    category: 'Smartphones',
    subCategory: 'Apple',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1693390132477-0e42266d43f4?w=500'],
    stock: 25,
    rating: 4.8,
    reviewCount: 124,
    isFeatured: true,
    isActive: true,
    tags: ['iphone', 'smartphone', 'apple', '5g'],
    specifications: {
      color: 'Natural Titanium',
      size: '6.7 inch',
      weight: '221g',
      dimensions: '159.9 x 76.7 x 8.25 mm',
      material: 'Titanium',
      other: 'USB-C'
    }
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Flagship Android with S Pen, 200MP camera, 6.8" display',
    price: 1199,
    originalPrice: 1399,
    category: 'Smartphones',
    subCategory: 'Samsung',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1701363685510-e5033b5f16e9?w=500'],
    stock: 18,
    rating: 4.7,
    reviewCount: 89,
    isFeatured: true,
    isActive: true,
    tags: ['samsung', 'galaxy', 's24', 'spen'],
    specifications: {
      color: 'Titanium Black',
      size: '6.8 inch',
      weight: '232g',
      dimensions: '162.3 x 79 x 8.6 mm',
      material: 'Titanium',
      other: 'S Pen included'
    }
  },
  {
    name: 'MacBook Pro 16 M3 Max',
    description: 'Professional laptop with M3 Max chip, 36GB RAM, 1TB SSD',
    price: 3499,
    originalPrice: 3999,
    category: 'Laptops',
    subCategory: 'Apple',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1700836621009-f6b4419a7f58?w=500'],
    stock: 8,
    rating: 4.9,
    reviewCount: 67,
    isFeatured: true,
    isActive: true,
    tags: ['macbook', 'm3', 'pro', 'laptop'],
    specifications: {
      color: 'Space Black',
      size: '16.2 inch',
      weight: '2.14kg',
      dimensions: '355.7 x 248.1 x 16.8 mm',
      material: 'Aluminum',
      other: 'Liquid Retina XDR'
    }
  },
  {
    name: 'Dell XPS 13',
    description: 'Ultra-thin laptop with Intel Core Ultra, 16GB RAM, 512GB SSD',
    price: 1299,
    category: 'Laptops',
    subCategory: 'Dell',
    brand: 'Dell',
    images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500'],
    stock: 15,
    rating: 4.6,
    reviewCount: 45,
    isActive: true,
    tags: ['dell', 'xps', 'ultrabook', 'windows'],
    specifications: {
      color: 'Platinum',
      size: '13.4 inch',
      weight: '1.19kg',
      dimensions: '295.3 x 199.1 x 14.8 mm',
      material: 'Aluminum',
      other: 'InfinityEdge display'
    }
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Premium wireless noise-cancelling headphones with 30hr battery',
    price: 399,
    originalPrice: 449,
    category: 'Audio',
    subCategory: 'Headphones',
    brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1576519065164-5cc93a0e577f?w=500'],
    stock: 42,
    rating: 4.8,
    reviewCount: 234,
    isFeatured: true,
    isActive: true,
    tags: ['sony', 'headphones', 'anc', 'wireless'],
    specifications: {
      color: 'Black',
      weight: '250g',
      dimensions: '251 x 227 x 122 mm (case)',
      material: 'Plastic/Leatherette',
      other: 'Bluetooth 5.2'
    }
  },
  {
    name: 'AirPods Pro 2',
    description: 'Wireless earbuds with active noise cancellation, USB-C charging',
    price: 249,
    category: 'Audio',
    subCategory: 'Earbuds',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1614007848607-86d849c30f75?w=500'],
    stock: 65,
    rating: 4.5,
    reviewCount: 156,
    isActive: true,
    tags: ['airpods', 'earbuds', 'apple', 'wireless'],
    specifications: {
      color: 'White',
      weight: '5.3g per bud',
      dimensions: '30.9 x 21.7 x 24 mm (case)',
      material: 'Plastic',
      other: 'IP54 water resistance'
    }
  },
  {
    name: 'Nike Air Jordan 1 High',
    description: 'Iconic basketball sneakers with premium leather upper',
    price: 179,
    originalPrice: 199,
    category: 'Footwear',
    subCategory: 'Sneakers',
    brand: 'Nike',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'],
    stock: 32,
    rating: 4.7,
    reviewCount: 89,
    isActive: true,
    tags: ['nike', 'jordan', 'sneakers', 'basketball'],
    specifications: {
      color: 'Black/Red',
      size: 'US 8-13',
      weight: '400g',
      material: 'Leather',
      other: 'Air cushioning'
    }
  },
  {
    name: 'Adidas Ultraboost 23',
    description: 'Running shoes with BOOST energy return foam',
    price: 189,
    category: 'Footwear',
    subCategory: 'Running',
    brand: 'Adidas',
    images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500'],
    stock: 28,
    rating: 4.6,
    reviewCount: 112,
    isFeatured: true,
    isActive: true,
    tags: ['adidas', 'running', 'ultraboost', 'boost'],
    specifications: {
      color: 'Core Black',
      size: 'US 7-14',
      weight: '310g',
      material: 'Primeknit/Textile',
      other: 'Continental rubber outsole'
    }
  },
  {
    name: 'Apple Watch Series 9',
    description: 'Smartwatch with S9 chip, Double Tap gesture, bright display',
    price: 399,
    category: 'Wearables',
    subCategory: 'Smartwatch',
    brand: 'Apple',
    images: ['https://images.unsplash.com/photo-1682270428099-a9a857e1b6a3?w=500'],
    stock: 51,
    rating: 4.7,
    reviewCount: 78,
    isActive: true,
    tags: ['applewatch', 'smartwatch', 'fitness', 'apple'],
    specifications: {
      color: 'Midnight',
      size: '41mm/45mm',
      weight: '31.9g',
      material: 'Aluminum',
      other: 'Always-on Retina display'
    }
  },
  {
    name: 'Samsung Galaxy Watch 6',
    description: 'Android smartwatch with Wear OS 4, improved sensors',
    price: 299,
    category: 'Wearables',
    subCategory: 'Smartwatch',
    brand: 'Samsung',
    images: ['https://images.unsplash.com/photo-1628830394039-1f98e8f6a4a3?w=500'],
    stock: 37,
    rating: 4.5,
    reviewCount: 65,
    isActive: true,
    tags: ['galaxywatch', 'wearos', 'samsung', 'fitness'],
    specifications: {
      color: 'Graphite',
      size: '40mm/44mm',
      weight: '28.7g',
      material: 'Aluminum',
      other: 'BioActive sensor'
    }
  },
  {
    name: 'PlayStation 5 Slim',
    description: 'Next-gen gaming console with 1TB SSD, DualSense controller',
    price: 499,
    originalPrice: 549,
    category: 'Gaming',
    subCategory: 'Consoles',
    brand: 'Sony',
    images: ['https://images.unsplash.com/photo-1607250689864-6426948069d5?w=500'],
    stock: 12,
    rating: 4.9,
    reviewCount: 345,
    isFeatured: true,
    isActive: true,
    tags: ['ps5', 'playstation', 'gaming', 'console'],
    specifications: {
      color: 'White',
      weight: '3.2kg',
      dimensions: '390 x 104 x 260 mm',
      material: 'Plastic',
      other: '4K/120fps support'
    }
  },
  {
    name: 'Nintendo Switch OLED',
    description: 'Hybrid gaming console with 7" OLED screen, improved kickstand',
    price: 349,
    category: 'Gaming',
    subCategory: 'Handheld',
    brand: 'Nintendo',
    images: ['https://images.unsplash.com/photo-1639986149852-4ff0c1e9b8b3?w=500'],
    stock: 22,
    rating: 4.8,
    reviewCount: 289,
    isActive: true,
    tags: ['switch', 'nintendo', 'oled', 'portable'],
    specifications: {
      color: 'White',
      weight: '0.42kg (handheld)',
      dimensions: '242 x 102 x 14mm',
      material: 'Plastic',
      other: '64GB internal storage'
    }
  }
];

const seedProducts = async () => {
  try {
    await connectDB();
    console.log('Connected to DB, seeding products...');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert sample data
    await Product.insertMany(sampleProducts);
    console.log(`✅ Seeded ${sampleProducts.length} sample products successfully!`);

    // Close connection
    mongoose.connection.close();
    console.log('DB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedProducts();

