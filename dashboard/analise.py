"""
Funções de análise do JSON exportado pelo app (botão "Exportar dados (JSON)").
Ficam separadas da tela para poderem ser testadas e reaproveitadas.
"""
import json
from pathlib import Path

import pandas as pd

# Pedidos que viraram venda de fato
STATUS_VENDA = ["pago", "em_preparo", "enviado", "entregue"]

ROTULO_STATUS = {
    "aguardando_pagamento": "Aguardando pagamento",
    "pago": "Pago",
    "recusado": "Recusado",
    "em_preparo": "Em preparo",
    "enviado": "Enviado",
    "entregue": "Entregue",
    "cancelado": "Cancelado",
}
ROTULO_METODO = {
    "pix": "Pix",
    "cartao_credito": "Cartão de crédito",
    "cartao_debito": "Cartão de débito",
    "boleto": "Boleto",
    "saldo_mercado_pago": "Saldo Mercado Pago",
}
DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]


def carregar(fonte) -> dict:
    """Aceita um caminho de arquivo ou um arquivo enviado pelo Streamlit."""
    if isinstance(fonte, (str, Path)):
        return json.loads(Path(fonte).read_text(encoding="utf-8"))
    return json.load(fonte)


def montar_tabelas(dados: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Transforma o JSON em duas tabelas: pedidos (1 linha por pedido) e itens (1 linha por item vendido)."""
    pedidos = pd.DataFrame(dados.get("pedidos", []))
    if pedidos.empty:
        colunas = ["id", "cliente_id", "status", "metodo_pagamento", "subtotal", "frete", "total", "cidade", "uf", "criado_em"]
        return pd.DataFrame(columns=colunas + ["data"]), pd.DataFrame()

    # As datas vêm do banco em UTC; convertemos para o horário de Brasília
    pedidos["data"] = (
        pd.to_datetime(pedidos["criado_em"], utc=True).dt.tz_convert("America/Sao_Paulo").dt.tz_localize(None)
    )
    pedidos["dia"] = pedidos["data"].dt.normalize()
    pedidos["semana"] = pedidos["data"].dt.to_period("W-SUN").dt.start_time
    pedidos["mes"] = pedidos["data"].dt.to_period("M").dt.start_time
    pedidos["dia_semana"] = pd.Categorical(
        pedidos["data"].dt.dayofweek.map(dict(enumerate(DIAS))), categories=DIAS, ordered=True
    )
    pedidos["hora"] = pedidos["data"].dt.hour
    pedidos["status_rotulo"] = pedidos["status"].map(ROTULO_STATUS).fillna(pedidos["status"])
    pedidos["metodo_rotulo"] = pedidos["metodo_pagamento"].map(ROTULO_METODO).fillna("Não informado")
    pedidos["venda"] = pedidos["status"].isin(STATUS_VENDA)

    linhas = []
    for p in dados.get("pedidos", []):
        for it in p.get("itens", []):
            linhas.append({"pedido_id": p["id"], **it})
    itens = pd.DataFrame(linhas)
    if not itens.empty:
        itens = itens.merge(pedidos[["id", "data", "venda", "status"]], left_on="pedido_id", right_on="id", how="left")
        if "subtotal" not in itens:
            itens["subtotal"] = itens["quantidade"] * itens["preco_unitario"]
    return pedidos.drop(columns=["itens"], errors="ignore"), itens


def indicadores(pedidos: pd.DataFrame) -> dict:
    """KPIs principais. Faturamento e ticket consideram só pedidos que viraram venda."""
    vendas = pedidos[pedidos["venda"]]
    total = len(pedidos)
    perdidos = pedidos["status"].isin(["cancelado", "recusado"]).sum()
    return {
        "faturamento": float(vendas["total"].sum()),
        "pedidos_vendidos": int(len(vendas)),
        "ticket_medio": float(vendas["total"].mean()) if len(vendas) else 0.0,
        "clientes_compradores": int(vendas["cliente_id"].nunique()),
        "taxa_perda": float(perdidos / total) if total else 0.0,
    }


def estatistica_descritiva(valores: pd.Series) -> pd.DataFrame:
    """Medidas de tendência central e de dispersão (média, mediana, moda, desvio-padrão, quartis...)."""
    v = valores.dropna().astype(float)
    if v.empty:
        return pd.DataFrame(columns=["Medida", "Valor"])
    moda = v.round(0).mode()
    q1, q3 = v.quantile(0.25), v.quantile(0.75)
    linhas = [
        ("Quantidade (n)", len(v)),
        ("Média", v.mean()),
        ("Mediana", v.median()),
        ("Moda (arredondada)", moda.iloc[0] if not moda.empty else float("nan")),
        ("Desvio-padrão", v.std(ddof=1) if len(v) > 1 else 0.0),
        ("Coeficiente de variação (%)", (v.std(ddof=1) / v.mean() * 100) if len(v) > 1 and v.mean() else 0.0),
        ("Mínimo", v.min()),
        ("1º quartil (Q1)", q1),
        ("3º quartil (Q3)", q3),
        ("Amplitude interquartil", q3 - q1),
        ("Máximo", v.max()),
    ]
    return pd.DataFrame(linhas, columns=["Medida", "Valor"])


def ranking_produtos(itens: pd.DataFrame, n: int = 10) -> pd.DataFrame:
    vendidos = itens[itens["venda"]] if not itens.empty else itens
    if vendidos.empty:
        return pd.DataFrame(columns=["nome", "categoria", "quantidade", "receita"])
    return (
        vendidos.groupby(["nome", "categoria"], as_index=False)
        .agg(quantidade=("quantidade", "sum"), receita=("subtotal", "sum"))
        .sort_values("receita", ascending=False)
        .head(n)
    )


def brl(valor: float) -> str:
    """1234.5 -> 'R$ 1.234,50'"""
    return "R$ " + f"{valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
