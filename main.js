// Execute fetchRecipes function once the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    fetchRecipes();
});

// Fetch recipes from the server, optionally filtering by a search query
function fetchRecipes(query = '') {
    // if query exists, get the searched url, else get the recipes.json page 
    const url = query ? `/recipes.json/search?q=${query}` : '/recipes.json';

    fetch(url, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
         //create recipe cards based on their attributes like title, ingredients, image..
        .then(data => {
            // Select the div where recipes will be displayed
            const recipesDiv = document.getElementById('recipe-list');
            recipesDiv.innerHTML = '';
            data.forEach(recipe => {
                //iterate over each recipe and create HTML structure
                const recipeHtml = `
                    <div class="recipe col-md-4 col-sm-6 col-12 mb-3">
                        <div class="card">
                        <img src="images/${recipe.image}" class="card-img-top" alt="${recipe.title}">
                            <div class="card-body"> 
                                <h3 class="card-title">${recipe.title}</h3>
                                <p class="card-text"><strong>Ingredients:</strong> ${recipe.ingredients}</p>
                                <p class="card-text"><strong>Instructions:</strong> ${recipe.instructions}</p>
                                <button class="btn btn-danger mr-2" onclick="deleteRecipe(${recipe.id})">Delete</button>
                                <button class="btn btn-warning" onclick="editRecipe(${recipe.id})">Edit</button>
                            </div>
                        </div>
                    </div>
                `;
                // add each recipe to the recipesDiv
                recipesDiv.innerHTML += recipeHtml;
            });
        })
        .catch(error => {
            console.error('Error fetching recipes:', error);
            alert('Failed to load recipes: ' + error.message);
        });
}

// Fetch recipes based on the search query entered by the user
function searchRecipes() {
    const query = document.getElementById('search-input').value;
    fetchRecipes(query);
}

// Add a new recipe to the server
function addRecipe() {
    // Collect form data
    const title = document.getElementById('title').value;
    const ingredients = document.getElementById('ingredients').value;
    const instructions = document.getElementById('instructions').value;
    const image = document.getElementById('image').files[0];
    const category = document.getElementById('category').value;

    // Create FormData object to send the form data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('ingredients', ingredients);
    formData.append('instructions', instructions);
    formData.append('image', image);
    formData.append('category', category);

    fetch('/recipes.json', {
        method: 'POST',
        body: formData,
        cache: 'no-cache'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Refresh the list of recipes and clear the form inputs
        fetchRecipes();
        document.getElementById('title').value = '';
        document.getElementById('ingredients').value = '';
        document.getElementById('instructions').value = '';
        document.getElementById('image').value = '';
    })
    .catch(error => {
        console.error('Error adding recipe:', error);
        alert('Failed to add recipe: ' + error.message);
    });
}

// Delete a recipe from the server
function deleteRecipe(id) {
    fetch(`/recipes.json/${id}`, {
        method: 'DELETE',
        cache: 'no-cache'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    // Refresh the list of recipes after deletion
    .then(data => {
        fetchRecipes();
    })
    .catch(error => {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe: ' + error.message);
    });
}

function editRecipe(id) {
    // Fetch the existing recipe details
    fetch(`/recipes.json/${id}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        // Prompt dialogs with existing details populated
        const title = prompt("Enter new title:", data.title);
        const ingredients = prompt("Enter new ingredients:", data.ingredients);
        const instructions = prompt("Enter new instructions:", data.instructions);
        const image = data.image;
        const category = data.category;

        // If user cancels any of the prompts, exit
        if (title === null || ingredients === null || instructions === null) {
            return;
        }

        // Send updated details to the server
        fetch(`/recipes.json/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, ingredients, instructions, id, image, category}), 
            cache: 'no-cache'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            fetchRecipes(); // Refresh the recipes after editing
        })
        .catch(error => {
            console.error('Error editing recipe:', error);
            alert('Failed to edit recipe: ' + error.message);
        });
    })
    .catch(error => {
        console.error('Error fetching recipe details:', error);
        alert('Failed to fetch recipe details for editing: ' + error.message);
    });
}

// Fetch and display recipes filtered by category
function filterRecipes(category) {
    fetch(`/recipes.json/filter?category=${category}`, { cache: 'no-cache' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const recipesDiv = document.getElementById('recipe-list');
            recipesDiv.innerHTML = '';
            // Iterate over each filtered recipe and create HTML structure
            data.forEach(recipe => {
                const recipeHtml = `
                    <div class="recipe col-md-4 col-sm-6 col-12 mb-3">
                        <div class="card">
                        <img src="images/${recipe.image}" class="card-img-top" alt="${recipe.title}">
                            <div class="card-body"> 
                                <h3 class="card-title">${recipe.title}</h3>
                                <p class="card-text"><strong>Ingredients:</strong> ${recipe.ingredients}</p>
                                <p class="card-text"><strong>Instructions:</strong> ${recipe.instructions}</p>
                                <button class="btn btn-danger mr-2" onclick="deleteRecipe(${recipe.id})">Delete</button>
                                <button class="btn btn-warning" onclick="editRecipe(${recipe.id})">Edit</button>
                            </div>
                        </div>
                    </div>
                `;
                recipesDiv.innerHTML += recipeHtml;
            });
        })
        .catch(error => {
            console.error('Error filtering recipes:', error);
            alert('Failed to filter recipes: ' + error.message);
        });
}
