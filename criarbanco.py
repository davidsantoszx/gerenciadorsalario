from projetsalario import database, app
from projetsalario.models import Usuario, Plano, LinhaPlano
import os

# Garante que a pasta instance exista
os.makedirs(app.instance_path, exist_ok=True)

with app.app_context():
    database.create_all()
    print("✅ Banco de dados criado com sucesso em:", os.path.join(app.instance_path, 'site.db'))
