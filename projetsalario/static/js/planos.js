const { useState, useEffect } = React;

// Componente principal responsável por exibir e gerenciar os planos salariais
function PainelPlanos({ atualizarTotais, atualizarPlanos }) {
  // Estados principais do painel
  const [planos, setPlanos] = useState([]); // Lista de todos os planos
  const [novoPlano, setNovoPlano] = useState(null); // Armazena o plano sendo criado/editado
  const [logado, setLogado] = useState(false); // Verifica se o usuário está logado
  const [planoEmEdicaoId, setPlanoEmEdicaoId] = useState(null); // ID do plano em edição
  const [notificacao, setNotificacao] = useState(null); // Notificação de sucesso ou erro
  const [planoParaExcluir, setPlanoParaExcluir] = useState(null); // Armazena o plano que será excluído

  // Função para exibir uma notificação temporária
  function notificar(mensagem, status) {
    setNotificacao({ mensagem, status });
    setTimeout(() => setNotificacao(null), 3000);
  }

  // Cálculo de totais (receita, despesa e meta) com base no plano principal
  function calcularTotais(planos) {
    const planoPrincipal = planos.find((plano) => plano.principal);
    let receita = 0,
      despesa = 0,
      meta = 0;

    if (planoPrincipal) {
      planoPrincipal.linhas.forEach((linha) => {
        const valor = Number(linha.valor) || 0;
        if (linha.tipo === "Receita") receita += valor;
        else if (linha.tipo === "Despesa") despesa += valor;
        else if (linha.tipo === "Meta") meta += valor;
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
    fetch("/api/planos")
      .then((res) => res.json())
      .then((data) => {
        setPlanos(data);
        calcularTotais(data);
      });
  }

  // useEffect para buscar os planos assim que o componente for montado
  useEffect(() => {
    fetch("/api/planos")
      .then((res) => res.json())
      .then((data) => {
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
      notificar(
        "Limite atingido: exclua algum plano ou edite um existente.",
        "erro",
      );
      return;
    }

    setNovoPlano({
      nome: "Novo Plano",
      linhas: [
        { tipo: "Receita", descricao: "", valor: "" },
        { tipo: "Despesa", descricao: "", valor: "" },
        { tipo: "Meta", descricao: "", valor: "" },
      ],
    });
    setPlanoEmEdicaoId("novo");
  }

  // Adiciona uma nova linha ao plano que está sendo criado
  function adicionarLinha() {
    setNovoPlano({
      ...novoPlano,
      linhas: [
        ...novoPlano.linhas,
        { tipo: "Receita", descricao: "", valor: "" },
      ],
    });
  }

  // Define um plano como principal
  function definirComoPrincipal(id) {
    fetch(`/api/planos/${id}/principal`, { method: "PATCH" })
      .then((res) => res.json())
      .then((data) => {
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
      i === index ? { ...linha, [campo]: valor } : linha,
    );
    setNovoPlano({ ...novoPlano, linhas: novasLinhas });
  }

  // Salva um novo plano ou atualiza um existente
  function salvarPlano() {
    if (!novoPlano.nome || novoPlano.linhas.length === 0) {
      notificar("Preencha o nome e pelo menos uma linha!", "erro");
      return;
    }

    const metodo = novoPlano.id ? "PUT" : "POST";
    const url = novoPlano.id ? `/api/planos/${novoPlano.id}` : "/criarplano";

    fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novoPlano),
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401)
            throw new Error("Faça login para salvar seus planos.");
          throw new Error("Erro ao salvar plano.");
        }
        return res.json();
      })
      .then((data) => {
        notificar(data.mensagem, data.status);
        if (data.status === "sucesso") {
          setNovoPlano(null);
          setPlanoEmEdicaoId(null);
          carregarPlanosDoServidor();
        }
      })
      .catch((err) => notificar(err.message, "erro"));
  }

  // Exclui um plano do servidor
  function excluirPlano(id) {
    fetch(`/api/planos/${id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then((data) => {
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
  <div
  id="painel-planos"
  style={{
    backgroundColor: '#1e1e2f',
    minHeight: '350px'
  }}
>

    {/* NOTIFICAÇÃO */}
    {notificacao && (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '14px 18px',
          borderRadius: '10px',
          backgroundColor:
            notificacao.status === 'sucesso'
              ? '#198754'
              : '#dc3545',
          color: '#fff',
          boxShadow: '0 8px 25px rgba(0,0,0,0.35)',
          zIndex: 9999,
          fontSize: '0.85rem',
          fontWeight: '600'
        }}
      >
        {notificacao.mensagem}
      </div>
    )}

    {/* CABEÇALHO */}
    <h2>Meus Planos Salariais</h2>

    <p>
      Acompanhe seus ganhos, gastos e metas mês a mês.
    </p>


    {/* LISTA DE PLANOS */}
    <div className="lista-planos">

      {planos.length === 0 ? (

        <div className="planos-vazio">
          Nenhum plano cadastrado ainda. Clique em
          <strong style={{ color: '#ffc107', marginLeft: '4px' }}>
            "Criar Novo Plano"
          </strong>
          para começar a organizar sua vida financeira.
        </div>

      ) : (

        planos.map(plano => (

          <div
            key={plano.id}
            className={`plano-card plano-criacao ${plano.principal ? 'plano-principal' : ''}`}
          >

            {/* =================================================
                MODO EDIÇÃO
               ================================================= */}

            {planoEmEdicaoId === plano.id ? (

              <div className="plano-formulario">

                <div className="plano-formulario-titulo">
                  <i className="bi bi-pencil-square me-2"></i>
                  Editar plano
                </div>

                <input
                  type="text"
                  className="plano-nome-input"
                  value={novoPlano.nome}
                  onChange={e =>
                    setNovoPlano({
                      ...novoPlano,
                      nome: e.target.value
                    })
                  }
                />


                <div className="plano-tabela-header">
                  <div>Tipo</div>
                  <div>Descrição</div>
                  <div>Valor</div>
                  <div></div>
                </div>


                {novoPlano.linhas.map((linha, index) => (

                  <div
                    key={index}
                    className="plano-form-linha"
                  >

                    <select
                      value={linha.tipo}
                      onChange={e =>
                        atualizarLinha(
                          index,
                          'tipo',
                          e.target.value
                        )
                      }
                    >
                      <option>Receita</option>
                      <option>Despesa</option>
                      <option>Meta</option>
                    </select>


                    <input
                      type="text"
                      placeholder="Descrição"
                      value={linha.descricao}
                      onChange={e =>
                        atualizarLinha(
                          index,
                          'descricao',
                          e.target.value
                        )
                      }
                    />


                    <input
                      type="number"
                      placeholder="Valor"
                      value={linha.valor}
                      onChange={e =>
                        atualizarLinha(
                          index,
                          'valor',
                          e.target.value
                        )
                      }
                    />


                    <button
                      className="btn btn-danger btn-remover-linha"
                      onClick={() => removerLinha(index)}
                      title="Remover linha"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>

                  </div>

                ))}


                <div className="plano-form-acoes">

                  <button
                    className="btn btn-outline-warning"
                    onClick={adicionarLinha}
                  >
                    <i className="bi bi-plus-lg me-1"></i>
                    Adicionar linha
                  </button>


                  <button
                    className="btn btn-success"
                    onClick={salvarPlano}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    Salvar alterações
                  </button>


                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setNovoPlano(null);
                      setPlanoEmEdicaoId(null);
                    }}
                  >
                    Cancelar
                  </button>

                </div>

              </div>

            ) : (

              /* =================================================
                 MODO VISUALIZAÇÃO
                 ================================================= */

              <>

                {/* CABEÇALHO DO PLANO */}

                <div className="plano-header">

                  <div className="plano-info">

                    <h3>
                      {plano.nome}
                    </h3>

                    {plano.principal && (
                      <span className="plano-principal-badge">
                        <i className="bi bi-star-fill"></i>
                        PRINCIPAL
                      </span>
                    )}

                  </div>


                  <div className="plano-acoes">

                    {!plano.principal && (

                      <button
                        className="btn btn-outline-warning btn-principal"
                        onClick={() =>
                          definirComoPrincipal(plano.id)
                        }
                        title="Tornar plano principal"
                      >
                        <i className="bi bi-star me-1"></i>
                        Tornar principal
                      </button>

                    )}


                    <button
                      className="btn btn-warning"
                      onClick={() => editarPlano(plano)}
                      title="Editar plano"
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>


                    <button
                      className="btn btn-danger"
                      onClick={() =>
                        setPlanoParaExcluir(plano)
                      }
                      title="Excluir plano"
                    >
                      <i className="bi bi-trash3-fill"></i>
                    </button>

                  </div>

                </div>


                {/* LINHAS DO PLANO */}

                {plano.linhas.map((linha, index) => {

                  const shadowColor =
                    linha.tipo === 'Receita'
                      ? '#1dc407'
                      : linha.tipo === 'Despesa'
                        ? '#FF6347'
                        : '#6A5ACD';

                  return (

                    <div
                      key={index}
                      className="plano-linha"
                      style={{
                        boxShadow:
                          `0 4px 10px ${shadowColor}18`
                      }}
                    >

                      <div className="plano-linha-info">

                        <span className="plano-linha-descricao">
                          {linha.descricao}
                        </span>

                        <span
                          className="plano-linha-tipo"
                          style={{
                            color: shadowColor
                          }}
                        >
                          {linha.tipo}
                        </span>

                      </div>


                      <span className="plano-linha-valor">
                        R$ {Number(linha.valor).toFixed(2)}
                      </span>

                    </div>

                  );

                })}

              </>

            )}

          </div>

        ))

      )}

    </div>


    {/* =========================================================
        FORMULÁRIO NOVO PLANO
       ========================================================= */}

    {novoPlano && planoEmEdicaoId === 'novo' && (

      <div className="plano-formulario">

        <div className="plano-formulario-titulo">
          <i className="bi bi-plus-circle me-2"></i>
          Criar novo plano
        </div>


        <input
          type="text"
          className="plano-nome-input"
          placeholder="Nome do plano"
          value={novoPlano.nome}
          onChange={e =>
            setNovoPlano({
              ...novoPlano,
              nome: e.target.value
            })
          }
        />


        <div className="plano-tabela-header">
          <div>Tipo</div>
          <div>Descrição</div>
          <div>Valor</div>
          <div></div>
        </div>


        {novoPlano.linhas.map((linha, index) => (

          <div
            key={index}
            className="plano-form-linha"
          >

            <select
              value={linha.tipo}
              onChange={e =>
                atualizarLinha(
                  index,
                  'tipo',
                  e.target.value
                )
              }
            >
              <option>Receita</option>
              <option>Despesa</option>
              <option>Meta</option>
            </select>


            <input
              type="text"
              placeholder="Descrição"
              value={linha.descricao}
              onChange={e =>
                atualizarLinha(
                  index,
                  'descricao',
                  e.target.value
                )
              }
            />


            <input
              type="number"
              placeholder="Valor"
              value={linha.valor}
              onChange={e =>
                atualizarLinha(
                  index,
                  'valor',
                  e.target.value
                )
              }
            />


            <button
              className="btn btn-danger btn-remover-linha"
              onClick={() => removerLinha(index)}
              title="Remover linha"
            >
              <i className="bi bi-trash3"></i>
            </button>

          </div>

        ))}


        <div className="plano-form-acoes">

          <button
            className="btn btn-outline-warning"
            onClick={adicionarLinha}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Adicionar linha
          </button>


          <button
            className="btn btn-success"
            onClick={salvarPlano}
          >
            <i className="bi bi-check-lg me-1"></i>
            Salvar plano
          </button>


          <button
            className="btn btn-secondary"
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


    {/* =========================================================
        MODAL DE EXCLUSÃO
       ========================================================= */}

    {planoParaExcluir && (

      <div
        className="modal fade show"
        style={{
          display: 'block',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          position: 'fixed',
          inset: 0,
          zIndex: 2000
        }}
      >

        <div
          className="modal-dialog modal-dialog-centered"
          style={{ maxWidth: '460px' }}
        >

          <div
            className="modal-content"
            style={{
              backgroundColor: '#202235',
              borderRadius: '14px',
              color: '#fff',
              border: '1px solid #3b3e55'
            }}
          >

            <div className="modal-header border-0">

              <h5 className="modal-title text-warning fw-bold">
                <i className="bi bi-exclamation-triangle me-2"></i>
                Confirmar exclusão
              </h5>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() =>
                  setPlanoParaExcluir(null)
                }
              ></button>

            </div>


            <div className="modal-body">

              <p>
                Você tem certeza de que deseja excluir o plano
                <strong
                  className="text-warning"
                  style={{ marginLeft: '6px' }}
                >
                  {planoParaExcluir.nome}
                </strong>
                ?
              </p>

            </div>


            <div className="modal-footer border-0">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setPlanoParaExcluir(null)
                }
              >
                Cancelar
              </button>

              <button
                className="btn btn-danger"
                onClick={() => {
                  excluirPlano(planoParaExcluir.id);
                  setPlanoParaExcluir(null);
                }}
              >
                <i className="bi bi-trash3 me-1"></i>
                Excluir plano
              </button>

            </div>

          </div>

        </div>

      </div>

    )}


    {/* CRIAR NOVO PLANO */}

    {!novoPlano && (

      <button
        className="btn btn-criar-plano"
        onClick={iniciarNovoPlano}
      >
        <i className="bi bi-plus-lg me-1"></i>
        Criar novo plano
      </button>

    )}

  </div>
);
}
