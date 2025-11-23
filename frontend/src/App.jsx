import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'

// Shopping List Modal Component
function ShoppingListModal({ shoppingList, totalCost, removeFromShoppingList, onClose, getDirections }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Shopping List</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-4">
          {shoppingList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>Your shopping list is empty</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shoppingList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {item.price && (
                        <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                          ${parseFloat(String(item.price).replace(/[^0-9.]/g, '')).toFixed(2)}
                        </span>
                      )}
                      {item.store && (
                        <span className="text-xs text-slate-500">{item.store}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromShoppingList(item.id)}
                    className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {shoppingList.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">${totalCost.toFixed(2)}</span>
            </div>
            <button
              onClick={() => {
                getDirections();
                onClose();
              }}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-medium transition-colors"
            >
              View Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const navigate = useNavigate();
  const [mealIdea, setMealIdea] = useState("");
  const [generatedIngredients, setGeneratedIngredients] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [location, setLocation] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [specificStore, setSpecificStore] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPrices, setExpandedPrices] = useState({});
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [cities, setCities] = useState([]);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [locationSearchTerm, setLocationSearchTerm] = useState("");
  const [isStoreValid, setIsStoreValid] = useState(true);
  const [isLocationValid, setIsLocationValid] = useState(true);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [recipeData, setRecipeData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true';
  });

  // Common store names
  const commonStores = [
    "Walmart", "Target", "Kroger", "Safeway", "Albertsons",
    "Publix", "Whole Foods", "Trader Joe's", "Aldi", "Costco",
    "Sam's Club", "H-E-B", "Wegmans", "Meijer", "Food Lion",
    "Giant Eagle", "ShopRite", "Stop & Shop", "Harris Teeter",
    "Sprouts", "Fresh Market", "Hy-Vee", "Winco", "Food 4 Less"
  ];

  const filteredStores = storeSearchTerm
    ? commonStores.filter(store => store.toLowerCase().includes(storeSearchTerm.toLowerCase()))
    : commonStores;

  const filteredCities = locationSearchTerm
    ? cities.filter(city => city.toLowerCase().includes(locationSearchTerm.toLowerCase()))
    : cities;

  // Load cities from JSON file
  useEffect(() => {
    fetch('/US_States_and_Cities.json')
      .then(response => response.json())
      .then(data => {
        const cityList = [];
        Object.entries(data).forEach(([state, cities]) => {
          cities.forEach(city => {
            cityList.push(`${city}, ${state}`);
          });
        });
        setCities(cityList);
      })
      .catch(err => console.error('Error loading cities:', err));
  }, []);

  // Reset validation when store filter changes
  useEffect(() => {
    setValidationAttempted(false);
    setIsStoreValid(true);
    setIsLocationValid(true);
    setStoreSearchTerm("");
    setLocationSearchTerm("");
    setSpecificStore("");
    setLocation("");
  }, [storeFilter]);

  // Dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  async function fetchPrice(itemName) {
    try {
      let url = `http://127.0.0.1:5000/api/target-price?item=${encodeURIComponent(itemName)}`;

      if (location) {
        const locationWithCountry = `${location}, United States`;
        url += `&location=${encodeURIComponent(locationWithCountry)}`;
      }

      if (storeFilter === "specific" && specificStore) {
        url += `&store=${encodeURIComponent(specificStore)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      return {
        price: data.price || null,
        stores: data.stores || {},
        storeDetails: data.store_details || {},
        source: data.source || 'unknown',
        link: data.link || null,
        note: data.note || null
      };
    } catch (err) {
      console.error("fetchPrice error:", err);
      return null;
    }
  }

  function removeFromShoppingList(id) {
    setShoppingList((prev) => prev.filter((i) => i.id !== id));
  }

  function addToShoppingListWithStore(item, store, price) {
    const entryId = `${item.id}-${store}`;
    if (shoppingList.find((s) => s.baseId === item.id)) {
        setShoppingList(prev => prev.filter(s => s.baseId !== item.id));
    }
    const storeDetail = (item.storeDetails && item.storeDetails[store]) || null;
    const shoppingItem = {
      id: entryId,
      baseId: item.id,
      name: item.name,
      price: price,
      store: store,
      link: storeDetail?.link || null,
      storeDetail,
    };
    setShoppingList((prev) => [...prev.filter(s => s.baseId !== item.id), shoppingItem]);
  }

  async function generateIngredients() {
    if (!mealIdea.trim()) return;

    setValidationAttempted(true);

    if (storeFilter === "specific") {
      const storeIsValid = commonStores.includes(specificStore);
      setIsStoreValid(storeIsValid);
      if (!storeIsValid) return;
    }

    if (storeFilter !== "all") {
      const locationIsValid = cities.includes(location);
      setIsLocationValid(locationIsValid);
      if (!locationIsValid) return;
    }

    setIsGenerating(true);
    setGeneratedIngredients([]);
    setShoppingList([]);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealIdea }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Network response was not ok");
      }

      if (data.success && data.ingredients) {
        setRecipeData({
          recipe: data.recipe,
          instructions: data.instructions,
          mealIdea: mealIdea
        });

        const ingredients = data.ingredients.map((i, index) => ({
          ...i,
          id: `${Date.now()}-${index}`,
          price: null,
          loading: true
        }));

        // Show all ingredients immediately
        setGeneratedIngredients(ingredients);

        // Fetch all prices in parallel (much faster!)
        fetchPricesInParallel(ingredients);
      } else {
        throw new Error(data.error || "Failed to generate recipe");
      }
    } catch (err) {
      console.error("generateIngredients error:", err);
      alert(err.message || "Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function fetchPricesInParallel(ingredients) {
    // Fetch all prices simultaneously (parallel) instead of one-by-one (sequential)
    // This is MUCH faster!
    const pricePromises = ingredients.map(async (item) => {
      try {
        const priceData = await fetchPrice(item.name);

        // Update this specific ingredient as soon as its price is ready
        setGeneratedIngredients((prev) =>
          prev.map((ing) =>
            ing.id === item.id
              ? {
                  ...ing,
                  price: priceData?.price || null,
                  stores: priceData?.stores || {},
                  storeDetails: priceData?.storeDetails || {},
                  priceSource: priceData?.source || null,
                  priceLink: priceData?.link || null,
                  priceNote: priceData?.note || null,
                  loading: false,
                }
              : ing
          )
        );
      } catch (error) {
        console.error(`Error fetching price for ${item.name}:`, error);
        setGeneratedIngredients((prev) =>
          prev.map((ing) =>
            ing.id === item.id ? { ...ing, loading: false } : ing
          )
        );
      }
    });

    // Wait for all prices to complete
    await Promise.all(pricePromises);
  }

  function addToShoppingList(item) {
    const baseId = item.id;
    if (shoppingList.find((i) => i.baseId === baseId)) {
        setShoppingList(prev => prev.filter(s => s.baseId !== baseId));
    }

    const shoppingItem = {
      ...item,
      id: baseId,
      baseId: baseId,
      price: item.price,
      store: item.priceSource,
      link: item.priceLink || (item.storeDetails && item.storeDetails[item.priceSource]?.link) || null,
    };
    setShoppingList([...shoppingList.filter(s => s.baseId !== baseId), shoppingItem]);
  }

  const totalCost = shoppingList.reduce((acc, it) => {
    const priceString = String(it.price || '').replace(/[^0-9.]/g, '');
    const n = parseFloat(priceString);
    if (isNaN(n)) return acc;
    return acc + n;
  }, 0);

  function getDirections() {
    if (!recipeData) {
      alert('Please generate a recipe first!');
      return;
    }

    navigate('/recipe', {
      state: {
        recipe: recipeData.recipe,
        instructions: recipeData.instructions,
        ingredients: generatedIngredients,
        shoppingList: shoppingList,
        mealIdea: recipeData.mealIdea
      }
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-cyan-600 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.5 1.5c-1.3 0-2.5.5-3.5 1.3C8 2.5 6.8 2 5.5 2 3 2 1 4 1 6.5c0 1.7.9 3.1 2.3 3.8V21c0 .6.4 1 1 1h15.4c.6 0 1-.4 1-1V10.3c1.4-.7 2.3-2.1 2.3-3.8C23 4 21 2 18.5 2c-1.3 0-2.5.5-3.5 1.3-1-1.3-2.2-1.8-3.5-1.8zm0 2c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9 1.4 0 2.5 1.1 2.5 2.5S19.2 8.5 17.8 8.5c-.6 0-1 .4-1 1V20H7.2v-10.5c0-.6-.4-1-1-1C4.8 8.5 3.7 7.4 3.7 6s1.1-2.5 2.5-2.5c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9z" />
                </svg>
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">RecipeAI</span>
            </div>

            {/* Search Input */}
            <input
              value={mealIdea}
              onChange={(e) => setMealIdea(e.target.value)}
              placeholder="What would you like to cook?"
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-0 rounded text-sm text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 outline-none"
            />

            {/* Store Filter */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded">
              <button
                onClick={() => setStoreFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  storeFilter === "all"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStoreFilter("nearby")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  storeFilter === "nearby"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Nearby
              </button>
              <button
                onClick={() => setStoreFilter("specific")}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  storeFilter === "specific"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Specific
              </button>
            </div>

            {/* Store Input */}
            {storeFilter === "specific" && (
              <div className="relative w-32">
                <input
                  value={storeSearchTerm}
                  onChange={(e) => {
                    setStoreSearchTerm(e.target.value);
                    setIsStoreValid(false);
                  }}
                  onFocus={() => setShowStoreDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
                  placeholder="Store"
                  className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm ${
                    validationAttempted && !isStoreValid ? 'ring-2 ring-red-500' : ''
                  } focus:ring-2 focus:ring-cyan-500 outline-none`}
                />
                {showStoreDropdown && filteredStores.length > 0 && (
                  <div className="absolute top-full mt-1 w-48 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                    {filteredStores.map((store) => (
                      <button
                        key={store}
                        onClick={() => {
                          setSpecificStore(store);
                          setStoreSearchTerm(store);
                          setIsStoreValid(true);
                          setShowStoreDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Location Input */}
            {storeFilter !== "all" && (
              <div className="relative w-36">
                <input
                  value={locationSearchTerm}
                  onChange={(e) => {
                    setLocationSearchTerm(e.target.value);
                    setIsLocationValid(false);
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                  placeholder="Location"
                  className={`w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded text-sm ${
                    validationAttempted && !isLocationValid ? 'ring-2 ring-red-500' : ''
                  } focus:ring-2 focus:ring-cyan-500 outline-none`}
                />
                {showLocationDropdown && filteredCities.length > 0 && (
                  <div className="absolute top-full mt-1 w-48 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg z-50">
                    {filteredCities.slice(0, 50).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city);
                          setLocationSearchTerm(city);
                          setIsLocationValid(true);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateIngredients}
              disabled={isGenerating}
              className={`px-4 py-2 rounded text-sm font-medium text-white ${
                isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-700'
              } transition-colors`}
            >
              {isGenerating ? 'Loading...' : 'Generate'}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setShowShoppingList(true)}
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {shoppingList.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-600 text-white text-xs flex items-center justify-center rounded-full">
                  {shoppingList.length}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {isGenerating && generatedIngredients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-12 w-12 text-cyan-600 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg text-slate-600 dark:text-slate-400">Getting ingredients...</p>
          </div>
        )}

        {generatedIngredients.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Ingredients</h2>

            <div className="space-y-3">
              {generatedIngredients.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Thumbnail */}
                    {item.storeDetails && item.storeDetails[item.priceSource]?.thumbnail && (
                      <img
                        src={item.storeDetails[item.priceSource].thumbnail}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded border border-slate-200 dark:border-slate-700"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 dark:text-white mb-2">{item.name}</h3>

                      {item.loading && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>
                            {storeFilter === "all" && "Searching stores..."}
                            {storeFilter === "nearby" && "Finding nearby..."}
                            {storeFilter === "specific" && specificStore && `Checking ${specificStore}...`}
                          </span>
                        </div>
                      )}

                      {item.price && (
                        <div>
                          {/* Best Price */}
                          <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded mb-2">
                            <div className="flex items-center gap-3">
                              {item.storeDetails && item.storeDetails[item.priceSource]?.icon && (
                                <img
                                  src={item.storeDetails[item.priceSource].icon}
                                  alt={item.priceSource}
                                  className="w-8 h-8 object-contain"
                                />
                              )}
                              <div>
                                <div className="text-xs text-slate-500 mb-0.5">Best Price</div>
                                <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                                  {item.price}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {item.priceSource && (
                                    <span className="text-xs text-slate-600">{item.priceSource}</span>
                                  )}
                                  {item.storeDetails && item.storeDetails[item.priceSource]?.discount && (
                                    <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded font-medium">
                                      {item.storeDetails[item.priceSource].discount}
                                    </span>
                                  )}
                                  {item.storeDetails && item.storeDetails[item.priceSource]?.nearby && (
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                      {item.storeDetails[item.priceSource].nearby}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(() => {
                              const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === item.priceSource);
                              return (
                                <button
                                  onClick={() => addToShoppingList(item)}
                                  disabled={isSelected}
                                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                    isSelected
                                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                      : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                  }`}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </button>
                              );
                            })()}
                          </div>

                          {/* All Stores */}
                          {item.stores && Object.keys(item.stores).length > 1 && (
                            <div>
                              <button
                                onClick={() => setExpandedPrices(prev => ({
                                  ...prev,
                                  [item.id]: !prev[item.id]
                                }))}
                                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                              >
                                <svg className={`w-4 h-4 transition-transform ${expandedPrices[item.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                View {Object.keys(item.stores).length} stores
                              </button>

                              {expandedPrices[item.id] && (
                                <div className="mt-2 space-y-1">
                                  {Object.entries(item.stores).map(([store, price]) => {
                                    const storeDetail = item.storeDetails && item.storeDetails[store];
                                    const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === store);
                                    return (
                                      <div key={store} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded text-sm">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          {storeDetail?.icon && (
                                            <img src={storeDetail.icon} alt={store} className="w-6 h-6 object-contain flex-shrink-0" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium">{store}</div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{price}</span>
                                              {storeDetail?.discount && (
                                                <span className="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded font-medium">
                                                  {storeDetail.discount}
                                                </span>
                                              )}
                                              {storeDetail?.nearby && (
                                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                  {storeDetail.nearby}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => addToShoppingListWithStore(item, store, price)}
                                          disabled={isSelected}
                                          className={`px-2 py-1 rounded text-xs font-medium ${
                                            isSelected
                                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                                              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                          }`}
                                        >
                                          {isSelected ? 'Added' : 'Add'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Shopping List Modal */}
      {showShoppingList && (
        <ShoppingListModal
          shoppingList={shoppingList}
          totalCost={totalCost}
          removeFromShoppingList={removeFromShoppingList}
          onClose={() => setShowShoppingList(false)}
          getDirections={getDirections}
        />
      )}
    </div>
  );
}

export default App;
