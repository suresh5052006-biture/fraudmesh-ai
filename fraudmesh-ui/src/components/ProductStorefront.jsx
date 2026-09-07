import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Store, CreditCard } from 'lucide-react';

const PRODUCTS = [
  {
    id: 1,
    name: 'MacBook Pro 14"',
    price: 1999.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200&h=200&fit=crop',
    category: 'Electronics'
  },
  {
    id: 2,
    name: 'AirPods Pro',
    price: 249.00,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=200&h=200&fit=crop',
    category: 'Audio'
  },
  {
    id: 3,
    name: 'iPhone 15 Pro',
    price: 999.00,
    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&h=200&fit=crop',
    category: 'Mobile'
  },
  {
    id: 4,
    name: 'Apple Watch Ultra',
    price: 799.00,
    image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=200&h=200&fit=crop',
    category: 'Wearables'
  },
  {
    id: 5,
    name: 'iPad Air',
    price: 599.00,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&h=200&fit=crop',
    category: 'Tablets'
  },
  {
    id: 6,
    name: 'Magic Keyboard',
    price: 299.00,
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&h=200&fit=crop',
    category: 'Accessories'
  }
];

const ProductStorefront = ({ onCheckout, cart, setCart }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  const filteredProducts = selectedCategory === 'All'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === selectedCategory);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId);
      if (item.quantity > 1) {
        return prev.map(i =>
          i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter(i => i.id !== productId);
    });
  };

  const deleteFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Grid */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store size={18} className="text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Store</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition group"
            >
              <div className="aspect-square bg-slate-800 relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-900/90 text-slate-300 rounded-full">
                    {product.category}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => addToCart(product)}
                    className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-indigo-400" />
              <h3 className="font-bold text-white">Your Cart</h3>
            </div>
            {cartCount > 0 && (
              <span className="text-xs px-2 py-0.5 bg-indigo-600/30 text-indigo-300 rounded-full">
                {cartCount} items
              </span>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={24} className="text-slate-600" />
              </div>
              <p className="text-sm text-slate-400">Your cart is empty</p>
              <p className="text-xs text-slate-500 mt-1">Add products to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{item.name}</p>
                      <p className="text-xs text-emerald-400">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs text-white w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="p-1 hover:bg-slate-700 rounded text-slate-400"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => deleteFromCart(item.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 ml-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tax (8%)</span>
                  <span className="text-white">${(cartTotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-slate-700">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-emerald-400 font-bold">${(cartTotal * 1.08).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <CreditCard size={16} />
                Proceed to Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductStorefront;
