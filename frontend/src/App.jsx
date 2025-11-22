import { useState } from 'react'
import './App.css'

function App() {
  const [mealIdea, setMealIdea] = useState("");
  const [generatedIngredients, setGeneratedIngredients] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [location, setLocation] = useState("");
  const [storeFilter, setStoreFilter] = useState("all"); // "all", "nearby", or specific store name
  const [specificStore, setSpecificStore] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPrices, setExpandedPrices] = useState({}); // Track which items have expanded price lists

  async function fetchPrice(itemName) {
    try {
      let url = `http://127.0.0.1:5000/api/target-price?item=${encodeURIComponent(itemName)}`;
      
      if (location) {
        url += `&location=${encodeURIComponent(location)}`;
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
    if (shoppingList.find((s) => s.id === entryId)) return;
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
    setShoppingList((prev) => [...prev, shoppingItem]);
  }

  async function generateIngredients() {
    if (!mealIdea.trim()) return;

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
    // Check if an item with the same baseId is already in the list to prevent duplicates
    const baseId = item.id;
    if (shoppingList.find((i) => i.baseId === baseId)) return; 
    
    const shoppingItem = { 
      ...item, 
      id: baseId, // Use the base ID for simple best-price entry
      baseId: baseId,
      price: item.price, 
      store: item.priceSource,
      link: item.priceLink || (item.storeDetails && item.storeDetails[item.priceSource]?.link) || null, // Best price link
    };
    setShoppingList([...shoppingList, shoppingItem]);
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
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center transition-colors duration-200">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-2 text-gray-900 dark:text-white">
          Meal to Grocery
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">Transform your meal ideas into shopping lists</p>
      </div>

      {/* Meal Idea Input */}
      <div className="w-full max-w-2xl mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              What would you like to cook?
            </label>
            <input
              value={mealIdea}
              onChange={(e) => setMealIdea(e.target.value)}
              placeholder="e.g., Chicken Tacos, Pasta Carbonara, Sushi..."
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
            />
          </div>
        
          {/* Store Filter Options */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Store Preferences
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setStoreFilter("all")}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  storeFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                All Stores
              </button>
              <button
                onClick={() => setStoreFilter("nearby")}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  storeFilter === "nearby"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Nearby
              </button>
              <button
                onClick={() => setStoreFilter("specific")}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  storeFilter === "specific"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                Specific Store
              </button>
            </div>
            
            {/* Specific Store Input */}
            {storeFilter === "specific" && (
              <input
                value={specificStore}
                onChange={(e) => setSpecificStore(e.target.value)}
                placeholder="Store name (e.g., Walmart, Target)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
              />
            )}
          </div>
          
          {/* Location Input - Only show when not "All Stores" */}
          {storeFilter !== "all" && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Austin, Texas, United States"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
              />
            </div>
          )}
          
          <button
            onClick={generateIngredients}
            disabled={isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-colors ${
              isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating your list...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Generate Grocery List</span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Generated Ingredient List */}
      {generatedIngredients.length > 0 && (
        <div className="w-full max-w-2xl mb-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Ingredients Needed</h2>
            <p className="text-gray-600 dark:text-gray-400">Prices are fetched automatically</p>
          </div>

          <div className="space-y-4">
            {generatedIngredients.map((item) => (
              <div
                key={item.id}
                className="group flex items-center p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{item.name}</p>
                  {item.loading && (
                    <div className="mb-2 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Fetching prices...
                    </div>
                  )}
                  {item.price && (
                    <div className="mt-2">
                      {/* Best Price with Store Logo and Clickable Link */}
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3 flex-1">
                          {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].icon && (
                            <img 
                              src={item.storeDetails[item.priceSource].icon} 
                              alt={item.priceSource}
                              className="w-8 h-8 rounded-lg object-contain bg-white p-1 shadow-sm"
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
                                className="text-green-700 dark:text-green-400 font-bold text-lg hover:text-green-800 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
                              >
                                {item.price} {item.priceSource && `@ ${item.priceSource}`}
                              </a>
                            ) : (
                              <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                                {item.price} {item.priceSource && `@ ${item.priceSource}`}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].nearby && (
                                <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                  {item.storeDetails[item.priceSource].nearby}
                                </span>
                              )}
                              {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].discount && (
                                <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full font-semibold">
                                  {item.storeDetails[item.priceSource].discount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Add to List Button for Best Price (on the right) */}
                        {!item.loading && item.price && (
                          <button
                            onClick={() => addToShoppingList(item)}
                            className="ml-4 px-4 py-2 rounded-xl font-semibold text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-1"
                            title="Add best price to list"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            List
                          </button>
                        )}
                      </div>
                      
                      {/* All Store Prices with Logos - Collapsible Dropdown */}
                      {item.stores && Object.keys(item.stores).length > 1 && (
                        <div className="mt-3">
                          <button
                            onClick={() => setExpandedPrices(prev => ({
                              ...prev,
                              [item.id]: !prev[item.id]
                            }))}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-2 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                          >
                            <span className="text-lg transition-transform duration-200" style={{transform: expandedPrices[item.id] ? 'rotate(90deg)' : 'rotate(0deg)'}}>▶</span>
                            <span>View all {Object.keys(item.stores).length} store options</span>
                          </button>
                          {expandedPrices[item.id] && (
                            <div className="mt-3 space-y-2 pl-6 border-l-3 border-blue-300 dark:border-blue-700 animate-fadeIn">
                              {Object.entries(item.stores).map(([store, price]) => {
                                const storeDetail = item.storeDetails && item.storeDetails[store];
                                const isSelected = shoppingList.some(s => s.baseId === item.id && s.store === store);
                                return (
                                  <div key={store} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className='flex items-center gap-3'>
                                        {storeDetail && storeDetail.icon && (
                                            <img 
                                            src={storeDetail.icon} 
                                            alt={store}
                                            className="w-6 h-6 rounded-lg object-contain bg-white p-1 shadow-sm"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        )}
                                        <div className='flex-1'>
                                            {storeDetail && storeDetail.link ? (
                                                <a
                                                href={storeDetail.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer font-medium"
                                                >
                                                {store}: <span className="text-green-600 dark:text-green-400 font-bold">{price}</span>
                                                </a>
                                            ) : (
                                                <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                {store}: <span className="text-green-600 dark:text-green-400 font-bold">{price}</span>
                                                </span>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                {storeDetail && storeDetail.nearby && (
                                                    <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                                        {storeDetail.nearby}
                                                    </span>
                                                )}
                                                {storeDetail && storeDetail.discount && (
                                                    <span className="text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full font-semibold">
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
                                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                                            isSelected
                                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                                        }`}
                                        title={isSelected ? 'Already on list' : `Add ${store} price to list`}
                                    >
                                        {isSelected ? 'On List' : '+ List'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      {item.priceNote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">{item.priceNote}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Shopping List */}
      {shoppingList.length > 0 && (
        <div className="w-full max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Your Shopping List</h2>
              <p className="text-gray-600 dark:text-gray-400">{shoppingList.length} {shoppingList.length === 1 ? 'item' : 'items'}</p>
            </div>

            <div className="space-y-3 mb-6">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-yellow-200 dark:border-yellow-800/50 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                          title="View product page"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromShoppingList(item.id)}
                          className="px-2 py-1 rounded-md bg-red-400 hover:bg-red-500 text-white text-sm"
                          title="Remove item"
                        >
                          &times; {/* HTML entity for multiplication sign for a clean 'x' */}
                        </button>
                      </div>
                    </div>
                    {/* Show price and store, no editing */}
                    <div className="mt-3">
                      {item.price ? (
                        <span className="font-bold text-green-700 dark:text-green-400 text-lg">
                          ${parseFloat(String(item.price).replace(/[^0-9.]/g, '')).toFixed(2)}
                          {item.store && (
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">@ {item.store}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No price</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-4 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">Estimated total</div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">${totalCost.toFixed(2)}</div>
            </div>

            <button
              onClick={getDirections}
              className="w-full py-4 rounded-xl font-bold text-white text-lg bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Get directions on how to cook
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App