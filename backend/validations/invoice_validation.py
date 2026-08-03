"""
Billing, labor charge, spare parts itemization, and invoice calculations validation.
"""

from decimal import Decimal
from typing import Union, Dict, Any
from rest_framework.exceptions import ValidationError, NotFound


def validate_labour_charge(charge: Union[Decimal, float, int, str]) -> Decimal:
    """
    Validate labor service charge amount.

    :param charge: Numeric charge.
    :return: Decimal labor charge.
    :raises ValidationError: If charge is negative.
    """
    try:
        dec_charge = Decimal(str(charge))
    except Exception:
        raise ValidationError({"labour_charges": "Labour charge must be a valid numeric amount."})

    if dec_charge < Decimal("0.00"):
        raise ValidationError({"labour_charges": "Labour charge cannot be negative."})

    return dec_charge


def validate_unit_price(price: Union[Decimal, float, int, str]) -> Decimal:
    """
    Validate unit price for spare parts or service items.

    :param price: Unit price numeric value.
    :return: Decimal price.
    :raises ValidationError: If unit price is negative.
    """
    try:
        dec_price = Decimal(str(price))
    except Exception:
        raise ValidationError({"price": "Unit price must be a valid numeric amount."})

    if dec_price < Decimal("0.00"):
        raise ValidationError({"price": "Unit price cannot be negative."})

    return dec_price


def validate_quantity(quantity: Union[int, float, str]) -> int:
    """
    Validate item quantity is a positive integer.

    :param quantity: Quantity value.
    :return: Validated integer quantity.
    :raises ValidationError: If quantity is less than 1.
    """
    if isinstance(quantity, bool):
        raise ValidationError({"quantity": "Quantity must be an integer."})

    try:
        int_qty = int(quantity)
    except Exception:
        raise ValidationError({"quantity": "Quantity must be an integer."})

    if int_qty < 1:
        raise ValidationError({"quantity": "Quantity must be at least 1."})

    return int_qty


def validate_spare_part(spare_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate spare part line item attributes.

    :param spare_data: Part dictionary with part_name, quantity, price.
    :return: Cleaned part dictionary.
    :raises ValidationError: If part name, quantity, or price is invalid.
    """
    if not isinstance(spare_data, dict):
        raise ValidationError({"detail": "Spare part item must be a JSON object."})

    part_name = spare_data.get("part_name", "").strip() if isinstance(spare_data.get("part_name"), str) else ""
    if not part_name:
        raise ValidationError({"part_name": "Spare part name is required."})

    qty = validate_quantity(spare_data.get("quantity", 1))
    price = validate_unit_price(spare_data.get("price", 0))

    return {
        "part_name": part_name,
        "quantity": qty,
        "price": price,
        "total": price * qty
    }


def validate_invoice_total(labour_charge: Decimal, parts_total: Decimal, grand_total: Decimal) -> None:
    """
    Validate that calculated invoice grand total matches itemized subtotal components (Labour + Parts + GST - Discount).

    :param labour_charge: Labour fee.
    :param parts_total: Total for spare parts.
    :param grand_total: Computed grand total.
    :raises ValidationError: If calculated total is invalid or inconsistent.
    """
    if grand_total < Decimal("0.00"):
        raise ValidationError({"grand_total": "Invoice grand total cannot be negative."})

    subtotal = labour_charge + parts_total
    if grand_total < subtotal and (subtotal - grand_total) > Decimal("10000.00"):
        raise ValidationError({"grand_total": "Inconsistent invoice grand total calculation."})


def validate_invoice_lock(bill: Any) -> None:
    """
    Prevent modifications to approved or locked invoices.

    :param bill: Bill model instance.
    :raises ValidationError: If bill is already approved/locked.
    """
    if not bill:
        raise NotFound("Bill not found.")

    if getattr(bill, 'is_approved', False):
        raise ValidationError({"detail": "Approved invoices are locked and cannot be edited."})
