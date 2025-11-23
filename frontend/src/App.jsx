import { useState, useEffect } from 'react' // Import useEffect for managing body class
import { useNavigate } from 'react-router-dom'
import './App.css'

// --- ShoppingListModal Component ---
function ShoppingListModal({ shoppingList, totalCost, removeFromShoppingList, onClose, getDirections }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 border-b border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Shopping List
              </h2>
              <p className="text-blue-100 text-sm mt-1">{shoppingList.length} {shoppingList.length === 1 ? 'item' : 'items'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-220px)] px-6 py-4">
          {shoppingList.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg">Your shopping list is empty</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Add items from the ingredients below!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className="group p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border-2 border-yellow-200/50 dark:border-yellow-800/50 hover:border-yellow-300 dark:hover:border-yellow-700 transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 group/link"
                          title="View product page"
                        >
                          <span className="truncate">{item.name}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {item.price ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            ${parseFloat(String(item.price).replace(/[^0-9.]/g, '')).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">No price</span>
                        )}
                        {item.store && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {item.store}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromShoppingList(item.id)}
                      className="flex-shrink-0 p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all hover:scale-110 shadow-sm"
                      title="Remove item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {shoppingList.length > 0 && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Estimated Total</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ${totalCost.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => {
                getDirections();
                onClose();
              }}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Get Cooking Directions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// --- End ShoppingListModal Component ---


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
        // Store the complete recipe data for later use
        setRecipeData({
          recipe: data.recipe,
          instructions: data.instructions,
          mealIdea: mealIdea
        });

        // Display ingredients one by one as they get their prices
        const ingredients = data.ingredients.map((i, index) => ({
          ...i,
          id: `${Date.now()}-${index}`, // Ensure unique ID
          price: null,
          loading: true
        }));

        // Fetch prices one by one and update state as each completes
        fetchPricesSequentially(ingredients);
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

  async function fetchPricesSequentially(ingredients) {
    // Add ingredients to state one by one as we fetch prices
    for (let i = 0; i < ingredients.length; i++) {
      const item = ingredients[i];

      // Add the ingredient to the displayed list
      setGeneratedIngredients((prev) => [...prev, item]);

      // Fetch price for this ingredient
      try {
        const priceData = await fetchPrice(item.name);

        // Update this specific ingredient with its price data
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
        // Mark as not loading even if price fetch failed
        setGeneratedIngredients((prev) =>
          prev.map((ing) =>
            ing.id === item.id ? { ...ing, loading: false } : ing
          )
        );
      }
    }
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
    if (!recipeData) {
      alert('Please generate a recipe first!');
      return;
    }

    // Navigate to recipe page with all the data
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 transition-colors duration-200">

      {/* Top Bar - Modern Header */}
      <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            {/* Title with Icon */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.5 1.5c-1.3 0-2.5.5-3.5 1.3C8 2.5 6.8 2 5.5 2 3 2 1 4 1 6.5c0 1.7.9 3.1 2.3 3.8V21c0 .6.4 1 1 1h15.4c.6 0 1-.4 1-1V10.3c1.4-.7 2.3-2.1 2.3-3.8C23 4 21 2 18.5 2c-1.3 0-2.5.5-3.5 1.3-1-1.3-2.2-1.8-3.5-1.8zm0 2c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9 1.4 0 2.5 1.1 2.5 2.5S19.2 8.5 17.8 8.5c-.6 0-1 .4-1 1V20H7.2v-10.5c0-.6-.4-1-1-1C4.8 8.5 3.7 7.4 3.7 6s1.1-2.5 2.5-2.5c.8 0 1.5.3 2.1.9.3.3.8.3 1.1 0 .6-.6 1.3-.9 2.1-.9z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                RecipeAI
              </h1>
            </div>

            {/* Meal Input */}
            <div className="flex-1 relative">
              <input
                value={mealIdea}
                onChange={(e) => setMealIdea(e.target.value)}
                placeholder="What would you like to cook today?"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Store Preferences */}
            <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <button
                onClick={() => setStoreFilter("all")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  storeFilter === "all"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                All Stores
              </button>
              <button
                onClick={() => setStoreFilter("nearby")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  storeFilter === "nearby"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Nearby
              </button>
              <button
                onClick={() => setStoreFilter("specific")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  storeFilter === "specific"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                Specific
              </button>
            </div>

            {/* Specific Store Input with Autocomplete - Conditional */}
            {storeFilter === "specific" && (
              <div className="relative w-48">
                <input
                  value={storeSearchTerm}
                  onChange={(e) => {
                    setStoreSearchTerm(e.target.value);
                    setIsStoreValid(false); // Mark as invalid until they select from dropdown
                  }}
                  onFocus={() => setShowStoreDropdown(true)}
                  onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
                  placeholder="Store name"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    validationAttempted && !isStoreValid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm`}
                />
                {showStoreDropdown && filteredStores.length > 0 && (
                  <div className="absolute top-full mt-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50">
                    {filteredStores.map((store) => (
                      <button
                        key={store}
                        onClick={() => {
                          setSpecificStore(store);
                          setStoreSearchTerm(store);
                          setIsStoreValid(true);
                          setShowStoreDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                )}
                {validationAttempted && !isStoreValid && (
                  <p className="absolute top-full mt-1 text-xs text-red-500 font-medium">Please select a store from the dropdown</p>
                )}
              </div>
            )}

            {/* Location Input with Autocomplete - Conditional */}
            {storeFilter !== "all" && (
              <div className="relative w-52">
                <input
                  value={locationSearchTerm}
                  onChange={(e) => {
                    setLocationSearchTerm(e.target.value);
                    setIsLocationValid(false); // Mark as invalid until they select from dropdown
                  }}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => setTimeout(() => setShowLocationDropdown(false), 200)}
                  placeholder="City, State"
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    validationAttempted && !isLocationValid
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-gray-200 dark:border-gray-700'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm`}
                />
                {showLocationDropdown && filteredCities.length > 0 && (
                  <div className="absolute top-full mt-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50">
                    {filteredCities.slice(0, 50).map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setLocation(city);
                          setLocationSearchTerm(city);
                          setIsLocationValid(true);
                          setShowLocationDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                )}
                {validationAttempted && !isLocationValid && (
                  <p className="absolute top-full mt-1 text-xs text-red-500 font-medium">Please select a city from the dropdown</p>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generateIngredients}
              disabled={isGenerating}
              className={`px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all whitespace-nowrap shadow-lg hover:shadow-xl ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setShowShoppingList(true)}
              className="relative p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl text-white hover:scale-110 active:scale-95"
              title="View Shopping List"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {shoppingList.length > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-gradient-to-br from-red-500 to-pink-600 rounded-full ring-2 ring-white dark:ring-gray-900 animate-pulse">
                  {shoppingList.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-6 py-8 w-full max-w-7xl mx-auto">

        {/* Generated Ingredient List */}
        {generatedIngredients.length > 0 && (
          <div className="w-full">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">Ingredients</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{generatedIngredients.length} items found</p>
              </div>
            </div>

            <div className="grid gap-4">
              {generatedIngredients.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden hover:scale-[1.01]"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-600 to-indigo-600"></div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                          {generatedIngredients.indexOf(item) + 1}
                        </span>
                        {item.name}
                      </h3>
                    </div>

                    {item.loading && (
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {storeFilter === "all" && "Searching all stores..."}
                            {storeFilter === "nearby" && "Finding nearby prices..."}
                            {storeFilter === "specific" && specificStore && `Checking ${specificStore}...`}
                            {storeFilter === "specific" && !specificStore && "Fetching prices..."}
                          </p>
                        </div>
                      </div>
                    )}
                    {item.price && (
                      <div>
                        {/* Best Price with Store Logo and Clickable Link */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-300 dark:border-green-800 shadow-sm">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 dark:bg-green-700/20 rounded-full -mr-12 -mt-12"></div>

                          <div className="relative flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                              {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].icon && (
                                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg p-1.5 shadow-sm">
                                  <img
                                    src={item.storeDetails[item.priceSource].icon}
                                    alt={item.priceSource}
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Best Price</p>
                                {(item.priceLink || (item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].link)) ? (
                                  <a
                                    href={item.priceLink || item.storeDetails[item.priceSource].link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-2xl font-bold text-green-700 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors inline-flex items-center gap-2 group/link"
                                  >
                                    {item.price}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover/link:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                ) : (
                                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{item.price}</p>
                                )}
                                {item.priceSource && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">at {item.priceSource}</p>
                                )}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].nearby && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                      {item.storeDetails[item.priceSource].nearby}
                                    </span>
                                  )}
                                  {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].discount && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {item.storeDetails[item.priceSource].discount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {/* Add to List Button for Best Price */}
                            {!item.loading && item.price && (() => {
                              const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === item.priceSource);
                              return (
                                <button
                                  onClick={() => addToShoppingList(item)}
                                  disabled={isSelected}
                                  className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 ${
                                    isSelected
                                      ? 'bg-gray-400 text-white cursor-not-allowed'
                                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105 active:scale-95'
                                  }`}
                                  title={isSelected ? 'Already on list' : 'Add best price to list'}
                                >
                                  {isSelected ? (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add to List
                                    </>
                                  )}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                        
                        {/* All Store Prices with Logos - Collapsible Dropdown */}
                        {item.stores && Object.keys(item.stores).length > 1 && (
                          <div className="mt-4">
                            <button
                              onClick={() => setExpandedPrices(prev => ({
                                ...prev,
                                [item.id]: !prev[item.id]
                              }))}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-all group/expand"
                            >
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${expandedPrices[item.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                                View all {Object.keys(item.stores).length} stores
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Compare prices</span>
                            </button>
                            {expandedPrices[item.id] && (
                              <div className="mt-3 space-y-2 bg-gray-50 dark:bg-gray-700/20 rounded-xl p-3">
                                {Object.entries(item.stores).map(([store, price]) => {
                                  const storeDetail = item.storeDetails && item.storeDetails[store];
                                  const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === store);
                                  return (
                                    <div key={store} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-700">
                                      <div className='flex items-center gap-3 flex-1 min-w-0'>
                                          {storeDetail && storeDetail.icon && (
                                              <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg p-1 shadow-sm">
                                                <img
                                                  src={storeDetail.icon}
                                                  alt={store}
                                                  className="w-full h-full object-contain"
                                                  onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                              </div>
                                          )}
                                          <div className='flex-1 min-w-0'>
                                              {storeDetail && storeDetail.link ? (
                                                  <a
                                                  href={storeDetail.link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 group/storelink"
                                                  >
                                                  {store}
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 opacity-0 group-hover/storelink:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                  </svg>
                                                  </a>
                                              ) : (
                                                  <span className="text-sm font-medium text-gray-900 dark:text-white">{store}</span>
                                              )}
                                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{price}</span>
                                                  {storeDetail && storeDetail.nearby && (
                                                      <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                                          {storeDetail.nearby}
                                                      </span>
                                                  )}
                                                  {storeDetail && storeDetail.discount && (
                                                      <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold">
                                                          {storeDetail.discount}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                      </div>

                                      {/* Add to list button for each store price */}
                                      <button
                                          onClick={() => addToShoppingListWithStore(item, store, price)}
                                          disabled={isSelected}
                                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm hover:shadow-md ${
                                              isSelected
                                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:scale-105 active:scale-95'
                                          }`}
                                          title={isSelected ? 'Already on list' : `Add ${store} price to list`}
                                      >
                                          {isSelected ? '✓ Added' : '+ Add'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        {item.priceNote && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{item.priceNote}</span>
                            </p>
                          </div>
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
        className="fixed bottom-6 right-6 p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-400 dark:from-indigo-600 dark:to-purple-600 text-gray-900 dark:text-white shadow-2xl hover:shadow-3xl transition-all z-40 hover:scale-110 active:scale-95 group"
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-rotate-12 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default App