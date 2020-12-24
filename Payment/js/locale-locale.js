var Locale=Locale||{};Locale.language=Locale.language||{};

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
	Object.keys = function () {
		'use strict';
		var e = Object.prototype.hasOwnProperty,
			t = !{
				toString: null
			}.propertyIsEnumerable('toString'),
			n = ['toString', 'toLocaleString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'constructor'],
			r = n.length;
		return function (i) {
			if (typeof i !== 'object' && (typeof i !== 'function' || i === null)) {
				throw new TypeError('Object.keys called on non-object')
			}
			var s = [],
				o, u;
			for (o in i) {
				if (e.call(i, o)) {
					s.push(o)
				}
			}
			if (t) {
				for (u = 0; u < r; u++) {
					if (e.call(i, n[u])) {
						s.push(n[u])
					}
				}
			}
			return s
		}
	}()
};

/*jslint nomen:false, debug:true, evil:true, vars:false, browser:true, forin:true, undef:false, white:false */
/**
 * Locale library. For managing translations inside the user interface.
 */

/**
 * Localization Function
 */
var extend = function () {

	// Variables
	var extended = {};
	var deep = false;
	var i = 0;
	var length = arguments.length;

	// Check if a deep merge
	if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
		deep = arguments[0];
		i++;
	}

	// Merge the object into the extended object
	var merge = function (obj) {
		for (var prop in obj) {
			if (Object.prototype.hasOwnProperty.call(obj, prop)) {
				// If deep merge and property is an object, merge properties
				if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
					extended[prop] = extend(true, extended[prop], obj[prop]);
				} else {
					extended[prop] = obj[prop];
				}
			}
		}
	};

	// Loop through each object and conduct a merge
	for (; i < length; i++) {
		var obj = arguments[i];
		merge(obj);
	}

	return extended;

};

(function () {
	// RegEx to trim whitespaces around strings to be translated.
	'use strict';
	Locale.trimRexp = /^\s+|\s+$/g;
	Locale.notTranslated = [];
	Locale.currentTranslation = {};

	function stretch(str, length) {
		if (str.length > length) {
			return str;
		}
		var slength = str.length - 1,
			diff = Math.ceil(length / slength),
			sum = 0,
			newWord = [],
			r;
		for (var x = 0; x < slength; x++) {
			r = rand(1, diff);
			sum += r;
			newWord[x] = r;
		}
		newWord[x] = (length - sum);
		stretched = "";
		for (var i = 0; i < newWord.length; i++) {
			for (j = 0; j < newWord[i]; j++) {
				stretched += str[i];
			}
		}
		return stretched;
	}

	if (Array.prototype.include === undefined) {
		Array.prototype.include = function (wrd) {
			for (var i in this) {
				if (wrd == this[i]) {
					return true;
				}
			}
			return false;
		};
	}

	String.prototype.jprintf = function (obj) {
		var useArguments = false;
		var _arguments = arguments;
		var i = -1;
		if (typeof _arguments[0] == "string") {
			useArguments = true;
		}
		if (obj instanceof Array || useArguments) {
			return this.replace(/\%s/g,
				function (a, b) {
					i++;
					if (useArguments) {
						if (typeof _arguments[i] == 'string') {
							return _arguments[i];
						} else {
							throw new Error("Arguments element is an invalid type");
						}
					}
					return obj[i];
				});
		} else {
			return this.replace(/{([^{}]*)}/g,
				function (a, b) {
					var r = obj[b];
					return typeof r === 'string' || typeof r === 'number' ? r : a;
				});
		}
	};

	// String.locale() is the main function that translates a string. It is 
	// added to the prototype so that any String variable can access it.
	String.prototype.locale = function (arg_obj) {
		if (arg_obj === undefined) {

		}

		var word = this;
		if ('language' in Locale) {
			// Trim String
			word = word.toString().replace(Locale.trimRexp, '');
			// Check language file
			if (word in Locale.language && Locale.language[word] !== null) {
				if (Locale.language[word] != "") {
					// word = Locale.language[word];
					if(window.user && window.user.username === 'translation_zombie') {
						word = word
					} else {
						word = Locale.language[word];
					}
				}
			} else {
				if (Locale.isJotFormDate(word)) {
					var date = Locale.jotFormDateTranslate(word);
					word = date;
				}
				if (!Locale.notTranslated.include(word)) {
					//only insert if there is more than 6 translations already in languages This was a bad Hack TODO: find a way for not to use this!
					if (Object.keys(Locale.language).length > 6) {
						Locale.notTranslated.push(word);
						//Locale.submitNotTranslated();
					}
				}
			}
		}

		if (arg_obj !== undefined) {
			if (typeof arg_obj !== "string" && typeof arg_obj !== "number") {
				return word.jprintf(arg_obj);
			} else {
				return word.printf.apply(word, arguments); //use old system
			}
		} else {
			return word;
		}
	};
	Locale.isJotFormDate = function (date) {
		// if Date format is :: January 31st, 2020
		var regex = /(January|February|March|April|May|June|July|August|September|November|December)\s[0-9]{1,2}(st|nd|rd|th),\s[0-9]{4}/g;
		var result = regex.test(date);

		if (result) {
			var dates = date.split(' ');
			result = (dates[0] in Locale.language && Locale.language[dates[0]] !== null);
		}

		return result;
	};

	Locale.jotFormDateTranslate = function (date) {
		var dates = date.split(' ');
		if (dates[1].indexOf(',') > 0) {
			dates[1] = dates[1].replace(",", "");
		}
		if (dates[1].indexOf('st') > 0) {
			dates[1] = dates[1].replace("st", "");
		}
		if (dates[1].indexOf('nd') > 0) {
			dates[1] = dates[1].replace("nd", "");
		}
		if (dates[1].indexOf('rd') > 0) {
			dates[1] = dates[1].replace("rd", "");
		}
		if (dates[1].indexOf('th') > 0) {
			dates[1] = dates[1].replace("th", "");
		}
		return dates[1] + ' ' + Locale.language[dates[0]] + ' ' + dates[2];
	};

	Locale.submitNotTranslated = function () {

		//if no admin cookie was to be found do not submit
		// if(document.cookie.indexOf("admin=") === -1){
		//console.log('submitNotTranslated returning false since admin cookie was not found');
		// 	return false;
		// }

		if (window.JOTFORM_ENV === "PRODUCTION") {
			if (document.cookie.indexOf('Helen') === -1 && document.cookie.indexOf('emre') === -1 && document.cookie.indexOf('translationtest') === -1)
				return false;
			else return true;
		} else {
			if ((document.cookie.indexOf('=hatice') === -1) && (document.cookie.indexOf('=emre') === -1) && (document.cookie.indexOf('translationtest') === -1))
				return false;
		}

		if (Locale.submitNotTranslatedTimer !== undefined) {
			//there is already ongoing submit proccess prevent it from happening
			clearTimeout(Locale.submitNotTranslatedTimer);
		}

		Locale.submitNotTranslatedTimer = setTimeout(function () {

			var tmp = [];

			for (var i = 0; i < Locale.notTranslated.length; i++) {
				var ntwd = Locale.notTranslated[i];

				if (!(ntwd in Locale.language) && ntwd !== '') { //check for double translations and empty strings
					tmp.push(ntwd);
				}
			}

			var raw = tmp.join("__NOT_TRANSLATED__");
			Locale.notTranslated = []; //flush the nonTranslated
			if ("Ajax" in window) {
				if (Ajax.Request !== undefined) {
					new Ajax.Request('/translations/submit_translations.php', {
						parameters: {
							action: 'submitNotTranslated',
							lang_code: Locale.language['langCode'],
							raw: raw
						},
						method: "POST",
						onComplete: function (t) {}
					});
				}
			} else {
				var $_ = $ || jQuery;
				$_.post("/translations/submit_translations.php", {
					action: 'submitNotTranslated',
					lang_code: Locale.language['langCode'],
					raw: raw
				}, function (t) {});
			}

		}, 5000); //send after 10 seconds
	}



	// Extend the English language with the custom language here.
	if ('language' in Locale) {
		if (Object.extend !== undefined) {
			Locale.language = Object.extend(Locale.languageEn, Locale.language);
		} else {
			Locale.language = extend(Locale.languageEn, Locale.language);
		}

	} else {
		// This is faster than extending :)
		Locale.language = Locale.languageEn;
	}


	function startsWith(str, word) {
		return str.lastIndexOf(word, 0) === 0;
	}

	

	/**
	 * Since the page is not rendered yet when this library is loaded, 
	 * interval runs until it finds all elements.
	 * 
	 * After manupulations done, interval deletes itself.
	 */
	var elementsToUpdate = null;
	var elemtentsWithDataAttr = null;
	var isTranslatedDataAttr = false;
	var executeIntervalTime = 100;
	var killIntervalTime = 5000;
	var el = null;
	var localeAttributes = setInterval(function () {
		elementsToUpdate = document.querySelectorAll('[class*="locale-data"]');

		if (elementsToUpdate.length > 0) {
			for (var i = 0; i < elementsToUpdate.length; i++) {
				el = elementsToUpdate[i];
				for (var a = 0; a < el.classList.length; a++) {
					//var currentClass = el.classList[a].startsWith("locale-data");
					
					// IE fix
					var currentClass = startsWith(el.classList[a], "locale-data");

					if (currentClass) {
						var className = el.classList[a];
						var res = className.replace("locale-data-", "");
						
						if (el.attributes[res]) {
							el.attributes[res].nodeValue = el.attributes[res].nodeValue.locale();
							isTranslatedDataAttr = true;
						} else if (el.attributes['data-'+res] ) {
							el.attributes['data-'+res].nodeValue = el.attributes['data-'+res].nodeValue.locale();
							isTranslatedDataAttr = true;
						} 
					}
				}
			}
			clearInterval(localeAttributes)
		}

		elemtentsWithDataAttr = Array.from(document.querySelectorAll('*[data-content]')).filter(function(item) { return item.innerText === ''});

		if (elemtentsWithDataAttr.length > 0 && !isTranslatedDataAttr) {
			for(var i = 0; i < elemtentsWithDataAttr.length; i++) {
				var translatedText = elemtentsWithDataAttr[i].getAttribute('data-content').locale();
				
				elemtentsWithDataAttr[i].setAttribute('data-content', translatedText);
			}

			clearInterval(localeAttributes);
		}

		setTimeout(function() {
			clearInterval(localeAttributes);
		}, killIntervalTime);

	}, executeIntervalTime);

	// 

	/**
	 * Translates the hard coded strings in html templates
	 */
	var title_translated_mtrsfix = false;
	Locale.changeHTMLStrings = function () {
	
		var isZombieActive = (Locale.language['langCode'] == 'zb-ZB') ? true : false;
	
		var localeItems = document.querySelectorAll('.locale'),
			localeImgs = document.querySelectorAll('.locale-img'),
			localeButtons = document.querySelectorAll('.locale-button');

		Array.prototype.forEach.call(localeItems, function(element) { 
			if (!isZombieActive) {
				element.classList.remove('locale');
			}

			if (element.firstChild && (element.firstChild.nodeName == "IMG" || element.firstChild.nodeName == "SVG")) { return; }
			
			element.innerHTML = element.innerHTML.locale();
		});

		// Array.from(document.querySelectorAll('.locale')).forEach(function(element) {
		// 	if (!isZombieActive) {
		// 		element.classList.remove('locale');
		// 	}

		// 	if (element.firstChild && (element.firstChild.nodeName == "IMG" || element.firstChild.nodeName == "SVG")) { return; }
			
		// 	element.innerHTML = element.innerHTML.locale();
		// });

		Array.prototype.forEach.call(localeImgs, function(element) { 
			if (!isZombieActive) {
				element.classList.remove('locale-img');
			}

			if (element.hasAttribute('alt')) {
				element.setAttribute("alt", element.getAttribute('alt').locale());
			}
			if (element.hasAttribute('title')) {
				element.setAttribute("title", element.getAttribute('title').locale());
			}
		});

		// Array.from(document.querySelectorAll('.locale-img')).forEach(function(element) {
		// 	if (!isZombieActive) {
		// 		element.classList.remove('locale-img');
		// 	}

		// 	if (element.hasAttribute('alt')) {
		// 		element.setAttribute("alt", element.getAttribute('alt').locale());
		// 	}
		// 	if (element.hasAttribute('title')) {
		// 		element.setAttribute("title", element.getAttribute('title').locale());
		// 	}
		// });

		Array.prototype.forEach.call(localeButtons, function(element) { 
			if (!isZombieActive) {
				element.classList.remove('locale-button');
			}

			if(element.value) {
				element.value = element.value.locale();
			} 
			if(element.innerHTML) {
				element.innerHTML = element.innerHTML.locale();
			}
		});	

		// Array.from(document.querySelectorAll('.locale-button')).forEach(function(element) {
		// 	if (!isZombieActive) {
		// 		element.classList.remove('locale-button');
		// 	}

		// 	if(element.value) {
		// 		element.value = element.value.locale();
		// 	} 
		// 	if(element.innerHTML) {
		// 		element.innerHTML = element.innerHTML.locale();
		// 	}
		// });

		// Change document title as well.
		if (title_translated_mtrsfix === false) {
			title_translated_mtrsfix = true;
			document.title = document.title && document.title.locale();
		}

	};


	Locale.changeHTMLStrings(); // Translate hard coded values first
	
	var selectVal = document.getElementById('language-box');
	if (selectVal != null) {
		selectVal.addEventListener('change', function() {
			if (typeof Utils === 'undefined') {
				var req = new XMLHttpRequest();
				req.open('POST', "/server.php", true);
				req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
				req.send('action=setCookie&name=language&value=' + selectVal.value + '&expire=+1 Month');
				req.onreadystatechange = function() {
					if (this.readyState === 4 && this.status === 200) {
						location.reload();
					}
				}
			} else {
				Utils.Request({
					parameters: {
						action:'setCookie',
						name: 'language',
						value: selectVal.value,
						expire: '+1 Month'
					},
					onSuccess: function(res){
						location.reload();
					}
				});                
			}
		});
	} 
}());