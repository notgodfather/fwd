import React, { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import api from "../api";
import { useNavigate } from "react-router-dom"; // Import useNavigate

import "./MyProfile.css"; // Link the new CSS file

// Sub-component for a single recipe link item
const RecipeListItem = ({ recipe, type }) => {
    const navigate = useNavigate();
    let typeClass = "";
    if (type === 'my') typeClass = 'my-recipe-item';
    if (type === 'fav') typeClass = 'favorite-item';

    return (
        <div 
            className={`recipe-list-item ${typeClass}`} 
            onClick={() => navigate(`/recipe/${recipe.id}`)}
            tabIndex={0}
            role="link"
        >
            <span className="recipe-title">{recipe.title}</span>
            <span className="recipe-stats">
                {recipe.stars ? `⭐ ${recipe.stars.toFixed(1)}` : 'N/A'}
            </span>
        </div>
    );
}

export default function MyProfile() {
    const [userData, setUserData] = useState(null);
    const [myRecipes, setMyRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = auth.currentUser;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Fetch user data (favorites list)
                const userRes = await api.get(`/recipes/user/${user.uid}`);
                const fetchedUserData = userRes.data || {};
                setUserData(fetchedUserData);

                // Fetch all recipes
                const recipeRes = await api.get("/recipes");
                const allRecipes = recipeRes.data || [];

                // Filter by authorID for "My Recipes"
                const userRecipes = allRecipes.filter(x => x.authorID === user.uid);
                setMyRecipes(userRecipes);

                // Filter favorites
                const favIds = fetchedUserData.favorites || [];
                const favRecipes = allRecipes.filter(x => favIds.includes(x.id));
                setFavorites(favRecipes);

            } catch (err) {
                console.error("Error fetching profile data:", err);
                // Even on error, we know the basic Firebase user data
                setUserData({});
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    const handleLogout = () => {
        auth.signOut();
        navigate("/"); // Redirect to landing page
    };

    if (loading) return <div className="loading-message">Loading profile...</div>;
    
    // Check for user existence after loading
    if (!user) return <div className="no-user-message">Please log in with Google to view your profile.</div>;

    const recipeCount = myRecipes.length;
    const favoriteCount = favorites.length;

    return (
        <div className="profile-container">
            {/* --- Profile Header Card --- */}
            <div className="profile-header-card">
                <img 
                    src={user.photoURL || "https://img.icons8.com/fluency/48/000000/user-male-circle--v1.png"} 
                    alt={user.displayName} 
                    className="profile-avatar" 
                />
                <div className="profile-info">
                    <h2 className="profile-name">{user.displayName}</h2>
                    <p className="profile-email">{user.email}</p>
                    <button className="logout-btn" onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
                
                {/* Status Counters */}
                <div className="profile-stats">
                    <div className="stat-box posted">
                        <span className="stat-number">{recipeCount}</span>
                        <span className="stat-label">Recipes Posted</span>
                    </div>
                    <div className="stat-box favorited">
                        <span className="stat-number">{favoriteCount}</span>
                        <span className="stat-label">Favorites</span>
                    </div>
                </div>
            </div>

            {/* --- Content Tabs/Sections --- */}
            <div className="profile-content-grid">
                
                {/* Section 1: My Recipes */}
                <div className="content-section my-recipes-section">
                    <h3 className="section-title">🍽️ My Posted Recipes ({recipeCount})</h3>
                    <div className="recipe-list">
                        {recipeCount === 0 ? (
                            <div className="empty-message posted-empty">
                                <p>You haven't posted any recipes yet. Start sharing your creations!</p>
                                <button className="action-btn primary-action" onClick={() => navigate("/create-recipe")}>
                                    + Post New Recipe
                                </button>
                            </div>
                        ) : (
                            myRecipes.map(r => <RecipeListItem key={r.id} recipe={r} type="my" />)
                        )}
                    </div>
                </div>

                {/* Section 2: Favorites */}
                <div className="content-section favorites-section">
                    <h3 className="section-title">❤️ My Favorites ({favoriteCount})</h3>
                    <div className="recipe-list">
                        {favoriteCount === 0 ? (
                            <div className="empty-message favorites-empty">
                                <p>No favorites yet. Find and bookmark recipes you love on the home feed!</p>
                            </div>
                        ) : (
                            favorites.map(r => <RecipeListItem key={r.id} recipe={r} type="fav" />)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
