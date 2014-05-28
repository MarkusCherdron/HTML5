/*!
 * SAP UI development toolkit for HTML5 (SAPUI5) (c) Copyright 2009-2013 SAP AG. All rights reserved
 */
jQuery.sap.declare("sap.ushell.ui.footerbar.SettingsButton");jQuery.sap.require("sap.ushell.library");jQuery.sap.require("sap.m.Button");sap.m.Button.extend("sap.ushell.ui.footerbar.SettingsButton",{metadata:{library:"sap.ushell"}});
// Copyright (c) 2013 SAP AG, All Rights Reserved
(function(){"use strict";jQuery.sap.declare("sap.ushell.ui.footerbar.SettingsButton");jQuery.sap.require("sap.ushell.resources");sap.ushell.ui.footerbar.SettingsButton.prototype.init=function(){jQuery.sap.require("sap.ushell.ui.footerbar.AboutButton");jQuery.sap.require("sap.ushell.ui.footerbar.LoginDetailsButton");jQuery.sap.require("sap.ushell.ui.footerbar.LogoutButton");this.setIcon('sap-icon://action-settings');this.setTooltip(sap.ushell.resources.i18n.getText("helpBtn_tooltip"));this.attachPress(this.showSettingsMenu);var a=new sap.ushell.ui.footerbar.AboutButton(),l=new sap.ushell.ui.footerbar.LoginDetailsButton(),L=new sap.ushell.ui.footerbar.LogoutButton();this.defaultMenuItems=[a,l,L]};sap.ushell.ui.footerbar.SettingsButton.prototype.setMenuItems=function(b){this.menuItems=b};sap.ushell.ui.footerbar.SettingsButton.prototype.showSettingsMenu=function(){var a=new sap.m.ActionSheet({showHeader:false,buttons:(this.menuItems||[]).concat(this.defaultMenuItems)});a.setPlacement(sap.m.PlacementType.Vertical);a.openBy(this);a.attachAfterClose(function(){a.removeAllButtons();a.destroy()})}}());