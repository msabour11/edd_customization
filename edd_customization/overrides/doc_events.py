import frappe


def calcalculate_si_profitability(doc, method):
    total_cost = 0.0

    for item in doc.items:
        qty = item.get("qty")
        if not qty:
            qty = 0

        valuation_rate = item.get("custom_valuation_rate")
        if not valuation_rate:
            valuation_rate = 0

        item_cost = valuation_rate

        # if not item_cost:
        #     # item_price = frappe.db.get_value(
        #     #     "Item Price",
        #     #     {"item_code": item.item_code, "price_list": doc.selling_price_list},
        #     #     "price_list_rate",
        #     # )
        #     item_price = item.get("price_list_rate")
        #     if item_price:
        #         print("Item Price Found:", item_price)
        #         item_cost = item_price
        #     else:
        #         item_cost = 0

        line_cost = float(qty) * float(item_cost)
        print("Line Cost:", line_cost)

        total_cost = float(total_cost) + float(line_cost)
        print("Total Cost so far:", total_cost)

    base_net_total = doc.get("base_net_total")
    print("Base Net Total:", base_net_total)
    if not base_net_total:
        base_net_total = 0

    profit = float(base_net_total) - float(total_cost)
    print("Profit:", profit)

    if float(base_net_total) > 0:
        custom_profit_percentage = (profit / float(base_net_total)) * 100
    else:
        profit_percentage = 0

    doc.custom_profitability = float(custom_profit_percentage)


@frappe.whitelist()
def get_last_customer_item_rate(customer, item_code):
    return frappe.db.sql(
        """
        SELECT sii.rate
        FROM `tabSales Invoice Item` sii
        INNER JOIN `tabSales Invoice` si ON si.name = sii.parent
        WHERE
            si.customer = %s
            AND si.docstatus = 1
            AND sii.item_code = %s
        ORDER BY si.posting_date DESC, si.creation DESC
        LIMIT 1
    """,
        (customer, item_code),
        as_dict=True,
    )
