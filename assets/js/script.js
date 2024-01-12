class safeBite {
	// API URLs
	apis     = {
		spoonacular: new URL('https://api.spoonacular.com/recipes/complexSearch'),
		unsplash:    new URL('https://api.unsplash.com/search/photos')
	};
	// Data Storage
	data     = {
		apiKeys:       {},  // API keys. Filled by constructor.
		functions:     [],  // Events functions list
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

		// Load the cache.
		this.apiCacheLoad();

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
		// Remove all the children elements.
		this.eventClickChildrenRemove(this.elements.searchResults, 'recipeBuild');

		const recipeBuild = recipe => {
			// TODO: Consider putting this in a <template> instead of building it.
			const recipeElement = document.createElement('li');
			const recipeImage   = document.createElement('img');
			const recipeTitle   = document.createElement('div');

			recipeTitle.textContent = recipe.title;

			// Add the image location and title.
			recipeImage.src = recipe.image;
			recipeImage.alt = recipe.title;

			// Add the image to the list item.
			recipeElement.appendChild(recipeImage);
			recipeElement.appendChild(recipeTitle);

			// Add an event listener to the recipe list item
			this.eventClickSave(recipeElement, 'recipeBuild', (event) => this.recipeView(event.target.dataset.id));

			return recipeElement;
		};

		// Loop through the recipe results and fill the list.
		recipeData.results.forEach(
			recipe => this.elements.searchResults.appendChild(recipeBuild(recipe)));
	}

	recipeListUpdate() {

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
				this.recipeListBuild(searchResult);
			}

			// Fetch the JSON
			else this.apiFetchJSON(this.apis.spoonacular, recipeData => {
				console.log(recipeData);

				// Add the search to the array.
				this.data.searchHistory.push({searchQuery: searchQuery, ...recipeData});
				this.apiCacheSave();

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

	recipeView(recipeID) {
		// TODO: Add Recipe View Code Here
	}
}

// Load the site.
const sb = new safeBite();