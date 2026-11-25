"""
TESTE E2E (ponta a ponta) da versão web do app, com Playwright.

Pré-requisitos:
  1. API rodando:            cd server && npm start
  2. App web rodando:        npx expo start --web   (porta 8081)
  3. pip install playwright && python -m playwright install chromium

Rodar:  python e2e/web/fluxo_completo.py
As capturas de tela vão para e2e/web/capturas/ (servem para o documento final).
"""
import json, os, pathlib
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("APP_URL", "http://localhost:8081")
OUT = str(pathlib.Path(__file__).parent / "capturas")
os.makedirs(OUT, exist_ok=True)
CHROME = os.environ.get("CHROME_PATH")  # opcional: usar o Chrome instalado
erros = []

def t(page, tid): return page.get_by_test_id(tid)


def modal(page, botao="modal-ok", foto=None):
    """Espera o modal do app aparecer, tira print (opcional) e toca no botão."""
    expect(t(page, "modal")).to_be_visible(timeout=10000)
    page.wait_for_timeout(350)  # animação de entrada
    if foto:
        page.screenshot(path=f"{OUT}/{foto}")
    t(page, botao).click()
    expect(t(page, "modal")).to_have_count(0, timeout=5000)
    page.wait_for_timeout(450)  # animação de saída

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, accept_downloads=True)
    page = ctx.new_page()
    page.on("console", lambda m: m.type == "error" and erros.append(m.text))
    page.on("pageerror", lambda e: erros.append(str(e)))
    page.on("dialog", lambda d: d.accept())

    page.goto(BASE + "/")
    page.wait_for_url("**/login")
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/01-login.png")

    t(page, "login-email").fill("maria@exemplo.com")
    t(page, "login-senha").fill("123456")
    t(page, "login-entrar").click()
    page.wait_for_url("**/catalogo")
    modal(page, foto="02a-modal-login.png")
    expect(t(page, "produto-1")).to_be_visible(timeout=10000)
    t(page, "favoritar-1").click()
    t(page, "favoritar-5").click()
    page.get_by_role("button", name="Favoritos").click()
    expect(t(page, "produto-1")).to_be_visible()
    expect(t(page, "produto-2")).to_have_count(0)
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/02b-favoritos.png")
    page.get_by_role("button", name="Todos").click()
    expect(t(page, "produto-2")).to_be_visible()
    page.wait_for_timeout(800)
    page.screenshot(path=f"{OUT}/02-catalogo.png")

    t(page, "produto-5").click()
    expect(t(page, "adicionar-carrinho")).to_be_visible()
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/03-produto.png")
    page.get_by_label("Aumentar quantidade").click()
    t(page, "adicionar-carrinho").click()
    modal(page, botao="modal-cancelar", foto="03a-modal-adicionado.png")
    expect(t(page, "produto-1")).to_be_visible()
    t(page, "adicionar-6").click()
    page.wait_for_timeout(300)

    t(page, "aba-carrinho").click()
    expect(t(page, "item-carrinho-5")).to_be_visible()
    assert t(page, "quantidade-5").inner_text() == "2", "quantidade do cupcake deveria ser 2"
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/04-carrinho.png")

    t(page, "finalizar-compra").click()
    page.wait_for_url("**/pagamento")
    expect(t(page, "pagar")).to_be_enabled(timeout=10000)
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/05-pagamento.png", full_page=True)
    t(page, "pagar").click()
    page.wait_for_url("**/pedido/**")
    expect(t(page, "simular-aprovado")).to_be_visible(timeout=10000)
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/06-pedido-aguardando.png")
    t(page, "simular-aprovado").click()
    modal(page, foto="06a-modal-pagamento-aprovado.png")
    expect(page.get_by_text("Pago com Pix")).to_be_visible(timeout=10000)
    page.screenshot(path=f"{OUT}/07-pedido-pago.png", full_page=True)

    page.go_back()
    page.wait_for_timeout(500)
    t(page, "aba-pedidos").click()
    expect(page.get_by_text("Pedido #").first).to_be_visible(timeout=10000)
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/08-meus-pedidos.png")

    t(page, "aba-contato").click()
    t(page, "contato-assunto").fill("Encomenda para aniversário")
    t(page, "contato-mensagem").fill("Olá! Vocês fazem bolo de dois andares para 40 pessoas no sábado?")
    t(page, "contato-enviar").click()
    modal(page)
    expect(page.get_by_text("Suas mensagens")).to_be_visible(timeout=10000)
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/09-contato.png", full_page=True)

    t(page, "aba-conta").click()
    t(page, "sair").click()
    modal(page, foto="09a-modal-sair.png")
    page.wait_for_url("**/login")

    # ---------- administradora ----------
    t(page, "login-email").fill("admin@doceencanto.com")
    t(page, "login-senha").fill("admin123")
    t(page, "login-entrar").click()
    page.wait_for_url("**/catalogo")
    modal(page)
    t(page, "aba-conta").click()
    expect(t(page, "exportar-json")).to_be_visible(timeout=10000)
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/10-conta-admin.png")

    with page.expect_download() as dl:
        t(page, "exportar-json").click()
    modal(page)
    dl.value.save_as(f"{OUT}/export.json")

    t(page, "menu-admin-produtos").click()
    expect(t(page, "admin-produto-1")).to_be_visible(timeout=10000)
    page.wait_for_timeout(400)
    page.screenshot(path=f"{OUT}/11-admin-produtos.png")

    t(page, "novo-produto").click()
    expect(t(page, "produto-nome")).to_be_visible()
    t(page, "produto-nome").fill("Torta de Limão")
    t(page, "produto-descricao").fill("Base crocante, creme de limão siciliano e merengue maçaricado.")
    t(page, "produto-preco").fill("54,90")
    page.get_by_role("button", name="Doce").click()
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/12-admin-novo-produto.png")
    t(page, "produto-salvar").click()
    modal(page)
    expect(page.get_by_text("Torta de Limão")).to_be_visible(timeout=10000)

    novo = page.locator("[data-testid^=admin-produto-]").filter(has_text="Torta de Limão")
    pid = novo.get_attribute("data-testid").split("-")[-1]
    t(page, f"editar-{pid}").click()
    expect(t(page, "produto-preco")).to_have_value("54,90", timeout=10000)
    t(page, "produto-preco").fill("49,90")
    t(page, "produto-salvar").click()
    modal(page)
    expect(page.get_by_text("R$ 49,90")).to_be_visible(timeout=10000)
    t(page, f"excluir-{pid}").click()
    modal(page, foto="12a-modal-excluir.png")
    expect(page.get_by_text("Torta de Limão")).to_have_count(0, timeout=10000)

    page.go_back()  # volta para "Minha conta"
    page.get_by_text("Todos os pedidos").click()
    expect(page.get_by_text("Pedido #").first).to_be_visible(timeout=10000)
    page.wait_for_timeout(500)
    page.screenshot(path=f"{OUT}/13-admin-pedidos.png")

    page.go_back()
    page.get_by_text("Mensagens de clientes").click()
    expect(page.get_by_text("Encomenda para aniversário").first).to_be_visible(timeout=10000)
    page.wait_for_timeout(300)
    page.screenshot(path=f"{OUT}/14-admin-mensagens.png")

    b.close()

dados = json.load(open(f"{OUT}/export.json"))
print("export:", dados["totais"])
print("erros de console:", erros or "nenhum")
print("E2E WEB OK")
