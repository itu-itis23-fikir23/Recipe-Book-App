from flask import Flask, request, jsonify, send_file
import json
import os

## Initialize Flask app
app = Flask(__name__, static_url_path='', static_folder='')

# Path to the JSON file
DATA_FILE = 'recipes.json'

# Load data from JSON file
def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, 'r') as file:
        return json.load(file)

# Save data to JSON file
def save_data(data):
    with open(DATA_FILE, 'w') as file:
        json.dump(data, file, indent=4)


@app.route('/')
def serve_index():
    return send_file('index.html')

# Generate a new unique ID
def generate_id(data):
    if not data:
        return 1
    return max(recipe['id'] for recipe in data) + 1

# Get all recipes
@app.route('/recipes.json', methods=['GET'])
def get_recipes():
    data = load_data()
    return jsonify(data)

# get a recipe with its ID
@app.route('/recipes.json/<int:recipe_id>', methods=['GET'])
def get_recipe(recipe_id):
    data = load_data()
    for recipe in data:
        if recipe['id'] == recipe_id:
            return jsonify(recipe)
    return jsonify({'error': 'Recipe not found'}), 404


# Configure adding images 
UPLOAD_FOLDER = 'images' 
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# get the image extension to check if its valid or not
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Add a new recipe
@app.route('/recipes.json', methods=['POST'])
def add_recipe():
    data = load_data()
    new_recipe = {}
    new_recipe['id'] = generate_id(data)
    new_recipe['title'] = request.form['title']
    new_recipe['ingredients'] = request.form['ingredients']
    new_recipe['instructions'] = request.form['instructions']
    new_recipe['category'] = request.form['category']

    if 'image' not in request.files:
        return jsonify({'error': 'No image part'}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename): # if file exists and its extension is valid
        filename = file.filename
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename)) # save image to the images folder
        new_recipe['image'] = filename 
    # add new recipe to the recipes data
    data.append(new_recipe)
    save_data(data)
    return jsonify(new_recipe), 201


# Update an existing recipe
@app.route('/recipes.json/<int:recipe_id>', methods=['PUT'])
def update_recipe(recipe_id):
    data = load_data()
    updated_recipe = request.json
    for index, recipe in enumerate(data):
        if recipe['id'] == recipe_id:
            data[index] = updated_recipe
            # Ensure the ID remains unchanged
            data[index]['id'] = recipe_id 
            save_data(data)
            return jsonify(updated_recipe)
    return jsonify({'error': 'Recipe not found'}), 404

# Delete an existing recipe
@app.route('/recipes.json/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    data = load_data()
    # add the recipes other than the recipe to be deleted to the new list (check by their ID)
    updated_data = [recipe for recipe in data if recipe['id'] != recipe_id]
    # if all recipes are added to the new list, then recipe ID is not found 
    if len(updated_data) == len(data):
        return jsonify({'error': 'Recipe not found'}), 404
    save_data(updated_data)
    return jsonify({'success': 'Recipe deleted'}), 200

@app.route('/recipes.json/search', methods=['GET'])
def search_recipe():
    query = request.args.get('q')  # Get the search query from the request parameters
    data = load_data()
    results = []
    for recipe in data:
        # Check if the query matches the title or any ingredient of the recipe
        if query.lower() in recipe['title'].lower() or query.lower() in ' '.join(recipe['ingredients']).lower():
            results.append(recipe)
    return jsonify(results)

@app.route('/recipes.json/filter', methods=['GET'])
def filter_recipe():
    category = request.args.get('category')  # Get the category from the request parameters
    data = load_data()
    # select recipes from the desired category 
    results = [recipe for recipe in data if recipe['category'] == category]
    return jsonify(results)


if __name__ == '__main__':
    app.run(debug=True, port=8000)
