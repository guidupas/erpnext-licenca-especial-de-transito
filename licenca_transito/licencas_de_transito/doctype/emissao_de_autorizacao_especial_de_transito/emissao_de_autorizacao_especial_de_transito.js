// Copyright (c) 2021, Inova Techy and contributors
// For license information, please see license.txt

frappe.ui.form.on('Emissao de Autorizacao Especial de Transito', {
	setup(frm) {
		frm.set_indicator_formatter("autorizacao_de_transito", function(doc) {
			return (doc.aet_confirmada == 1) ? "green" : "orange"
		})
	},

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

		frm.set_query("autorizacao_de_transito", "tabela_aets", function(doc, cdt, cdn) {
			return {
				filters: {
					item_group: doc_configuracoes_licenca_transito.grupo_item_licenca_transito
				}
			}
		})

		frm.set_query("taxa_de_emissao_aet", "tabela_aets", function(doc, cdt, cdn) {
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

		if(frm.is_new()) {
			frm.doc.tabela_aets.forEach(function(item_aet) {
				if(!frm.doc.amended_from) {
					item_aet.numero_aet = "";
					item_aet.vencimento_da_aet = "";
					item_aet.situacao_aet = "Solicitada";
					item_aet.pedido_de_venda_aet = "";
					item_aet.pedido_de_compra_aet = "";
				}
			
				item_aet.aet_confirmada = 0;
			})
		}
	},

	refresh(frm) {
		if(frm.doc.docstatus == 1) {
			frm.get_field("tabela_aets").grid.cannot_add_rows = true;
			frm.get_field("tabela_aets").grid.wrapper.find('.grid-remove-rows').hide();
			frm.get_field("tabela_aets").grid.cannot_delete_rows = true;
			frm.get_field("tabela_aets").grid.only_sortable();

			frm.fields_dict["tabela_aets"].grid.add_custom_button(__('Confirmar AETs Liberadas e Canceladas'),
				function() {
					let doctype = "Itens Emissao de Autorizacao Especial de Transito";
					var campos_obrigatorios_aet_liberada_preenchidos = true;
					frm.doc.tabela_aets.forEach(function(item_aet) {
						if(item_aet.situacao_aet == "Liberada") {
							try {
								if(item_aet.placa_veiculo_aet.trim() == "" || item_aet.numero_aet.trim() == "" || item_aet.vencimento_da_aet.trim() == "") {
									campos_obrigatorios_aet_liberada_preenchidos = false;
								} else {
									item_aet.aet_confirmada = 1;
							
									var df = frappe.meta.get_docfield(doctype,"placa_veiculo_aet", item_aet.name);
									df.allow_on_submit = 0;

									df = frappe.meta.get_docfield(doctype,"numero_aet", item_aet.name);
									df.allow_on_submit = 0;

									df = frappe.meta.get_docfield(doctype,"vencimento_da_aet", item_aet.name);
									df.allow_on_submit = 0;

									df = frappe.meta.get_docfield(doctype,"tipo_veiculo_aet", item_aet.name);
									df.allow_on_submit = 0;

									df = frappe.meta.get_docfield(doctype,"situacao_aet", item_aet.name);
									df.allow_on_submit = 0;
								}
							} catch(e) {
								campos_obrigatorios_aet_liberada_preenchidos = false
							}
						}

						if(item_aet.situacao_aet == "Cancelada") {
							item_aet.aet_confirmada = 1;
							
							var df = frappe.meta.get_docfield(doctype,"placa_veiculo_aet", item_aet.name);
							df.allow_on_submit = 0;

							df = frappe.meta.get_docfield(doctype,"numero_aet", item_aet.name);
							df.allow_on_submit = 0;

							df = frappe.meta.get_docfield(doctype,"vencimento_da_aet", item_aet.name);
							df.allow_on_submit = 0;

							df = frappe.meta.get_docfield(doctype,"tipo_veiculo_aet", item_aet.name);
							df.allow_on_submit = 0;

							df = frappe.meta.get_docfield(doctype,"situacao_aet", item_aet.name);
							df.allow_on_submit = 0;
						}
					})
					if(campos_obrigatorios_aet_liberada_preenchidos) {
						frm.refresh_field('tabela_aets');
						frm.save('Update');
					} else {
						msgprint("Campos obrigatórios da AETs liberadas estão incompletos<br/>Preencha os campos:<br/>Placa do veículo<br/>Número da AET<br/>Data de vencimento");
					}
			});

			var tem_item_para_pedido_venda = false;
			var tem_item_para_pedido_compra = false;
			
			frm.doc.tabela_aets.forEach(function(item_aet){
				if(item_aet.situacao_aet == "Liberada" && !item_aet.pedido_de_compra_aet && item_aet.gerar_pagamento_de_taxa_de_emissao_aet == 1 && item_aet.aet_confirmada == 1) {
					tem_item_para_pedido_compra = true;
				}
				
				if(item_aet.situacao_aet == "Liberada" && !item_aet.pedido_de_venda_aet && item_aet.aet_confirmada == 1) {
					tem_item_para_pedido_venda = true;
				}
			});

			if(tem_item_para_pedido_compra) {
				frm.add_custom_button(("Gerar Pedido de Compra"), function(){
					criar_pedido_compra(frm)
				});
			}
			
			if(tem_item_para_pedido_venda) {
				frm.add_custom_button(("Gerar Pedido de Venda"), function(){
					criar_pedido_venda(frm);
				});
			}
		} else if(frm.doc.docstatus == 0) {
			frm.get_field("tabela_aets").grid.cannot_add_rows = false;
			frm.get_field("tabela_aets").grid.wrapper.find('.grid-remove-rows').show();
			frm.get_field("tabela_aets").grid.wrapper.find('.grid-add-rows').show();
			frm.get_field("tabela_aets").grid.cannot_delete_rows = false;
			frm.get_field("tabela_aets").grid.static_rows = false;
			frm.get_field("tabela_aets").grid.clear_custom_buttons();
		}

		let doctype = "Itens Emissao de Autorizacao Especial de Transito";
		frm.doc.tabela_aets.forEach(function(item_aet) {
			if(item_aet.aet_confirmada == 1) {
				var df = frappe.meta.get_docfield(doctype,"placa_veiculo_aet", item_aet.name);
				df.allow_on_submit = 0;
				
				df = frappe.meta.get_docfield(doctype,"numero_aet", item_aet.name);
				df.allow_on_submit = 0;

				df = frappe.meta.get_docfield(doctype,"vencimento_da_aet", item_aet.name);
				df.allow_on_submit = 0;

				df = frappe.meta.get_docfield(doctype,"tipo_veiculo_aet", item_aet.name);
				df.allow_on_submit = 0;

				df = frappe.meta.get_docfield(doctype,"situacao_aet", item_aet.name);
				df.allow_on_submit = 0;
			}
		})
		
		frm.refresh_field('tabela_aets');
	},

	before_submit(frm) {
		var form_valido = true;
		var mensagem_erro = "Preencha os campos Taxa de Emissão e Fornecedor";
		frm.doc.tabela_aets.forEach(function(item_aet, indice){
			if(item_aet.gerar_pagamento_de_taxa_de_emissao_aet == 1) {
				if(item_aet.taxa_de_emissao_aet == "" || item_aet.taxa_de_emissao_aet == null || item_aet.fornecedor_aet == "" || item_aet.fornecedor_aet == null) {
					form_valido = false;
					if(indice == 0) {
						mensagem_erro = mensagem_erro + "<br/>AET " + (indice + 1).toString();
					}
				}
			}
		});

		if(form_valido == false) {
			frappe.validated = false;
			msgprint(mensagem_erro);
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
});

frappe.ui.form.on('Itens Emissao de Autorizacao Especial de Transito', {
	gerar_pagamento_de_taxa_de_emissao_aet(frm,cdt,cdn) {
		var linha_aet_selecionada = locals[cdt][cdn];
		var indice_aet_selecionada = linha_aet_selecionada.idx - 1;
		var gerar_pagamento_taxa_emissao_aet_selecionada = linha_aet_selecionada.gerar_pagamento_de_taxa_de_emissao_aet;

		if(gerar_pagamento_taxa_emissao_aet_selecionada == 0) {
			var df = frappe.meta.get_docfield(cdt,"fornecedor_aet", cdn);
			df.read_only = 1;

			df = frappe.meta.get_docfield(cdt,"taxa_de_emissao_aet", cdn);
			df.read_only = 1;

			frappe.model.set_value(linha_aet_selecionada.doctype, linha_aet_selecionada.name, 'taxa_de_emissao_aet', '');
			frappe.model.set_value(linha_aet_selecionada.doctype, linha_aet_selecionada.name, 'fornecedor_aet', '');
		} else {
			var df = frappe.meta.get_docfield(cdt,"fornecedor_aet", cdn);
			df.read_only = 0;
			
			df = frappe.meta.get_docfield(cdt,"taxa_de_emissao_aet", cdn);
			df.read_only = 0;
		}
		refresh_field('fornecedor_aet', cdn, 'tabela_aets');
		refresh_field('taxa_de_emissao_aet', cdn, 'tabela_aets');
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

	var itens_pedido_venda = [];
	var itens_aets_liberadas = [];

	var valor_total_itens = 0;
	var tabela_preco_venda = "";
	
	frm.doc.tabela_aets.forEach(function(item_aet) {
		if(item_aet.situacao_aet == "Liberada") {
			argumentos_retorno_doc = {
				doctype: 'Item',
				name: item_aet.autorizacao_de_transito,
			};

			var item_autorizacao = retorna_doc(argumentos_retorno_doc);
			tabela_preco_venda = retorna_tabela_preco_venda(item_autorizacao, company, cliente);
			var preco_item = retorna_preco_item(item_autorizacao, tabela_preco_venda);
			valor_total_itens = valor_total_itens + preco_item;
			var item_pedido_venda = monta_item_pedido_venda(item_autorizacao, preco_item);
			itens_pedido_venda.push(item_pedido_venda);
			itens_aets_liberadas.push(item_aet);
		}
	});
	
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
		async: false,
		callback(response) {
			if(response.message) {
				itens_aets_liberadas.forEach(function(item_aet_liberada) {
					item_aet_liberada.pedido_de_venda_aet = response.message.name;
				})
				
				frappe.show_alert({
					message:__('Pedido de Venda criado'),
					indicator:'green'
				}, 5);

				criar_guia_remessa(frm, response.message.name, itens_pedido_venda)
			} else {
				msgprint("Erro ao gerar a pedido de venda");
			}
		}
	})
	frm.save('Update');
}

function criar_guia_remessa(frm, name_pedido_venda, itens_pedido_venda) {
	var argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Sales Order',
		name: name_pedido_venda,
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
		async: false,
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
				
				//frm.save('Update');
			} else {
				msgprint("Erro ao gerar a guia de remessa");
			}
		}
	})
}

function criar_pedido_compra(frm) {
	var argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	var fornecedores_itens_pedido_compra = monta_pedido_compra(frm);
	
	fornecedores_itens_pedido_compra.forEach(function(objeto) {
		argumentos_retorno_doc = {
			doctype: 'Supplier',
			name: objeto.fornecedor,
		};

		var fornecedor = retorna_doc(argumentos_retorno_doc);
		
		var itens_do_objeto = objeto.itens;
		
		var itens_pedido_compra = [];
		var itens_aets_liberadas = [];

		var valor_total_itens = 0;
		var tabela_preco_compra = "";

		itens_do_objeto.forEach(function(item) {
			argumentos_retorno_doc = {
				doctype: 'Item',
				name: item.taxa_de_emissao_aet,
			};

			var item_taxa_emissao = retorna_doc(argumentos_retorno_doc);
			tabela_preco_compra = retorna_tabela_preco_compra(fornecedor);
			var preco_item = retorna_preco_item(item_taxa_emissao, tabela_preco_compra);
			valor_total_itens = valor_total_itens + preco_item;
			var item_pedido_compra = monta_item_pedido_compra(item_taxa_emissao, preco_item);
			itens_pedido_compra.push(item_pedido_compra);
			itens_aets_liberadas.push(item);
		})

		frappe.call({
			method: "frappe.client.insert",
			args: {
				doc: {
					doctype: "Purchase Order",
					naming_series: "PUR-ORD-.YYYY.-",
					supplier: objeto.fornecedor,
					company: frm.doc.company,
					currency: company.default_currency,
					buying_price_list: tabela_preco_compra,
					price_list_currency: company.default_currency,
					docstatus: 0,
					items: itens_pedido_compra,
				},
			},
			async: false,
			callback(response) {
				if(response.message) {
					itens_aets_liberadas.forEach(function(item_aet_liberada) {
						item_aet_liberada.pedido_de_compra_aet = response.message.name;
					})
	
					frappe.show_alert({
						message:__('Pedido de Compra criado'),
						indicator:'green'
					}, 5);
	
					criar_recibo_compra(frm, response.message.name, itens_pedido_compra)
				} else {
					msgprint("Erro ao gerar a pedido de compra");
				}
			}
		})
	})
	frm.save('Update');
}

function criar_recibo_compra(frm, name_pedido_compra, itens_pedido_compra) {
	var argumentos_retorno_doc = {
		doctype: 'Company',
		name: frm.doc.company,
	};

	var company = retorna_doc(argumentos_retorno_doc);

	argumentos_retorno_doc = {
		doctype: 'Purchase Order',
		name: name_pedido_compra,
	};

	var pedido_de_compra_doctype = retorna_doc(argumentos_retorno_doc);

	frappe.call({
		method: "frappe.client.insert",
		args: {
			doc: {
				doctype: 'Purchase Receipt',
				naming_series: 'MAT-PRE-.YYYY.-',
				supplier: pedido_de_compra_doctype.supplier,
				company: frm.doc.company,
				currency: company.default_currency,
				buying_price_list: pedido_de_compra_doctype.buying_price_list,
				price_list_currency: company.default_currency,
				docstatus: 0,
				items: itens_pedido_compra,
			},
		},
		async: false,
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
				
				//frm.save('Update');
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

function monta_pedido_compra(frm) {
	var fornecedores_itens_list = [];
	frm.doc.tabela_aets.forEach(function(item_aet) {
		if(item_aet.situacao_aet == "Liberada") {
			var encontrado = fornecedores_itens_list.find(fil => fil.fornecedor == item_aet.fornecedor_aet);
			
			if(encontrado) {
				encontrado.itens.push(item_aet);
			} else {
				var itens_list = [];
				itens_list.push(item_aet);

				var dict = {};
				dict["fornecedor"] = item_aet.fornecedor_aet;
				dict["itens"] = itens_list;
			
				fornecedores_itens_list.push(dict);
			}
		}
	});
	
	return fornecedores_itens_list;
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