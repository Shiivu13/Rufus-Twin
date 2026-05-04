import { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { ChatComponent } from './components/ChatComponent';
import { ProductCard } from './components/ProductCard';
import { ThreeBackground } from './components/ThreeBackground';
import './hero.css';

interface Product {
  id: string | number;
  name: string;
  description: string;
  price?: string;
}

function App() {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('http://localhost:8000/products');
        if (res.ok) {
          const data = await res.json();
          setRecentProducts(data.products || []);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <ThreeBackground />

      <div className="bg-orbs-container" style={{ opacity: 0.3 }}>
        <div className="orb orb-purple"></div>
        <div className="orb orb-blue"></div>
      </div>

      <div className="app-container">
        <aside className="glass-panel sidebar">
          <div className="sidebar-title">
            <ShoppingBag size={24} color="var(--accent-neon)" />
            Dashboard
          </div>
          
          <div className="products-list">
            {recentProducts.length > 0 ? (
              recentProducts.map(product => (
                <ProductCard
                  key={product.id}
                  title={product.name}
                  description={product.description}
                />
              ))
            ) : (
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem'}}>Loading products...</p>
            )}
          </div>
        </aside>

        <ChatComponent />
      </div>
    </>
  );
}

export default App;
