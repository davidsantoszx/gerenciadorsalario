from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
import os

app = Flask(__name__, instance_relative_config=True)
CORS(app)

# Configurações do banco
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'site.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = 'sua_chave_secreta'

# Inicializa extensões
database = SQLAlchemy(app)
bcrypt = Bcrypt(app)  
login_manager = LoginManager(app)  
login_manager.login_view = 'login'  
login_manager.login_message = "Faça login para salvar seus planos"
login_manager.login_message_category = "warning" 

# Importa rotas
from projetsalario import routes


from projetsalario.models import Usuario

@login_manager.user_loader
def load_user(user_id):
    return Usuario.query.get(int(user_id))
