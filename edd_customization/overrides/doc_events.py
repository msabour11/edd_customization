import frappe


def calcalculate_si_profitability(doc, method):

    total_cost = 0.0

    for item in doc.items:
        is_stock_item = frappe.db.get_value("Item", item.item_code, "is_stock_item")
        if not is_stock_item:
            continue

        qty = float(item.get("qty") or 0)
        valuation_rate = float(item.get("valuation_rate") or 0)

        # 1: Last Purchase Rate
        if not valuation_rate:
            valuation_rate = float(
                frappe.db.get_value("Item", item.item_code, "last_purchase_rate") or 0
            )
            # item.valuation_rate = valuation_rate
            # frappe.db.set_value(
            #     "Sales Order Item", item.name, "valuation_rate", valuation_rate
            # )

        # 2: Standard Purchase Price List
        if not valuation_rate:
            item_price = frappe.db.get_value(
                "Item Price",
                {"item_code": item.item_code, "price_list": "شراء القياسية"},
                "price_list_rate",
            )
            valuation_rate = float(item_price or 0)

        # Calculate line cost and accumulate
        line_cost = qty * valuation_rate
        total_cost = total_cost + line_cost

    base_net_total = float(doc.get("base_net_total") or 0)
    profit = base_net_total - total_cost

    # Safe division check against total_cost, not base_net_total
    if total_cost > 0:
        custom_profit_percentage = (profit / total_cost) * 100
    else:
        custom_profit_percentage = 0.0

    doc.custom_profit_percentage = custom_profit_percentage
    frappe.msgprint(
        f"Custom Profit Percentage calculated: {custom_profit_percentage:.2f}%"
    )

    doc.db_set("custom_profit_percentage", custom_profit_percentage)


def calcalculate_so_profitability(doc, method):

    total_cost = 0.0

    for item in doc.items:
        is_stock_item = frappe.db.get_value("Item", item.item_code, "is_stock_item")
        if not is_stock_item:
            continue

        qty = float(item.get("qty") or 0)
        valuation_rate = float(item.get("valuation_rate") or 0)

        # 1: Last Purchase Rate
        if not valuation_rate:
            valuation_rate = float(
                frappe.db.get_value("Item", item.item_code, "last_purchase_rate") or 0
            )
            # item.valuation_rate = valuation_rate
            # frappe.db.set_value(
            #     "Sales Order Item", item.name, "valuation_rate", valuation_rate
            # )

        # 2: Standard Purchase Price List
        if not valuation_rate:
            item_price = frappe.db.get_value(
                "Item Price",
                {"item_code": item.item_code, "price_list": "شراء القياسية"},
                "price_list_rate",
            )
            valuation_rate = float(item_price or 0)

        # Calculate line cost and accumulate
        line_cost = qty * valuation_rate
        total_cost = total_cost + line_cost

    base_net_total = float(doc.get("base_net_total") or 0)
    profit = base_net_total - total_cost

    # Safe division check against total_cost, not base_net_total
    if total_cost > 0:
        custom_profit_percentage = (profit / total_cost) * 100
    else:
        custom_profit_percentage = 0.0

    doc.custom_profit_percentage = custom_profit_percentage

    doc.db_set("custom_profit_percentage", custom_profit_percentage)


def set_profit_on_update_after_submit(doc, method):
    total_cost = 0.0

    for item in doc.items:
        is_stock_item = frappe.db.get_value("Item", item.item_code, "is_stock_item")
        if not is_stock_item:
            continue

        qty = float(item.get("qty") or 0)
        valuation_rate = float(item.get("valuation_rate") or 0)

        # 1: Last Purchase Rate
        if not valuation_rate:
            valuation_rate = float(
                frappe.db.get_value("Item", item.item_code, "last_purchase_rate") or 0
            )
            item.valuation_rate = valuation_rate  # Sets it in memory for the doc save
            frappe.db.set_value(
                "Sales Order Item", item.name, "valuation_rate", valuation_rate
            )

        # 2: Standard Purchase Price List
        if not valuation_rate:
            item_price = frappe.db.get_value(
                "Item Price",
                {"item_code": item.item_code, "price_list": "شراء القياسية"},
                "price_list_rate",
            )
            valuation_rate = float(item_price or 0)

        # Calculate line cost and accumulate
        line_cost = qty * valuation_rate
        total_cost += line_cost

    base_net_total = float(doc.get("base_net_total") or 0)
    profit = base_net_total - total_cost

    # Safe division check against total_cost, not base_net_total
    if total_cost > 0:
        custom_profit_percentage = (profit / total_cost) * 100
    else:
        custom_profit_percentage = 0.0

    doc.custom_profit_percentage = custom_profit_percentage

    doc.db_set("custom_profit_percentage", custom_profit_percentage)

    # Logging to sites/{site}/logs/frappe.log
    frappe.logger("sales_order_profit").warning(
        f"Sales Order {doc.name}: Profit={profit}, Percentage={custom_profit_percentage}%"
    )


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
