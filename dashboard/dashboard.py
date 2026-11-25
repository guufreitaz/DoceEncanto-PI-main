"""
Dashboard de vendas da Doce Encanto (Análise de Dados e Estatística).

Como usar:
  1. No app, entre como administradora > Conta > "Exportar dados (JSON)".
  2. pip install -r requirements.txt
  3. streamlit run dashboard.py
  4. Envie o arquivo JSON pela barra lateral (ou use o arquivo de exemplo).
"""
from pathlib import Path

import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from analise import (
    brl,
    carregar,
    estatistica_descritiva,
    indicadores,
    montar_tabelas,
    ranking_produtos,
    DIAS,
)

# ---------------- identidade visual ----------------
ROSA = "#D91B72"          # cor da marca: usada quando há uma única série
TINTA = "#2B2226"         # texto principal
TINTA_2 = "#6F666B"       # texto secundário
GRADE = "#EFE6EA"         # linhas de grade discretas
# Cores fixas por categoria (validadas para daltonismo) - a cor segue a categoria, nunca a posição
COR_CATEGORIA = {"Bolo": "#D91B72", "Doce": "#2a78d6", "Salgado": "#eda100"}
COR_METODO = {"Pix": "#1baf7a", "Cartão de crédito": "#2a78d6", "Cartão de débito": "#eda100",
              "Boleto": "#D91B72", "Saldo Mercado Pago": "#8a6fd1", "Não informado": "#9A8F95"}

EXEMPLO = Path(__file__).parent / "dados" / "exemplo-doceencanto.json"

st.set_page_config(page_title="Doce Encanto - Dashboard", page_icon=":material/cake:", layout="wide")
st.markdown(
    """
    <style>
      [data-testid="stMetricValue"] { color: #2B2226; font-weight: 800; }
      [data-testid="stMetricLabel"] p { color: #6F666B; }
      h1, h2, h3 { color: #2B2226; }
    </style>
    """,
    unsafe_allow_html=True,
)


def folga_rotulos(fig: go.Figure, maximo: float, eixo: str = "x") -> None:
    """Deixa espaço depois da maior barra para o rótulo de valor não ser cortado."""
    if maximo and maximo > 0:
        (fig.update_xaxes if eixo == "x" else fig.update_yaxes)(range=[0, maximo * 1.3])


def estilo(fig: go.Figure, altura: int = 340) -> go.Figure:
    """Aplica o mesmo visual em todos os gráficos: grade discreta, sem fundo, cantos arredondados."""
    fig.update_layout(
        height=altura,
        margin=dict(l=8, r=8, t=8, b=8),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color=TINTA, size=13),
        barcornerradius=4,
        bargap=0.35,
        hoverlabel=dict(bgcolor="white", font_color=TINTA, bordercolor=GRADE),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, x=0, title=None),
    )
    fig.update_xaxes(showgrid=False, linecolor=GRADE, tickfont=dict(color=TINTA_2), title=None)
    fig.update_yaxes(gridcolor=GRADE, zeroline=False, tickfont=dict(color=TINTA_2), title=None)
    return fig


# ---------------- dados ----------------
st.sidebar.title(":material/cake: Doce Encanto")
arquivo = st.sidebar.file_uploader("Arquivo JSON exportado pelo app", type="json")
if arquivo is not None:
    dados = carregar(arquivo)
elif EXEMPLO.exists():
    dados = carregar(EXEMPLO)
    st.sidebar.info("Mostrando o arquivo de exemplo (dados fictícios de demonstração).")
else:
    st.warning("Envie o arquivo JSON exportado pelo app para começar.")
    st.stop()

pedidos_todos, itens_todos = montar_tabelas(dados)
if pedidos_todos.empty:
    st.warning("O arquivo não tem pedidos ainda.")
    st.stop()

inicio_min, fim_max = pedidos_todos["dia"].min().date(), pedidos_todos["dia"].max().date()
periodo = st.sidebar.date_input("Período", value=(inicio_min, fim_max), min_value=inicio_min,
                                max_value=fim_max, format="DD/MM/YYYY")
if isinstance(periodo, tuple) and len(periodo) == 2:
    inicio, fim = periodo
else:
    inicio, fim = inicio_min, fim_max
categorias = st.sidebar.multiselect("Categorias", list(COR_CATEGORIA), default=list(COR_CATEGORIA))
st.sidebar.caption(f"Arquivo gerado em {dados.get('gerado_em', '')[:10]}")

no_periodo = (pedidos_todos["dia"].dt.date >= inicio) & (pedidos_todos["dia"].dt.date <= fim)
pedidos = pedidos_todos[no_periodo]
itens = itens_todos[itens_todos["pedido_id"].isin(pedidos["id"]) & itens_todos["categoria"].isin(categorias)]
vendas = pedidos[pedidos["venda"]]

# ---------------- cabeçalho e indicadores ----------------
st.title("Dashboard de vendas")
st.caption(f"{inicio:%d/%m/%Y} a {fim:%d/%m/%Y} • faturamento e ticket consideram só pedidos pagos, "
           "em preparo, enviados ou entregues")

k = indicadores(pedidos)
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Faturamento", brl(k["faturamento"])[:-3])  # sem centavos para caber no cartão
c2.metric("Pedidos vendidos", f"{k['pedidos_vendidos']}")
c3.metric("Ticket médio", brl(k["ticket_medio"]))
c4.metric("Clientes que compraram", f"{k['clientes_compradores']}")
c5.metric("Cancelados ou recusados", f"{k['taxa_perda']:.1%}".replace(".", ","))

st.divider()

# ---------------- evolução ----------------
st.subheader("Faturamento por semana")
st.caption("A última semana pode estar incompleta.")
semanal = vendas.groupby("semana", as_index=False).agg(faturamento=("total", "sum"), pedidos=("id", "count"))
fig = px.line(semanal, x="semana", y="faturamento", markers=True, custom_data=["pedidos"])
fig.update_traces(line=dict(color=ROSA, width=2), marker=dict(size=8, color=ROSA, line=dict(color="white", width=2)),
                  hovertemplate="Semana de %{x|%d/%m}<br><b>R$ %{y:,.2f}</b><br>%{customdata[0]} pedidos<extra></extra>")
fig.update_yaxes(tickprefix="R$ ", separatethousands=True)
fig.update_layout(hovermode="x unified", separators=",.")
fig.update_xaxes(tickformat="%d/%m", hoverformat="%d/%m/%Y")
st.plotly_chart(estilo(fig, 320), width="stretch")

# ---------------- produtos e categorias ----------------
esq, dir_ = st.columns([3, 2])
with esq:
    st.subheader("Produtos mais vendidos (receita)")
    top = ranking_produtos(itens, 10).sort_values("receita")
    fig = px.bar(top, x="receita", y="nome", orientation="h", color="categoria",
                 color_discrete_map=COR_CATEGORIA, custom_data=["quantidade"], text="receita")
    fig.update_traces(texttemplate="R$ %{x:,.0f}", textposition="outside", cliponaxis=False,
                      hovertemplate="%{y}<br><b>R$ %{x:,.2f}</b><br>%{customdata[0]} unidades<extra></extra>")
    fig.update_layout(separators=",.", yaxis=dict(categoryorder="array", categoryarray=top["nome"].tolist()))
    fig.update_xaxes(showticklabels=False, showgrid=False)
    fig.update_yaxes(showgrid=False)
    folga_rotulos(fig, top["receita"].max())
    st.plotly_chart(estilo(fig, 420), width="stretch")
with dir_:
    st.subheader("Receita por categoria")
    cat = (itens[itens["venda"]].groupby("categoria", as_index=False)["subtotal"].sum()
           .sort_values("subtotal", ascending=False))
    cat["percentual"] = cat["subtotal"] / cat["subtotal"].sum()
    fig = px.bar(cat, x="categoria", y="subtotal", color="categoria", color_discrete_map=COR_CATEGORIA,
                 custom_data=["percentual"])
    fig.update_traces(texttemplate="R$ %{y:,.0f}<br>%{customdata[0]:.0%}", textposition="outside", cliponaxis=False,
                      hovertemplate="%{x}<br><b>R$ %{y:,.2f}</b> (%{customdata[0]:.1%})<extra></extra>")
    fig.update_layout(showlegend=False, separators=",.")
    fig.update_yaxes(showticklabels=False, showgrid=False)
    folga_rotulos(fig, cat["subtotal"].max(), "y")
    st.plotly_chart(estilo(fig, 420), width="stretch")

# ---------------- quando as pessoas compram ----------------
st.subheader("Quando as clientes compram")
a, b = st.columns(2)
with a:
    por_dia = vendas.groupby("dia_semana", observed=False).size().reindex(DIAS, fill_value=0).reset_index(name="pedidos")
    fig = px.bar(por_dia, x="dia_semana", y="pedidos", text="pedidos")
    fig.update_traces(marker_color=ROSA, textposition="outside", cliponaxis=False,
                      hovertemplate="%{x}: <b>%{y} pedidos</b><extra></extra>")
    fig.update_yaxes(showticklabels=False, showgrid=False)
    folga_rotulos(fig, por_dia["pedidos"].max(), "y")
    st.caption("Pedidos por dia da semana")
    st.plotly_chart(estilo(fig, 280), width="stretch")
with b:
    por_hora = vendas.groupby("hora").size().reindex(range(8, 23), fill_value=0).reset_index(name="pedidos")
    fig = px.bar(por_hora, x="hora", y="pedidos")
    fig.update_traces(marker_color=ROSA, hovertemplate="%{x}h: <b>%{y} pedidos</b><extra></extra>")
    fig.update_xaxes(ticksuffix="h", dtick=2)
    st.caption("Pedidos por hora do dia")
    st.plotly_chart(estilo(fig, 280), width="stretch")

# ---------------- pagamento, status e região ----------------
a, b, c = st.columns(3)
with a:
    st.subheader("Formas de pagamento")
    met = vendas.groupby("metodo_rotulo").size().sort_values().reset_index(name="pedidos")
    met["percentual"] = met["pedidos"] / met["pedidos"].sum()
    fig = px.bar(met, x="pedidos", y="metodo_rotulo", orientation="h", color="metodo_rotulo",
                 color_discrete_map=COR_METODO, custom_data=["percentual"])
    fig.update_traces(texttemplate="%{customdata[0]:.0%}", textposition="outside", cliponaxis=False,
                      hovertemplate="%{y}: <b>%{x} pedidos</b> (%{customdata[0]:.1%})<extra></extra>")
    fig.update_layout(showlegend=False)
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showgrid=False)
    folga_rotulos(fig, met["pedidos"].max())
    st.plotly_chart(estilo(fig, 280), width="stretch")
with b:
    st.subheader("Situação dos pedidos")
    sit = pedidos.groupby("status_rotulo").size().sort_values().reset_index(name="pedidos")
    fig = px.bar(sit, x="pedidos", y="status_rotulo", orientation="h", text="pedidos")
    fig.update_traces(marker_color=ROSA, textposition="outside", cliponaxis=False,
                      hovertemplate="%{y}: <b>%{x}</b><extra></extra>")
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showgrid=False)
    folga_rotulos(fig, sit["pedidos"].max())
    st.plotly_chart(estilo(fig, 280), width="stretch")
with c:
    st.subheader("Vendas por estado")
    uf = vendas.groupby("uf", as_index=False)["total"].sum().sort_values("total")
    fig = px.bar(uf, x="total", y="uf", orientation="h", text="total")
    fig.update_traces(marker_color=ROSA, texttemplate="R$ %{x:,.0f}", textposition="outside", cliponaxis=False,
                      hovertemplate="%{y}: <b>R$ %{x:,.2f}</b><extra></extra>")
    fig.update_layout(separators=",.")
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(showgrid=False)
    folga_rotulos(fig, uf["total"].max() * 1.15)
    st.plotly_chart(estilo(fig, 280), width="stretch")

# ---------------- estatística ----------------
st.divider()
st.subheader("Estatística descritiva do valor dos pedidos")
a, b = st.columns([3, 2])
with a:
    fig = px.histogram(vendas, x="total", nbins=20)
    fig.update_traces(marker_color=ROSA, marker_line=dict(color="white", width=2),
                      hovertemplate="R$ %{x}<br><b>%{y} pedidos</b><extra></extra>")
    media, mediana = vendas["total"].mean(), vendas["total"].median()
    fig.add_vline(x=media, line=dict(color=TINTA, width=2, dash="dash"),
                  annotation_text=f"média {brl(media)}", annotation_position="top right",
                  annotation_bgcolor="rgba(255,255,255,0.9)")
    fig.add_vline(x=mediana, line=dict(color=TINTA_2, width=2, dash="dot"),
                  annotation_text=f"mediana {brl(mediana)}", annotation_position="top left",
                  annotation_y=0.88, annotation_bgcolor="rgba(255,255,255,0.9)")
    fig.update_xaxes(tickprefix="R$ ")
    fig.update_layout(bargap=0.05)
    st.caption("Distribuição do valor total dos pedidos vendidos")
    st.plotly_chart(estilo(fig, 340), width="stretch")
with b:
    tabela = estatistica_descritiva(vendas["total"])
    tabela["Valor"] = [
        f"{v:.0f}" if m == "Quantidade (n)" else (f"{v:.1f}%".replace(".", ",") if "%" in m else brl(v))
        for m, v in zip(tabela["Medida"], tabela["Valor"])
    ]
    st.dataframe(tabela, hide_index=True, width="stretch", height=35 * (len(tabela) + 1) + 3)
    st.caption("Média maior que a mediana indica distribuição assimétrica à direita: "
               "poucos pedidos grandes (bolos de festa) puxam a média para cima.")

with st.expander("Ver os dados (tabela de pedidos)"):
    st.dataframe(
        pedidos[["id", "data", "status_rotulo", "metodo_rotulo", "subtotal", "frete", "total", "cidade", "uf"]]
        .rename(columns={"status_rotulo": "status", "metodo_rotulo": "pagamento"})
        .sort_values("data", ascending=False),
        hide_index=True,
        width="stretch",
    )
