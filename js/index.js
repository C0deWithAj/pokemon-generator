const PATH_SPRITES = '../resources/normal/'; //.sprites/png/normal/
const PATH_SPRITES_SHINY = '../resources/shiny/'; //'sprites/png/shiny/'
const EXTENSIONSPRITE = '.png';
const KEY_STORAGE = "options";


function initPokemonGeneration() {
	console.log("generateRandom called");
	var userOptions = getUserOptions();
	saveOptionsToLocalStorage(userOptions);
	getEligiblePokemon(
		userOptions,
		function (eligiblePokemon) {
			var results = document.getElementById("iz0i");
			if (eligiblePokemon) {
				var generatedPokemon = pickupPokemonRandomly(eligiblePokemon, userOptions);
				var arrayResult = PokemonArrayToHtml(generatedPokemon, userOptions);
				if (arrayResult.length > 0) {
					console.log("pokemon generator")
					let sizeOfImages = 0;
					for (var i = 0; i < arrayResult.length; i++) {
						if (!isEmpty(arrayResult[i].image)) {
							sizeOfImages = sizeOfImages + 1;
						} else {

						}
						document.getElementById("result_img_" + (i + 1)).src = arrayResult[i].image;
						document.getElementById("result_title_" + (i + 1)).textContent = arrayResult[i].title;
					}
					handleResultContainerVisiblity(sizeOfImages);
				} else {
					showNoResultFound();
					console.log("Pokemon randomizer - no Result Found");
				}
			} else {
				results.innerHTML = "An error occurred while generating Pok&eacute;mon.";
			}
		}
	);
}


function showNoResultFound() {
    document.getElementById("main_result_container").hidden = false 
	document.getElementById("has_result_container").hidden = true
	document.getElementById("span_result_title").textContent = "Whoops! No Result found :("
}


function handleResultContainerVisiblity(numberOfResult) {
	document.getElementById("main_result_container").hidden = false 
	document.getElementById("has_result_container").hidden = false
	document.getElementById("span_result_title").textContent = "Pokémon Generated"
}

function isEmpty(str) {
	return (!str || str.length === 0);
}

/**
 * 
 * returns Number of total Images
 * @param {} array 
 */

function numberOfImagesInResult(array) {
	if (array.length > 0) {

	}
}

function isEmptyImages(str) {
	return (!str || str.length === 0);
}


function markLoading(isLoading) {
	document.getElementById("iiiuf").className = isLoading ? "loading" : "";
}




function setUserOptions(options) {
	if ("n" in options) {
		setDropdownIfValid("n", parseInt(options.n));
	}
	if ("region" in options) {
		setDropdownIfValid("region", options.region);
	}
	if ("type" in options) {
		setDropdownIfValid("type", options.type);
	}
	if ("ubers" in options) {
		document.getElementById("ubers").checked = parseBoolean(options.ubers);
	}
	if ("nfes" in options) {
		document.getElementById("nfes").checked = parseBoolean(options.nfes);
	}
	if ("sprites" in options) {
		document.getElementById("sprites").checked = parseBoolean(options.sprites);
	}
	if ("natures" in options) {
		document.getElementById("natures").checked = parseBoolean(options.natures);
	}
	if ("forms" in options) {
		document.getElementById("forms").checked = parseBoolean(options.forms);
	}
	if ("generate" in options) {
		initPokemonGeneration();
	}
}

function getUserOptions() {
	return {
		n: parseInt(6), //document.getElementById("n").value
		region: document.getElementById("region").value,
		type: document.getElementById("type").value,
		ubers: document.getElementById("ubers").checked,
		nfes: document.getElementById("nfes").checked,
		sprites: document.getElementById("sprites").checked,
		natures: document.getElementById("natures").checked,
		forms: document.getElementById("forms").checked
	};
}



function parseBoolean(boolean) {
	if (typeof boolean == "string") {
		return boolean.toLowerCase() == "true";
	}
	return !!boolean;
}

// Cache the results of getEligiblePokemon by options.
var cachedOptionsJson;
var cachedEligiblePokemon;

function getEligiblePokemon(options, callback) {
	var optionsJson = JSON.stringify(options);

	if (cachedOptionsJson == optionsJson) {
		callback(cachedEligiblePokemon);
	} else {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == XMLHttpRequest.DONE) {
				if (request.status == 200) {
					var pokemonInRegion = JSON.parse(request.responseText);
					var eligiblePokemon = filterByOptions(pokemonInRegion, options);
					cachedOptionsJson = optionsJson;
					cachedEligiblePokemon = eligiblePokemon;
					callback(eligiblePokemon);
				} else {
					console.error(request);
					callback(null);
				}
			}
		};
		request.open("GET", "../json/" + options.region + ".json");
		request.send();
	}
}

function setDropdownIfValid(selectID, value) {
	const select = document.getElementById(selectID);
	const option = select.querySelector("[value='" + value + "']");
	if (option) {
		select.value = option.value;
	}
}

function filterByOptions(pokemonInRegion, options) {
	return pokemonInRegion.filter(function (pokemon) {
		if (options.forms && "forms" in pokemon) {
			// Filter Pokémon with Forms, ignore the top level Pokémon
			pokemon.forms = filterByOptions(pokemon.forms, options);
			return pokemon.forms.length > 0;
		}

		if (options.type != "all" && pokemon.types.indexOf(options.type) < 0) {
			return false;
		}

		if (!options.ubers && pokemon.isUber) {
			return false;
		}

		if (!options.nfes && pokemon.isNfe) {
			return false;
		}

		return true;
	});
}



/** pokemon randomizer - Chooses x Pokemom from array without replacing them */

function pickupPokemonRandomly(eligiblePokemon, options) {
	var chosenArray = [];

	// Deep copy so that we can modify the array as needed.
	var eligiblePokemon = JSON.parse(JSON.stringify(eligiblePokemon));

	while (eligiblePokemon.length > 0 && chosenArray.length < options.n) {
		var chosen = removeRandomElement(eligiblePokemon);

		if (options.forms && chosen.forms) {
			// Choose a random form, getting its ID from the top level.
			var randomForm = removeRandomElement(chosen.forms);
			randomForm.id = chosen.id;
			chosen = randomForm;

			// If we generated a mega, we can't choose any more.
			if (chosen.isMega) {
				eligiblePokemon = removeMegas(eligiblePokemon);
			}
			if (chosen.isGigantamax) {
				eligiblePokemon = filterOutGigantaMaxes(eligiblePokemon);
			}
		}

		chosenArray.push(chosen);
	}

	// Shuffling for good measurement 
	return shuffleModernFisherYatesPokemon(chosenArray);
}

/** Pokemon team generatorFilters megas from the array. Doesn't mutate the original array. */
/** Filter out all the megas from the Random array of Pokemons */
function removeMegas(arrayOfPokemon) {
	return arrayOfPokemon.filter(function (pokemon) {
		if ("forms" in pokemon) {
			pokemon.forms = pokemon.forms.filter(function (form) {
				return !form.isMega
			});
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

/** Filters Gigantamax forms from the array. Doesn't mutate the original array. */
function filterOutGigantaMaxes(pokemonArray) {
	return pokemonArray.filter(function (pokemon) {
		if ("forms" in pokemon) {
			pokemon.forms = pokemon.forms.filter(function (form) {
				return !form.isGigantamax
			});
			return pokemon.forms.length > 0;
		} else {
			return true; // always keep if no forms
		}
	});
}

function generateRandomPlayers()
{
	Math.floor(Math.random() * 11);
}

/** Converts a JSON array of Pokémon into an HTML ordered list. */

function PokemonArrayToHtml(generatedPokemon, options) {
	const output = [];
	for (var i = 0; i < generatedPokemon.length; i++) {
		console.log("Adding result to array");
		output.push(htmlifyPokemon(generatedPokemon[i], options))
	
	}
	return output;
}

/**
 * pokémon team generator
 * @param {*} pokemon 
 * @param {*} options 
 * @returns 
 * /**  JSON of one Pokemon into an HTML list */


function htmlifyPokemon(pokemon, options) {
	var shiny = Math.floor(Math.random() * 65536) < 16;

	var title = (shiny ? "Shiny " : "") + pokemon.name;
	var classes = "";
	if (shiny) {
		classes += "shiny ";
	}
	if (!options.sprites) {
		classes += "imageless ";
	}

	var result = new Object();
	result.title = title;


	var out = '<li title="' + title + '" class="' + classes + '">';

	if (options.natures) {
		out += '<span class="nature">' + generateNature() + "</span> ";
	}
	out += pokemon.name;
	if (shiny) {
		out += ' <span class="star">&#9733;</span>';
	}
	if (options.sprites) {
		var sprite = getSpritePath(pokemon, shiny);
		out += ' <img src="' + sprite + '" alt="' + title + '" title="' + title + '" />';
		console.log("setting image = " + sprite);
		result.image = sprite;
	}
	out += "</li>";
	console.log("returning object = " + result);
	return result;
}

function getSpritePath(pokemon, shiny) {
	var path = shiny ? PATH_SPRITES_SHINY : PATH_SPRITES;
	var name = pokemon.id;
	if (pokemon.spriteSuffix) {
		name = name + "-" + pokemon.spriteSuffix;
	}
	return path + name + EXTENSIONSPRITE;
}

function generateNature() {
	return getRandomElement(NATURES);
}

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Na&iuml;ve", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];

function getRandomElement(arr) {
	return arr[randomInteger(arr.length)];
}

function removeRandomElement(arr) {
	return arr.splice(randomInteger(arr.length), 1)[0];
}

/** Modern Fisher-Yates shuffle. */
function shuffleModernFisherYatesPokemon(arr) {
	for (var i = arr.length - 1; i > 0; i--) {
		var j = randomInteger(i + 1);
		var temp = arr[i];
		arr[i] = arr[j];
		arr[j] = temp;
	}
	return arr;
}

function randomInteger(maxExclusive) {
	return Math.floor(Math.random() * maxExclusive);
}


/** Random Pokemon Generator -> Stores the current options in local storage and in the URL. */
function saveOptionsToLocalStorage(userOptions) {
	var strigifiedJson = JSON.stringify(userOptions);
	window.localStorage.setItem(KEY_STORAGE, strigifiedJson);

	window.history.replaceState({}, "", "?" + changeOptionsToUrlParams(userOptions));
}

/** Loads options from either the URL or local storage. */
function loadUserOptions() {
	if (isOptionsInUrl()) {
		setUserOptions(convertUrlParamsToOptions());
	} else {
		var optionsJson = window.localStorage.getItem(KEY_STORAGE);
		if (optionsJson) {
			setUserOptions(JSON.parse(optionsJson));
		}
	}
}

/** pokemon randomizer Returns whether or not the URL specifies any options as parameters. */
function isOptionsInUrl() {
	const questionIndex = window.location.href.indexOf("?");
	return questionIndex >= 0 && questionIndex + 1 < window.location.href.length;
}

/** pokemon team generator - Parse URL parameter OPtions */
function convertUrlParamsToOptions() {
	const indexQuestionMark = window.location.href.indexOf("?");
	const paramString = window.location.href.substring(indexQuestionMark + 1);
	const options = {};
	const pairParams = paramString.split("&");
	for (let i = 0; i < pairParams.length; i++) { // woo IE
		const splitParam = pairParams[i].split("=");
		const key = decodeURIComponent(splitParam[0]);
		const value = splitParam[1];
		if (value) {
			options[key] = decodeURIComponent(value);
		} else {
			options[key] = null;
		}
	}
	return options;
}

/** random pokemon team generator - Returns URL parameters for the given settings, excluding the leading "?". */
function changeOptionsToUrlParams(options) {
	return Object.keys(options).map(function (key) {
		return encodeURIComponent(key) + "=" + encodeURIComponent(options[key])
	}).join("&");
}

document.addEventListener("DOMContentLoaded", loadUserOptions);





