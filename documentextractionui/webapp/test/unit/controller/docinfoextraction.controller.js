/*global QUnit*/

sap.ui.define([
	"com/solex/documentextractionui/controller/docinfoextraction.controller"
], function (Controller) {
	"use strict";

	QUnit.module("docinfoextraction Controller");

	QUnit.test("I should test the docinfoextraction controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});