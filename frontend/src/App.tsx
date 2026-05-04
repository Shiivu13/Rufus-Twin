import { ShoppingBag } from 'lucide-react';
import { ChatComponent } from './components/ChatComponent';
import { ProductCard } from './components/ProductCard';
import { ThreeBackground } from './components/ThreeBackground';
import './hero.css';

const recentProducts = [
  {
    id: 1,
    title: 'Neon Quantum Keyboard',
    description: 'Mechanical keyboard with ultra-low latency and programmable RGB quantum switches.'
  },
  {
    id: 2,
    title: 'Holographic Display Pro',
    description: 'Next-gen desktop monitor with transparent OLED technology and 3D projection.'
  },
  {
    id: 3,
    title: 'Neural Link Earbuds',
    description: 'Seamless audio experience with direct nerve conduction and AI noise cancellation.'
  },
  {
    id: 4,
    title: 'Aura Gaming Mouse',
    description: 'Ultralight weight mouse with zero gravity skates and 50K DPI sensor.'
  }
];

function App() {
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
            {recentProducts.map(product => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
              />
            ))}
          </div>
        </aside>

        <ChatComponent />
      </div>
    </>
  );
}

export default App;
