frappe.ui.form.on("Sales Invoice", {
	refresh(frm) {},
	set_warehouse(frm) {
		update_items_valuation_rate(frm);
	},
});

frappe.ui.form.on("Sales Invoice Item", {
	item_code(frm, cdt, cdn) {
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

		if (frm.doc.customer) {
			fetch_last_rate_for_row(frm, cdt, cdn);
		}
	},

	warehouse(frm, cdt, cdn) {
		update_row_valuation_rate(frm, cdt, cdn);
	},
});

function update_items_valuation_rate(frm) {
	(frm.doc.items || []).forEach((row) => {
		update_row_valuation_rate(frm, row.doctype, row.name);
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
				r.message ? r.message.valuation_rate || 0 : 0
			);
		},
	});
}
// fetch last customer rates
function update_last_customer_rates(frm) {
	(frm.doc.items || []).forEach((row) => {
		fetch_last_rate_for_row(frm, row.doctype, row.name);
	});
}

function fetch_last_rate_for_row(frm, cdt, cdn) {
	let row = locals[cdt][cdn];
	if (!row.item_code || !frm.doc.customer) return;

	frappe.call({
		method: "edd_customization.overrides.doc_events.get_last_customer_item_rate",
		args: {
			customer: frm.doc.customer,
			item_code: row.item_code,
		},
		callback: (r) => {
			if (r.message && r.message.length) {
				// frappe.model.set_value(cdt, cdn, "rate", r.message[0].rate);
				setTimeout(() => {
					frappe.model.set_value(cdt, cdn, "rate", r.message[0].rate);
				}, 300);

				console.log("Last Rate:", r.message[0].rate, typeof r.message[0].rate);
			}
		},
	});
}
