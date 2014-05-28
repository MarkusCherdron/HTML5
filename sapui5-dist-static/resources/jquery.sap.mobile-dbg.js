/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2013 SAP AG. All rights reserved
 */

//Provides common helper functions for the mobile version of UI5 
jQuery.sap.declare("jquery.sap.mobile", false);
jQuery.sap.require("jquery.sap.dom");
jQuery.sap.require("jquery.sap.events");

(function( $ ) {
	var FAKE_OS_PATTERN = /(?:\?|&)sap-ui-xx-fakeOS=([^&]+)/,
		mFakeFonts = undefined;
	$.sap.simulateMobileOnDesktop = false;

	// OS overriding mechanism
	if ((jQuery.browser.webkit || (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) >= 10)) && !jQuery.support.touch) { // on non-touch webkit browsers and IE10 we are interested in overriding
		var result = document.location.search.match(FAKE_OS_PATTERN);
		var resultUA = result && result[1] || jQuery.sap.byId("sap-ui-bootstrap").attr("data-sap-ui-xx-fakeOS");
		if (resultUA) {
			$.sap.simulateMobileOnDesktop = true;
			var ua = { // for "ios"/"android"/"blackberry" we have defined fake user-agents; these will affect all other browser/platform detection mechanisms
					ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.48 (KHTML, like Gecko) Version/5.1 Mobile/9A406 Safari/7534.48.3",
					iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 5_0_1 like Mac OS X) AppleWebKit/534.48 (KHTML, like Gecko) Version/5.1 Mobile/9A406 Safari/7534.48.3",
					ipad: "Mozilla/5.0 (iPad; CPU OS 5_1_1 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Mobile/9B206",
					android: "Mozilla/5.0 (Linux; U; Android 4.0.3; en-us; GT-I9100 Build/IML74K) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.46",
					android_phone: "Mozilla/5.0 (Linux; U; Android 4.0.3; en-us; GT-I9100 Build/IML74K) AppleWebKit/534.46 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.46",
					android_tablet: "Mozilla/5.0 (Linux; Android 4.1.2; Nexus 7 Build/JZ054K) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.166 Safari/535.19",
					blackberry: "Mozilla/5.0 (BB10; Touch) AppleWebKit/537.10+ (KHTML, like Gecko) Version/10.0.9.2372 Mobile Safari/537.10+",
					winphone: "Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch; NOKIA; Lumia 920)"
			}[resultUA];

			if (ua &&
					(jQuery.browser.webkit && resultUA !== "winphone" || jQuery.browser.msie && resultUA === "winphone")) { // only for the working combinations
				
				mFakeFonts = {
					ios: "'Helvetica Neue'",
					android: "Roboto,'Droid Sans'",
					blackberry: "'BBGlobal Sans','DejaVu Sans'",
					winphone: "'Segoe WP', 'Segoe UI'"
				};
				
				// code for modifying the real user-agent
				if (jQuery.browser.safari) {
					var __originalNavigator = window.navigator;
					window.navigator = new Object();
					window.navigator.__proto__ = __originalNavigator;
					window.navigator.__defineGetter__('userAgent', function(){ return ua; });
				} else { // Chrome, IE10
					Object.defineProperty(navigator, "userAgent", {
						get: function() {
							return ua;
						}
					});
				}

				if(jQuery.browser.webkit) {
					// all downstream checks will be fine with the faked user-agent. 
					// But now we also need to adjust the wrong upstream settings in jQuery:
					jQuery.browser.msie = jQuery.browser.opera = jQuery.browser.mozilla = false;
					jQuery.browser.webkit = true;
					jQuery.browser.version = "534.46"; // this is not exactly true for all UAs, but there are much bigger shortcomings of this approach than a minor version of the browser, so giving the exact value is not worth the effort
				} else {
					// in IE10 with winphone emulation, jQuery.browser has already the correct information
				}
				
				sap.ui.Device._update($.sap.simulateMobileOnDesktop);
			}
		}
	}

	// OS detection
	function getOS(userAgent) {
		userAgent = userAgent || navigator.userAgent;
		var platform = /\(([a-zA-Z ]+);\s(?:[U]?[;]?)([\D]+)((?:[\d._]*))(?:.*[\)][^\d]*)([\d.]*)\s/;
		var result = userAgent.match(platform);
		if (result) {
			var appleDevices = /iPhone|iPad|iPod/;
			var bbDevices = /PlayBook|BlackBerry/;
			if (result[0].match(appleDevices)){
				result[3] = result[3].replace(/_/g, ".");
				//result[1] contains info of devices
				return({os:"ios", version:result[3]});
			} else if (result[2].match(/Android/)) {
				result[2] = result[2].replace(/\s/g, "");
				return({os:"android", version:result[3]});
			} else if (result[0].match(bbDevices)) {
				return({os:"blackberry", version:result[4]});
			} else {
				// currently we only support iOS, Android, BlackBerry 10.0+ , everything else will be ignored, if more platforms should be supported, logic can be placed here
				return;
			}
			
		} else if (userAgent.indexOf("(BB10;") > 0) { 
			// BlackBery 10 has a different structure...
			platform = /\sVersion\/([\d.]+)\s/;
			result = userAgent.match(platform);
			if (result){
				return {os: "blackberry", version:result[1]};
			} else {
				return {os: "blackberry", version:10};
			}
			
		} else {
			// Windows phone has a different structure, so we need to check with another regExp.
			platform = /Windows Phone (?:OS )?([\d.]*)/;
			result = userAgent.match(platform);
			if (result){
				return {os: "winphone", version:result[1]};
			} else {
				return;
			}
		}
	}

	var os = getOS() || {},
		oHtml = window.document.documentElement,
		iDocumentWidth = 0,
		iDocumentHeight = 0;
	
	//save the window size values when viewport meta tag is inserted
	function saveWindowSize(){
		iDocumentWidth = oHtml.clientWidth;
		iDocumentHeight = oHtml.clientHeight;
	}

	if (os.os) {
		var f = parseFloat(os.version);

		/**
		 * Holds information about the current operating system
		 * 
		 * @name jQuery.os
		 * @namespace
		 * @public
		 */
		$.os = $.extend(/** @lends jQuery.os */ {
			/**
			 * The name of the operating system; currently supported are: "ios", "android", "blackberry"
			 * @type {string}
			 * @public
			 */
			os: os.os,
			/**
			 * The version of the operating system as a string (including minor versions)
			 * @type {string}
			 * @public
			 */
			version: os.version,
			/**
			 * The version of the operating system parsed as a float (major and first minor version)
			 * @type {float}
			 * @public
			 */
			fVersion: f
		}, $.os);
		$.os[os.os] = true;
		/**
		 * Whether the current operating system is Android
		 * @type {boolean}
		 * @public
		 * @name jQuery.os.android
		 */
		/**
		 * Whether the current operating system is BlackBerry
		 * @type {boolean}
		 * @public
		 * @name jQuery.os.blackberry
		 */
		/**
		 * Whether the current operating system is Apple iOS
		 * @type {boolean}
		 * @public
		 * @name jQuery.os.ios
		 */
	} else {
		if (!$.os) $.os = {};
	}

	// if fakeOS is set, the first installed font of the list of fonts for the various platforms will win, but we should only use appropriate ones for the simulated platform
	if (mFakeFonts) { // this is only defined if we are in a valid fakeOS situation
		//var sFont = mFakeFonts[$.os.os];
		// this is only relevant for demo purposes in MVI theme. Disabling it for the moment.   $("head").append("<style>.sapUiBody{font-family:" + sFont + ",Helvetica,Arial !important;</style>");
	}

	// feature and state detection
	$.extend( $.support, {
		/**
		 * Whether the device has a retina display (window.devicePixelRatio >= 2)
		 * @type {boolean}
		 * @public 
		 */
		retina: window.devicePixelRatio >= 2
	});
	
	var sAvoidRepeatTimer = null;

	function isLandscape(){
		if(jQuery.support.touch){
			if(sAvoidRepeatTimer){
				return $.device.is.landscape;
			}
			
			sAvoidRepeatTimer = window.setTimeout(function(){
				sAvoidRepeatTimer = null;
			}, 50);
		}
		
		var iWidth = oHtml.clientWidth,
			iHeight = oHtml.clientHeight,
			bKeyboardOpen = false;
		if($.support.touch){
			//if runs in real device, landscape/portrait detection is skipped when keyboard opens
			//when keyboard opens, only height changes.
			//we can't simply compare the width and height on window because when keyboard is open in android, it makes the window smaller which can turn a device from portrait to landscape, for example in Nexus 7
			//because the height may get smaller than the width when keyboard opens.
			if((iWidth === iDocumentWidth) && (iHeight !== iDocumentHeight)){
				bKeyboardOpen = true;
			}
			//return window.orientation === undefined || window.orientation === 90 || window.orientation === -90;
		}
		
		iDocumentWidth = iWidth;
		iDocumentHeight = iHeight;
		
		//if keyboard opens, landscape value doesn't change. otherwise, compare width with height.
		return bKeyboardOpen ? $.device.is.landscape : iWidth > iHeight;
	}

	var landscape = oHtml.clientWidth > oHtml.clientHeight;
	var android_phone = (/(?=android)(?=.*mobile)/i.test(navigator.userAgent));
	/**
	 * @name jQuery.device
	 * @namespace
	 * @public
	 */
	$.device = $.extend({}, $.device);

	/**
	 * Holds information about the current device and its state
	 * 
	 * @name jQuery.device.is
	 * @namespace
	 * @public
	 */
	$.device.is = $.extend( /** @lends jQuery.device.is */ {
		/**
		 * Whether the application runs in standalone mode without browser UI (launched from the iOS home screen)
		 * @type {boolean}
		 * @public 
		 */
		standalone: window.navigator.standalone,
		/**
		 * Whether the device is in "landscape" orientation (also "true" when the device does not know about the orientation)
		 * @type {boolean}
		 * @public 
		 */
		landscape: landscape,
		/**
		 * Whether the device is in portrait orientation
		 * @type {boolean}
		 * @public 
		 */
		portrait: !landscape,
		/**
		 * Whether the application runs on an iPhone
		 * @type {boolean}
		 * @public 
		 */
		iphone: /iphone/i.test(navigator.userAgent),
		/**
		 * Whether the application runs on an iPad
		 * @type {boolean}
		 * @public 
		 */
		ipad: /ipad/i.test(navigator.userAgent),
		/**
		 * Whether the application runs on an Android phone
		 * https://developers.google.com/chrome/mobile/docs/user-agent
		 * Some device vendors however do not follow this rule
		 * @type {boolean}
		 * @public
		 */
		android_phone: android_phone,
		/**
		 * Whether the application runs on an Android tablet
		 * https://developers.google.com/chrome/mobile/docs/user-agent
		 * Some device vendors however do not follow this rule
		 * @type {boolean}
		 * @public
		 */
		android_tablet: (!!$.os.android && !android_phone)
	},$.device.is);

	$(window).bind("resize", function(){
		var landscape = isLandscape(); 
		$.device.is.landscape = landscape;
		$.device.is.portrait = !landscape;
	});

	var tablet = (function(){
		
		if($.os.ios) { // iOS
			return $.device.is.ipad;
		
		} else {  // android and others, including desktop browsers
			if($.support.touch) {
				//in real mobile device
				var densityFactor = window.devicePixelRatio ? window.devicePixelRatio : 1; // may be undefined in Windows Phone devices
				if ($.os.android && $.browser.webkit && (parseFloat(jQuery.browser.version) > 537.10)) {
					// On Android sometimes window.screen.width returns the logical CSS pixels, sometimes the physical device pixels;
					// Tests on multiple devices suggest this depends on the Webkit version.
					// The Webkit patch which changed the behavior was done here: https://bugs.webkit.org/show_bug.cgi?id=106460
					// Chrome 27 with Webkit 537.36 returns the logical pixels,
					// Chrome 18 with Webkit 535.19 returns the physical pixels.
					// The BlackBerry 10 browser with Webkit 537.10+ returns the physical pixels.
					// So it appears like somewhere above Webkit 537.10 we do not hve to divide by the devicePixelRatio anymore.
					densityFactor = 1;
				}
				
				//this is how android distinguishes between tablet and phone
				//http://android-developers.blogspot.de/2011/07/new-tools-for-managing-screen-sizes.html
				return (Math.min(window.screen.width / densityFactor, window.screen.height / densityFactor) >= 600);
				
			} else {
				//in desktop browser
				//return (Math.min($window.width(), $window.height()) >= 600);
				return $.device.is.android_tablet;
			}
		}
	}());

	$.device.is = $.extend( /** @lends jQuery.device.is */ { 
		/**
		 * Whether the running device is a tablet.
		 * If a desktop browser runs in mobile device simulation mode (with URL parameter sap-ui-xx-fakeOS or sap-ui-xx-test-mobile), 
		 * this property will also be set according to the simulated platform.
		 * This property will be false when runs in desktop browser.
		 * @type {boolean}
		 * @public
		 */
		tablet: ($.support.touch || $.sap.simulateMobileOnDesktop) && tablet,
		/**
		 * Whether the running device is a phone.
		 * If a desktop browser runs in mobile device simulation mode (with URL parameter sap-ui-xx-fakeOS or sap-ui-xx-test-mobile), 
		 * this property will also be set according to the simulated platform.
		 * This property will be false when runs in desktop browser.
		 * @type {boolean}
		 * @public
		 */
		phone: ($.support.touch || $.sap.simulateMobileOnDesktop) && !tablet,
		/**
		 * Whether the running device is a desktop browser.
		 * If a desktop browser runs in mobile device simulation mode (with URL parameter sap-ui-xx-fakeOS or sap-ui-xx-test-mobile), 
		 * this property will be false.
		 * @type {boolean}
		 * @public
		 */
		desktop: !$.support.touch && !$.sap.simulateMobileOnDesktop
	}, $.device.is);

	var _bInitMobileTriggered = false;

	/**
	 * Does some basic modifications to the HTML page that make it more suitable for mobile apps.
	 * Only the first call to this method is executed, subsequent calls are ignored. Note that this method is also called by the constructor of toplevel controls like sap.m.App, sap.m.SplitApp and sap.m.Shell.
	 * Exception: if no homeIcon was set, subsequent calls have the chance to set it.
	 * 
	 * The "options" parameter configures what exactly should be done.
	 *  
	 * It can have the following properties:
	 * <ul>
	 * <li>viewport: whether to set the viewport in a way that disables zooming (default: true)</li>
	 * <li>statusBar: the iOS status bar color, "default", "black" or "black-translucent" (default: "default")</li>
	 * <li>hideBrowser: whether the browser UI should be hidden as far as possible to make the app feel more native (default: true)</li>
	 * <li>preventScroll: whether native scrolling should be disabled in order to prevent the "rubber-band" effect where the whole window is moved (default: true)</li>
	 * <li>preventPhoneNumberDetection: whether Safari Mobile should be prevented from transforming any numbers that look like phone numbers into clickable links; this should be left as "true", otherwise it might break controls because Safari actually changes the DOM. This only affects all page content which is created after initMobile is called.</li>
	 * <li>rootId: the ID of the root element that should be made fullscreen; only used when hideBrowser is set (default: the document.body)</li>
	 * <li>useFullScreenHeight: a boolean that defines whether the height of the html root element should be set to 100%, which is required for other elements to cover the full height (default: true)</li>
	 * <li>homeIcon: deprecated since 1.12, use jQuery.sap.setIcons instead.
	 * </ul>
	 * 
	 * 
	 * @param {object}  [options] configures what exactly should be done
	 * @param {boolean} [options.viewport=true] whether to set the viewport in a way that disables zooming
	 * @param {string}  [options.statusBar='default'] the iOS status bar color, "default", "black" or "black-translucent"
	 * @param {boolean} [options.hideBrowser=true] whether the browser UI should be hidden as far as possible to make the app feel more native
	 * @param {boolean} [options.preventScroll=true] whether native scrolling should be disabled in order to prevent the "rubber-band" effect where the whole window is moved
	 * @param {boolean} [options.preventPhoneNumberDetection=true] whether Safari mobile should be prevented from transforming any numbers that look like phone numbers into clickable links
	 * @param {string}  [options.rootId] the ID of the root element that should be made fullscreen; only used when hideBrowser is set. If not set, the body is used
	 * @param {boolean} [options.useFullScreenHeight=true] whether the height of the html root element should be set to 100%, which is required for other elements to cover the full height 
	 * @param {string}  [options.homeIcon=undefined] deprecated since 1.12, use jQuery.sap.setIcons instead.
	 * @param {boolean} [options.homeIconPrecomposed=false] deprecated since 1.12, use jQuery.sap.setIcons instead. 
	 * 
	 * @name jQuery.sap.initMobile
	 * @function
	 * @public
	 */
	$.sap.initMobile = function(options) {
		var $head = $("head");
		
		if (!_bInitMobileTriggered) { // only one initialization per HTML page
			_bInitMobileTriggered = true;

			options = $.extend({}, { // merge in the default values
				viewport: true,
				statusBar: "default",
				hideBrowser: true,
				preventScroll: true,
				preventPhoneNumberDetection: true,
				useFullScreenHeight: true,
				homeIconPrecomposed: false
			}, options);
			
			// en-/disable automatic link generation for phone numbers
			if ($.os.ios && options.preventPhoneNumberDetection) {
				$head.append($('<meta name="format-detection" content="telephone=no">')); // this only works for all DOM created afterwards
				
			} else if ($.browser.msie) {
				$head.append($('<meta http-equiv="cleartype" content="on">'));
				$head.append($('<meta name="msapplication-tap-highlight" content="no"/>'));
			}
			
			
			// initialize viewport
			if (options.viewport) {
				if ($.device.is.iphone && (Math.max(window.screen.height, window.screen.width) === 568)) {
					// iPhone 5
					$head.append($('<meta name="viewport" content="user-scalable=0, initial-scale=1.0">'));
				} else if ($.os.android && $.os.fVersion < 3){
					$head.append($('<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'));
				} else if ($.os.winphone){
					$head.append($('<meta name="viewport" content="width=320, user-scalable=no">'));
				} else {
					// all other devices
					$head.append($('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'));
				}
			}

			if ($.os.ios) {

				// enable fullscreen when possible
				$head.append($('<meta name="apple-mobile-web-app-capable" content="yes">')); // since iOS 2.1

				// set the status bar style on Apple devices
				$head.append($('<meta name="apple-mobile-web-app-status-bar-style" content="' + options.statusBar + '">')); // "default" or "black" or "black-translucent", since iOS 2.1

				// splash screen
				//<link rel="apple-touch-startup-image" href="/startup.png">

			}

			// hide browser address bar
			if (options.hideBrowser && !jQuery.browser.msie) {
				/*var hideAddressBar = function() {
					document.body.style.height = (window.outerHeight + 120) + 'px'; // must be large enough to scroll out

					window.setTimeout(function(){
						window.scrollTo(0, 1); 
						var $root = options.rootId ? $.sap.byId(options.rootId) : $(document.body); // TODO: does body work?
						var height = window.innerHeight  + "px";
						$root.css("height", height);
					}, 0);
				};*/

				//	$(window)
				//		.bind("load", hideAddressBar)
				//		.bind("resize", hideAddressBar); // this one helps iOS, but only AFTER initial loading
				//.bind("orientationchange", hideAddressBar) // this one does not seem to be required
			}

			if (options.preventScroll) {
				$(window).bind("touchmove", function sapInitMobileTouchMoveHandle(oEvent){
					if (!oEvent.isDefaultPrevented()) {
						oEvent.preventDefault();	// this one prevents the rubber-band effect - and disables native scrolling
					}
				});
			}

			if (options.useFullScreenHeight) {
				$(function() {
					document.documentElement.style.height = "100%"; // set html root tag to 100% height
				});
			}
			
			//save the size of window object for detecting if keyboard is open on non-ios devices.
			saveWindowSize();


			// platform depending checks to show mobile support message
			(function() {
				var bShowSupportMessage = false;
				var sSupportMessage = "";
				var sPopupWidth = "240px";
				var iTimeOut = 3000;

				var getRB = sap.ui.getCore().getLibraryResourceBundle;

				// check mobile devices
				if (jQuery.device.is.ipad ||
						jQuery.device.is.iphone ||
						jQuery.os.os == "android" ||
						jQuery.os.os == "blackberry" ||
						jQuery.os.os == "winphone") {

					// check OS version
					if ((jQuery.os.ios && jQuery.os.fVersion < 5) ||            // iOS < 5.x
							(jQuery.os.android && jQuery.os.fVersion < 2.3) ||    // Android < 2.3
							(jQuery.os.blackberry && jQuery.os.fVersion < 10) ||  // BlackBerry < 10
							(jQuery.os.winphone && jQuery.os.fVersion < 8) ||     // Windows Phone < 8
							(!jQuery.os.winphone && !jQuery.browser.webkit) ||    // non-Webkit browsers on iOS/Android/BlackBerry
							(jQuery.os.winphone && !jQuery.browser.msie)) {       // non-IE browsers on Windows Phone
						bShowSupportMessage = true;
						sSupportMessage = getRB("sap.ui.core").getText("MOBILE_SUPPORT_MESSAGE_DEVICE", [jQuery.os.os, jQuery.os.fVersion]);
					}

				// check desktop browser
				} else {

					// check if browser is something else than webkit-based or IE9+
					if (!jQuery.browser.webkit && !jQuery.browser.mozilla && !(jQuery.browser.msie && jQuery.browser.fVersion >= 9)){
						sPopupWidth = "auto";
						bShowSupportMessage = true;
						sSupportMessage = getRB("sap.ui.core").getText("MOBILE_SUPPORT_MESSAGE_BROWSER");

					} else { // webkit, mozilla or IE9+
						
						// now it gets dirty: in sap_mvi only IE10 or webkit with fakeOS is supported, in sap_bluecrystal these browsers are all fully supported
						// this should go into library metadata or so, but for now hardcode that
						// and give the warning only for MVI (blacklist), not for unknown themes, because those might support desktop without fakeOS
						
						// so find out the theme - this ignores any configuration  (URL ... bootstrap ... config)
						var oThemeMatch = document.location.search.match(/sap-ui-theme=([^&]+)/);
						var sTheme = oThemeMatch ? oThemeMatch[1] : jQuery.sap.byId("sap-ui-bootstrap").attr("data-sap-ui-theme");
						sTheme = sTheme || (window["sap-ui-config"] ? window["sap-ui-config"].theme : null);
						
						if (sTheme !== "sap_mvi") { // sap_bluecrystal or any unknown theme
							// IE9+, mozilla and webkit are (or could be) supported
							
						} else { // sap_mvi; only supported with fakeOS
							// show message if no URL parameter is set
							var result = window.location.search.match(FAKE_OS_PATTERN);
							var resultUA = result && result[1] || jQuery.sap.byId("sap-ui-bootstrap").attr("data-sap-ui-xx-fakeOS");
							
							if (!resultUA) { // desktop browser with no fakeOS being set
								if (jQuery.browser.msie && jQuery.browser.fVersion >= 9) {  // MVI and IE9+
									// IE9+ without fakeOS not supported in MVI
									bShowSupportMessage = true;
									sSupportMessage = getRB("sap.ui.core").getText("MOBILE_SUPPORT_MESSAGE_BROWSER") + " (sap_mvi theme)"; // TODO: translatable text or support IE in MVI
								} else {  // MVI and webkit, but no fakeOS
									sPopupWidth = "480px";
									iTimeOut = 6000;
									bShowSupportMessage = true;
									sSupportMessage = getRB("sap.ui.core").getText("MOBILE_SUPPORT_MESSAGE_URL_PARAM");
								}
								
								// fakeOS is set, desktop browser
							} else if (jQuery.browser.webkit && resultUA === "winphone" ||
									!jQuery.browser.webkit && resultUA !== "winphone") { // fakeOS set, but to a platform not supported in current browser
								sPopupWidth = "480px";
								iTimeOut = 7000;
								bShowSupportMessage = true;
								sSupportMessage = getRB("sap.ui.core").getText("MOBILE_SUPPORT_MESSAGE_URL_PARAM_COMBINATION");
							}
						}

					}

				}

				if (bShowSupportMessage) {

					// we need to wait dom ready to add popup into document 
					$(function() {
						jQuery.sap.require("sap.ui.core.Popup");
	
						var oHtml = new sap.ui.core.HTML("mSAPUI5SupportMessage", {
							content: "<div id=\"mSAPUI5SupportMessage\"" +
							"style=\"" +
							"background-color:white;" +
							"border:solid 1px #cccccc;" +
							"border-radius:0.3125em;" +
							"-webkit-border-radius:0.3125em;" +
							"padding:0.3125em;" +
							"text-align:center;" +
							"width:" + sPopupWidth +
							"\"" +
							"tabindex=\"0\">" +
							"<img src=\"" + sap.ui.resource("sap.ui.core", "mimes/logo/icotxt_white_220x72.png") + "\"\>" +
							"<br>" +
							"<span style=\"color:#ff0000;\">" + jQuery.sap.encodeHTML(sSupportMessage) + "</span>" +
							"<br>" +
							"</div>"
						});
	
						var oPopup = new sap.ui.core.Popup(oHtml, false, true, false);
	
						window.setTimeout(function() {
							if(oPopup) {
								oPopup.open(0, "center center", "center center", document.body);
							}
						}, 0);
	
						window.setTimeout(function() {
							if(oPopup) {
								oPopup.close();
							}
						}, iTimeOut);
					});
				}
			})();

		}
		
		if (options.homeIcon) {
			var oIcons;
			if (typeof options.homeIcon === "string") {
				oIcons = {phone:options.homeIcon};
			} else {
				oIcons = $.extend({}, options.homeIcon);
			}
			
			oIcons.precomposed = options.homeIconPrecomposed || oIcons.precomposed;
			oIcons.favicon = options.homeIcon.icon || oIcons.favicon;
			oIcons.icon = undefined;
			$.sap.setIcons(oIcons);
		}
	};	
	
	/**
	 * Sets the bookmark icon for desktop browsers and the icon to be displayed on the home screen of iOS devices after the user does "add to home screen".
	 * 
	 * Only call this method once and call it early when the page is loading: browsers behave differently when the favicon is modified while the page is alive. 
	 * Some update the displayed icon inside the browser but use an old icon for bookmarks.
	 * When a favicon is given, any other existing favicon in the document will be removed.
	 * When at least one home icon is given, all existing home icons will be removed and new home icon tags for all four resolutions will be created.
	 * 
	 * The home icons must be in PNG format and given in different sizes for iPad/iPhone with and without retina display. 
	 * The favicon is used in the browser and for desktop shortcuts and should optimally be in ICO format: 
	 * PNG does not seem to be supported by Internet Explorer and ICO files can contain different image sizes for different usage locations. E.g. a 16x16px version
	 * is used inside browsers.
	 * 
	 * All icons are given in an an object holding icon URLs and other settings. The properties of this object are:
	 * <ul>
	 * <li>phone: a 57x57 pixel version for non-retina iPhones</li>
	 * <li>tablet: a 72x72 pixel version for non-retina iPads</li>
	 * <li>phone@2: a 114x114 pixel version for retina iPhones</li>
	 * <li>tablet@2: a 144x144 pixel version for retina iPads</li>
	 * <li>precomposed: whether the home icons already have some glare effect (otherwise iOS will add it) (default: false)</li>
	 * <li>favicon: the ICO file to be used inside the browser and for desktop shortcuts</li>
	 * </ul>
	 * 
	 * One example is:
	 * <pre>
	 * {
	 *    'phone':'phone-icon_57x57.png',
	 *    'phone@2':'phone-retina_117x117.png',
	 *    'tablet':'tablet-icon_72x72.png',
	 *    'tablet@2':'tablet-retina_144x144.png',
	 *    'precomposed':true,
	 *    'favicon':'desktop.ico'
	 * }
	 * </pre>
	 * If one of the sizes is not given, the largest available alternative image will be used instead for this size.
	 * On Android these icons may or may not be used by the device. Apparently chances can be improved by using icons with glare effect, so the "precomposed" property can be set to "true". Some Android devices may also use the favicon for bookmarks instead of the home icons.</li>
	 * 
	 * @name jQuery.sap.setIcons
	 * @function
	 * @public
	 */
	$.sap.setIcons = function(oIcons) {
		if (!oIcons || (typeof oIcons !== "object")) {
			$.sap.log.warning("Call to jQuery.sap.setIcons() has been ignored because there were no icons given or the argument was not an object.");
			return ;
		}
		
		var $head = $("head"),
			precomposed = oIcons.precomposed ? "-precomposed" : "",
			getBestFallback = function(res) {
				return oIcons[res] || oIcons['tablet@2'] || oIcons['phone@2'] || oIcons['phone'] || oIcons['tablet']; // fallback logic
			},
			mSizes = {
				"phone": "",
				"tablet": "72x72", 
				"phone@2": "114x114",
				"tablet@2": "144x144"
			};
		
		// desktop icon
		if (oIcons["favicon"]) {
			// remove any other favicons
			var $fav = $head.find("[rel^=shortcut]"); // cannot search for "shortcut icon"
			$fav.each(function(){
				if (this.rel === "shortcut icon") {
					$(this).remove();
				}
			});
			
			// create favicon
			$head.append($('<link rel="shortcut icon" href="' + oIcons["favicon"] + '" />'));
		}
		
		
		// mobile home screen icons
		
		if (getBestFallback("phone")) {
			// if any home icon is given remove old ones
			$head.find("[rel=apple-touch-icon]").remove();
			$head.find("[rel=apple-touch-icon-precomposed]").remove();
		}
		
		for (var platform in mSizes) {
			oIcons[platform] = oIcons[platform] || getBestFallback(platform);
			if (oIcons[platform]) {
				var size = mSizes[platform];
				$head.append($('<link rel="apple-touch-icon' + precomposed + '" ' + (size ? 'sizes="' + size + '"' : "") + ' href="' + oIcons[platform] + '" />'));
			}
		}
	};

})( jQuery );