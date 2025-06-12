from flask_login import UserMixin
from projetsalario import database

class Usuario(database.Model, UserMixin):
    __tablename__ = 'usuarios'
    id = database.Column(database.Integer, primary_key=True)
    nome = database.Column(database.String(100), nullable=False)
    email = database.Column(database.String(120), unique=True, nullable=False)
    senha = database.Column(database.String(100), nullable=False)

    planos = database.relationship('Plano', backref='usuario', lazy=True)

    def __repr__(self):
        return f'<Usuario {self.nome}>'



class Plano(database.Model):
    __tablename__ = 'planos'
    id = database.Column(database.Integer, primary_key=True)
    nome = database.Column(database.String(100), nullable=False)
    principal = database.Column(database.Boolean, default=False, nullable=False)

    usuario_id = database.Column(database.Integer, database.ForeignKey('usuarios.id'), nullable=False)
    
    linhas = database.relationship('LinhaPlano', backref='plano', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Plano {self.nome}, Principal: {self.principal}>'


class LinhaPlano(database.Model):
    __tablename__ = 'linhas_plano'
    id = database.Column(database.Integer, primary_key=True)
    tipo = database.Column(database.String(50), nullable=False) 
    descricao = database.Column(database.String(200), nullable=False)
    valor = database.Column(database.Float, nullable=False)

    plano_id = database.Column(database.Integer, database.ForeignKey('planos.id'), nullable=False)

    def __repr__(self):
        return f'<Linha {self.tipo}: {self.descricao} - R$ {self.valor}>'

