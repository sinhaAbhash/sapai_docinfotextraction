sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/codeeditor/CodeEditor"
], function (Controller, MessageBox, CodeEditor) {
	"use strict";

	return Controller.extend("com.solex.documentextractionui.controller.dox", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.solex.sapai.view.docx
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("dox").attachPatternMatched(this._onObjectMatched, this);
		},

		navToHome: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Routedocinfoextraction");
		},

		_onObjectMatched: function (oEvent) {
			var that = this;
			this.busyDialog = new sap.m.BusyDialog();
			this.busyDialog.open();
			var docxModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(docxModel, "data");
			that.docId = oEvent.getParameter("arguments").docId;
			var docId = that.docId;
			var src = "/destinations/DOCX_APP/document/jobs/" + docId + "/pages/1?clientId=scp_00";
			this.getView().byId("pdfimage").setSrc(src);
			var that = this;
			var url = "/destinations/DOCX_APP/document/jobs/" + docId + "?clientId=scp_00";
			$.ajax({
				url: url,
				type: "GET",
				async: false,
				dataType: "json",
				contentType: "application/json",
				success: function (data, textStatus, jqXHR) {
					// alert("success");
					var docData = {
						"context": data
					};
					that.busyDialog.close();
					that.getView().getModel("data").setData(docData);
					that.getView().getModel("data").refresh(true);
				},
				error: function (edata, ejqXHR) {
					MessageBox.error("error fetching token");
					console.log("docx");
					that.busyDialog.close();

				}
			});
			var oTable = this.getView().byId("LineItemList");
			var oRowsBinding = oTable.getBinding("rows");
			this.getView().byId("titletreetable").setText("Line items (" + oRowsBinding.getLength() + ")");
		},

		updateDoc: function () {
			var that = this;
			this.busyDialog = new sap.m.BusyDialog();
			this.busyDialog.open();
			var payload = this.getView().getModel("data").getData().context;
			var url = "/destinations/DOCX_APP/document/jobs/" + this.docId + "?clientId=scp_00";
			$.ajax({
				url: url,
				type: "POST",
				async: false,
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify(payload),
				success: function (data, textStatus, jqXHR) {
					MessageBox.success("Updated document successfully");
					that.busyDialog.close();
				},
				error: function (edata, ejqXHR) {
					MessageBox.error("Error updating document");
					that.busyDialog.close();

				}
			});
		},

		onExtractionDetails: function () {
			var that = this;
			var url = "/destinations/DOCX_APP/document/jobs/" + this.docId + "?clientId=scp_00";
			$.ajax({
				url: url,
				type: "GET",
				async: false,
				dataType: "json",
				contentType: "application/json",
				success: function (data, textStatus, jqXHR) {
					that.busyDialog.close();
					var json = JSON.stringify(data, null, "\t");
					var codeEditor = new CodeEditor({
						type: "json",
						height: "1000px",
						width: "800px"
					});
					codeEditor.setValue(json);

					var dialog = new sap.m.Dialog({
						contentHeight: "800px",
						contentWidth: "800px",
						content: codeEditor,
						buttons: new sap.m.Button({
							text: "Close",
							press: function () {
								dialog.close();
							}
						})
					});
					dialog.open();
				},
				error: function (edata, ejqXHR) {
					MessageBox.error("Error");
					that.busyDialog.close();

				}
			});
		},

		onCollapseAll: function () {
			var oTreeTable = this.getView().byId("LineItemList");
			oTreeTable.collapseAll();
		},

		onExpandAll: function () {
			var oTreeTable = this.getView().byId("LineItemList");
			oTreeTable.expandToLevel(1);
		},

		gotoDar: function () {

		},

		openDarExtractionDialog: function () {
			if (!this.darExtractionDialog) {
				// create dialog via fragment factory
				this.darExtractionDialog = sap.ui.xmlfragment("com.solex.sapai.fragments.darExtractionDialog", this);
				this.getView().addDependent(this.darExtractionDialog);
			}
			this.darExtractionDialog.open();
		},

		closeDarExtractionDialog: function () {
			this.darExtractionDialog.close();
		},

		formatDescription: function (desc) {
			if (desc == "description") {

			}
		},

		onDarDialogOpen: function (evet) {
			var description1 = this.darExtractionDialog.getModel("data").getData().context.extraction.lineItems[0][0].value;
			var description2 = this.darExtractionDialog.getModel("data").getData().context.extraction.lineItems[0][0].value;
			var data
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.solex.sapai.view.docx
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.solex.sapai.view.docx
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.solex.sapai.view.docx
		 */
		//	onExit: function() {
		//
		//	}

	});

});