from flask import render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from projetsalario import app, database, bcrypt, login_manager
from projetsalario.models import Usuario, Plano, LinhaPlano
import re



@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith("/api/") or request.is_json:
        return jsonify({"mensagem": "Faça login para salvar seus planos.", "status": "erro"}), 401
    return redirect(url_for('login'))




@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))

def senha_valida(senha):
    if (len(senha) < 6 or 
        not re.search(r'[A-Z]', senha) or
        not re.search(r'\d', senha) or
        not re.search(r'[\W_]', senha)):
        return False
    return True

@app.route("/")
def homepage():
    return render_template("homepage.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email")
        senha = request.form.get("senha")

        if not email or not senha:
            flash("Preencha todos os campos!", "warning")
            return render_template("login.html")

        usuario = Usuario.query.filter_by(email=email).first()

        if usuario and bcrypt.check_password_hash(usuario.senha, senha):
            login_user(usuario)
            flash("Login realizado com sucesso!", "success")
            return redirect(url_for("homepage"))
        else:
            flash("E-mail ou senha inválidos.", "danger")
            return render_template("login.html")

    return render_template("login.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logout realizado com sucesso!", "success")
    return redirect(url_for("homepage"))

@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    if request.method == "POST":
        nome = request.form.get("nome")
        email = request.form.get("email")
        senha = request.form.get("senha")

        if not nome or not email or not senha:
            flash("Preencha todos os campos!", "warning")
            return render_template("cadastro.html")

        if not senha_valida(senha):
            flash("A senha deve conter pelo menos 6 caracteres, uma letra maiúscula, um número e um caractere especial.", "warning")
            return render_template("cadastro.html")

        if Usuario.query.filter_by(email=email).first():
            flash("Este e-mail já está cadastrado.", "warning")
            return render_template("cadastro.html")

        hash_senha = bcrypt.generate_password_hash(senha).decode('utf-8')
        novo_usuario = Usuario(nome=nome, email=email, senha=hash_senha)
        database.session.add(novo_usuario)
        database.session.commit()

        flash("Cadastro realizado com sucesso! Faça login.", "success")
        return redirect(url_for("login"))

    return render_template("cadastro.html")

@app.route("/api/planos", methods=["GET"])
@login_required
def listar_planos():
    planos = Plano.query.filter_by(usuario_id=current_user.id).all()
    result = []
    for plano in planos:
        result.append({
            "id": plano.id,
            "nome": plano.nome,
            "principal": plano.principal,
            "linhas": [
                {"id": linha.id, "tipo": linha.tipo, "descricao": linha.descricao, "valor": linha.valor}
                for linha in plano.linhas
            ]
        })
    return jsonify(result)

@app.route("/criarplano", methods=["POST"])
@login_required
def criar_plano():
    data = request.get_json()
    if not data.get('nome') or not data.get('linhas'):
        return jsonify({"mensagem": "Dados incompletos", "status": "erro"}), 400

    plano_principal = Plano.query.filter_by(usuario_id=current_user.id, principal=True).first()

    novo_plano = Plano(
        nome=data['nome'],
        principal=False if plano_principal else True,
        usuario_id=current_user.id
    )

    database.session.add(novo_plano)
    database.session.commit()

    for linha_data in data['linhas']:
        try:
            valor = float(linha_data['valor'])
        except (ValueError, TypeError):
            return jsonify({"mensagem": "Valor inválido em uma das linhas", "status": "erro"}), 400

        nova_linha = LinhaPlano(
            tipo=linha_data['tipo'],
            descricao=linha_data['descricao'],
            valor=valor,
            plano_id=novo_plano.id
        )
        database.session.add(nova_linha)

    database.session.commit()
    return jsonify({"mensagem": "Plano salvo com sucesso!", "status": "sucesso"}), 201

@app.route("/api/planos/<int:id>", methods=["DELETE"])
@login_required
def deletar_plano(id):
    plano = Plano.query.get(id)
    if not plano or plano.usuario_id != current_user.id:
        return jsonify({"mensagem": "Plano não encontrado ou acesso negado", "status": "erro"}), 404

    database.session.delete(plano)
    database.session.commit()
    return jsonify({"mensagem": "Plano excluído com sucesso", "status": "sucesso"})

@app.route("/api/planos/<int:id>/principal", methods=["PATCH"])
@login_required
def definir_plano_principal(id):
    plano = Plano.query.get(id)
    if not plano or plano.usuario_id != current_user.id:
        return jsonify({"mensagem": "Plano não encontrado ou acesso negado", "status": "erro"}), 404

    planos = Plano.query.filter_by(usuario_id=current_user.id).all()
    for p in planos:
        p.principal = False

    plano.principal = True
    database.session.commit()

    return jsonify({"mensagem": "Plano definido como principal com sucesso!", "status": "sucesso"})

@app.route("/api/planos/<int:id>", methods=["PUT"])
@login_required
def atualizar_plano(id):
    plano = Plano.query.get(id)
    if not plano or plano.usuario_id != current_user.id:
        return jsonify({"mensagem": "Plano não encontrado ou acesso negado", "status": "erro"}), 404

    data = request.get_json()
    if not data.get('nome') or 'linhas' not in data:
        return jsonify({"mensagem": "Dados incompletos", "status": "erro"}), 400

    plano.nome = data['nome']
    ids_enviados = [linha.get('id') for linha in data['linhas'] if linha.get('id')]

    for linha in plano.linhas:
        if linha.id not in ids_enviados:
            database.session.delete(linha)

    for linha_data in data['linhas']:
        try:
            valor = float(linha_data['valor'])
        except (ValueError, TypeError):
            return jsonify({"mensagem": "Valor inválido em uma das linhas", "status": "erro"}), 400

        linha_id = linha_data.get('id')
        if linha_id:
            linha = LinhaPlano.query.get(linha_id)
            if linha and linha.plano_id == plano.id:
                linha.tipo = linha_data['tipo']
                linha.descricao = linha_data['descricao']
                linha.valor = valor
        else:
            nova_linha = LinhaPlano(
                tipo=linha_data['tipo'],
                descricao=linha_data['descricao'],
                valor=valor,
                plano_id=plano.id
            )
            database.session.add(nova_linha)

    database.session.commit()
    return jsonify({"mensagem": "Plano atualizado com sucesso!", "status": "sucesso"})
