sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/Filter"
], function (Controller, MessageBox, Filter) {
	"use strict";

	return Controller.extend("com.solex.documentextractionui.controller.docinfoextraction", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf com.solex.sapai.view.docinfoextraction
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Routedocinfoextraction").attachPatternMatched(this._onObjectMatched, this);

			var panelModel = new sap.ui.model.json.JSONModel({
				HTML: "<p>Document Information Extraction is a machine learning service running on SAP Cloud Platform.You can use the Document Information Extraction service to process various documents that have content in headers and tables. You can use the extracted information, e.g. to automatically process payables, invoices, or payment notes while making sure that invoices and payables match.</p>" +
					"<p>The service requires a PDF document as input so that we can download one of the sample invoices and upload it into the Document Extraction Service by using below file upload section. After the document upload, the service returns a unique job id with the status for the given document. By Clicking on the job id, the page will navigate to the document extraction detail page to view the header and line item fields for the given document.</p>"
			});
			this.getView().setModel(panelModel, "panelModel");

			var docExtractionModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(docExtractionModel, "docExtractionModel");
			this.getDocxDocuments();

		},
		_onObjectMatched: function (oEvent) {

			var docExtractionModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(docExtractionModel, "docExtractionModel");
			this.getDocxDocuments();
		},

		onAfterRendering: function () {
			jQuery("#asset-upload").on("change", this.onInputChange.bind(this));
		},

		navToHome: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteHome");
		},

		searchTable: function (oEvent) {
			var aFilters = [];
			var sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
				var filter1 = new Filter("fileName", sap.ui.model.FilterOperator.Contains, sQuery);
				var filter2 = new Filter("id", sap.ui.model.FilterOperator.Contains, sQuery);
				var arrFilter = new Filter({
					filters: [filter1, filter2],
					and: false
				});
				aFilters.push(arrFilter);
			}
			// update list binding
			var list = this.getView().byId("doctable");
			var binding = list.getBinding("items");
			binding.filter(aFilters);
		},

		getDocxDocuments: function () {
			var that = this;
			if (!this.busyDialog) {
				this.busyDialog = new sap.m.BusyDialog();
			}
			this.busyDialog.open();
			var url = "/destinations/DOCX_APP/document/jobs?clientId=scp_00";
			$.ajax({
				url: url,
				type: "GET",
				async: false,
				dataType: "json",
				contentType: "application/json",
				success: function (data, textStatus, jqXHR) {
					that.getView().getModel("docExtractionModel").setData(data);
					that.getView().getModel("docExtractionModel").refresh(true);

					if (that.fetchDocsServiceCall) {
						var statusArr = [];
						var itemsArr = that.getView().byId("doctable").getItems();
						itemsArr.map(function (obj, index) {
							var status = obj.getCells()[2].getText();
							statusArr.push(status);
						});
						if (!statusArr.includes("PENDING")) {
							clearInterval(that.fetchDocsServiceCall);
							that.busyDialog.close();
						}
					} else {
						that.busyDialog.close();
					}
				},
				error: function (edata, ejqXHR) {
					MessageBox.error("error fetching documents");
					that.busyDialog.close();

				}
			});
		},

		fetchToken: function () {
			var that = this;
			var url = "/destinations/DOCX_AUTH?grant_type=client_credentials";
			var accessToken;
			$.ajax({
				url: url,
				type: "GET",
				async: false,
				dataType: "json",
				contentType: "application/json",
				success: function (data, textStatus, jqXHR) {
					accessToken = data.access_token;
					that.accessToken = accessToken;
				},
				error: function (edata, ejqXHR) {
					MessageBox.error("error fetching token");
					that.busyDialog.close();

				}
			});
			return accessToken;
		},

		uploadDoc: function () {
			var that = this;
			if (!this.busyDialog) {
				this.busyDialog = new sap.m.BusyDialog();
			}
			this.busyDialog.open();
			var url = "/destinations/DOCX_APP/document/jobs?clientId=scp_00";
			that.fileToUpload = document.getElementById("asset-upload").files[0];
			var optionsObj = {
				"extraction": {
					"headerFields": [
						"documentNumber",
						"taxId",
						"taxName",
						"purchaseOrderNumber",
						"shippingAmount",
						"netAmount",
						"senderAddress",
						"senderName",
						"grossAmount",
						"currencyCode",
						"receiverContact",
						"documentDate",
						"taxAmount",
						"taxRate",
						"receiverName",
						"receiverAddress"
					],
					"lineItemFields": [
						"description",
						"netAmount",
						"quantity",
						"unitPrice",
						"materialNumber"
					]
				},
				"clientId": "scp_00",
				"documentType": "invoice",
				"enrichment": {
					"sender": {
						"top": 5,
						"type": "businessEntity",
						"subtype": "supplier"
					},
					"employee": {
						"type": "employee"
					}
				}
			};

			var formData = new FormData();
			formData.append("file", that.fileToUpload);
			formData.append("options", JSON.stringify(optionsObj));

			var settings = {
				"async": false,
				"crossDomain": true,
				"url": url,
				"method": "POST",
				"headers": {
					"Cache-Control": "no-cache"
				},
				"processData": false,
				"contentType": false,
				"mimeType": "multipart/form-data",
				"data": formData
			};

			$.ajax(settings).done(function (response) {
				that.getDocxDocuments();
				that.fetchDocsServiceCall = window.setInterval(function () {
					that.getDocxDocuments();
				}, 2000);
				MessageBox.success("Document uploaded successfully with id:" + (JSON.parse(response).id));
			}).fail(function (xhr, status, errorThrown) {
				MessageBox.error(JSON.parse(xhr.responseText).error.message);
				that.busyDialog.close();
			});
		},

		deleteDoc: function (oEvent) {
			var that = this;
			if (!this.busyDialog) {
				this.busyDialog = new sap.m.BusyDialog();
			}
			this.busyDialog.open();
			var docId = oEvent.getParameter("listItem").getBindingContext("docExtractionModel").getObject().id;
			var payload = {
				"value": [docId]
			};
			$.ajax({
				url: "/destinations/DOCX_APP/document/jobs?clientId=scp_00",
				type: "DELETE",
				data: JSON.stringify(payload),
				dataType: "json",
				contentType: "application/json",
				success: function (darData, darStatus, darXHR) {
					MessageBox.success("Document deleted successfully");
					that.busyDialog.close();
					that.getDocxDocuments();
				},
				error: function (darError, darEXHR) {
					MessageBox.error("Error while deleting the document");
					that.busyDialog.close();
				}
			});
		},

		gotoDocX: function (oEvent) {
			var that = this;
			if (!this.busyDialog) {
				this.busyDialog = new sap.m.BusyDialog();
			}
			this.busyDialog.open();
			setTimeout(function () {
				that.busyDialog.close();
			}, 2000);
			var docId = oEvent.getSource().getBindingContext("docExtractionModel").getObject().id;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("dox", {
				docId: docId
			});
		},

		onInputChange: function (element) {
			this.uploadDoc();
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf com.solex.sapai.view.docinfoextraction
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf com.solex.sapai.view.docinfoextraction
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf com.solex.sapai.view.docinfoextraction
		 */
		//	onExit: function() {
		//
		//	}

	});
});