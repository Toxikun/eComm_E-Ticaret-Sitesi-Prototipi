-- Seeding Products into catalog_db
\c catalog_db;

INSERT INTO products (id, name, description, price, category, image_url, stock, is_active)
VALUES 
('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c91', 'Quantum V Headset', 'Experience the future of virtual reality with 8K resolution, spatial audio, and ultra-high refresh rates. Ergonomic design for maximum comfort during long sessions.', 899.99, 'Electronics', 'https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?auto=format&fit=crop&q=80&w=800', 50, true),

('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c92', 'Gravity Watch Pro', 'A masterpiece of engineering and design. Featuring a titanium case, sapphire glass, and a stunning 1.5-inch Always-On OLED display. Seamless health tracking.', 449.00, 'Accessories', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800', 120, true),

('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c93', 'Nebula Laptop X1', 'The ultimate professional workstation. Powered by a 16-core processor, 64GB RAM, and a 2TB NVMe SSD. The 120Hz Liquid Retina display brings your work to life.', 2499.00, 'Computing', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800', 25, true),

('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c94', 'Echo Pulse Earbuds', 'Pure sound, zero noise. Industry-leading active noise cancellation and crystal-clear calls. Smart switching between all your devices with Bluetooth 5.3.', 199.99, 'Electronics', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=800', 200, true),

('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c95', 'Zenith Smart Speaker', 'Ambient high-fidelity audio that fills the room. Integrated with all major voice assistants and featuring a sleek, minimalist fabric design.', 129.50, 'Electronics', 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&q=80&w=800', 85, true),

('d1a3a9a1-7b7e-4b4b-9c9c-9c9c9c9c9c96', 'Atlas Pro Backpack', 'Designed for the modern nomad. Weatherproof exterior, dedicated laptop compartment, and integrated USB charging port. Sophistication meets utility.', 89.00, 'Accessories', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', 150, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  stock = EXCLUDED.stock;
