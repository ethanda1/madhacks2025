import { useState, useEffect } from 'react' // Import useEffect for managing body class
import './App.css'

// --- ShoppingListModal Component ---
function ShoppingListModal({ shoppingList, totalCost, removeFromShoppingList, onClose, getDirections }) {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Shopping List
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {shoppingList.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
            Your shopping list is empty. Add items from the ingredients list!
          </p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex justify-between items-center border border-yellow-200 dark:border-yellow-800/50"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          title="View product page"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.name}</p>
                      )}

                      <button
                        onClick={() => removeFromShoppingList(item.id)}
                        className="px-1.5 py-0.5 rounded bg-red-400 hover:bg-red-500 text-white text-xs transition-colors ml-2 flex-shrink-0"
                        title="Remove item"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="mt-1">
                      {item.price ? (
                        <span className="font-bold text-green-700 dark:text-green-400 text-sm">
                          ${parseFloat(String(item.price).replace(/[^0-9.]/g, '')).toFixed(2)}
                          {item.store && (
                            <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">@ {item.store}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">No price</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">Estimated Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalCost.toFixed(2)}</div>
            </div>

            <button
              onClick={() => {
                getDirections();
                onClose();
              }}
              className="w-full mt-3 py-2 rounded-lg font-medium text-white text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Get Cooking Directions
            </button>
          </>
        )}
      </div>
    </div>
  );
}
// --- End ShoppingListModal Component ---


function App() {
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

  // Common store names for autocomplete
  const commonStores = [
    "Walmart", "Target", "Kroger", "Safeway", "Albertsons",
    "Publix", "Whole Foods", "Trader Joe's", "Aldi", "Costco",
    "Sam's Club", "H-E-B", "Wegmans", "Meijer", "Food Lion",
    "Giant Eagle", "ShopRite", "Stop & Shop", "Harris Teeter",
    "Sprouts", "Fresh Market", "Hy-Vee", "Winco", "Food 4 Less"
  ];

  // Filter stores based on search term
  const filteredStores = storeSearchTerm
    ? commonStores.filter(store =>
        store.toLowerCase().includes(storeSearchTerm.toLowerCase())
      )
    : commonStores;

  // Filter cities based on search term
  const filteredCities = locationSearchTerm
    ? cities.filter(city =>
        city.toLowerCase().includes(locationSearchTerm.toLowerCase())
      )
    : cities;

  // Load cities from JSON file
  useEffect(() => {
    fetch('/US_States_and_Cities.json')
      .then(response => response.json())
      .then(data => {
        // Transform the JSON into "City, State" format
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

  // NEW STATE: Dark Mode Management
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize state from localStorage or default to false
    const savedMode = localStorage.getItem('darkMode');
    return savedMode === 'true' ? true : false;
  });

  // EFFECT: Apply the 'dark' class to the <html> tag based on state
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

  // TOGGLE FUNCTION: Toggles the dark mode state
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };
  
  // NOTE: Keeping the helper functions here for brevity, assuming they are imported
  // or defined correctly in the full component logic.

  async function fetchPrice(itemName) {
    // ... (fetchPrice logic unchanged)
    try {
      let url = `http://127.0.0.1:5000/api/target-price?item=${encodeURIComponent(itemName)}`;

      if (location) {
        // Append ", United States" to location for API call
        const locationWithCountry = `${location}, United States`;
        url += `&location=${encodeURIComponent(locationWithCountry)}`;
      }

      if (storeFilter === "specific" && specificStore) {
        url += `&store=${encodeURIComponent(specificStore)}`;
      } else if (storeFilter === "nearby" && location) {
        // For nearby, we'll use location but no specific store filter
        // The API will return results relevant to the location
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      return {
        price: data.price || null,
        stores: data.stores || {},
        storeDetails: data.store_details || {}, // Full store details with logos
        source: data.source || 'unknown',
        link: data.link || null, // Best price link (if returned directly)
        note: data.note || null
      };
    } catch (err) {
      console.error("fetchPrice error:", err);
      return null;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function addPriceToItem(id) {
    setGeneratedIngredients((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, loading: true } : i
      )
    );

    const item = generatedIngredients.find((i) => i.id === id);
    const priceData = await fetchPrice(item.name);

    if (priceData) {
      setGeneratedIngredients((prev) =>
        prev.map((i) =>
          i.id === id ? { 
            ...i, 
            price: priceData.price, 
            stores: priceData.stores,
            storeDetails: priceData.storeDetails, // Include store details with logos
            priceSource: priceData.source,
            priceLink: priceData.link, // Include best price link
            priceNote: priceData.note,
            loading: false 
          } : i
        )
      );
    } else {
      setGeneratedIngredients((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, loading: false } : i
        )
      );
    }
  }

  // Remove an item from the shopping list
  function removeFromShoppingList(id) {
    setShoppingList((prev) => prev.filter((i) => i.id !== id));
  }

  // Add a specific store price for an ingredient to the shopping list
  function addToShoppingListWithStore(item, store, price) {
    const entryId = `${item.id}-${store}`;
    // Check if an item with the same baseId is already in the list
    if (shoppingList.find((s) => s.baseId === item.id)) {
        // Find and remove all entries with the same baseId before adding the new one
        setShoppingList(prev => prev.filter(s => s.baseId !== item.id));
    }
    const storeDetail = (item.storeDetails && item.storeDetails[store]) || null;
    const shoppingItem = {
      id: entryId,
      baseId: item.id,
      name: item.name,
      price: price,
      store: store,
      link: storeDetail?.link || null, // Use specific store link
      storeDetail,
    };
    setShoppingList((prev) => [...prev.filter(s => s.baseId !== item.id), shoppingItem]);
  }

  async function generateIngredients() {
    if (!mealIdea.trim()) return;

    // Validate store and location selections
    setValidationAttempted(true);

    // Check if specific store is required and valid
    if (storeFilter === "specific") {
      const storeIsValid = commonStores.includes(specificStore);
      setIsStoreValid(storeIsValid);
      if (!storeIsValid) return;
    }

    // Check if location is required and valid
    if (storeFilter !== "all") {
      const locationIsValid = cities.includes(location);
      setIsLocationValid(locationIsValid);
      if (!locationIsValid) return;
    }

    setIsGenerating(true);
    setGeneratedIngredients([]); // Clear previous ingredients
    setShoppingList([]); // Clear previous shopping list
    
    try {
      const res = await fetch("http://127.0.0.1:5000/api/generate-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mealIdea }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show the actual error message from the backend
        throw new Error(data.error || data.message || "Network response was not ok");
      }
      
      if (data.success && data.ingredients) {
        // Assign a unique ID and set loading state for initial rendering
        const ingredients = data.ingredients.map((i, index) => ({ 
          ...i, 
          id: `${Date.now()}-${index}`, // Ensure unique ID
          price: null, 
          loading: true 
        }));
        setGeneratedIngredients(ingredients);
        
        // Automatically fetch prices for all ingredients
        fetchAllPrices(ingredients);
      } else {
        throw new Error(data.error || "Failed to generate recipe");
      }
    } catch (err) {
      console.error("generateIngredients error:", err);
      // Show the actual error message to the user
      alert(err.message || "Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function fetchAllPrices(ingredients) {
    // Fetch prices for all ingredients in parallel for efficiency
    const pricePromises = ingredients.map(async (item) => {
      try {
        const priceData = await fetchPrice(item.name);
        return { id: item.id, priceData };
      } catch (error) {
        console.error(`Error fetching price for ${item.name}:`, error);
        return { id: item.id, priceData: null };
      }
    });

    // Wait for all prices to be fetched
    const results = await Promise.all(pricePromises);

    // Update ingredients with fetched prices
    setGeneratedIngredients((prev) =>
      prev.map((ingredient) => {
        const result = results.find((r) => r.id === ingredient.id);
        if (result && result.priceData) {
          return {
            ...ingredient,
            price: result.priceData.price,
            stores: result.priceData.stores,
            storeDetails: result.priceData.storeDetails,
            priceSource: result.priceData.source,
            priceLink: result.priceData.link, // Include best price link
            priceNote: result.priceData.note,
            loading: false,
          };
        }
        return { ...ingredient, loading: false };
      })
    );
  }

  // Add the best-priced item to the shopping list
  function addToShoppingList(item) {
    const baseId = item.id;
    // Check if an item with the same baseId is already in the list
    if (shoppingList.find((i) => i.baseId === baseId)) {
        // Find and remove all entries with the same baseId before adding the new one
        setShoppingList(prev => prev.filter(s => s.baseId !== baseId));
    }
    
    const shoppingItem = { 
      ...item, 
      id: baseId, // Use the base ID for simple best-price entry
      baseId: baseId,
      price: item.price, 
      store: item.priceSource,
      link: item.priceLink || (item.storeDetails && item.storeDetails[item.priceSource]?.link) || null, // Best price link
    };
    setShoppingList([...shoppingList.filter(s => s.baseId !== baseId), shoppingItem]);
  }


  // Compute automatic total: sum up item.price if numeric
  const totalCost = shoppingList.reduce((acc, it) => {
    // Safe parsing: handles null/undefined/non-string/non-numeric prices gracefully
    const priceString = String(it.price || '').replace(/[^0-9.]/g, '');
    const n = parseFloat(priceString);
    if (isNaN(n)) return acc;
    return acc + n;
  }, 0);

  function getDirections() {
    // Placeholder: in a full app we'd fetch or generate step-by-step cooking directions
    alert('This will open cooking instructions for your meal. (placeholder)');
  }

  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center transition-colors duration-200">
      
      {/* Top Bar - Minimalistic Horizontal Layout */}
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
              Recipe
            </h1>

            {/* Meal Input */}
            <input
              value={mealIdea}
              onChange={(e) => setMealIdea(e.target.value)}
              placeholder="What would you like to cook?"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />

            {/* Store Preferences */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStoreFilter("all")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  storeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStoreFilter("nearby")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  storeFilter === "nearby"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Nearby
              </button>
              <button
                onClick={() => setStoreFilter("specific")}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  storeFilter === "specific"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Specific
              </button>
            </div>

            {/* Specific Store Input with Autocomplete - Conditional */}
            {storeFilter === "specific" && (
              <div className="relative w-40">
                <input
                  value={storeSearchTerm}
                  onChange={(e) => {
                    setStoreSearchTerm(e.target.value);
                    setIsStoreValid(false); // Mark as invalid until they select from dropdown
                  }}
                  onFocus={() => setShowStoreDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
                  placeholder="Store name"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    validationAttempted && !isStoreValid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                />
                {showStoreDropdown && filteredStores.length > 0 && (
                  <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    {filteredStores.map((store) => (
                      <button
                        key={store}
                        onClick={() => {
                          setSpecificStore(store);
                          setStoreSearchTerm(store);
                          setIsStoreValid(true);
                          setShowStoreDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                )}
                {validationAttempted && !isStoreValid && (
                  <p className="absolute text-xs text-red-500 mt-1">Please select a store from the dropdown</p>
                )}
              </div>
            )}

            {/* Location Input with Autocomplete - Conditional */}
            {storeFilter !== "all" && (
              <div className="relative w-48">
                <input
                  value={locationSearchTerm}
                  onChange={(e) => {
                    setLocationSearchTerm(e.target.value);
                    setIsLocationValid(false); // Mark as invalid until they select from dropdown
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                  placeholder="City, State"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    validationAttempted && !isLocationValid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                />
                {showLocationDropdown && filteredCities.length > 0 && (
                  <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    {filteredCities.slice(0, 50).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city);
                          setLocationSearchTerm(city);
                          setIsLocationValid(true);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {validationAttempted && !isLocationValid && (
                  <p className="absolute text-xs text-red-500 mt-1">Please select a city from the dropdown</p>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateIngredients}
              disabled={isGenerating}
              className={`px-6 py-2 rounded-lg font-medium text-white text-sm transition-colors whitespace-nowrap ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </span>
              ) : (
                "Generate"
              )}
            </button>

            {/* Chef Hat Button */}
            <button
              onClick={() => setShowShoppingList(true)}
              className="relative p-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white"
              title="View Shopping List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.5 1.5c-1.3 0-2.5.5-3.5 1.3C8 2.5 6.8 2 5.5 2 3 2 1 4 1 6.5c0 1.7.9 3.1 2.3 3.8V21c0 .6.4 1 1 1h15.4c.6 0 1-.4 1-1V10.3c1.4-.7 2.3-2.1 2.3-3.8C23 4 21 2 18.5 2c-1.3 0-2.5.5-3.5 1.3-1-1.3-2.2-1.8-3.5-1.8zm0 2c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9 1.4 0 2.5 1.1 2.5 2.5S19.2 8.5 17.8 8.5c-.6 0-1 .4-1 1V20H7.2v-10.5c0-.6-.4-1-1-1C4.8 8.5 3.7 7.4 3.7 6s1.1-2.5 2.5-2.5c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9z"/>
              </svg>
              {shoppingList.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-6 py-4 w-full">

        {/* Generated Ingredient List */}
        {generatedIngredients.length > 0 && (
          <div className="w-full">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ingredients</h2>
            </div>

            <div className="space-y-2">
              {generatedIngredients.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{item.name}</p>
                    {item.loading && (
                      <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {storeFilter === "all" && "Fetching prices from all stores..."}
                        {storeFilter === "nearby" && "Fetching prices from nearby stores..."}
                        {storeFilter === "specific" && specificStore && `Fetching prices from ${specificStore}...`}
                        {storeFilter === "specific" && !specificStore && "Fetching prices..."}
                      </div>
                    )}
                    {item.price && (
                      <div className="mt-1">
                        {/* Best Price with Store Logo and Clickable Link */}
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 flex-1">
                            {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].icon && (
                              <img
                                src={item.storeDetails[item.priceSource].icon}
                                alt={item.priceSource}
                                className="w-6 h-6 rounded object-contain bg-white p-0.5"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="flex-1">
                              {/* Use item.priceLink for the best price, falling back to store details link */}
                              {(item.priceLink || (item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].link)) ? (
                                <a
                                  href={item.priceLink || item.storeDetails[item.priceSource].link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-700 dark:text-green-400 font-bold text-sm hover:text-green-800 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
                                >
                                  Best Price: {item.price} {item.priceSource && `@ ${item.priceSource}`}
                                </a>
                              ) : (
                                <p className="text-green-700 dark:text-green-400 font-bold text-sm">
                                  {item.price} {item.priceSource && `@ ${item.priceSource}`}
                                </p>
                              )}
                              <div className="flex items-center gap-1 mt-0.5">
                                {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].nearby && (
                                  <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                                    {item.storeDetails[item.priceSource].nearby}
                                  </span>
                                )}
                                {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].discount && (
                                  <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded font-semibold">
                                    {item.storeDetails[item.priceSource].discount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Add to List Button for Best Price (on the right) */}
                          {!item.loading && item.price && (() => {
                            const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === item.priceSource);
                            return (
                              <button
                                onClick={() => addToShoppingList(item)}
                                disabled={isSelected}
                                className={`ml-2 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1 ${
                                  isSelected
                                    ? 'bg-gray-400 text-white cursor-not-allowed'
                                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                }`}
                                title={isSelected ? 'Already on list' : 'Add best price to list'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                {isSelected ? 'Added' : 'Add'}
                              </button>
                            );
                          })()}
                        </div>
                        
                        {/* All Store Prices with Logos - Collapsible Dropdown */}
                        {item.stores && Object.keys(item.stores).length > 1 && (
                          <div className="mt-2">
                            <button
                              onClick={() => setExpandedPrices(prev => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }))}
                              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            >
                              <span className="text-sm transition-transform duration-200" style={{transform: expandedPrices[item.id] ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
                              <span>All {Object.keys(item.stores).length} stores</span>
                            </button>
                            {expandedPrices[item.id] && (
                              <div className="mt-2 space-y-1 pl-3 border-l-2 border-blue-300 dark:border-blue-700">
                                {Object.entries(item.stores).map(([store, price]) => {
                                  const storeDetail = item.storeDetails && item.storeDetails[store];
                                  const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === store);
                                  return (
                                    <div key={store} className="flex items-center justify-between text-xs p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <div className='flex items-center gap-2 flex-1'>
                                          {storeDetail && storeDetail.icon && (
                                              <img
                                              src={storeDetail.icon}
                                              alt={store}
                                              className="w-5 h-5 rounded object-contain bg-white p-0.5"
                                              onError={(e) => { e.target.style.display = 'none'; }}
                                              />
                                          )}
                                          <div className='flex-1'>
                                              {storeDetail && storeDetail.link ? (
                                                  <a
                                                  href={storeDetail.link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer"
                                                  >
                                                  {store}: <span className="text-green-600 dark:text-green-400 font-semibold">{price}</span>
                                                  </a>
                                              ) : (
                                                  <span className="text-gray-700 dark:text-gray-300">
                                                  {store}: <span className="text-green-600 dark:text-green-400 font-semibold">{price}</span>
                                                  </span>
                                              )}
                                              <div className="flex items-center gap-1 mt-0.5">
                                                  {storeDetail && storeDetail.nearby && (
                                                      <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">
                                                          {storeDetail.nearby}
                                                      </span>
                                                  )}
                                                  {storeDetail && storeDetail.discount && (
                                                      <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/30 px-1 py-0.5 rounded font-semibold">
                                                          {storeDetail.discount}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>

                                      {/* Add to list button for each store price (on the right) */}
                                      <button
                                          onClick={() => addToShoppingListWithStore(item, store, price)}
                                          disabled={isSelected}
                                          className={`px-2 py-0.5 rounded text-xs transition-colors ml-2 ${
                                              isSelected
                                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                          }`}
                                          title={isSelected ? 'Already on list' : `Add ${store} price to list`}
                                      >
                                          {isSelected ? 'Added' : '+ Add'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        {item.priceNote && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded">{item.priceNote}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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
      
      {/* DARK MODE TOGGLE BUTTON - FIXED BOTTOM RIGHT */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-3 right-3 p-2.5 rounded-lg bg-yellow-400 dark:bg-indigo-600 text-gray-900 dark:text-white shadow-lg hover:shadow-xl transition-all z-40"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default App