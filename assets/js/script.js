class safeBite {
	// API URLs
	apis      = {
		apiNinjas:   new URL('https://api.api-ninjas.com/v1/quotes'),
		edamam:      new URL('https://api.edamam.com/api/nutrition-data'),
		spoonacular: new URL('https://api.spoonacular.com/recipes/complexSearch')
	};
	// Data Storage
	data      = {
		apiKeys:       {},  // API keys. Filled by constructor.
		favorites:     [],  // Favorite's array
		functions:     [],  // Events functions list
		searchHistory: []   // Search history
	};
	// Elements
	elements  = {
		favoritesClearButton: document.querySelector('#clear-favorites'),  // Clear favorites button
		favoritesShowButton:  document.querySelector('#show-favorites'),   // Clear favorites button
		historyClearButton:   document.querySelector('#clear-history'),    // Clear history button
		searchButton:         document.querySelector('#search-button'),    // Search button
		searchHistory:        document.querySelector('#search-history'),   // Search history list
		searchInput:          document.querySelector('#search-recipe'),    // Search recipe input
		searchResults:        document.querySelector('#search-results')    // Search results list
	};
	// Errors
	errors    = {
		searchInputEmpty: 'You must enter text.'
	};
	// Settings
	settings  = {
		cacheSearchHistoryKey: 'searchHistory',    // Search history cache key
		cacheFavoritesKey:     'favorites'         // Favorites cache key
	};
	templates = {
		searchResultsItem: document.querySelector('#search-results-item').content,
		searchHistoryItem: document.querySelector('#search-history-item').content
	};

	constructor() {
		// Load the API key
		this.data.apiKeys = apiKeys;

		// Load the cache.
		this.apiCacheLoad('searchHistory');
		this.apiCacheLoad('favorites');

		// Initialize event listeners
		this.initializeEventListeners();

		// Initialize Foundation
		$(document).foundation();
	}

	// Initialize event listeners for the UI
	initializeEventListeners() {
		this.elements.searchButton.addEventListener('click', this.recipeSearch.bind(this));

		// Event listener for clearing search history
		// this.eventClickSave(this.elements.historyClearButton, 'clearHistory', () => this.recipeHistoryClear());
		document.getElementById('clear-history').addEventListener('click', () => this.recipeHistoryClear());

		// Event listener for showing favorites
		// this.eventClickSave(this.elements.favoritesShowButton, 'showFavorites', () => this.showFavorites());
		document.getElementById('show-favorites').addEventListener('click', () => this.showFavorites());

		// Event listener for clearing favorites
		// this.eventClickSave(this.elements.favoritesClearButton, 'clearFavorites', () => this.clearFavorites());
		document.getElementById('clear-favorites').addEventListener('click', () => this.clearFavorites());
	}

	/***
	 * API Functions
	 ***/

	// Load the search history cache
	apiCacheLoad(type) {
		try {
			switch (type) {
				case 'favorites':
					// Load favorites into the data storage
					this.data.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
					break;
				case 'searchHistory':
					// Pull the searchHistory from localStorage and parse it into an array. If this is unsuccessful,
					// use the default value (or any other value) in searchHistory.
					this.data.searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
					this.recipeHistoryList();
					break;
				default:
					// If trying to load a cache that isn't defined, throw an error.
					throw new Error(`Invalid data cache type used: "$type"`);
			}
		} catch (error) {
			console.log('apiCacheSave failure:', error);
			return false;
		}
	}

	// Cache the search history
	apiCacheSave(type) {
		let apiData, cacheKey;
		try {
			if (!this.data[type]) throw new Error(`Data "${type}" does not exist.`);

			switch (type) {
				case 'favorites':
					// Cache favorites
					cacheKey = this.settings.cacheFavoritesKey;
					apiData  = JSON.stringify(this.data.favorites);
					break;
				case 'searchHistory':
					// Cache search history
					cacheKey = this.settings.cacheSearchHistoryKey;
					apiData  = JSON.stringify(this.data.searchHistory);
					break;
				// An invalid type was specified.
				default:
					throw new Error(`Invalid data cache type used: "${type}"`);
			}
			// Turn the array data into a string for storage
			apiData = JSON.stringify(this.data[type]);

			// If the data was successfully converted to an array, save it and check the integrity.
			if (apiData) {
				localStorage.setItem(cacheKey, apiData);
				if (apiData === localStorage.getItem(cacheKey)) return true;
			}

		} catch (error) {
			// If JSON conversion was unsuccessful, or the data did not save properly, something broke.
			console.log('apiCacheSave failure:', error);
		}
		return false;
	}

	// Handler for API fetch requests, with optional header and callback function for handling asynchronous requests.
	async apiFetchJSON(apiData) {
		// Default fetch data, then append anything that was specified.
		const fetchObject = {
			url:      undefined,
			callback: undefined,
			...apiData,
			headers: {headers: apiData.headers ?? {}}
		};

		try {
			// Fetch data from the specified URL, and then return it.
			const response = await fetch(fetchObject.url, fetchObject.headers);

			// If the response is not okay, throw an error.
			if (!response.ok) throw new Error('networkError');

			// If a callback was provided, return the value from that, otherwise return the parsed response.
			else return fetchObject.callback
			            ? response.json().then(response => fetchObject.callback(response))
			            : response.json();
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

	/***
	 * Favorites Functions
	 ***/

	// Method to show the favorites list
	showFavorites() {
		const modalFavoritesList     = document.getElementById('modal-favorites-list');
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
		this.apiCacheSave('favorites');
		this.showFavorites();
		console.log('Favorites cleared.');
	}

	// Toggles the favorite status of a recipe
	toggleFavorite(recipe, favoriteButton) {
		const isFavorite = this.data.favorites.some(fav => fav.id === recipe.id);
		console.log(`Recipe "${recipe.title}" is currently ${isFavorite ? 'a favorite' : 'not a favorite'}. Toggling status.`);

		if (isFavorite) {
			this.data.favorites        = this.data.favorites.filter(fav => fav.id !== recipe.id);
			favoriteButton.textContent = '❤️'; // Change to heart icon
		} else {
			this.data.favorites.push(recipe);
			favoriteButton.textContent = '💔'; // Change to broken heart icon
		}

		console.log(`Updated favorites:`, this.data.favorites);
		this.apiCacheSave('favorites');
	}

	// Checks if a recipe is a favorite
	isFavorite(recipeId) {
		return this.data.favorites.includes(recipeId);
	}

	async nutritionFetch(foodData) {
		// Get the API URL for Edamam, fill the API key data and search query.
		const url  = this.apis.edamam;
		url.search = new URLSearchParams({
			                                 ...this.data.apiKeys.edamam,
			                                 ingr: foodData
		                                 });
		// Fetch the JSON
		return this.apiFetchJSON({
			                         url:      this.apis.spoonacular,
			                         callback: recipeData => {
				                         // Save the search history
				                         this.data.searchHistory.push({searchQuery: foodData, ...recipeData});
				                         this.apiCacheSave('searchHistory');
				                         this.recipeHistoryList();
			                         }
		                         });
	}

	/***
	 * Quote Function
	 ***/

	// Fetch a random food quote.
	quoteFetch() {
		const url = this.apis.apiNinjas;

		// Set search category to food.
		url.searchParams.set('category', 'food');

		// Fetch a quote from API Ninjas.
		this.apiFetchJSON({
			                  url:      url,
			                  headers:  {'X-Api-Key': this.data.apiKeys.apiNinjas},
			                  callback: quote => console.log(quote)
			                  // this.elements.someElement.textContent = `"${quote[0].quote}" - ${quote[0].author}`;
			                  // TODO: Remove console.log() and uncomment the string, replace 'someElement' with
			                  //  whatever element. Alternatively, two separate elements (quote and author)
			                  //  could be filled, and adjusted with CSS.
		                  });
	}

	/***
	 * Recipe Functions
	 ***/

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
		this
			.eventClickChildrenRemove(this.elements.searchHistory, 'historyBuild');

		// Function to build search history list items.
		const
			historyBuild = search => {
				const searchElement       = this.templates.searchHistoryItem.cloneNode(true).firstElementChild;
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
			recipe => this.elements.searchHistory.prepend(historyBuild(recipe)));
	}

	recipeResultList(recipeData) {
		// Remove all the children elements.
		this.eventClickChildrenRemove(this.elements.searchResults, 'recipeBuild');

		const recipeBuild = recipe => {
			const recipeElement  = this.templates.searchResultsItem.cloneNode(true).firstElementChild;
			const recipeImage    = recipeElement.querySelector('.search-image');
			const recipeTitle    = recipeElement.querySelector('.search-title');
			const favoriteButton = recipeElement.querySelector('.favorite-button');

			favoriteButton.textContent = this.isFavorite(recipe.id) ? '💔' : '❤️';

			// Set the recipe title
			recipeTitle.textContent = recipe.title;

			// Add the image location and title.
			recipeImage.src        = recipe.image;
			recipeImage.alt        = recipe.title;
			recipeImage.dataset.id = recipe.id;

			// Add an event listener to the recipe list item
			this.eventClickSave(recipeElement, 'recipeBuild', (event) => this.recipeViewOpen(event.target.dataset.id));

			// Check if the recipe is a favorite and update the button class
			if (this.isFavorite(recipe.id))
				favoriteButton.classList.add('is-favorite');

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
			else this.apiFetchJSON({
				                       url:      this.apis.spoonacular,
				                       callback: recipeData => {
					                       console.log(recipeData);

					                       // Save the search history
					                       this.data.searchHistory.push({searchQuery: searchQuery, ...recipeData});
					                       this.apiCacheSave('searchHistory');
					                       this.recipeHistoryList();

					                       // Build the recipe result list.
					                       this.recipeResultList(recipeData);
				                       }
			                       });

			// Random food quote
			this.quoteFetch();

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

// Open the recipe view element and populate it.
	recipeViewOpen(recipeID) {
		// TODO: Add Recipe View Code Here
	}
}

// Load the site
const sb = new safeBite();
