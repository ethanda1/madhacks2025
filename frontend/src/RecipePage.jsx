import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function RecipePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipe, instructions, ingredients, shoppingList, mealIdea } = location.state || {};

  // Redirect if no data
  useEffect(() => {
    if (!instructions || !ingredients) {
      navigate('/');
    }
  }, [instructions, ingredients, navigate]);

  if (!instructions || !ingredients) {
    return null;
  }

  // Create a Set of ingredient names that are in the shopping list for quick lookup
  const shoppingListNames = new Set(
    (shoppingList || []).map(item => item.name.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg sticky top-0 z-10 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-semibold">Back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {mealIdea || 'Recipe'}
              </h1>
            </div>
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {recipe && (
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-blue-600 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">About this Recipe</h3>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{recipe}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Instructions */}
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-orange-600 to-red-600 rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Instructions
              </h2>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="space-y-6">
                {instructions.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;

                  return (
                    <div key={index} className="flex gap-4 group">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                          {index + 1}
                        </div>
                      </div>
                      <p className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                        {trimmedLine}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Ingredients */}
          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Ingredients
                </h2>
                {shoppingList && shoppingList.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {shoppingList.length} item{shoppingList.length !== 1 ? 's' : ''} in your shopping list
                  </p>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24">
              <ul className="space-y-3">
                {ingredients.map((ingredient, index) => {
                  const isInShoppingList = shoppingListNames.has(ingredient.name.toLowerCase());
                  return (
                    <li
                      key={index}
                      className={`relative overflow-hidden flex items-start gap-3 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                        isInShoppingList
                          ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {isInShoppingList && (
                        <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200/30 dark:bg-yellow-700/20 rounded-full -mr-8 -mt-8"></div>
                      )}
                      <span className={`relative flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        isInShoppingList
                          ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white'
                          : 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 relative">
                        <span className={`text-sm font-semibold block ${
                          isInShoppingList
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {ingredient.name}
                        </span>
                        {isInShoppingList && (
                          <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-lg text-xs font-bold bg-yellow-500 text-white shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            In Shopping List
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipePage;
