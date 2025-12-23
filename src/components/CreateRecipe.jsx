import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { auth } from "../firebaseConfig";
import "./CreateRecipe.css";

// Helper function to simulate image upload (replace with actual storage logic)
const uploadImageAndGetUrl = async (imageFile) => {
    if (!imageFile) return null;

    // Generate a unique URL for each selected image
    return URL.createObjectURL(imageFile);
};


export default function CreateRecipe() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [steps, setSteps] = useState(""); // New state for steps
    const [veg, setVeg] = useState(true);
    const [stars, setStars] = useState(5);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert("File size must be less than 2MB.");
                setImage(null);
                setImagePreview(null);
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const postRecipe = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMsg("");
        setErrorMsg("");
        const user = auth.currentUser;

        if (!user) {
            setLoading(false);
            setErrorMsg("You must log in to post.");
            return;
        }

        try {
            // 1. Handle Image Upload first
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImageAndGetUrl(image);
            }

            // 2. Prepare recipe data
            const recipeData = {
                title,
                description,
                ingredients: ingredients.split(",").map(i => i.trim()).filter(i => i),
                steps: steps.split("\n").map(s => s.trim()).filter(s => s), // Split steps by new line
                veg,
                stars: Number(stars),
                imageUrl, // Add the image URL
                authorID: user.uid,
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL
            };

            // 3. Post to API
            await api.post("/recipes", recipeData);
            
            // 4. Success and Cleanup
            setSuccessMsg("Recipe posted successfully! Redirecting...");
            // Clear form
            setTitle(""); setDescription(""); setIngredients(""); setSteps("");
            setVeg(true); setStars(5); setImage(null); setImagePreview(null);
            
            setTimeout(() => navigate("/home"), 1500); // Redirect after success message
        } catch (err) {
            console.error("Posting Error:", err);
            setErrorMsg("Failed to post recipe. Please check your network and try again.");
        }
        setLoading(false);
    };

    return (
        <div className="create-bg">
            <header className="create-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    &larr; Back to Home
                </button>
                <div className="brand-title">RecipeVerse / New Recipe</div>
            </header>
            
            <div className="form-container">
                <form className="create-card" onSubmit={postRecipe}>
                    <h2 className="create-title">Post a New Recipe</h2>
                    <p className="form-subtitle">Share your delicious creation with the community!</p>

                    <fieldset>
                        <legend>Basic Info</legend>
                        <label className="input-group">
                            <span>Recipe Title *</span>
                            <input 
                                required 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="E.g., Authentic Chicken Biryani"
                            />
                        </label>
                        <label className="input-group">
                            <span>Short Description *</span>
                            <textarea 
                                required 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows="3"
                                placeholder="A brief summary of the dish (max 100 characters)"
                                maxLength={100}
                            />
                        </label>
                    </fieldset>

                    <fieldset>
                        <legend>Details</legend>
                        <label className="input-group">
                            <span>Ingredients List *<span className="mini-help"> (Comma separated, e.g., 1 cup flour, 2 eggs, 5g salt)</span></span>
                            <textarea 
                                required 
                                type="text" 
                                value={ingredients} 
                                onChange={e => setIngredients(e.target.value)}
                                rows="4"
                                placeholder="List all ingredients and quantities here..."
                            />
                        </label>
                        <label className="input-group">
                            <span>Cooking Steps *<span className="mini-help"> (Enter each step on a new line)</span></span>
                            <textarea 
                                required 
                                type="text" 
                                value={steps} 
                                onChange={e => setSteps(e.target.value)}
                                rows="6"
                                placeholder="1. Preheat oven to 400°F.&#10;2. Mix all dry ingredients.&#10;3. Bake for 30 minutes."
                            />
                        </label>
                        <div className="row">
                            <label className="input-group">
                                <span>Dish Type *</span>
                                <select value={veg ? "veg" : "nonveg"} onChange={e => setVeg(e.target.value === "veg")}>
                                    <option value="veg">🌱 Vegetarian</option>
                                    <option value="nonveg">🍗 Non-Vegetarian</option>
                                </select>
                            </label>
                            <label className="input-group">
                                <span>Initial Rating (1-5) *</span>
                                <input 
                                    required 
                                    type="number" 
                                    min="1" 
                                    max="5" 
                                    step="0.1" 
                                    value={stars} 
                                    onChange={e => setStars(e.target.value)} 
                                />
                            </label>
                        </div>
                    </fieldset>

                    <fieldset className="image-fieldset">
                        <legend>Photo</legend>
                        <label className="input-group file-upload-group">
                            <span>Recipe Photo (Max 2MB)</span>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="file-input-hidden"
                            />
                            <div className="file-custom-btn">
                                {image ? `File Selected: ${image.name}` : "Upload an image"}
                            </div>
                        </label>
                        {imagePreview && (
                            <div className="image-preview-wrapper">
                                <img src={imagePreview} alt="Recipe Preview" className="preview-img" />
                            </div>
                        )}
                    </fieldset>

                    <button className="submit-btn" type="submit" disabled={loading}>
                        {loading ? "Preparing the dish..." : "Post Recipe"}
                    </button>
                    
                    {successMsg && <div className="form-message form-success">{successMsg}</div>}
                    {errorMsg && <div className="form-message form-error">{errorMsg}</div>}
                </form>
            </div>
        </div>
    );
}
