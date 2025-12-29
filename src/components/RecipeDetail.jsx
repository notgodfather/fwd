import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import api from "../api";
import { auth } from "../firebaseConfig";
import "./RecipeDetail.css";

/* ---------- Nutrition Data (per 100g, approx) ---------- */
const NUTRITION_TABLE = {
  onion: { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  oil: { calories: 884, protein: 0, carbs: 0, fat: 100 },
  potato: { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  egg: { calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  chicken: { calories: 239, protein: 27, carbs: 0, fat: 14 },
  paneer: { calories: 265, protein: 18, carbs: 1.2, fat: 20 },
};

const calculateNutrition = (ingredients) => {
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  ingredients.forEach((ing) => {
    const key = ing.toLowerCase();
    if (NUTRITION_TABLE[key]) {
      const d = NUTRITION_TABLE[key];
      const portion = key === "oil" ? 0.1 : 0.5; // oil 10g, others 50g
      total.calories += d.calories * portion;
      total.protein += d.protein * portion;
      total.carbs += d.carbs * portion;
      total.fat += d.fat * portion;
    }
  });

  return {
    calories: Math.round(total.calories),
    protein: Math.round(total.protein),
    carbs: Math.round(total.carbs),
    fat: Math.round(total.fat),
  };
};

const calculateHealthScore = (n) => {
  let score = 10;
  let reason = "Balanced recipe";

  if (n.fat > 25) { score -= 2; reason = "High fat content"; }
  if (n.carbs > 60) { score -= 1.5; reason = "High carbohydrates"; }
  if (n.protein < 10) { score -= 1; reason = "Low protein"; }

  return { score: score.toFixed(1), reason };
};

export default function RecipeDetail() {
    const { id } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [rating, setRating] = useState(0);
    const [rated, setRated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false); // New state for favorites
    const navigate = useNavigate();
    const currentUser = auth.currentUser;

    // Fetch recipe by ID and check user status
    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const res = await api.get(`/recipes/${id}`);
                const recipeData = res.data;
                setRecipe(recipeData);
                
                if (currentUser) {
                    const userId = currentUser.uid;
                    
                    // 1. Check if already rated
                    if (recipeData.ratings && recipeData.ratings[userId]) {
                        setRating(recipeData.ratings[userId]);
                        setRated(true);
                    }
                    
                    // 2. Check if it's a favorite
                    // NOTE: This assumes an API endpoint exists to check user favorites, 
                    // or that the recipe object contains a list of user favorites. 
                    // For robustness, we'll simulate a check until we can verify the backend structure.
                    try {
                        const userRes = await api.get(`/recipes/user/${userId}`);
                        const favoritesList = userRes.data?.favorites || [];
                        setIsFavorite(favoritesList.includes(id));
                    } catch (e) {
                        console.warn("Could not fetch user favorites status.");
                        setIsFavorite(false);
                    }
                }
                setLoading(false);
            } catch (error) {
                console.error("Error fetching recipe:", error);
                setLoading(false);
                setRecipe(null);
            }
        };
        fetchRecipe();
        if (currentUser) {
    const key = `favorites_${currentUser.uid}`;
    const stored = JSON.parse(localStorage.getItem(key)) || [];
    setIsFavorite(stored.includes(id));
}

    }, [id, currentUser]);

    // Submit rating
    const handleRate = async () => {
        if (!currentUser) {
            alert("Please log in with Google to rate!");
            return;
        }
        if (rating < 1 || rating > 5) return;
        try {
            await api.patch(`/recipes/${id}/rate`, {
                userId: currentUser.uid,
                rating
            });
            setRated(true);

            // Re-fetch recipe to update community average and UI
            const { data } = await api.get(`/recipes/${id}`);
            setRecipe(data);
        } catch (err) {
            alert("Failed to submit rating.");
        }
    };

  const handleToggleFavorite = () => {
    if (!currentUser) {
        alert("Please log in to manage favorites!");
        return;
    }

    const userId = currentUser.uid;
    const key = `favorites_${userId}`;

    const stored = JSON.parse(localStorage.getItem(key)) || [];
    let updatedFavorites;

    if (stored.includes(id)) {
        updatedFavorites = stored.filter(rid => rid !== id);
        alert("Recipe removed from favorites!");
    } else {
        updatedFavorites = [...stored, id];
        alert("Recipe added to favorites!");
    }

    localStorage.setItem(key, JSON.stringify(updatedFavorites));
    setIsFavorite(updatedFavorites.includes(id));
};


    if (loading) return <div className="detail-bg loading-page"><p>Loading recipe details...</p></div>;
    if (!recipe) return <div className="detail-bg loading-page"><p>Recipe not found. It may have been removed.</p></div>;

    const avg = recipe.stars || 5; // Use pre-calculated star average
    const defaultImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=560&q=80";

    // Assuming ingredients and steps are arrays/newline separated strings
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : recipe.ingredients?.split(',').map(i => i.trim()).filter(i => i) || [];
    const steps = Array.isArray(recipe.steps) ? recipe.steps : recipe.steps?.split('\n').map(s => s.trim()).filter(s => s) || [];
    const nutrition = calculateNutrition(ingredients);
const health = calculateHealthScore(nutrition);

    return (
        <div className="detail-bg">
            <header className="detail-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    &larr; Back to Recipes
                </button>
            </header>

            <div className="recipe-wrapper">
                {/* --- Hero Section: Image and Summary --- */}
                <section className="recipe-hero">
                    <img className="detail-img" src={recipe.imageUrl || defaultImage} alt={recipe.title} />
                    <div className="recipe-summary">
                        <div className="tags-container">
                            {recipe.veg ? <span className="tag veg">🌱 Vegetarian</span> : <span className="tag nonveg">🍗 Non-Vegetarian</span>}
                        </div>
                        
                        <h1 className="detail-title">{recipe.title}</h1>
                        <p className="detail-desc">{recipe.description}</p>
                        
                        {/* Rating Display */}
                        <div className="detail-rating">
                            <span className="rating-label">Community Rating:</span>
                            <span className="rating-stars">
                                {Array(Math.round(avg)).fill().map((_, i) => (<span key={i} className="star-icon">★</span>))}
                                <span className="star-num">{avg.toFixed(1)}</span>
                            </span>
                        </div>

                        {/* Author Info */}
                        <div className="author-info">
                            <img src={recipe.photoURL || "https://img.icons8.com/fluency/48/000000/user-male-circle--v1.png"} alt={recipe.displayName} />
                            <span>Posted by <b>{recipe.displayName || "Anonymous Chef"}</b></span>
                        </div>

                        {/* Action Buttons */}
                        <div className="detail-actions">
                            <button className={`favorite-btn ${isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite} disabled={!currentUser}>
                                {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
                            </button>
                            <button className="share-btn" onClick={() => navigator.clipboard.writeText(window.location.href)} title="Copy link">
                                Share Recipe 🔗
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- Detail Section: Ingredients and Steps --- */}
                <section className="recipe-details-grid">
                    {/* Ingredients Column */}
                    <div className="ingredients-col detail-col">
                        <h2>Ingredients</h2>
                        <ul className="ingredients-list">
                            {ingredients.length > 0 ? (
                                ingredients.map((ing, idx) => <li key={idx}><span>{ing}</span></li>)
                            ) : (
                                <p className="list-placeholder">Ingredients list not provided.</p>
                            )}
                        </ul>
                    </div>

                    {/* Steps Column */}
                    <div className="steps-col detail-col">
                        <h2>Preparation Steps</h2>
                        <ol className="steps-list">
                            {steps.length > 0 ? (
                                steps.map((step, idx) => <li key={idx} className="step-item"><span>{step}</span></li>)
                            ) : (
                                <p className="list-placeholder">Preparation steps not provided.</p>
                            )}
                        </ol>
                    </div>
                </section>
                <div className="nutrition-col detail-col">
  <h2>Nutrition (Estimated)</h2>

  <p>🔥 Calories: <b>{nutrition.calories} kcal</b></p>
  <p>💪 Protein: <b>{nutrition.protein} g</b></p>
  <p>🍞 Carbs: <b>{nutrition.carbs} g</b></p>
  <p>🧈 Fat: <b>{nutrition.fat} g</b></p>

  <div className="health-score">
    <b>Health Score:</b> {health.score}/10
    <br />
    <small>{health.reason}</small>
  </div>

  <small className="nutrition-note">
    *Estimated values for academic use
  </small>
</div>
                {/* --- User Rating Section --- */}
                <section className="user-rating-section">
                    <h3>Rate this Recipe</h3>
                    <div className="rating-control">
                        {[1, 2, 3, 4, 5].map(num =>
                            <span
                                className={`user-star ${rating >= num ? "active" : ""}`}
                                style={{ cursor: rated ? "not-allowed" : "pointer" }}
                                key={num}
                                onClick={() => !rated && setRating(num)}
                            >★</span>
                        )}
                        {rating > 0 && !rated && (
                            <button className="rate-btn" onClick={handleRate} disabled={!currentUser}>
                                Submit {rating}.0 Rating
                            </button>
                        )}
                        {rated && <span className="thanks-msg">⭐ Rated {rating}.0! Thank you!</span>}
                        {!currentUser && <span className="login-prompt">Login to rate this recipe.</span>}
                    </div>
                </section>
            </div>
        </div>
    );
}
