// Copyright (c) 2021, Inova Techy and contributors
// For license information, please see license.txt

frappe.ui.form.on('Emissao de Autorizacao Especial de Transito', {
	onload(frm) {
		//Retorna doc de informacoes da Configuracao do Grupo de Item
		var argumentos_retorno_doc = {
			doctype: 'Configuracoes de Licenca de Transito',
			name: 'grupo_item_licenca_transito',
		};
		
		var doc_configuracoes_licenca_transito = retorna_doc(argumentos_retorno_doc);

		frm.set_query('autorizacao', function() {
			return {
				filters: {
					item_group: doc_configuracoes_licenca_transito.grupo_item_licenca_transito
				}
			}
		})

		frm.set_query('taxa_de_emissao', function(){
			return {
				filters: {
					item_group: doc_configuracoes_licenca_transito.grupo_de_itens_das_taxas_de_licenças_de_trânsito
				}
			}
		})

		if(frm.doc.cliente) {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 0);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 0);
			atualiza_query_contato_notificacao(frm);
		} else {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 1);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
		}

		if(frm.doc.gerar_pagamento_de_taxa_de_emissão == 0) {
			frm.set_df_property('taxa_de_emissao', 'read_only', 1);
			frm.set_df_property('fornecedor', 'read_only', 1);
		} else {
			frm.set_df_property('taxa_de_emissao', 'read_only', 0);
			frm.set_df_property('fornecedor', 'read_only', 0);
		}
	},

	refresh(frm) {
		if(frm.is_new() && !frm.doc.amended_from) {
			frm.set_value('numero_autorizacao', '');
			frm.set_value('vencimento_autorizacao', '');
			frm.set_value('pedido_de_venda');
			frm.set_value('pedido_de_compra');
			frm.refresh_field('numero_autorizacao');
			frm.refresh_field('vencimento_autorizacao');
			frm.refresh_field('pedido_de_venda');
			frm.refresh_field('pedido_de_compra');
		}

		if(frm.doc.docstatus == 1) {
			if(frm.doc.situacao_aet == "Liberada" && !frm.doc.pedido_de_compra && frm.doc.gerar_pagamento_de_taxa_de_emissão == 1) {
				frm.add_custom_button(("Gerar Pedido de Compra"), function(){
					criar_pedido_compra(frm)
				});
			}
			
			if(frm.doc.situacao_aet == "Liberada" && !frm.doc.pedido_de_venda) {
				frm.add_custom_button(("Gerar Pedido de Venda"), function(){
					criar_pedido_venda(frm)
				});
			}
		}
	},

	before_submit(frm) {
		if(!frm.doc.autorizacao) {
			frappe.validated = false;
			msgprint("Informe a autorização de trânsito");
		} else if(!frm.doc.placa) {
			frappe.validated = false;
			msgprint("Informe a placa");
		} else if(!frm.doc.numero_autorizacao) {
			frappe.validated = false;
			msgprint("Informe o número da autorização");
		} else if(!frm.doc.vencimento_autorizacao) {
			frappe.validated = false;
			msgprint("Informe a data de vencimento da autorização");
		} else if(frm.doc.situacao_aet != "Liberada" && frm.doc.situacao_aet != "Errada" && frm.doc.situacao_aet != "Cancelada") {
			frappe.validated = false;
			msgprint("A autorização não está concluída. Verifique a situação da autorização");
		}
	},

	cliente(frm) {
		if(frm.doc.cliente) {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 0);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 0);
			atualiza_query_contato_notificacao(frm);
		} else {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 1);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
		}
	},

	contato_notificacao_vencimento(frm) {
		if(frm.doc.contato_notificacao_vencimento) {
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
			
			var argumentos_retorno_doc_contact = {
				doctype: 'Contact',
				name: frm.doc.contato_notificacao_vencimento,
			};
			var doc_contact = retorna_doc(argumentos_retorno_doc_contact);

			frm.set_value('email_notificacao_vencimento', doc_contact.email_id);
			frm.refresh_field('email_notificacao_vencimento');
		} else {
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 0);
			frm.set_value('email_notificacao_vencimento', '');
			frm.refresh_field('email_notificacao_vencimento');
		}
	},

	gerar_pagamento_de_taxa_de_emissão(frm) {
		if(frm.doc.gerar_pagamento_de_taxa_de_emissão == 0) {
			frm.set_df_property('taxa_de_emissao', 'read_only', 1);
			frm.set_value('taxa_de_emissao', '');
			frm.refresh_field('taxa_de_emissao');
			frm.set_df_property('fornecedor', 'read_only', 1);
			frm.set_value('fornecedor', '');
			frm.refresh_field('fornecedor');
		} else {
			frm.set_df_property('taxa_de_emissao', 'read_only', 0);
			frm.set_df_property('fornecedor', 'read_only', 0);
		}
	}
});

function retorna_doc(argumentos) {
    var retorno = null;
    frappe.call({
        method: "frappe.client.get",
        args: argumentos,
        async: false,
        callback(r) {
            if(r.message) {
				retorno = r.message;
            }
        }
    });
    
    return retorno;
}

function retorna_list(doctype, argumentos) {
	var retorno = null;
	frappe.call({
        method: "frappe.client.get_list",
		args: {
			doctype: doctype,
			filters: argumentos,
		},
        async: false,
        callback(r) {
            if(r.message) {
				retorno = r.message;
            }
        }
    });

	return retorno;
}

function atualiza_query_contato_notificacao(frm) {
	frm.set_query('contato_notificacao_vencimento', function() {
		return {
			query: 'licenca_transito.licencas_de_transito.doctype.emissao_de_autorizacao_especial_de_transito.emissao_de_autorizacao_especial_de_transito.filtrar_contacts_empresa',
			filters: {
				'customer': frm.doc.cliente,
			}
		}
	})
}

function criar_pedido_venda(frm) {
	var argumentos_retorno_doc = {
		doctype: 'Customer',
		name: frm.doc.cliente,
	};

	var cliente = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	var valor_total_itens = 0;
	
	argumentos_retorno_doc = {
		doctype: 'Item',
		name: frm.doc.autorizacao,
	};

	var item_autorizacao = retorna_doc(argumentos_retorno_doc);

	var tabela_preco_venda = retorna_tabela_preco_venda(item_autorizacao, company, cliente);

	valor_total_itens = valor_total_itens + retorna_preco_item(item_autorizacao, tabela_preco_venda);

	var item_pedido_venda = monta_item_pedido_venda(item_autorizacao, valor_total_itens)
	var itens_pedido_venda = [
		item_pedido_venda,
	]

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: "Sales Order",
				naming_series: "SAL-ORD-.YYYY.-",
				customer: frm.doc.cliente,
				company: frm.doc.company,
				currency: company.default_currency,
				selling_price_list: tabela_preco_venda,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_venda,
			},
		},
		callback(response) {
			if(response.message) {
				frm.set_value('pedido_de_venda', response.message.name);
				frm.refresh_field('pedido_de_venda');
				
				frappe.show_alert({
					message:__('Pedido de Venda criado'),
					indicator:'green'
				}, 5);

				criar_guia_remessa(frm, itens_pedido_venda)
			} else {
				msgprint("Erro ao gerar a pedido de venda");
			}
		}
	})
}

function criar_guia_remessa(frm, itens_pedido_venda) {
	var argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Sales Order',
		name: frm.doc.pedido_de_venda,
	};

	var pedido_de_venda_doctype = retorna_doc(argumentos_retorno_doc);

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: 'Delivery Note',
				naming_series: 'MAT-DN-.YYYY.-',
				customer: frm.doc.cliente,
				company: frm.doc.company,
				currency: company.default_currency,
				selling_price_list: pedido_de_venda_doctype.selling_price_list,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_venda,
			},
		},
		callback(response) {
			if(response.message) {
				frappe.show_alert({
					message:__('Guia de Remessa criada'),
					indicator:'green'
				}, 5);

				var guia_de_remessa = response.message.name;

				argumentos_retorno_doc = {
					doctype: 'Delivery Note',
					name: guia_de_remessa,
				};

				var guia_de_remessa_doctype = retorna_doc(argumentos_retorno_doc);

				var itens_guia_de_remessa = guia_de_remessa_doctype.items;

				itens_guia_de_remessa.forEach(function(item) {
					frappe.call({
						method: "frappe.client.set_value",
						args: {
							doctype: "Delivery Note Item",
							name: item.name,
							fieldname: "against_sales_order",
							value: pedido_de_venda_doctype.name,
						},
						async: false,
						callback(res) {

						},
					});
				});

				argumentos_retorno_doc = {
					doctype: 'Delivery Note',
					name: guia_de_remessa,
				};

				var guia_de_remessa_doctype = retorna_doc(argumentos_retorno_doc);

				frappe.call({
					method: "frappe.desk.form.save.savedocs",
					args: {
						doc: guia_de_remessa_doctype,
						action: "Submit",
					},
					callback: function(r) {	}
				});
				
				frm.save('Update');
			} else {
				msgprint("Erro ao gerar a guia de remessa");
			}
		}
	})
}

function criar_pedido_compra(frm) {
	var argumentos_retorno_doc = {
		doctype: 'Supplier',
		name: frm.doc.fornecedor,
	};

	var fornecedor = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	var valor_total_itens = 0;
	
	argumentos_retorno_doc = {
		doctype: 'Item',
		name: frm.doc.taxa_de_emissao,
	};

	var item_taxa_emissao = retorna_doc(argumentos_retorno_doc);

	var tabela_preco_compra = retorna_tabela_preco_compra(fornecedor);

	valor_total_itens = valor_total_itens + retorna_preco_item(item_taxa_emissao, tabela_preco_compra);

	var item_pedido_compra = monta_item_pedido_compra(item_taxa_emissao, valor_total_itens);
	var itens_pedido_compra = [
		item_pedido_compra,
	]

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: "Purchase Order",
				naming_series: "PUR-ORD-.YYYY.-",
				supplier: frm.doc.fornecedor,
				company: frm.doc.company,
				currency: company.default_currency,
				buying_price_list: tabela_preco_compra,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_compra,
			},
		},
		callback(response) {
			if(response.message) {
				frm.set_value('pedido_de_compra', response.message.name);
				frm.refresh_field('pedido_de_compra');

				frappe.show_alert({
					message:__('Pedido de Compra criado'),
					indicator:'green'
				}, 5);

				criar_recibo_compra(frm, itens_pedido_compra)
			} else {
				msgprint("Erro ao gerar a pedido de compra");
			}
		}
	})
}

function criar_recibo_compra(frm, itens_pedido_compra) {
	var argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Purchase Order',
		name: frm.doc.pedido_de_compra,
	};

	var pedido_de_compra_doctype = retorna_doc(argumentos_retorno_doc);

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: 'Purchase Receipt',
				naming_series: 'MAT-PRE-.YYYY.-',
				supplier: frm.doc.fornecedor,
				company: frm.doc.company,
				currency: company.default_currency,
				buying_price_list: pedido_de_compra_doctype.buying_price_list,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_compra,
			},
		},
		callback(response) {
			if(response.message) {
				frappe.show_alert({
					message:__('Recibo de Compra criado'),
					indicator:'green'
				}, 5);

				var recibo_de_compra = response.message.name;

				argumentos_retorno_doc = {
					doctype: 'Purchase Receipt',
					name: recibo_de_compra,
				};

				var recibo_de_compra_doctype = retorna_doc(argumentos_retorno_doc);

				var itens_recibo_de_compra = recibo_de_compra_doctype.items;

				itens_recibo_de_compra.forEach(function(item) {
					frappe.call({
						method: "frappe.client.set_value",
						args: {
							doctype: "Purchase Receipt Item",
							name: item.name,
							fieldname: "purchase_order",
							value: pedido_de_compra_doctype.name,
						},
						async: false,
						callback(res) {

						},
					});
				});

				argumentos_retorno_doc = {
					doctype: 'Purchase Receipt',
					name: recibo_de_compra,
				};

				var recibo_de_compra_doctype = retorna_doc(argumentos_retorno_doc);

				frappe.call({
					method: "frappe.desk.form.save.savedocs",
					args: {
						doc: recibo_de_compra_doctype,
						action: "Submit",
					},
					callback: function(r) {	}
				});
				
				frm.save('Update');
			}
		}
	})
}

function retorna_tabela_preco_venda(item, company, cliente) {
	var argumentos_retorno_doc = {
		doctype: 'Selling Settings',
		name: 'selling_price_list',
	};

	var config_vendas = retorna_doc(argumentos_retorno_doc);

	var tabela_preco_venda = config_vendas.selling_price_list;
	
	if(cliente.default_price_list) {
		tabela_preco_venda = cliente.default_price_list;
	} else {
		item.item_defaults.forEach(function(padrao_item) {
			if(padrao_item.company == company.name) {
				if(padrao_item.default_price_list) {
					tabela_preco_venda = padrao_item.default_price_list;
				}
			}
		});
	}
	
	return tabela_preco_venda;
}

function retorna_tabela_preco_compra(fornecedor) {
	var argumentos_retorno_doc = {
		doctype: 'Buying Settings',
		name: 'buying_price_list',
	};

	var config_compras = retorna_doc(argumentos_retorno_doc);

	var tabela_preco_compra = config_compras.buying_price_list;

	if(fornecedor.default_price_list) {
		tabela_preco_compra = fornecedor.default_price_list;
	}
	
	return tabela_preco_compra;
}

function retorna_preco_item(item, tabela_preco) {
	var valor_item = 0;
	
	doctype = 'Item Price';
	var argumentos_retorno_list = {
		item_code: item.item_code,
		price_list: tabela_preco,
	};

	var preco_item_list = retorna_list(doctype, argumentos_retorno_list);
	
	if(preco_item_list.length != 0) {
		var preco_item_name = preco_item_list[0].name;
		
		var argumentos_retorno_doc = {
			doctype: 'Item Price',
			name: preco_item_name,
		};
	
		var preco_item_doctype = retorna_doc(argumentos_retorno_doc);

		valor_item = preco_item_doctype.price_list_rate;
	}

	return valor_item;
}

function monta_item_pedido_venda(item_doctype, valor) {
	var item_retorno = {
		item_code: item_doctype.item_code,
		item_name: item_doctype.item_name,
		description: item_doctype.description,
		qty: 1,
		rate: valor,
		uom: item_doctype.stock_uom,
		delivery_date: frappe.datetime.now_datetime()
	}

	return item_retorno;
}

function monta_item_pedido_compra(item_doctype, valor) {
	var item_retorno = {
		item_code: item_doctype.item_code,
		item_name: item_doctype.item_name,
		description: item_doctype.description,
		qty: 1,
		rate: valor,
		uom: item_doctype.stock_uom,
		schedule_date: frappe.datetime.now_datetime()
	}

	return item_retorno;
}