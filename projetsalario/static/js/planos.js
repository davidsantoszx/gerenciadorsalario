const { useState, useEffect } = React;

// Componente principal responsável por exibir e gerenciar os planos salariais
function PainelPlanos({ atualizarTotais, atualizarPlanos }) {

  // Estados principais do painel
  const [planos, setPlanos] = useState([]);                          // Lista de todos os planos
  const [novoPlano, setNovoPlano] = useState(null);                 // Armazena o plano sendo criado/editado
  const [logado, setLogado] = useState(false);                      // Verifica se o usuário está logado
  const [planoEmEdicaoId, setPlanoEmEdicaoId] = useState(null);     // ID do plano em edição
  const [notificacao, setNotificacao] = useState(null);             // Notificação de sucesso ou erro
  const [planoParaExcluir, setPlanoParaExcluir] = useState(null);   // Armazena o plano que será excluído


  // Função para exibir uma notificação temporária
  function notificar(mensagem, status) {
    setNotificacao({ mensagem, status });
    setTimeout(() => setNotificacao(null), 3000);
  }


  // Cálculo de totais (receita, despesa e meta) com base no plano principal
  function calcularTotais(planos) {
    const planoPrincipal = planos.find(plano => plano.principal);
    let receita = 0, despesa = 0, meta = 0;

    if (planoPrincipal) {
      planoPrincipal.linhas.forEach(linha => {
        const valor = Number(linha.valor) || 0;
        if (linha.tipo === 'Receita') receita += valor;
        else if (linha.tipo === 'Despesa') despesa += valor;
        else if (linha.tipo === 'Meta') meta += valor;
      });
    }

    atualizarTotais({ receita, despesa, meta });

    // Atualiza os planos no componente pai, se necessário
    if (atualizarPlanos) {
      atualizarPlanos(planos);
    }
  }


  // Carrega todos os planos do backend
  function carregarPlanosDoServidor() {
    fetch('/api/planos')
      .then(res => res.json())
      .then(data => {
        setPlanos(data);
        calcularTotais(data);
      });
  }


  // useEffect para buscar os planos assim que o componente for montado
  useEffect(() => {
    fetch('/api/planos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlanos(data);
          setLogado(true);
          calcularTotais(data);
        } else {
          setLogado(false);
        }
      });
  }, []);


  // Inicia a criação de um novo plano com 3 linhas padrão
  function iniciarNovoPlano() {
    if (planos.length >= 4) {
      notificar("Limite atingido: exclua algum plano ou edite um existente.", "erro");
      return;
    }

    setNovoPlano({
      nome: "Novo Plano",
      linhas: [
        { tipo: "Receita", descricao: "", valor: "" },
        { tipo: "Despesa", descricao: "", valor: "" },
        { tipo: "Meta", descricao: "", valor: "" }
      ]
    });
    setPlanoEmEdicaoId('novo');
  }


  // Adiciona uma nova linha ao plano que está sendo criado
  function adicionarLinha() {
    setNovoPlano({
      ...novoPlano,
      linhas: [...novoPlano.linhas, { tipo: "Receita", descricao: "", valor: "" }]
    });
  }


  // Define um plano como principal
  function definirComoPrincipal(id) {
    fetch(`/api/planos/${id}/principal`, { method: 'PATCH' })
      .then(res => res.json())
      .then(data => {
        notificar(data.mensagem, data.status);
        carregarPlanosDoServidor();
      });
  }


  // Remove uma linha específica do novo plano
  function removerLinha(index) {
    const novasLinhas = novoPlano.linhas.filter((_, i) => i !== index);
    setNovoPlano({ ...novoPlano, linhas: novasLinhas });
  }


  // Atualiza o conteúdo de uma linha específica
  function atualizarLinha(index, campo, valor) {
    const novasLinhas = novoPlano.linhas.map((linha, i) =>
      i === index ? { ...linha, [campo]: valor } : linha
    );
    setNovoPlano({ ...novoPlano, linhas: novasLinhas });
  }


  // Salva um novo plano ou atualiza um existente
  function salvarPlano() {
    if (!novoPlano.nome || novoPlano.linhas.length === 0) {
      notificar("Preencha o nome e pelo menos uma linha!", "erro");
      return;
    }

    const metodo = novoPlano.id ? 'PUT' : 'POST';
    const url = novoPlano.id ? `/api/planos/${novoPlano.id}` : '/criarplano';

    fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novoPlano)
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) throw new Error('Faça login para salvar seus planos.');
          throw new Error('Erro ao salvar plano.');
        }
        return res.json();
      })
      .then(data => {
        notificar(data.mensagem, data.status);
        if (data.status === 'sucesso') {
          setNovoPlano(null);
          setPlanoEmEdicaoId(null);
          carregarPlanosDoServidor();
        }
      })
      .catch(err => notificar(err.message, 'erro'));
  }


  // Exclui um plano do servidor
  function excluirPlano(id) {
    fetch(`/api/planos/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        notificar(data.mensagem, data.status);
        carregarPlanosDoServidor();
      });
  }
  
  
  // Coloca um plano existente em modo de edição
  function editarPlano(plano) {
    setPlanoEmEdicaoId(plano.id);
    setNovoPlano(plano);
  }


    return (
  <div id="painel-planos" style={{ backgroundColor: '#1e1e2f', padding: '20px', marginTop: '2rem', minHeight: '350px' }}>
    {notificacao && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '20px 20px',
          borderRadius: '8px',
          backgroundColor: notificacao.status === 'sucesso' ? '#28a745' : '#dc3545',
          color: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 1000,
        }}>
          {notificacao.mensagem}
        </div>
      )}
    
    <h2 style={{ color: '#ffc107' }}>Meus Planos Salariais</h2>
       <p style={{ color: '#ffeaa7' }}>Acompanhe seus ganhos, gastos e metas mês a mês.</p> 




    {/* LISTA DE PLANOS */}
    <div className="lista-planos">
      {planos.length === 0 ? (
        <div style={{ color: '#ffeaa7', marginTop: '1rem', fontStyle: 'italic' }}>
          Nenhum plano cadastrado ainda. Clique no botão <strong>"Criar Novo Plano"</strong> para começar a organizar sua vida financeira!
        </div>
      ) : (
        planos.map(plano => (
          <div
            key={plano.id}
            className="plano-card"
            style={{
              border: plano.principal ? '2px solid #ffeaa7' : '1px solid white',
              margin: '10px',
              padding: '16px',
              borderRadius: '12px',
              background: '#1f1f1f'
            }}
          >
            {planoEmEdicaoId === plano.id ? (
              // MODO EDIÇÃO DE PLANO EXISTENTE
              <div>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={novoPlano.nome}
                  onChange={e => setNovoPlano({ ...novoPlano, nome: e.target.value })}
                />

                <div className="tabela">
                  <div className="linha cabecalho" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                    <div style={{ flex: 1 }}>Tipo</div>
                    <div style={{ flex: 2, paddingLeft: '34px' }}>Descrição</div>
                    <div style={{ flex: 1 }}>Valor</div>
                  </div>

                  {novoPlano.linhas.map((linha, index) => (
                    <div key={index} className="linha" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <select
                        className="form-select form-select-sm"
                        value={linha.tipo}
                        onChange={e => atualizarLinha(index, 'tipo', e.target.value)}
                        style={{ marginRight: '8px', flex: 1 }}
                      >
                        <option>Receita</option>
                        <option>Despesa</option>
                        <option>Meta</option>
                      </select>

                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Descrição" required
                        value={linha.descricao}
                        onChange={e => atualizarLinha(index, 'descricao', e.target.value)}
                        style={{ marginRight: '8px', flex: 2 }}
                      />

                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="Valor" required
                        value={linha.valor}
                        onChange={e => atualizarLinha(index, 'valor', e.target.value)}
                        style={{ marginRight: '8px', flex: 1 }}
                      />

                      <button className="btn btn-danger btn-sm" onClick={() => removerLinha(index)}>X</button>
                    </div>
                  ))}
                </div>
                    {/* Botões de ação */}
                <div className="acoes-planos mt-2">
                  <button className="btn btn-outline-warning btn-sm me-2" onClick={adicionarLinha}>Adicionar Linha</button>
                  <button className="btn btn-success btn-sm me-2" onClick={salvarPlano}>Salvar Plano</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setNovoPlano(null); setPlanoEmEdicaoId(null); }}>Cancelar</button>
                </div>
              </div>
            ) : (
              // MODO VISUALIZAÇÃO DO PLANO
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#ffeaa7' }}>{plano.nome}</h3>
                  {plano.principal && (
                    <small style={{ fontSize: '0.75em', color: '#ffeaa7', fontWeight: 'bold' }}>PRINCIPAL ⭐</small>
                  )}
                  <div>
                    {!plano.principal && (
                      <button className="btn btn-outline-primary btn-sm me-2" onClick={() => definirComoPrincipal(plano.id)}>⭐ Tornar Principal</button>
                    )}
                    <button className="btn btn-warning btn-sm me-2" onClick={() => editarPlano(plano)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setPlanoParaExcluir(plano)}>❌</button>

                  </div>
                </div>

                {plano.linhas.map((linha, index) => {
                  const shadowColor = linha.tipo === 'Receita'
                    ? '#1dc407'
                    : linha.tipo === 'Despesa'
                      ? '#FF6347'
                      : '#6A5ACD';

                  return (
                    <div key={index} style={{
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#2b2b2b',
                      color: '#fff',
                      marginTop: '8px',
                      boxShadow: `0 4px 6px -1px ${shadowColor}55`
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div><span>{linha.descricao}</span></div>
                        <small style={{ fontSize: '0.8em', opacity: 0.8, fontWeight: 'bold', color: shadowColor }}>{linha.tipo}</small>
                      </div>
                      <span>R$ {Number(linha.valor).toFixed(2)}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ))
      )}
    </div>

      

       {/* FORMULÁRIO DO NOVO PLANO */}
  {novoPlano && planoEmEdicaoId === 'novo' && (
    <div
      className="plano-card"
      style={{
        border: '1px solid white',
        margin: '10px',
        padding: '16px',
        borderRadius: '12px',
        background: '#1f1f1f'
      }}
    >
      <input
        type="text"
        className="form-control mb-2"
        value={novoPlano.nome}
        onChange={e => setNovoPlano({ ...novoPlano, nome: e.target.value })}
      />

      <div className="tabela">
        <div
          className="linha cabecalho"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
            <div style={{ flex: 1 }}>Tipo</div>
            <div style={{ flex: 2, paddingLeft: '34px' }}>Descrição</div>
            <div style={{ flex: 1 }}>Valor</div>
        </div>

        {novoPlano.linhas.map((linha, index) => (
          <div
            key={index}
            className="linha"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}
          >
            <select
              className="form-select form-select-sm"
              value={linha.tipo}
              onChange={e => atualizarLinha(index, 'tipo', e.target.value)}
              style={{ marginRight: '8px', flex: 1 }}
            >
              <option>Receita</option>
              <option>Despesa</option>
              <option>Meta</option>
            </select>

            <input
              type="text"
              placeholder="Descrição" required
              className="form-control form-control-sm"
              value={linha.descricao}
              onChange={e => atualizarLinha(index, 'descricao', e.target.value)}
              style={{ marginRight: '8px', flex: 2 }}
            />

            <input
              type="number"
              className="form-control form-control-sm"
              placeholder="Valor" required
              value={linha.valor}
              onChange={e => atualizarLinha(index, 'valor', e.target.value)}
              style={{ marginRight: '8px', flex: 1 }}
            />

            <button
              className="btn btn-danger btn-sm"
              onClick={() => removerLinha(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>


    {/* Botões de ação abaixo da lista de linhas */}
    <div className="acoes-planos mt-2">
      <button
        className="btn btn-outline-warning btn-sm me-2"
        onClick={adicionarLinha}
      >
        Adicionar Linha
      </button>
      <button
        className="btn btn-success btn-sm me-2"
        onClick={salvarPlano}
      >
        Salvar Plano
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => {
          setNovoPlano(null);
          setPlanoEmEdicaoId(null);
        }}
      >
        Cancelar
      </button>
    </div>
  </div>
)}


  {/* Modal de confirmação para exclusão de plano */}
    {planoParaExcluir && (
  <div
    className="modal fade show"
    style={{
      display: 'block',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 2000
    }}
  >
    <div
      className="modal-dialog modal-dialog-centered"
      style={{ maxWidth: '500px', margin: 'auto' }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: '#1e1e2f',
          borderRadius: '12px',
          color: '#fff',
          border: '1px solid #ffc107'
        }}
      >
        <div className="modal-header border-0">
          <h5 className="modal-title text-warning fw-bold">
            Confirmar Exclusão
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={() => setPlanoParaExcluir(null)}
          ></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>
            Você tem certeza de que deseja excluir o seu plano
            <strong className="text-warning" style={{ marginLeft: '6px' }}>
              {planoParaExcluir.nome}
            </strong>
            ?
          </p>
        </div>
        <div className="modal-footer border-0 d-flex justify-content-end">
          <button
            className="btn btn-danger"
            onClick={() => {
              excluirPlano(planoParaExcluir.id);
              setPlanoParaExcluir(null);
            }}
          >
            Excluir
          </button>
          <button
            className="btn btn-secondary me-2"
            onClick={() => setPlanoParaExcluir(null)}
          >
            Cancelar
          </button>
        
        </div>
      </div>
    </div>
  </div>
  )}






    <button className="btn btn-warning mt-3" onClick={iniciarNovoPlano}>Criar Novo Plano</button>
  </div>
);

}
