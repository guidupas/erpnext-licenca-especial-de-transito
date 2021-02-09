# -*- coding: utf-8 -*-
# Copyright (c) 2020, Inova Techy and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class AutorizacaoEspecialdeTransito(Document):
	pass

@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def filtrar_sales_order_usados(doctype, txt, searchfield, start, page_len, filters):
	return frappe.db.sql(
		"""
		select tso.name
		from `tabSales Order` tso
		where tso.docstatus = 1
		and
		tso.company = '%s'
		and
		tso.name not in
		(select pedido_de_venda
		from `tabAutorizacao Especial de Transito`)
		union all
		select taet.pedido_de_venda
		from `tabAutorizacao Especial de Transito` taet
		where taet.name = '%s'
		order by name
		""" %(filters.get('company'), filters.get('autorizacao_especial_de_transito_atual'))
	)

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

@frappe.whitelist()
def remove_aet_individual(doc_lnc_aet):
	frappe.db.sql("delete from `tabVerificacao individual de AET` where lnc_aet = '%s'" %doc_lnc_aet)