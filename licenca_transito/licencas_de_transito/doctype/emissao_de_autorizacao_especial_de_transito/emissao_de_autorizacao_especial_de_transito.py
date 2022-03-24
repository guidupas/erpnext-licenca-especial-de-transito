# -*- coding: utf-8 -*-
# Copyright (c) 2021, Inova Techy and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class EmissaodeAutorizacaoEspecialdeTransito(Document):
	pass

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def filtrar_contacts_empresa(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql(
		"""
		SELECT tc.name FROM tabContact tc
		INNER JOIN `tabDynamic Link` tdl 
		ON
		tc.name = tdl.parent
		WHERE
		tc.email_id IS NOT NULL
		AND
		tdl.link_doctype = 'Customer'
		AND
		tdl.link_name = '%s'
		""" %filters.get('customer')
	)