/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 * 
 * (c) Copyright 2009-2013 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ui.commons.MenuButtonRenderer");jQuery.sap.require("sap.ui.commons.ButtonRenderer");jQuery.sap.require("sap.ui.core.Renderer");sap.ui.commons.MenuButtonRenderer=sap.ui.core.Renderer.extend(sap.ui.commons.ButtonRenderer);
sap.ui.commons.MenuButtonRenderer.renderButtonAttributes=function(r,c){if(sap.ui.getCore().getConfiguration().getAccessibility()){r.writeAttribute("aria-haspopup","true")}};
sap.ui.commons.MenuButtonRenderer.renderButtonContentAfter=function(r,c){r.write("<span class=\"sapUiMenuButtonIco\"></span>")};
