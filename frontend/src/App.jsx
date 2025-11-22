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
        note: data.note || null
      };
    } catch (err) {
      console.error("fetchPrice error:", err);
      return null;
    }
  }

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

  function calculateTotal() {
    const total = shoppingList
      .filter((i) => i.price)
      .reduce(
        (acc, i) => acc + parseFloat(String(i.price).replace(/[^0-9.]/g, "")),
        0
      );

    alert(`Total Shopping Cost: $${isNaN(total) ? "0.00" : total.toFixed(2)}`);
  }

  async function generateIngredients() {
    if (!mealIdea.trim()) return;

    setIsGenerating(true);
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
        setGeneratedIngredients(
          data.ingredients.map((i) => ({ ...i, price: null, loading: false }))
        );
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

  function addToShoppingList(item) {
    if (shoppingList.find((i) => i.id === item.id)) return;
    setShoppingList([...shoppingList, item]);
  }

  return (
    <>
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900 flex flex-col items-center transition-colors duration-200">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold mb-2 text-gray-900 dark:text-white">
            🍽️ Meal → Grocery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Transform your meal ideas into shopping lists</p>
        </div>

        {/* Meal Idea Input */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🍳 What would you like to cook?
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
                🏪 Store Preferences
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
                  📍 Nearby
                </button>
                <button
                  onClick={() => setStoreFilter("specific")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    storeFilter === "specific"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  🎯 Specific Store
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
                  📍 Location
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
                  <span>✨</span>
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
              <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">🛒 Ingredients Needed</h2>
              <p className="text-gray-600 dark:text-gray-400">Click "Fetch Price" to see store options</p>
            </div>

            <div className="space-y-4">
              {generatedIngredients.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-start justify-between p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-gray-900 dark:text-white mb-3">{item.name}</p>
                    {item.price && (
                      <div className="mt-3">
                        {/* Best Price with Store Logo and Clickable Link */}
                        <div className="flex items-center gap-3 mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                          {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].icon && (
                            <img 
                              src={item.storeDetails[item.priceSource].icon} 
                              alt={item.priceSource}
                              className="w-8 h-8 rounded-lg object-contain bg-white p-1 shadow-sm"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          {item.storeDetails && item.storeDetails[item.priceSource] && item.storeDetails[item.priceSource].link ? (
                            <a
                              href={item.storeDetails[item.priceSource].link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-700 dark:text-green-400 font-bold text-lg hover:text-green-800 dark:hover:text-green-300 hover:underline cursor-pointer transition-colors"
                            >
                              💰 Best: {item.price} {item.priceSource && `@ ${item.priceSource}`}
                            </a>
                          ) : (
                            <p className="text-green-700 dark:text-green-400 font-bold text-lg">
                              💰 Best: {item.price} {item.priceSource && `@ ${item.priceSource}`}
                            </p>
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
                                  return (
                                    <div key={store} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      {storeDetail && storeDetail.icon && (
                                        <img 
                                          src={storeDetail.icon} 
                                          alt={store}
                                          className="w-6 h-6 rounded-lg object-contain bg-white p-1 shadow-sm"
                                          onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                      )}
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
                                      {storeDetail && storeDetail.rating && (
                                        <span className="text-yellow-500 text-xs">
                                          ⭐ {storeDetail.rating}
                                        </span>
                                      )}
                                      {storeDetail && storeDetail.nearby && (
                                        <span className="text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                          📍 {storeDetail.nearby}
                                        </span>
                                      )}
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

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => addPriceToItem(item.id)}
                      disabled={item.loading}
                      className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                        item.loading
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                          : item.price
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {item.loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading...
                        </span>
                      ) : item.price ? (
                        '✓ Fetched'
                      ) : (
                        '💰 Fetch Price'
                      )}
                    </button>

                    <button
                      onClick={() => addToShoppingList(item)}
                      className="px-4 py-2 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                    >
                      ➕ Add
                    </button>
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
                <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">📋 Your Shopping List</h2>
                <p className="text-gray-600 dark:text-gray-400">{shoppingList.length} {shoppingList.length === 1 ? 'item' : 'items'}</p>
              </div>

              <div className="space-y-3 mb-6">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-yellow-200 dark:border-yellow-800/50 flex justify-between items-center"
                  >
                    <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    {item.price && (
                      <span className="font-bold text-lg text-green-600 dark:text-green-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg">
                        {item.price}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={calculateTotal}
                className="w-full py-4 rounded-xl font-bold text-white text-lg bg-red-600 hover:bg-red-700 transition-colors"
              >
                💵 Calculate Total Cost
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default App
