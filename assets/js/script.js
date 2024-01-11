class safeBite {
	apis     = {
		spoonacular: new URL('https://api.spoonacular.com/recipes/complexSearch'),
		unsplash:    new URL('https://api.unsplash.com/search/photos')
	};
	data     = {
		apiKeys: {}     // API keys. Filled by constructor.
	};
	elements = {};
	settings = {
		cacheKey: ''    // Cache Location
	};

	constructor() {
		this.data.apiKeys = apiKeys;

		const url = this.apis.unsplash;
		url.search = new URLSearchParams({
			                                 client_id: this.data.apiKeys.unsplash.accessKey,
			                                 query:  'eggs'
		                                 });

		this.apiFetchJSON(this.apis.unsplash, data => console.log(data));
	}

	apiCacheLoad() {

	}

	apiCacheSave() {

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

	imageSearch() {

	}

	recipeListBuild() {

	}

	recipeListUpdate() {

	}

	recipeSearch() {

	}
}

const sb = new safeBite();