const { useState } = React;

// Componente que exibe os cartões de saldo, despesas, receitas e metas
function Cards({ totais }) {
  const saldo = totais.receita - totais.despesa;

  return (
    <div className="dashboard-cards">

      <div className="card card-balance">
        <h3>💲 Saldo Atual</h3>
        <p>R$ {saldo.toFixed(2)}</p>
      </div>
      <div className="card card-expenses">
        <h3>💸 Total de Despesas</h3>
        <p>R$ {totais.despesa.toFixed(2)}</p>
      </div>
      <div className="card card-income">
        <h3>💰 Total de Receitas</h3>
        <p>R$ {totais.receita.toFixed(2)}</p>
      </div>
      <div className="card card-goal">
        <h3>🎯 Metas de Economia</h3>
        <p>R$ {totais.meta.toFixed(2)}</p>
      </div>
    </div>
  );
}

// Componente principal da aplicação
function App() {
  const [totais, setTotais] = useState({ receita: 0, despesa: 0, meta: 0 });
  const [dadosPlanos, setDadosPlanos] = useState([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const atualizarPlanos = (planos) => {
    setDadosPlanos(planos);         
    setDadosCarregados(true);      
  };

  return (
    <>

      <Cards totais={totais} />

      <div style={{ marginTop: '8rem' }}>

        <PainelPlanos
          atualizarTotais={setTotais}
          atualizarPlanos={atualizarPlanos}
        />
      </div>

      <div style={{ marginTop: '4rem' }}>
        <GraficoTotais planos={dadosPlanos} />
      </div>
    </>
  );
}

// Renderiza o aplicativo React dentro da div com id "root"
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
