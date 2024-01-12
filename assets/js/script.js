class safeBite {
	// API URLs
	apis     = {
		spoonacular: new URL('https://api.spoonacular.com/recipes/complexSearch'),
		unsplash:    new URL('https://api.unsplash.com/search/photos')
	};
	// Data Storage
	data     = {
		apiKeys:       {},        // API keys. Filled by constructor.
		searchHistory: []   // Search history
	};
	// Elements
	elements = {
		searchButton:  document.querySelector('#search-button'),
		searchHistory: document.querySelector('#search-history'),
		searchInput:   document.querySelector('#search-recipe'),
		searchResults: document.querySelector('#search-results')
	};
	// Errors
	errors   = {
		searchInputEmpty: 'You must enter text.'
	};
	// Settings
	settings = {
		cacheKey: 'searchHistory'    // Cache Location
	};

	constructor() {
		// Load the API key
		this.data.apiKeys = apiKeys;

		// Add an event listener to the search button
		this.elements.searchButton.addEventListener('click', this.recipeSearch.bind(this));
	}

	// Load the search history cache
	apiCacheLoad() {
		// Pull the searchHistory from localStorage and parse it into an array. If this is unsuccessful, use the
		// default value (or any other value) in searchHistory.
		this.data.searchHistory = JSON.parse(localStorage.getItem(this.settings.cacheKey)) ?? this.data.searchHistory;
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

	// Search for images
	imageSearch(query) {
		try {
			// If there's no text entered in in the search box, throw an error.
			if (!this.elements.searchInput.value.length) throw new Error('searchInputEmpty');

			// Get the API URL for Unsplash, and build the search parameters.
			const url  = this.apis.unsplash;
			url.search = new URLSearchParams({
				                                 client_id: this.data.apiKeys.unsplash.accessKey,
				                                 query:     this.elements.searchInput.value
			                                 });
			// Fetch the JSON
			return this.apiFetchJSON(this.apis.unsplash, data => console.log(data));
		} catch (error) {
			// Log any errors.
			console.log('recipeSearch Error:', this.errors[error.message]);
			return false;
		}
	}

	recipeListBuild(recipeData) {

		const recipeBuild = recipe => {
			// TODO: Consider putting this in a <template> instead of building it.
			const recipeElement = document.createElement('li');
		};
	}

	recipeListUpdate() {

	}

	// Search for recipes
	recipeSearch() {
		const searchQuery = this.elements.searchInput.value;
		let searchResult;

		try {
			// If there's no text entered in the search box, throw an error.
			if (!this.elements.searchInput.value.length) throw new Error('searchInputEmpty');

			// Get the API URL for Spoonacular, and build the search parameters.
			const url  = this.apis.spoonacular;
			url.search = new URLSearchParams({
				                                 client_id: this.data.apiKeys.spoonacular,
				                                 query:     this.elements.searchInput.value
			                                 });

			// Check if this item has already been searched for (to save API calls)
			if (searchResult = this.data.searchHistory.find(item => item.searchQuery === searchQuery)) {
				this.recipeListUpdate(searchResult);
			}

			// Fetch the JSON
			else this.apiFetchJSON(this.apis.spoonacular, data => {
				console.log(recipeData);

				// Add the search to the front of the array.
				this.data.searchHistory.unshift({
					                                searchQuery:   searchQuery,
					                                searchResults: recipeData
				                                });

				this.recipeListBuild(recipeData);
				// Do an image search based off of the input
				// this.imageSearch(searchQuery)
			});

		} catch (error) {
			// Log any errors.
			console.log('recipeSearch Error:', this.errors[error.message]);
			return false;
		}
	}
}

// Load the site.
const sb = new safeBite();