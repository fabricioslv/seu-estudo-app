// routes/questoes-temp.js - Versão simplificada para teste
const express = require('express');
const router = express.Router();

// Rota simples de teste
router.get('/teste', (req, res) => {
  res.json({ success: true, msg: 'Rota de questões funcionando' });
});

console.log('Arquivo questoes-temp.js carregado com sucesso');

module.exports = router;