import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
import api from "../api";
import { auth } from "../firebaseConfig";
import "./RecipeDetail.css";

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

    // Toggle favorite status
    const handleToggleFavorite = async () => {
        if (!currentUser) {
            alert("Please log in to manage favorites!");
            return;
        }
        try {
            await api.patch(`/recipes/${id}/favorite`, {
                userId: currentUser.uid,
                isFavorite: !isFavorite // Toggle status
            });
            setIsFavorite(!isFavorite);
            alert(`Recipe ${!isFavorite ? 'added to' : 'removed from'} favorites!`);
        } catch (err) {
            alert("Failed to update favorites.");
        }
    };

    if (loading) return <div className="detail-bg loading-page"><p>Loading recipe details...</p></div>;
    if (!recipe) return <div className="detail-bg loading-page"><p>Recipe not found. It may have been removed.</p></div>;

    const avg = recipe.stars || 5; // Use pre-calculated star average
    const defaultImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=560&q=80";

    // Assuming ingredients and steps are arrays/newline separated strings
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : recipe.ingredients?.split(',').map(i => i.trim()).filter(i => i) || [];
    const steps = Array.isArray(recipe.steps) ? recipe.steps : recipe.steps?.split('\n').map(s => s.trim()).filter(s => s) || [];
    
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
