const { useEffect, useRef } = React;


function GraficoTotais({ planos }) {
  const canvasRef = useRef(null);        
  const chartInstance = useRef(null);      


  const planoPrincipal = planos.find(p => p.principal);


  let dados;

  if (planoPrincipal) {
    let receitaTotal = 0;
    let despesaTotal = 0;
    let metaTotal = 0;

    // Percorre as linhas do plano e soma os valores por tipo
    planoPrincipal.linhas.forEach(linha => {
      const valor = Number(linha.valor) || 0;

      if (linha.tipo === 'Receita') receitaTotal += valor;
      else if (linha.tipo === 'Despesa') despesaTotal += valor;
      else if (linha.tipo === 'Meta') metaTotal += valor;
    });

    dados = { receitaTotal, despesaTotal, metaTotal };
  } else {

    dados = { receitaTotal: 1000, despesaTotal: 500, metaTotal: 700 };
  }

  useEffect(() => {
    const canvas = canvasRef.current;

  
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Receitas', 'Despesas', 'Metas'],
        datasets: [{
          data: [
            dados.receitaTotal,
            dados.despesaTotal,
            dados.metaTotal
          ],

          backgroundColor: [
            'rgba(39, 209, 5, 0.8)',
            'rgba(255, 0, 0, 0.77)',
            'rgba(106, 90, 205, 0.85)'
          ],

          borderColor: '#25263a',
          borderWidth: 3,

          hoverOffset: 14,

          hoverBorderWidth: 3
        }]
      },
options: {
  responsive: true,

  animation: {
    duration: 900,
    easing: 'easeOutQuart'
  },

  hover: {
    mode: 'nearest',
    animationDuration: 300
  },

  interaction: {
    mode: 'nearest',
    intersect: true
  },

  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#f1f3f5',
        padding: 18,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 14,
          family: 'Segoe UI, Roboto, sans-serif',
          weight: '600'
        }
      }
    },

    title: {
      display: true,
      text: planoPrincipal
        ? 'Distribuição do Plano Principal'
        : 'Exemplo de Gráfico - Crie e defina um plano como principal',

      color: '#f1f3f5',

      font: {
        size: 18,
        family: 'Segoe UI, Roboto, sans-serif',
        weight: 'bold'
      },

      padding: {
        bottom: 20
      }
    },

    tooltip: {
      backgroundColor: '#25263a',
      titleColor: '#ffc107',
      bodyColor: '#f1f3f5',
      borderColor: '#ffc107',
      borderWidth: 1,
      padding: 12,
      displayColors: true,

      titleFont: {
        size: 14,
        weight: 'bold'
      },

      bodyFont: {
        size: 13
      },

      callbacks: {
        label: function(context) {
          const valor = Number(context.raw) || 0;

          return ` ${context.label}: R$ ${valor.toFixed(2)}`;
        }
      }
    }
  }
}
    });


    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [planos]); 
  return (
    <div className="grafico-container">
      <h2 className="grafico-titulo">
        {planoPrincipal ? 'Gráfico do Plano Principal' : 'Gráfico Ilustrativo'}
      </h2>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
