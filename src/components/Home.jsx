import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { auth } from "../firebaseConfig";
import "./Home.css"; // Ensure this path is correct

// Sub-component for a single recipe card (improves readability)
const RecipeCard = ({ recipe, onClick }) => {
  const defaultImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";
  const stars = recipe.stars || 5;
  const roundedStars = Math.round(stars);
  const displayStars = Array(roundedStars).fill().map((_, i) => <span key={i}>⭐</span>);

  return (
    <div
      className="recipe-card clickable"
      onClick={onClick}
      tabIndex={0}
    >
      <img
        src={recipe.imageUrl || defaultImageUrl}
        alt={recipe.title}
      />
      <div className="card-content">
        <h2>{recipe.title}</h2>
        <div className="stars">
          {displayStars}
          <span className="star-num">{stars.toFixed(1)}</span>
        </div>
        <div className="desc">
          {recipe.description && recipe.description.length > 60
            ? recipe.description.slice(0, 60) + "..."
            : recipe.description}
        </div>
        <div className="tags">
          {recipe.veg ? (
            <span className="tag veg">🌱 Veg</span>
          ) : (
            <span className="tag nonveg">🍗 Non-Veg</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // --- Effects ---

  // Listen to auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsub(); // Cleanup function
  }, []);

  // Fetch recipes
  useEffect(() => {
    api.get("/recipes")
      .then(res => {
        setRecipes(res.data);
        // Initial filtering/setting done by the next effect
      })
      .catch((error) => {
        console.error("Failed to fetch recipes:", error);
        setRecipes([]);
      });
  }, []);

  // Filter recipes based on filter/search state
  useEffect(() => {
    let temp = [...recipes];

    // 1. Apply category filter
    if (filter === "veg") temp = temp.filter(r => r.veg);
    else if (filter === "nonveg") temp = temp.filter(r => !r.veg);
    else if (filter === "top") temp = temp.filter(r => (r.stars || 0) >= 4.8);

    // 2. Apply search filter
    if (search)
      temp = temp.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
      );

    setFilteredRecipes(temp);
  }, [recipes, filter, search]);

  // --- Render Helpers ---

  const defaultProfileIcon = "https://img.icons8.com/fluency/48/000000/user-male-circle--v1.png";
  const profileImageSrc = currentUser && currentUser.photoURL ? currentUser.photoURL : defaultProfileIcon;
  const profileAltText = currentUser ? "User Profile" : "Default Profile";


  return (
    <div className="home-bg">
      <header className="home-header">
        <div className="brand">RecipeVerse</div>
        <input
          className="home-search"
          placeholder="Search delicious recipes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="user-menu" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/profile")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center"
            }}
            title="My Profile"
          >
            <img
              src={profileImageSrc}
              alt={profileAltText}
              width={38}
              style={{ borderRadius: "50%", minWidth: "38px" }}
            />
            <span style={{
              marginLeft: "9px",
              color: "#684a03", // This will be overridden by CSS
              fontWeight: 600,
              fontSize: "1em"
            }}>Profile</span>
          </button>
        </div>
      </header>

      <div className="home-main">
        <aside className="home-sidebar">
          <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All Recipes</button>
          <button className={`filter-btn ${filter === "veg" ? "active" : ""}`} onClick={() => setFilter("veg")}>🌱 Vegetarian</button>
          <button className={`filter-btn ${filter === "nonveg" ? "active" : ""}`} onClick={() => setFilter("nonveg")}>🍗 Non-Vegetarian</button>
          <button className={`filter-btn ${filter === "top" ? "active" : ""}`} onClick={() => setFilter("top")}>⭐ Top Rated (4.8+)</button>
        </aside>

        <main className="recipe-feed">
          {filteredRecipes.length === 0 ? (
            <p className="no-results">No recipes found matching your criteria. Be the first to post!</p>
          ) : (
            filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => navigate(`/recipe/${recipe.id}`)}
              />
            ))
          )}
        </main>

        <aside className="home-widgets">
          <div className="widget trending">
            <h4>Trending 🔥</h4>
            <p>Check back soon for the hottest recipes!</p>
          </div>
          <div className="widget new">
            <h4>New Recipes</h4>
            <p>The latest additions to the RecipeVerse!</p>
          </div>
        </aside>
      </div>

      <a href="/create-recipe" title="Add New Recipe">
        <button className="fab">＋</button>
      </a>
    </div>
  );
}
