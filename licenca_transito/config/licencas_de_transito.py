from __future__ import unicode_literals
from frappe import _

def get_data():
    return [
        {
            "label": _("Licenças de Trânsito"),
            "items": [
                {
                    "type": "doctype",
                    "name": "Customer",
                    "label": _("Customer"),
                    "onboard": 1,
                },
                {
                    "type": "doctype",
                    "name": "Emissao de Autorizacao Especial de Transito",
                    "label": _("Emissão de Autorização Especial de Trânsito"),
                    "onboard": 1,
                },
                {
                    "type": "doctype",
                    "name": "Autorizacao Especial de Transito",
                    "label": _("Autorização Especial de Trânsito"),
                    "onboard": 1,
                },
                {
                    "type": "doctype",
                    "name": "Verificacao individual de AET",
                    "label": _("Verificação individual de AET"),
                    "onboard": 1,
                },
            ]
        },
        {
            "label": _("Configurações"),
            "items": [
                {
                    "type": "doctype",
                    "name": "Configuracoes de Licenca de Transito",
                    "label": _("Configurações de Licença de Trânsito"),
                    "onboard": 1,
                    "settings": 1,
                },
                {
                    "type": "doctype",
                    "name": "Tipo de Veiculo da Autorizacao de Transito",
                    "label": _("Tipo de Veículo da Autorização de Trânsito"),
                    "onboard": 1,
                },
            ]
        }
    ]