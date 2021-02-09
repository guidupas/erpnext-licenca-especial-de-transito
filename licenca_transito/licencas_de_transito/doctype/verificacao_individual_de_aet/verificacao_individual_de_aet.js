// Copyright (c) 2020, Inova Techy and contributors
// For license information, please see license.txt

frappe.ui.form.on('Verificacao individual de AET', {
	onload(frm) {
		//Retorna doc de informacoes da Configuracao do Grupo de Item
		var argumentos_retorno_doc = {
			doctype: 'Configuracoes de Licenca de Transito',
			name: 'grupo_item_licenca_transito',
		};
		
		var doc_configuracoes_licenca_transito = retorna_doc(argumentos_retorno_doc);

		frm.set_query('autorizacao', function () {
			return {
				filters: {
					item_group: doc_configuracoes_licenca_transito.grupo_item_licenca_transito
				}
			}
		});

		if(frm.doc.contato_notificacao_vencimento) {
			frm.set_df_property('email_notificacao_vencimento', 'read_only', 1);
		}

		atualiza_query_contato_notificacao(frm);
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