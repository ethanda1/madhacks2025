import { useState } from 'react'
import './App.css'

function App() {
  const [mealIdea, setMealIdea] = useState("");
  const [generatedIngredients, setGeneratedIngredients] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);

  async function fetchPrice(itemName) {
    try {
      const res = await fetch(
        `http://127.0.0.1:5000/api/target-price?item=${encodeURIComponent(itemName)}`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      return {
        price: data.price || null,
        stores: data.stores || {},
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
    }
  }

  function addToShoppingList(item) {
    if (shoppingList.find((i) => i.id === item.id)) return;
    setShoppingList([...shoppingList, item]);
  }

  return (
    <>
      <div className="min-h-screen p-6 bg-white flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Meal → Grocery Generator</h1>

        {/* Meal Idea Input */}
        <div className="w-full max-w-md mb-6">
          <input
            value={mealIdea}
            onChange={(e) => setMealIdea(e.target.value)}
            placeholder="Type a meal idea (e.g., Chicken Tacos)"
            className="border border-gray-300 rounded-xl p-4 w-full"
          />
          <button
            onClick={generateIngredients}
            className="bg-green-500 text-white p-4 rounded-2xl mt-3 w-full font-semibold"
          >
            Generate Grocery List
          </button>
        </div>

        {/* Generated Ingredient List */}
        {generatedIngredients.length > 0 && (
          <div className="w-full max-w-md mb-10">
            <h2 className="text-2xl font-bold mb-2">Ingredients Needed</h2>

            <div className="space-y-3">
              {generatedIngredients.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-100 rounded-xl shadow-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.price && (
                      <div className="mt-1">
                        <p className="text-green-600 font-semibold">
                          Best Price: {item.price} {item.priceSource && `(${item.priceSource})`}
                        </p>
                        {item.stores && Object.keys(item.stores).length > 1 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {Object.entries(item.stores).map(([store, price]) => (
                              <span key={store} className="mr-2">
                                {store}: {price}
                              </span>
                            ))}
                          </div>
                        )}
                        {item.priceNote && (
                          <p className="text-xs text-gray-500 italic">{item.priceNote}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => addPriceToItem(item.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                    >
                      {item.loading ? "..." : item.price ? "Fetched" : "Fetch Price"}
                    </button>

                    <button
                      onClick={() => addToShoppingList(item)}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Shopping List */}
        {shoppingList.length > 0 && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Final Shopping List</h2>

            <div className="space-y-3">
              {shoppingList.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-yellow-100 rounded-xl shadow-sm flex justify-between"
                >
                  <p>{item.name}</p>
                  {item.price && <p className="font-semibold">{item.price}</p>}
                </div>
              ))}
            </div>

            <button
              onClick={calculateTotal}
              className="bg-red-600 text-white p-4 rounded-2xl w-full font-semibold mt-4"
            >
              Calculate Total Cost
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default App
