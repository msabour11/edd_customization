frappe.ui.form.on("Sales Invoice", {
	company: function (frm) {
		apply_custom_naming_series(frm);
	},
	custom_sales_channel: function (frm) {
		apply_custom_naming_series(frm);
	},
	customer: function (frm) {
		if (frm.doc.items && frm.doc.items.length) {
			frm.doc.items.forEach((item) => {
				fetch_last_rate(frm, item.doctype, item.name);
			});
		}
	},
	set_warehouse(frm) {
		update_items_valuation_rate(frm);
	},
});

frappe.ui.form.on("Sales Invoice Item", {
	item_code: function (frm, cdt, cdn) {
		let row = locals[cdt][cdn];
		if (row.item_code) {
			setTimeout(() => {
				update_row_valuation_rate(frm, cdt, cdn);
			}, 300);

			// update_row_valuation_rate(frm, cdt, cdn);
			frappe.call({
				method: "frappe.client.get_list",
				args: {
					doctype: "Bin",
					filters: { item_code: row.item_code },
					fields: ["actual_qty"],
				},
				callback(r) {
					const total = (r.message || []).reduce((sum, d) => sum + d.actual_qty, 0);
					frappe.model.set_value(cdt, cdn, "custom_all_warehouse_qt", total);
				},
			});
		}
		fetch_last_rate(frm, cdt, cdn);
	},
	warehouse(frm, cdt, cdn) {
		update_row_valuation_rate(frm, cdt, cdn);
	},
});

function fetch_last_rate(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	if (!frm.doc.customer || !row.item_code) return;

	frappe.call({
		method: "edd_customization.overrides.doc_events.get_last_selling_rate",
		args: {
			customer: frm.doc.customer,
			item_code: row.item_code,
		},
		callback: function (r) {
			if (r.message) {
				setTimeout(() => {
					frappe.model.set_value(cdt, cdn, "rate", r.message);
				}, 300);
				frappe.show_alert({
					message: __("Rate {0} fetched from last invoice", [
						format_currency(r.message),
					]),
					indicator: "green",
				});
				console.log("Last Rate:", r.message, typeof r.message);
			}
		},
	});
}

function update_row_valuation_rate(frm, cdt, cdn) {
	let row = locals[cdt][cdn];

	let warehouse = row.warehouse || frm.doc.set_warehouse;
	if (!row.item_code || !warehouse) return;

	frappe.call({
		method: "frappe.client.get_value",
		args: {
			doctype: "Bin",
			filters: {
				item_code: row.item_code,
				warehouse: warehouse,
			},
			fieldname: "valuation_rate",
		},
		callback: function (r) {
			frappe.model.set_value(
				cdt,
				cdn,
				"custom_valuation_rate",
				r.message ? r.message.valuation_rate || 0 : 0,
			);
		},
	});
}

function update_items_valuation_rate(frm) {
	(frm.doc.items || []).forEach((row) => {
		update_row_valuation_rate(frm, row.doctype, row.name);
	});
}

function apply_custom_naming_series(frm) {
	// التحقق من وجود الشركة والقناة البيعية أولاً
	if (frm.doc.company && frm.doc.custom_sales_channel) {
		// 1. شركة موارد الشاملة
		if (frm.doc.company === "شركة موارد الشاملة") {
			switch (frm.doc.custom_sales_channel) {
				case "مبيعات مشاريع الرياض":
					frm.set_value("naming_series", "INV-MR-PRJ-.YYYY.-");
					break;
				case "مبيعات اون لاين موارد":
					frm.set_value("naming_series", "INV-MR-ONL-.YYYY.-");
					break;
				default:
					// اختياري: تعيين ترقيم افتراضي للشركة في حال عدم مطابقة القنوات المحددة
					break;
			}
		}

		// 2. شركة العدد التقنية للتجارة
		else if (frm.doc.company === "العدد التقنية للتجارة") {
			switch (frm.doc.custom_sales_channel) {
				case "مبيعات جملة جده":
					frm.set_value("naming_series", "INV-AT-JEDW-.YYYY.-");
					break;
				case "مبيعات معرض العمامرة":
					frm.set_value("naming_series", "INV-AT-AMM-.YYYY.-");
					break;
				case "مبيعات معرض سوق 7":
					frm.set_value("naming_series", "INV-AT-SQ7-.YYYY.-");
					break;
				case "مبيعات نقدية (وانيت صبير)":
					frm.set_value("naming_series", "INV-AT-CSH-.YYYY.-");
					break;
				case "مبيعات جملة الرياض":
					frm.set_value("naming_series", "INV-AT-RUHW-.YYYY.-");
					break;
				case "مبيعات مشاريع جده":
					frm.set_value("naming_series", "INV-AT-JEDP-.YYYY.-");
					break;
				case "مبيعات اون لاين جده":
					frm.set_value("naming_series", "INV-AT-SALLA-.YYYY.-");
					break;
				default:
					break;
			}
		}
	}
}
