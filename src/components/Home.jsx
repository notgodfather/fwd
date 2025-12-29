import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { auth } from "../firebaseConfig";
import "./Home.css";

// ---------------- Recipe Card ----------------
const RecipeCard = ({ recipe, onClick }) => {
  const defaultImageUrl =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";

  const stars = recipe.stars || 5;
  const roundedStars = Math.round(stars);
  const displayStars = Array(roundedStars)
    .fill()
    .map((_, i) => <span key={i}>⭐</span>);

  return (
    <div className="recipe-card clickable" onClick={onClick} tabIndex={0}>
      <img src={recipe.imageUrl || defaultImageUrl} alt={recipe.title} />
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

        {recipe.matchScore !== undefined && (
          <div style={{ marginTop: "6px", fontSize: "0.9em", color: "#2e7d32" }}>
            🧺 Matches: {recipe.matchText}
          </div>
        )}

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

// ---------------- Ingredient Match Logic ----------------
const getIngredientMatchScore = (recipeIngredients, userIngredients) => {
  const recipeSet = recipeIngredients.map(i => i.toLowerCase().trim());
  const userSet = userIngredients.map(i => i.toLowerCase().trim());

  let matched = 0;
  recipeSet.forEach(ing => {
    if (userSet.includes(ing)) matched++;
  });

  return {
    matched,
    total: recipeSet.length,
    score: matched / recipeSet.length
  };
};

// ---------------- Home Component ----------------
export default function Home() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Ingredient search
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientMode, setIngredientMode] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Auth listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Fetch recipes
  useEffect(() => {
    api
      .get("/recipes")
      .then(res => setRecipes(res.data))
      .catch(err => {
        console.error("Failed to fetch recipes:", err);
        setRecipes([]);
      });
  }, []);

  // Filtering logic
  useEffect(() => {
    let temp = [...recipes];

    // Category filters
    if (filter === "veg") temp = temp.filter(r => r.veg);
    else if (filter === "nonveg") temp = temp.filter(r => !r.veg);
    else if (filter === "top") temp = temp.filter(r => (r.stars || 0) >= 4.8);

    // Text search
    if (search) {
      temp = temp.filter(
        r =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          (r.description &&
            r.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Ingredient-based search
    if (ingredientMode && ingredientInput.trim()) {
      const userIngredients = ingredientInput.split(",");

      temp = temp
        .map(recipe => {
          if (!recipe.ingredients || recipe.ingredients.length === 0)
            return recipe;

          const match = getIngredientMatchScore(
            recipe.ingredients,
            userIngredients
          );

          return {
            ...recipe,
            matchScore: match.score,
            matchText: `${match.matched}/${match.total} ingredients`
          };
        })
        .filter(r => r.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    }

    setFilteredRecipes(temp);
  }, [recipes, filter, search, ingredientInput, ingredientMode]);

  const profileImage =
    currentUser?.photoURL ||
    "https://img.icons8.com/fluency/48/000000/user-male-circle--v1.png";

  return (
    <div className="home-bg">
      <header className="home-header">
        <div className="brand">RecipeVerse</div>

        <input
          className="home-search"
          placeholder="Search delicious recipes..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setIngredientMode(false);
          }}
        />

        <input
          className="home-search"
          placeholder="Enter ingredients (comma separated)..."
          value={ingredientInput}
          onChange={e => {
            setIngredientInput(e.target.value);
            setIngredientMode(true);
          }}
        />

        <button
          onClick={() => navigate("/profile")}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <img src={profileImage} alt="Profile" width={38} />
        </button>
      </header>

      <div className="home-main">
        <aside className="home-sidebar">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Recipes
          </button>
          <button
            className={`filter-btn ${filter === "veg" ? "active" : ""}`}
            onClick={() => setFilter("veg")}
          >
            🌱 Vegetarian
          </button>
          <button
            className={`filter-btn ${filter === "nonveg" ? "active" : ""}`}
            onClick={() => setFilter("nonveg")}
          >
            🍗 Non-Vegetarian
          </button>
          <button
            className={`filter-btn ${filter === "top" ? "active" : ""}`}
            onClick={() => setFilter("top")}
          >
            ⭐ Top Rated
          </button>
        </aside>

        <main className="recipe-feed">
          {filteredRecipes.length === 0 ? (
            <p className="no-results">No matching recipes found.</p>
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
      </div>

      <button className="fab" onClick={() => navigate("/create-recipe")}>
        ＋
      </button>
    </div>
  );
}
