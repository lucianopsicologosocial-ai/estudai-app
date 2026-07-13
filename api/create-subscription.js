// api/create-subscription.js
// Função serverless (roda só no servidor, nunca no navegador do usuário).
// A chave da API do Asaas fica segura aqui, lida de uma variável de ambiente
// que NÃO tem o prefixo VITE_ (por isso nunca vai parar no código do site).

const ASAAS_BASE_URL = 'https://api.asaas.com/v3';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Integração de pagamento não configurada.' });
  }

  const { nome, email, cpfCnpj, plano } = req.body || {};

  if (!nome || !email || !cpfCnpj) {
    return res.status(400).json({ error: 'Nome, e-mail e CPF/CNPJ são obrigatórios.' });
  }

  const PLANOS = {
    estudai_mensal: { value: 29.9, cycle: 'MONTHLY', description: 'Estudaí — Plano Mensal' },
  };
  const planoEscolhido = PLANOS[plano] || PLANOS.estudai_mensal;

  const headers = {
    'Content-Type': 'application/json',
    access_token: apiKey,
  };

  try {
    // 1. Criar (ou localizar) o cliente no Asaas
    const buscaResp = await fetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${encodeURIComponent(cpfCnpj)}`, {
      headers,
    });
    const buscaData = await buscaResp.json();

    let customerId;
    if (buscaData?.data?.length > 0) {
      customerId = buscaData.data[0].id;
    } else {
      const criarResp = await fetch(`${ASAAS_BASE_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: nome, email, cpfCnpj }),
      });
      const criarData = await criarResp.json();
      if (!criarResp.ok) {
        return res.status(400).json({ error: criarData?.errors?.[0]?.description || 'Não foi possível cadastrar o cliente.' });
      }
      customerId = criarData.id;
    }

    // 2. Criar a assinatura recorrente
    const hoje = new Date();
    const primeiraCobranca = hoje.toISOString().slice(0, 10);

    const assinaturaResp = await fetch(`${ASAAS_BASE_URL}/subscriptions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'UNDEFINED',
        value: planoEscolhido.value,
        nextDueDate: primeiraCobranca,
        cycle: planoEscolhido.cycle,
        description: planoEscolhido.description,
      }),
    });
    const assinaturaData = await assinaturaResp.json();

    if (!assinaturaResp.ok) {
      return res.status(400).json({ error: assinaturaData?.errors?.[0]?.description || 'Não foi possível criar a assinatura.' });
    }

    return res.status(200).json({
      subscriptionId: assinaturaData.id,
      customerId,
      invoiceUrl: assinaturaData?.invoiceUrl || null,
    });
  } catch (err) {
    console.error('Erro Asaas:', err);
    return res.status(500).json({ error: 'Erro ao processar a assinatura. Tente novamente.' });
  }
}
