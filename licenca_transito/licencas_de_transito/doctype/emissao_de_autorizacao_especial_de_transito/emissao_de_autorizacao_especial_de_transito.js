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

		if(frm.doc.cliente) {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 0);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 0);
			atualiza_query_contato_notificacao(frm);
		} else {
			frm.set_df_property('contato_notificacao_vencimento', 'read_only', 1);
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
		}
	},

	refresh(frm) {
		if(frm.is_new() && !frm.doc.amended_from) {
			frm.set_value('numero_autorizacao', '');
			frm.set_value('vencimento_autorizacao', '');
			frm.refresh_field('numero_autorizacao');
			frm.refresh_field('vencimento_autorizacao');
		}

		if(frm.doc.docstatus == 1) {
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

function atualiza_query_contato_notificacao(frm) {
	frm.set_query('contato_notificacao_vencimento', function() {
		return {
			query: 'licenca_transito.licencas_de_transito.doctype.autorizacao_especial_de_transito.autorizacao_especial_de_transito.filtrar_contacts_empresa',
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

	valor_total_itens = valor_total_itens + retorna_preco_item(item_autorizacao, frm.doc.company);

	var item_pedido_venda = monta_item_pedido_venda(item_autorizacao)
	var itens_pedido_venda = [
		item_pedido_venda
	]

	var item_taxa_emissao = null;
	if(frm.doc.taxa_de_emissao) {
		argumentos_retorno_doc = {
			doctype: 'Item',
			name: frm.doc.taxa_de_emissao,
		};

		item_taxa_emissao = retorna_doc(argumentos_retorno_doc);

		valor_total_itens = valor_total_itens + retorna_preco_item(item_taxa_emissao, frm.doc.company);

		item_pedido_venda = monta_item_pedido_venda(item_taxa_emissao);

		itens_pedido_venda.push(item_pedido_venda);
	}

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: "Sales Order",
				naming_series: "SAL-ORD-.YYYY.-",
				customer: frm.doc.cliente,
				company: frm.doc.company,
				currency: company.default_currency,
				selling_price_list: item_autorizacao.item_defaults[0].default_price_list,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_venda,
			},
		},
		callback(response) {
			if(response.message) {
				frm.set_value('pedido_de_venda', response.message.name);
				frm.refresh_field('pedido_de_venda');
			} else {
				msgprint("Erro ao gerar a fatura de venda");
			}
		}
	})
}

function retorna_preco_item(item, company) {
	var valor_item = 0;
	
	item.item_defaults.forEach(function(padrao) {
		if(padrao.company == company) {
			if(padrao.default_price_list) {
				var argumentos_retorno_doc = {
					doctype: 'Item Price',
					filters: {
						'item_code': item.item_code,
						'price_list': padrao.default_price_list,
					}
				};

				var preco_item_doctype = retorna_doc(argumentos_retorno_doc);
				valor_item = preco_item_doctype.price_list_rate
			}
		}
	});

	return valor_item;
}

function monta_item_pedido_venda(item_doctype) {
	var item_retorno = {
		item_code: item_doctype.item_code,
		item_name: item_doctype.item_name,
		description: item_doctype.description,
		qty: 1,
		uom: item_doctype.stock_uom,
		delivery_date: frappe.datetime.now_datetime()
	}

	return item_retorno;
}