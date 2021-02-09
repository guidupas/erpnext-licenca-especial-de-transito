// Copyright (c) 2020, Inova Techy and contributors
// For license information, please see license.txt

frappe.ui.form.on('Autorizacao Especial de Transito', {
	onload(frm) {
		//Retorna doc de informacoes da Configuracao do Grupo de Item
		var argumentos_retorno_doc = {
			doctype: 'Configuracoes de Licenca de Transito',
			name: 'grupo_item_licenca_transito',
		};
		
		var doc_configuracoes_licenca_transito = retorna_doc(argumentos_retorno_doc);

		frm.fields_dict['autorizacoes_de_transito'].grid.get_field('autorizacao').get_query = function(doc) {
			return {
				filters: {
					item_group: doc_configuracoes_licenca_transito.grupo_item_licenca_transito
				}
			}
		};

		if(frm.doc.contato_notificacao_vencimento) {
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
		}

		atualiza_query_pedido_de_venda(frm);
		atualiza_query_contato_notificacao(frm);
	},

	refresh(frm) {
		atualiza_numero_autorizacoes(frm);
	},

	before_submit(frm) {
		adiciona_aet_individual(frm.doc);
	},

	before_cancel(frm) {
		remove_aet_individual(frm.doc.name);
	},

	pedido_de_venda(frm) {
		atualiza_query_pedido_de_venda(frm);

		var argumentos_retorno_doc_licenca_transito = {
			doctype: 'Configuracoes de Licenca de Transito',
			name: 'grupo_item_licenca_transito',
		};
		
		var doc_configuracoes_licenca_transito = retorna_doc(argumentos_retorno_doc_licenca_transito);
		
		if(!frm.doc.pedido_de_venda) {
			frm.set_value('cliente', '');
			frm.refresh_field('cliente');
			frm.set_df_property('cliente', 'read_only', 0);
			frm.set_df_property('autorizacoes_de_transito', 'read_only', 0);

			var df = frappe.meta.get_docfield('Itens da Autorizacao de Transito','autorizacao', frm.doc.name);
			df.read_only = 0;

			frm.clear_table('autorizacoes_de_transito');
			var childTable = frm.add_child('autorizacoes_de_transito');

			frm.refresh_field('autorizacoes_de_transito');
		} else {
			frm.set_df_property('cliente', 'read_only', 1);
			frm.set_df_property('autorizacoes_de_transito', 'read_only', 1);

			var argumentos_retorno_doc_sales_order = {
				doctype: 'Sales Order',
				name: frm.doc.pedido_de_venda,
			};
			var doc_sales_order = retorna_doc(argumentos_retorno_doc_sales_order);

			frm.clear_table('autorizacoes_de_transito');

			var df = frappe.meta.get_docfield('Itens da Autorizacao de Transito','autorizacao', frm.doc.name);
			df.read_only = 1;
			
			doc_sales_order.items.forEach(function(item) {
				if(item.item_group == doc_configuracoes_licenca_transito.grupo_item_licenca_transito) {
					for(var i = 0; i < item.qty; i++) {
						var childTable = frm.add_child('autorizacoes_de_transito');
						childTable.autorizacao = item.item_code;
					}
				}
			});
		}
		
		frm.refresh_field('autorizacoes_de_transito');
		atualiza_numero_autorizacoes(frm);
	},

	cliente(frm) {
		atualiza_query_contato_notificacao(frm);
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

frappe.ui.form.on('Itens da Autorizacao de Transito', {
	autorizacoes_de_transito_add(frm, cdt, cdn) {
		atualiza_numero_autorizacoes(frm);
	},

	autorizacoes_de_transito_remove(frm, cdt, cdn) {
		atualiza_numero_autorizacoes(frm);
	}
});

function atualiza_numero_autorizacoes(frm) {
	frm.doc.qtde_autorizacoes = frm.doc.autorizacoes_de_transito.length;
	frm.refresh_field('qtde_autorizacoes');
}

function atualiza_query_pedido_de_venda(frm) {
	frm.set_query('pedido_de_venda', function() {
		return {
			query: 'licenca_transito.licencas_de_transito.doctype.autorizacao_especial_de_transito.autorizacao_especial_de_transito.filtrar_sales_order_usados',
			filters: {
				'autorizacao_especial_de_transito_atual': frm.doc.name,
				'company': frm.doc.company,
			}
		}
	})
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

function adiciona_aet_individual(doc) {
	doc.autorizacoes_de_transito.forEach(function(item){
		frappe.call({
			method: "frappe.client.insert",
			args: {
				doc:{
					doctype: "Verificacao individual de AET",
					name: item.name,
					pedido_de_venda: doc.pedido_de_venda,
					cliente: doc.cliente,
					placa: item.placa,
					tipo_veiculo: item.tipo_veiculo,
					lnc_aet: doc.name,
					empresa: doc.empresa,
					transportadora: item.transportadora,
					observacoes: item.observacoes,
					autorizacao: item.autorizacao,
					numero_autorizacao: item.numero_autorizacao,
					vencimento_autorizacao: item.vencimento_autorizacao,
					company: doc.company,
					docstatus: 1,
					contato_notificacao_vencimento: doc.contato_notificacao_vencimento,
					email_notificacao_vencimento: doc.email_notificacao_vencimento,
				},
			},
			callback(response) {
				//
			}
		})
	})
}

function remove_aet_individual(lnc_aet) {
	frappe.call({
		method: "licenca_transito.licencas_de_transito.doctype.autorizacao_especial_de_transito.autorizacao_especial_de_transito.remove_aet_individual",
		args: {
			doc_lnc_aet: lnc_aet,
		},
		async: false,
		callback(response) {
			//
		}
	});
}

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