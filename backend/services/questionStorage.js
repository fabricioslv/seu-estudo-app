// services/questionStorage.js
const db = require('../db');

class QuestionStorage {
  async saveQuestions(questions, options = {}) {
    const {
      transaction,
      proveniencia = 'batch_import',
      overwrite = false,
    } = options;

    if (!Array.isArray(questions) || questions.length === 0) {
      return { success: true, inserted: 0, skipped: 0, errors: [] };
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const questao of questions) {
      try {
        if (overwrite) {
          // Delete existing question if overwrite is enabled
          await this.deleteQuestionByNumero(questao.numero, transaction);
        } else {
          // Check if question already exists
          const existingQuestion = await this.getQuestionByNumero(
            questao.numero,
            transaction
          );
          if (existingQuestion) {
            skippedCount++;
            continue; // Skip this question if it already exists
          }
        }

        // Insert the new question
        await this.insertQuestion(questao, proveniencia, transaction);
        insertedCount++;
      } catch (error) {
        console.error(`Erro ao salvar questão ${questao.numero}:`, error);
        errors.push({
          questaoNumero: questao.numero,
          error: error.message,
        });
      }
    }

    return {
      success: errors.length === 0,
      inserted: insertedCount,
      skipped: skippedCount,
      errors,
      totalProcessed: questions.length,
    };
  }

  async insertQuestion(questao, proveniencia, transaction = null) {
    const query = `
      INSERT INTO questoes (numero, enunciado, alternativas, resposta_correta, explicacao, materia, ano_vestibular, origem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;

    const values = [
      questao.numero,
      questao.enunciado,
      JSON.stringify(questao.alternativas),
      questao.resposta_correta || null,
      questao.explicacao || null,
      questao.materia || 'Não classificada',
      questao.ano || null,
      proveniencia,
    ];

    if (transaction) {
      return await transaction.query(query, values);
    } else {
      return await db.query(query, values);
    }
  }

  async getQuestionByNumero(numero, transaction = null) {
    const query = 'SELECT * FROM questoes WHERE numero = $1 LIMIT 1';
    const values = [numero];

    if (transaction) {
      const result = await transaction.query(query, values);
      return result.rows[0] || null;
    } else {
      const result = await db.query(query, values);
      return result.rows[0] || null;
    }
  }

  async deleteQuestionByNumero(numero, transaction = null) {
    const query = 'DELETE FROM questoes WHERE numero = $1';
    const values = [numero];

    if (transaction) {
      return await transaction.query(query, values);
    } else {
      return await db.query(query, values);
    }
  }

  async saveBatchResults(batchResults, options = {}) {
    const { overwrite = false } = options;

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = [];

    for (const result of batchResults) {
      if (
        result.status === 'success' &&
        result.questoes &&
        result.questoes.length > 0
      ) {
        const storageResult = await this.saveQuestions(result.questoes, {
          proveniencia: result.fileName,
          overwrite,
        });

        totalInserted += storageResult.inserted;
        totalSkipped += storageResult.skipped;
        totalErrors = totalErrors.concat(storageResult.errors);
      }
    }

    return {
      success: totalErrors.length === 0,
      totalInserted,
      totalSkipped,
      totalErrors,
      totalProcessed: batchResults.length,
    };
  }

  async getQuestionsBySubject(subject, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM questoes 
      WHERE materia = $1 
      ORDER BY numero 
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [subject, limit, offset]);
    return result.rows;
  }

  async getQuestionsByYear(year, limit = 10, offset = 0) {
    const query = `
      SELECT * FROM questoes 
      WHERE ano_vestibular = $1 
      ORDER BY numero 
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [year, limit, offset]);
    return result.rows;
  }

  async getQuestionsCount() {
    const query = 'SELECT COUNT(*) as count FROM questoes';
    const result = await db.query(query);
    return parseInt(result.rows[0].count);
  }

  async getQuestionsStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT materia) as materias,
        COUNT(DISTINCT ano_vestibular) as anos,
        STRING_AGG(DISTINCT materia, ', ') as materias_list,
        STRING_AGG(DISTINCT ano_vestibular::text, ', ') as anos_list
      FROM questoes
    `;

    const detailsQuery = `
      SELECT 
        materia,
        COUNT(*) as count
      FROM questoes
      GROUP BY materia
      ORDER BY count DESC
    `;

    const statsResult = await db.query(statsQuery);
    const detailsResult = await db.query(detailsQuery);

    return {
      summary: statsResult.rows[0],
      bySubject: detailsResult.rows,
    };
  }
}

module.exports = new QuestionStorage();
