import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [apiStatus, setApiStatus] = useState('Checking...');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'Other',
    expiryDate: '',
    quantity: '1',
    notes: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('expiry');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['Dairy', 'Meat', 'Vegetables', 'Fruits', 'Pantry', 'Frozen', 'Beverages', 'Other'];

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setApiStatus(data.message))
      .catch(err => setApiStatus('API connection failed'));
    
    loadFoodItems();
  }, []);

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/food');
      const data = await response.json();
      
      if (data.success) {
        setItems(data.data);
      } else {
        setError('Failed to load items');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.name) {
      setError('Please enter an item name');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem)
      });

      const data = await response.json();
      
      if (data.success) {
        setItems([...items, data.data]);
        setNewItem({ name: '', category: 'Other', expiryDate: '', quantity: '1', notes: '' });
        setShowAddForm(false);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartEstimate = async () => {
    if (!newItem.name) {
      setError('Please enter an item name first');
      return;
    }

    try {
      setEstimating(true);
      const response = await fetch(`/api/food/estimate?name=${encodeURIComponent(newItem.name)}&category=${newItem.category}`);
      const data = await response.json();
      
      if (data.success) {
        const estimation = data.data;
        setNewItem(prev => ({
          ...prev,
          expiryDate: estimation.estimatedDate,
          notes: `FDA Estimate: ${estimation.daysFromNow} days (${estimation.confidence} confidence)`
        }));
        
        setError(`✅ Smart estimate applied! Based on FDA guidelines, ${newItem.name} should last ${estimation.daysFromNow} days.`);
        setTimeout(() => setError(''), 4000);
      } else {
        setError('Failed to get smart estimate');
      }
    } catch (err) {
      setError('Failed to get smart estimate');
    } finally {
      setEstimating(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/food/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setItems(items.filter(item => item.id !== id));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleVoiceInput = async () => {
    setError('🎤 Voice input feature coming soon with Gemini AI!');
    setTimeout(() => setError(''), 3000);
  };

  const handlePhotoScan = async () => {
    setError('📷 Photo scanning feature coming soon with Gemini AI!');
    setTimeout(() => setError(''), 3000);
  };

  const handleReceiptScan = async () => {
    setError('📄 Receipt scanning feature coming soon with Gemini AI!');
    setTimeout(() => setError(''), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'expired': return 'status-expired';
      case 'critical': return 'status-critical';
      case 'warning': return 'status-warning';
      default: return 'status-fresh';
    }
  };

  const getStatusText = (item) => {
    const days = item.daysUntilExpiry;
    if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
    if (days === 0) return 'Expires today!';
    return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'expired': return '💀';
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiry':
          return new Date(a.expiryDate) - new Date(b.expiryDate);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'status':
          const statusOrder = { expired: 0, critical: 1, warning: 2, fresh: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

  const stats = {
    total: items.length,
    fresh: items.filter(item => item.status === 'fresh').length,
    warning: items.filter(item => item.status === 'warning').length,
    critical: items.filter(item => item.status === 'critical').length,
    expired: items.filter(item => item.status === 'expired').length
  };

  const renderDashboard = () => (
    <div className="dashboard">
      {/* Stats Overview */}
      <div className="stats-overview">
        <h2>📊 Food Inventory Overview</h2>
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">🏠</div>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Items</p>
            </div>
          </div>
          <div className="stat-card fresh">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.fresh}</h3>
              <p>Fresh Items</p>
            </div>
          </div>
          <div className="stat-card warning">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>{stats.warning}</h3>
              <p>Expiring Soon</p>
            </div>
          </div>
          <div className="stat-card critical">
            <div className="stat-icon">🚨</div>
            <div className="stat-content">
              <h3>{stats.critical}</h3>
              <p>Critical</p>
            </div>
          </div>
          <div className="stat-card expired">
            <div className="stat-icon">💀</div>
            <div className="stat-content">
              <h3>{stats.expired}</h3>
              <p>Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn add" onClick={() => setShowAddForm(true)}>
            <span className="action-icon">➕</span>
            <span>Add Item</span>
          </button>
          <button className="action-btn voice" onClick={handleVoiceInput}>
            <span className="action-icon">🎤</span>
            <span>Voice Add</span>
          </button>
          <button className="action-btn photo" onClick={handlePhotoScan}>
            <span className="action-icon">📷</span>
            <span>Photo Scan</span>
          </button>
          <button className="action-btn receipt" onClick={handleReceiptScan}>
            <span className="action-icon">📄</span>
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* Urgent Items */}
      {(stats.expired > 0 || stats.critical > 0) && (
        <div className="urgent-items">
          <h3>🚨 Urgent Attention Required</h3>
          <div className="urgent-list">
            {items
              .filter(item => item.status === 'expired' || item.status === 'critical')
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className={`urgent-item ${item.status}`}>
                  <span className="urgent-icon">{getStatusIcon(item.status)}</span>
                  <div className="urgent-content">
                    <strong>{item.name}</strong>
                    <span className="urgent-status">{getStatusText(item)}</span>
                  </div>
                  <button 
                    className="urgent-delete"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInventory = () => (
    <div className="inventory">
      {/* Controls */}
      <div className="inventory-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Items</option>
            <option value="fresh">Fresh</option>
            <option value="warning">Expiring Soon</option>
            <option value="critical">Critical</option>
            <option value="expired">Expired</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="expiry">Sort by Expiry</option>
            <option value="name">Sort by Name</option>
            <option value="category">Sort by Category</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Items Grid */}
      <div className="items-section">
        <h3>📦 Your Food Items ({filteredAndSortedItems.length})</h3>
        
        {loading && <div className="loading">Loading...</div>}
        
        {filteredAndSortedItems.length === 0 && !loading ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h4>No items found</h4>
            <p>Try adjusting your search or filters, or add some items to get started!</p>
            <button className="empty-action" onClick={() => setShowAddForm(true)}>
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="items-grid">
            {filteredAndSortedItems.map(item => (
              <div key={item.id} className={`item-card ${getStatusColor(item.status)}`}>
                <div className="item-header">
                  <div className="item-title">
                    <span className="item-icon">{getStatusIcon(item.status)}</span>
                    <h4>{item.name}</h4>
                  </div>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete item"
                  >
                    ×
                  </button>
                </div>
                <div className="item-body">
                  <div className="item-meta">
                    <span className="category-tag">{item.category}</span>
                    <span className="quantity-tag">{item.quantity}</span>
                  </div>
                  <div className="item-expiry">
                    <strong>Expires:</strong> {item.expiryDate}
                  </div>
                  <div className={`item-status ${getStatusColor(item.status)}`}>
                    {getStatusText(item)}
                  </div>
                  {item.notes && (
                    <div className="item-notes">
                      <strong>Notes:</strong> {item.notes}
                    </div>
                  )}
                  {item.estimationUsed && (
                    <div className="fda-badge">🧬 FDA Guidelines Used</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>🧞‍♂️ Genie Food Tracker</h1>
            <p>AI-powered food management for smarter kitchens</p>
          </div>
          
          <div className="header-status">
            <div className={`api-status ${apiStatus.includes('running') ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {apiStatus.includes('running') ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory
          </button>
          <button 
            className={`nav-tab ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            ➕ Add Item
          </button>
        </nav>
      </header>

      <main className="main-content">
        {error && (
          <div className={`alert ${error.includes('✅') ? 'alert-success' : 'alert-error'}`}>
            <span>{error}</span>
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inventory' && renderInventory()}
        
        {(activeTab === 'add' || showAddForm) && (
          <div className="add-item-section">
            <h2>➕ Add New Food Item</h2>
            <form className="add-item-form" onSubmit={handleAddItem}>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Milk, Bread, Chicken"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="date"
                    value={newItem.expiryDate}
                    onChange={(e) => setNewItem({...newItem, expiryDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g., 1 gallon, 500g"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  placeholder="Additional notes about this item..."
                  value={newItem.notes}
                  onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleSmartEstimate}
                  disabled={estimating || !newItem.name}
                >
                  {estimating ? '🤖 Estimating...' : '🤖 Smart Estimate'}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;