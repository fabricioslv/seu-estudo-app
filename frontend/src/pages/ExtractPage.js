// pages/ExtractPage.js
import React, { useState } from 'react';
import questoesService from '../services/questoesService'; // Importa o serviço

function ExtractPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecione um arquivo.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // Lógica de chamada ao serviço real
      const response = await questoesService.extractFromPDF(formData);
      setMessage(`${response.msg} Foram lidas ${response.pages} páginas.`);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Erro ao enviar o arquivo.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Extrair Questões de PDF</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="pdf">Selecione o arquivo PDF:</label>
          <input type="file" id="pdf" name="pdf" accept=".pdf" onChange={onFileChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Enviando...' : 'Extrair Questões'}
        </button>
      </form>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default ExtractPage;
