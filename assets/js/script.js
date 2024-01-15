class safeBite {
	// API URLs
	apis      = {
		spoonacular: new URL('https://api.spoonacular.com/recipes/complexSearch'),
		unsplash:    new URL('https://api.unsplash.com/search/photos')
	};
	// Data Storage
	data      = {
		apiKeys:       {},  // API keys. Filled by constructor.
		functions:     [],  // Events functions list
		searchHistory: []   // Search history
	};
	// Elements
	elements  = {
		searchButton:  document.querySelector('#search-button'),    // Search button
		searchHistory: document.querySelector('#search-history'),   // Search history list?
		searchInput:   document.querySelector('#search-recipe'),    // Search recipe input
		searchResults: document.querySelector('#search-results')    // Search results list
	};
	// Errors
	errors    = {
		searchInputEmpty: 'You must enter text.'
	};
	// Settings
	settings  = {
		cacheKey: 'searchHistory'    // Cache Location
	};
	templates = {
		searchResultsItem: document.querySelector('#search-results-item').content,
		searchHistoryItem: document.querySelector('#search-history-item').content
	};

	constructor() {
		// Load the API key
		this.data.apiKeys = apiKeys;

		// Load the cache.
		this.apiCacheLoad();

		// Add an event listener to the search button
		this.elements.searchButton.addEventListener('click', this.recipeSearch.bind(this));

		// Load favorites into the data storage
        this.data.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        
        // Initialize event listeners
        this.initializeEventListeners();
	}

	 // Initialize event listeners for the UI
	initializeEventListeners() {
        this.elements.searchButton.addEventListener('click', this.recipeSearch.bind(this));
        
        // Event listener for clearing search history
        document.getElementById('clear-history').addEventListener('click', () => this.recipeHistoryClear());

		 // Event listener for showing favorites
		document.getElementById('show-favorites').addEventListener('click', () => this.showFavorites());

		 // Event listener for clearing favorites
		document.getElementById('clear-favorites').addEventListener('click', () => this.clearFavorites());
    }

	/***
	 * API Functions
	 ***/

	// Load the search history cache
	apiCacheLoad() {
		// Pull the searchHistory from localStorage and parse it into an array. If this is unsuccessful, use the
		// default value (or any other value) in searchHistory.
		this.data.searchHistory = JSON.parse(localStorage.getItem(this.settings.cacheKey)) ?? this.data.searchHistory;
		this.recipeHistoryList();
	}

	// Cache the search history
	apiCacheSave() {
		try {
			// Turn the search history array into a string for storage
			const apiData = JSON.stringify(this.data.searchHistory);

			// If the search history was successfully converted to an array, save it and check the integrity.
			if (apiData) {
				localStorage.setItem(this.settings.cacheKey, apiData);
				if (apiData === localStorage.getItem(this.settings.cacheKey)) return true;
			}
		} catch (error) {
			// If JSON conversion was unsuccessful, or the data did not save properly, something broke.
			console.log('apiCacheSave failure:', error);
		}
		return false;
	}

	// Handler for API fetch requests, with optional callback function for handling asynchronous requests.
	async apiFetchJSON(url, callback = undefined) {
		try {
			//  Fetch data from the specified URL, and then return it.
			const response = await fetch(url);

			// If the response is not okay, throw an error.
			if (!response.ok) throw new Error('networkError');

			// If a callback was provided, return the value from that, otherwise return the parsed response.
			else return callback ? response.json().then(response => callback(response)) : response.json();
		} catch (error) {
			console.log('apiFetchJSON failure:', error);
		}
	}

	/***
	 * Event Functions
	 ***/

	// Remove all children and their click events from the specified parent element.
	eventClickChildrenRemove(element, funcName) {
		[...element.children].forEach(child => {
			this.eventClickRemove(child, funcName);
			child.remove();
		});
	}

	// Remove a click event.
	eventClickRemove(element, funcName) {
		// If the function name exists in the array, grab it; otherwise check if it's an actual function, and save that.
		// This is so that even if the event wasn't created with eventClickSave(), it can still save code.
		const func = this.data.functions[funcName] ?? (typeof funcName === 'function') ? funcName : false;
		// If the function is not a function, abort.
		if (!func) return false;

		// Remove the event listener from the element.
		element.removeEventListener('click', this.data.functions[funcName]);
		return true;
	}

	// Save the function for future removal.
	eventClickSave(element, funcName, func) {
		// If the eventFunctionSave failed, also fail.
		if (!this.eventFunctionSave(funcName, func)) return false;

		// Save the event handler.
		element.addEventListener('click', func);
		// Return the function.
		return func;
	}

	// Get the function name
	eventFunctionGet(funcName) {
		// If the function exists, return that; otherwise return false.
		return (this.data.functions[funcName]) ? this.data.functions[funcName] : false;
	}

	// Save functions for future reference.
	eventFunctionSave(funcName, func) {
		try {
			// If the function is not a function, abort.
			if (typeof func !== 'function') throw new Error('This is not a function.');

		} catch (error) {
			console.log(error);
			return false;
		}

		// If the function isn't saved, save it.
		if (!this.data.functions[funcName]) this.data.functions[funcName] = func;

		// Return the saved function.
		return this.data.functions[funcName];
	}

	// Clears the recipe history from localStorage, and the array.
	recipeHistoryClear() {
		// Clear the searchHistory array, save the cache and clear the history list.
		this.data.searchHistory = [];
		this.apiCacheSave();
		this.eventClickChildrenRemove(this.elements.searchHistory, 'historyBuild');
	}

	// Fill the
	recipeHistoryList() {
		// Empty the list and remove the event listeners.
		this.eventClickChildrenRemove(this.elements.searchHistory, 'historyBuild');

		// Function to build search history list items.
		const historyBuild = search => {
			const searchElement = this.templates.searchHistoryItem.cloneNode(true).firstElementChild;
			searchElement.textContent = search.searchQuery;

			// Add an event listener to the recipe list item
			this.eventClickSave(searchElement, 'historyBuild', (event) => {
				// Set the search box with the search text, and then click the search button.
				this.elements.searchInput.value = event.target.textContent;
				this.elements.searchButton.click();
			});

			// Return the element
			return searchElement;
		};

		// Loop through the
		this.data.searchHistory.forEach(
			recipe => this.elements.searchHistory.appendChild(historyBuild(recipe)));
	}

	 // Method to show the favorites list
	showFavorites() {
		const modalFavoritesList = document.getElementById('modal-favorites-list');
		modalFavoritesList.innerHTML = ''; // Clear current list
	
		// Check if favorites data is correctly formed
		console.log('Favorites Data:', this.data.favorites);
	
		// Populate the modal favorites list
		this.data.favorites.forEach(favorite => {
			const card = document.createElement('div');
			card.classList.add('card');
	
			const img = document.createElement('img');
			img.classList.add('search-image');
			img.src = favorite.image;
			
		const title = document.createElement('p');
		title.classList.add('search-title');
		title.textContent = favorite.title;
	
		const favoriteButton = document.createElement('button');
		favoriteButton.classList.add('favorite-button');
		favoriteButton.textContent = '💔'; // Or '❤️' depending on the favorite status
	
		// Append the elements to the card
		card.appendChild(img);
		card.appendChild(title);
		card.appendChild(favoriteButton);
	
		// Append the card to the modal list
		modalFavoritesList.appendChild(card);
	});
	
	// Open the modal
	const modal = new Foundation.Reveal($('#favorites-modal'));
	modal.open();
	}

    // Method to clear favorites
    clearFavorites() {
        this.data.favorites = [];
        localStorage.setItem('favorites', JSON.stringify(this.data.favorites));
        this.showFavorites(); 
        console.log('Favorites cleared.');
    }

	// Toggles the favorite status of a recipe
	toggleFavorite(recipe, favoriteButton) {
		const isFavorite = this.data.favorites.some(fav => fav.id === recipe.id);
		console.log(`Recipe "${recipe.title}" is currently ${isFavorite ? 'a favorite' : 'not a favorite'}. Toggling status.`);
	
		if (isFavorite) {
			this.data.favorites = this.data.favorites.filter(fav => fav.id !== recipe.id);
			favoriteButton.textContent = '❤️'; // Change to heart icon
		} else {
			this.data.favorites.push(recipe);
			favoriteButton.textContent = '💔'; // Change to broken heart icon
		}
	
		console.log(`Updated favorites:`, this.data.favorites);
		localStorage.setItem('favorites', JSON.stringify(this.data.favorites));
	}

    // Checks if a recipe is a favorite
    isFavorite(recipeId) {
        return this.data.favorites.includes(recipeId);
    }

	recipeResultList(recipeData) {
		// Remove all the children elements.
		this.eventClickChildrenRemove(this.elements.searchResults, 'recipeBuild');

		const recipeBuild = recipe => {
			const recipeElement = this.templates.searchResultsItem.cloneNode(true).firstElementChild;
			const recipeImage   = recipeElement.querySelector('.search-image');
			const recipeTitle   = recipeElement.querySelector('.search-title');
			const favoriteButton = recipeElement.querySelector('.favorite-button');

			favoriteButton.textContent = this.isFavorite(recipe.id) ? '💔' : '❤️';

			// Set the recipe title
			recipeTitle.textContent = recipe.title;

			// Add the image location and title.
			recipeImage.src = recipe.image;
			recipeImage.alt = recipe.title;
			recipeImage.dataset.id = recipe.id;

			// Add an event listener to the recipe list item
			this.eventClickSave(recipeElement, 'recipeBuild', (event) => this.recipeViewOpen(event.target.dataset.id));

			 // Check if the recipe is a favorite and update the button class
			if (this.isFavorite(recipe.id)) {
                favoriteButton.classList.add('is-favorite');
            }

            // Add event listener for the favorite button
			favoriteButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering any parent event
                this.toggleFavorite(recipe.id, favoriteButton); // Pass the button to the toggle function
                console.log(`Favorite button for recipe ID ${recipe.id} clicked.`);
            });

            // Return the element
            return recipeElement;
        };

		// Loop through the recipe results and fill the list.
		recipeData.results.forEach(
			recipe => this.elements.searchResults.appendChild(recipeBuild(recipe)));
	}

	// Search for recipes
	recipeSearch(event) {
		const searchQuery = this.elements.searchInput.value;
		let searchResult;

		event.preventDefault();

		try {
			// If there's no text in the search box, throw an error.
			if (!this.elements.searchInput.value.length) throw new Error('searchInputEmpty');

			// Get the API URL for Spoonacular, and build the search parameters.
			const url  = this.apis.spoonacular;
			url.search = new URLSearchParams({
				                                 apiKey: this.data.apiKeys.spoonacular,
				                                 query:  this.elements.searchInput.value
			                                 });

			// Check if this item has already been searched for (to save API calls)
			if (searchResult = this.data.searchHistory.find(item => item.searchQuery === searchQuery)) {
				this.recipeResultList(searchResult);
			}

			// Fetch the JSON
			else this.apiFetchJSON(this.apis.spoonacular, recipeData => {
				console.log(recipeData);

				// Save the search history
				this.data.searchHistory.push({searchQuery: searchQuery, ...recipeData});
				this.apiCacheSave();
				this.recipeHistoryList();

				// Build the recipe result list.
				this.recipeResultList(recipeData);

				// TODO: Do secondary API action here
			});

		} catch (error) {
			// Log any errors.
			console.log('recipeSearch Error:', this.errors[error.message]);
			return false;
		}
	}

	// Close the recipe view element
	recipeViewClose() {
		// TODO: Add Recipe View Close Code Here

	}

	// Open the recipe view element and populate it
	recipeViewOpen(recipeID) {
		// TODO: Add Recipe View Code Here
	}
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Foundation
    $(document).foundation();

    // Load the site
    const sb = new safeBite();
});

